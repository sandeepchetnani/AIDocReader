const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  context: {
    relevantChunks: [{
      chunkIndex: Number,
      content: String,
      relevanceScore: Number
    }]
  }
}, {
  timestamps: true
});

// Compound index for efficient user-document queries
chatHistorySchema.index({ userId: 1, documentId: 1 });
chatHistorySchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
