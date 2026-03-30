import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Trash2, Lightbulb, BookOpen } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import ProcessingProgress from '../components/ProcessingProgress';
import { documentService } from '../services/api';
import { useSocket } from '../context/SocketContext';

const DocumentView = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const { socket, joinDocument } = useSocket();

  useEffect(() => {
    loadDocument();
    if (id) {
      joinDocument(id);
    }
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const handleProcessingUpdate = (data) => {
      if (data.documentId === id) {
        setDocument((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                processingProgress: data.progress
              }
            : prev
        );

        if (data.status === 'completed') {
          loadDocument();
        }
      }
    };

    socket.on('processing-update', handleProcessingUpdate);

    return () => {
      socket.off('processing-update', handleProcessingUpdate);
    };
  }, [socket, id]);

  const loadDocument = async () => {
    try {
      const doc = await documentService.getDocument(id);
      setDocument(doc);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Document not found</h2>
          <Link to="/" className="text-primary-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass border-b border-slate-700/50 p-3 sm:p-4 pt-14 lg:pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link
              to="/"
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-white text-sm sm:text-base truncate">{document.originalName}</h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{formatDate(document.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </header>

      {document.status !== 'completed' && document.status !== 'failed' && (
        <div className="p-4 border-b border-slate-700/50">
          <ProcessingProgress
            status={document.status}
            progress={document.processingProgress}
            message={`Processing: ${document.status}`}
          />
        </div>
      )}

      {document.status === 'completed' && (
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-700/50 flex flex-col max-h-64 lg:max-h-none">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'insights'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  Insights
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <BookOpen className="w-4 h-4" />
                      Summary
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {document.summary || 'No summary available'}
                    </p>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      Key Insights
                    </h3>
                    {document.keyInsights && document.keyInsights.length > 0 ? (
                      <ul className="space-y-2">
                        {document.keyInsights.map((insight, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-slate-400"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center flex-shrink-0 text-xs">
                              {index + 1}
                            </span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No insights available</p>
                    )}
                  </div>

                  {document.metadata && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2">
                        Document Info
                      </h3>
                      <div className="space-y-1 text-sm text-slate-400">
                        {document.metadata.wordCount && (
                          <p>Words: {document.metadata.wordCount.toLocaleString()}</p>
                        )}
                        {document.metadata.pageCount && (
                          <p>Pages: {document.metadata.pageCount}</p>
                        )}
                        {document.chunks && (
                          <p>Chunks: {document.chunks.length}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="text-sm text-slate-400">
                  <p className="mb-2">Ask questions about:</p>
                  <ul className="space-y-1 text-slate-500">
                    <li>• Main topics and themes</li>
                    <li>• Specific details or facts</li>
                    <li>• Summaries of sections</li>
                    <li>• Comparisons and analysis</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0">
            <ChatInterface
              documentId={id}
              userId={userId}
              documentName={document.originalName}
            />
          </div>
        </div>
      )}

      {document.status === 'failed' && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Processing Failed</h2>
            <p className="text-slate-400 mb-4">
              {document.error || 'An error occurred while processing this document'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentView;
