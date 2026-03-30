require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const documentRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');

// Rate limiters by IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: { error: 'Upload limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 chat messages per minute
  message: { error: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? ['https://aidocreader.onrender.com'] : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://aidocreader.onrender.com'] : 'http://localhost:3000'
}));
app.use(express.json());

// Trust proxy for correct IP detection behind reverse proxies
app.set('trust proxy', 1);

// Apply general rate limiter to all requests
app.use(generalLimiter);

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/docreaderllm')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes with specific rate limiters
app.use('/api/documents/upload', uploadLimiter);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-document', (documentId) => {
    socket.join(`doc-${documentId}`);
    console.log(`Socket ${socket.id} joined document room: ${documentId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
module.exports = { io };

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
