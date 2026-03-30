const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  s3Url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'extracting', 'chunking', 'analyzing', 'completed', 'failed'],
    default: 'uploading'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  extractedText: {
    type: String,
    default: ''
  },
  chunks: [{
    index: Number,
    content: String,
    embeddingRef: String
  }],
  summary: {
    type: String,
    default: ''
  },
  keyInsights: [{
    type: String
  }],
  metadata: {
    pageCount: Number,
    wordCount: Number,
    language: String
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
