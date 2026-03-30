const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

const llmService = {
  async generateSummary(text) {
    const response = await openai.chat.completions.create({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis assistant. Generate a concise but comprehensive summary of the provided document text. Focus on the main topics, key arguments, and important conclusions.'
        },
        {
          role: 'user',
          content: `Please summarize the following document:\n\n${text.substring(0, 15000)}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return response.choices[0].message.content;
  },

  async extractKeyInsights(text) {
    const response = await openai.chat.completions.create({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis assistant. Extract 5-10 key insights from the provided document. Return them as a JSON array of strings.'
        },
        {
          role: 'user',
          content: `Extract key insights from this document:\n\n${text.substring(0, 15000)}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    try {
      const parsed = JSON.parse(response.choices[0].message.content);
      return parsed.insights || parsed.key_insights || [];
    } catch {
      return [];
    }
  },

  async answerQuestion(question, context, chatHistory = []) {
    const messages = [
      {
        role: 'system',
        content: `You are a helpful document assistant. Answer questions based on the provided document context. If the answer cannot be found in the context, say so clearly. Be accurate and cite specific parts of the document when relevant.

Document Context:
${context}`
      },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: question
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'openrouter/auto',
      messages,
      max_tokens: 1500,
      temperature: 0.5
    });

    return response.choices[0].message.content;
  },

  async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  },

  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunkEnd = end;

      // Try to break at sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize / 2) {
          chunkEnd = breakPoint + 1;
        }
      }

      chunks.push({
        index: chunks.length,
        content: text.substring(start, chunkEnd).trim()
      });

      start = chunkEnd - overlap;
      if (start < 0) start = 0;
      if (chunkEnd >= text.length) break;
    }

    return chunks;
  },

  findRelevantChunks(question, chunks = [], topK = 5) {
    // Simple keyword-based relevance scoring
    // In production, use embeddings for semantic search
    if (!chunks || chunks.length === 0) {
      return [];
    }
    
    // Convert Mongoose documents to plain objects if needed
    const plainChunks = chunks.map(chunk => {
      if (chunk.toObject) {
        return chunk.toObject();
      }
      return typeof chunk === 'object' ? { ...chunk._doc || chunk } : chunk;
    });
    
    const validChunks = plainChunks.filter(chunk => chunk && chunk.content);
    if (validChunks.length === 0) {
      return [];
    }
    
    const questionWords = question.toLowerCase().split(/\s+/);
    
    const scored = validChunks.map(chunk => {
      const chunkLower = chunk.content.toLowerCase();
      let score = 0;
      
      questionWords.forEach(word => {
        if (word.length > 2 && chunkLower.includes(word)) {
          score += 1;
        }
      });

      return { index: chunk.index, content: chunk.content, relevanceScore: score };
    });

    // Sort by relevance, but always return at least topK chunks even if score is 0
    const sorted = scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return sorted.slice(0, Math.min(topK, sorted.length));
  }
};

module.exports = llmService;
