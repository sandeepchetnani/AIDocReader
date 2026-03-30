const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Document = require('../models/Document');
const s3Service = require('../services/s3Service');
const llmService = require('../services/llmService');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
    }
  }
});

// Get presigned upload URL
router.post('/presigned-url', async (req, res) => {
  try {
    const { filename, contentType, userId } = req.body;
    
    if (!filename || !contentType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { uploadUrl, key, url } = await s3Service.getSignedUploadUrl(userId, filename, contentType);
    
    res.json({ uploadUrl, key, url });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Upload to S3
    const { key, url } = await s3Service.uploadFile(file, userId);

    // Create document record
    const document = new Document({
      userId,
      filename: key.split('/').pop(),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      s3Key: key,
      s3Url: url,
      status: 'processing'
    });

    await document.save();

    // Get socket.io instance and emit progress
    const io = req.app.get('io');
    
    // Start async processing
    processDocument(document, file.buffer, io);

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        filename: document.originalName,
        status: document.status
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to upload document', details: error.message });
  }
});

// Process document asynchronously
async function processDocument(document, buffer, io) {
  const roomId = `doc-${document._id}`;
  
  try {
    // Update status: extracting
    document.status = 'extracting';
    document.processingProgress = 20;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'extracting',
      progress: 20,
      message: 'Extracting text from document...'
    });

    // Extract text based on file type
    let extractedText = '';
    if (document.mimeType === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else if (document.mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (
      document.mimeType === 'application/msword' ||
      document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }

    document.extractedText = extractedText;
    document.metadata = {
      wordCount: extractedText.split(/\s+/).length,
      language: 'en'
    };

    // Update status: chunking
    document.status = 'chunking';
    document.processingProgress = 40;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'chunking',
      progress: 40,
      message: 'Chunking document for analysis...'
    });

    // Chunk the text
    const chunks = llmService.chunkText(extractedText);
    document.chunks = chunks;

    // Update status: analyzing
    document.status = 'analyzing';
    document.processingProgress = 60;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'analyzing',
      progress: 60,
      message: 'Generating summary and insights...'
    });

    // Generate summary
    const summary = await llmService.generateSummary(extractedText);
    document.summary = summary;
    document.processingProgress = 80;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'analyzing',
      progress: 80,
      message: 'Extracting key insights...'
    });

    // Extract key insights
    const keyInsights = await llmService.extractKeyInsights(extractedText);
    document.keyInsights = keyInsights;

    // Complete
    document.status = 'completed';
    document.processingProgress = 100;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'completed',
      progress: 100,
      message: 'Document analysis complete!'
    });

  } catch (error) {
    console.error('Error processing document:', error);
    document.status = 'failed';
    document.error = error.message;
    await document.save();
    io.to(roomId).emit('processing-update', {
      documentId: document._id,
      status: 'failed',
      progress: 0,
      message: `Processing failed: ${error.message}`
    });
  }
}

// Get all documents for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await Document.find({ userId })
      .select('-extractedText -chunks')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from S3
    await s3Service.deleteFile(document.s3Key);
    
    // Delete from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
