const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const ChatHistory = require('../models/ChatHistory');
const llmService = require('../services/llmService');

// Send a message and get AI response
router.post('/message', async (req, res) => {
  try {
    const { documentId, userId, message, sessionId } = req.body;

    if (!documentId || !userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'completed') {
      return res.status(400).json({ error: 'Document is still being processed' });
    }

    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({
      userId,
      documentId,
      sessionId: sessionId || 'default'
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        documentId,
        sessionId: sessionId || uuidv4(),
        messages: []
      });
    }

    // Add user message
    chatHistory.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Find relevant chunks for context
    const relevantChunks = llmService.findRelevantChunks(message, document.chunks || []);
    const context = relevantChunks
      .filter(c => c && c.content)
      .map(c => c.content)
      .join('\n\n---\n\n');

    // Store relevant chunks in chat history
    chatHistory.context = {
      relevantChunks: relevantChunks
        .filter(c => c && c.content)
        .map(c => ({
          chunkIndex: c.index,
          content: c.content.substring(0, 500),
          relevanceScore: c.relevanceScore
        }))
    };

    // Get AI response
    const aiResponse = await llmService.answerQuestion(
      message,
      context,
      chatHistory.messages
    );

    // Add assistant message
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    await chatHistory.save();

    res.json({
      response: aiResponse,
      sessionId: chatHistory.sessionId,
      relevantChunks: relevantChunks
        .filter(c => c && c.content)
        .map(c => ({
          index: c.index,
          preview: (c.content || '').substring(0, 200) + '...'
        }))
    });
  } catch (error) {
    console.error('Error processing chat message:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

// Get chat history for a document
router.get('/history/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId, sessionId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query = { userId, documentId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chatHistories = await ChatHistory.find(query)
      .sort({ updatedAt: -1 });

    res.json(chatHistories);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get all chat sessions for a user
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await ChatHistory.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document'
        }
      },
      { $unwind: '$document' },
      {
        $project: {
          sessionId: 1,
          documentId: 1,
          documentName: '$document.originalName',
          messageCount: { $size: '$messages' },
          lastMessage: { $arrayElemAt: ['$messages', -1] },
          updatedAt: 1
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Delete chat history
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await ChatHistory.findOneAndDelete({ sessionId, userId });

    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

module.exports = router;
