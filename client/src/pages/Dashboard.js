import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, TrendingUp } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import DocumentCard from '../components/DocumentCard';
import { documentService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const Dashboard = ({ userId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleProcessingUpdate = (data) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc._id === data.documentId
            ? { ...doc, status: data.status, processingProgress: data.progress }
            : doc
        )
      );
    };

    socket.on('processing-update', handleProcessingUpdate);

    return () => {
      socket.off('processing-update', handleProcessingUpdate);
    };
  }, [socket]);

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments(userId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    if (socket) {
      socket.emit('join-document', newDoc.id);
    }
    setTimeout(loadDocuments, 1000);
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const stats = {
    total: documents.length,
    completed: documents.filter((d) => d.status === 'completed').length,
    processing: documents.filter((d) => !['completed', 'failed'].includes(d.status)).length
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to <span className="gradient-text">DocReader AI</span>
          </h1>
          <p className="text-slate-400">
            Upload documents and get AI-powered summaries, insights, and answers
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-slate-400">Analyzed</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.processing}</p>
                <p className="text-sm text-slate-400">Processing</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Upload Document</h2>
          <FileUpload userId={userId} onUploadComplete={handleUploadComplete} />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Your Documents</h2>
          {loading ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
              <p className="text-slate-400">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <DocumentCard key={doc._id} document={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
