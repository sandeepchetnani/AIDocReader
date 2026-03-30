# DocReader AI - Document Analyser

A full-stack document upload and analysis platform where users can upload PDFs or Word files, get AI-generated summaries and insights, and chat with their documents using natural language.

## Tech Stack

- **Frontend**: React, TailwindCSS, Socket.io-client, Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI**: OpenRouter API (supports multiple LLM providers)

## Features

- **Document Upload**: Drag & drop PDFs, Word docs, or text files (up to 50MB)
- **Real-time Processing**: Live progress tracking via WebSockets
- **AI Analysis**: Automatic text extraction, chunking, summarization, and key insights extraction
- **Chat Interface**: Natural language Q&A against uploaded documents
- **Persistent Context**: Multi-session chat history stored in MongoDB
- **Modern UI**: Beautiful dark theme with glass morphism effects
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Rate Limiting**: IP-based rate limiting to prevent abuse

## Project Structure

```
docReaderllm/
├── server/                    # Node.js backend
│   ├── index.js              # Express server with Socket.io
│   ├── models/
│   │   ├── Document.js       # Document schema
│   │   └── ChatHistory.js    # Chat history schema
│   ├── routes/
│   │   ├── documents.js      # Document upload/management APIs
│   │   └── chat.js           # Chat/Q&A APIs
│   └── services/
│       ├── s3Service.js      # AWS S3 operations
│       └── llmService.js     # OpenAI integration
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   ├── FileUpload.js
│   │   │   ├── ChatInterface.js
│   │   │   ├── ProcessingProgress.js
│   │   │   └── DocumentCard.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   └── DocumentView.js
│   │   ├── context/
│   │   │   └── SocketContext.js
│   │   └── services/
│   │       └── api.js
│   └── tailwind.config.js
├── package.json
└── .env.example
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudflare R2 bucket
- OpenRouter API Key

### Installation

1. **Clone and install dependencies**
   ```bash
   cd docReaderllm
   npm run install:all
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set up Cloudflare R2**
   - Create an R2 bucket in Cloudflare dashboard
   - Generate R2 API tokens (Access Key ID & Secret)
   - Note your R2 endpoint URL

4. **Start the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or separately:
   npm run dev:server  # Backend on port 5001
   npm run start:client  # Frontend on port 3000
   ```

## Environment Variables

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/docreaderllm

# Cloudflare R2 (S3-compatible)
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
S3_BUCKET_NAME=your-r2-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key
```

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload a document
- `GET /api/documents/user/:userId` - Get user's documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete a document

### Chat
- `POST /api/chat/message` - Send a message and get AI response
- `GET /api/chat/history/:documentId` - Get chat history
- `GET /api/chat/sessions/:userId` - Get all chat sessions
- `DELETE /api/chat/history/:sessionId` - Delete chat history

## WebSocket Events

- `join-document` - Join a document room for real-time updates
- `processing-update` - Receive document processing progress

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Document Upload | 20 uploads | 1 hour |
| Chat Messages | 20 messages | 1 minute |

## Architecture

1. **Upload Flow**:
   - User uploads document → Server stores in Cloudflare R2 → Creates MongoDB record
   - Server extracts text using pdf-parse/mammoth, chunks it, and calls OpenRouter for analysis
   - Real-time progress updates via Socket.io

2. **Chat Flow**:
   - User sends question → Server finds relevant chunks using keyword matching
   - Chunks + chat history sent to OpenRouter → Response returned
   - Chat history persisted in MongoDB

## Supported File Types

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Plain Text (.txt)

## License

MIT
