import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const documentService = {
  async uploadDocument(file, userId, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    return response.data;
  },

  async getDocuments(userId) {
    const response = await api.get(`/documents/user/${userId}`);
    return response.data;
  },

  async getDocument(documentId) {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};

export const chatService = {
  async sendMessage(documentId, userId, message, sessionId = null) {
    const response = await api.post('/chat/message', {
      documentId,
      userId,
      message,
      sessionId
    });
    return response.data;
  },

  async getChatHistory(documentId, userId, sessionId = null) {
    const params = { userId };
    if (sessionId) params.sessionId = sessionId;
    
    const response = await api.get(`/chat/history/${documentId}`, { params });
    return response.data;
  },

  async getChatSessions(userId) {
    const response = await api.get(`/chat/sessions/${userId}`);
    return response.data;
  },

  async deleteChatHistory(sessionId, userId) {
    const response = await api.delete(`/chat/history/${sessionId}`, {
      params: { userId }
    });
    return response.data;
  }
};

export default api;
