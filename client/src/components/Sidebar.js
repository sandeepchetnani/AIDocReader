import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Home, Upload, Sparkles } from 'lucide-react';
import { documentService } from '../services/api';

const Sidebar = ({ userId, isOpen, onClose }) => {
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments(userId);
      setDocuments(docs.slice(0, 5));
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 glass border-r border-slate-700/50 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="p-6 border-b border-slate-700/50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">DocReader AI</h1>
            <p className="text-xs text-slate-400">Document Analyser</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </div>

        <div className="mt-8">
          <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Recent Documents
          </h3>
          {loading ? (
            <div className="px-4 py-2 text-slate-400 text-sm">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="px-4 py-2 text-slate-400 text-sm">No documents yet</div>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <Link
                  key={doc._id}
                  to={`/document/${doc._id}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    location.pathname === `/document/${doc._id}`
                      ? 'bg-slate-700/50 text-white'
                      : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{doc.originalName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="glass rounded-xl p-4 bg-gradient-to-br from-primary-500/10 to-purple-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-slate-200">Upload Docs</span>
          </div>
          <p className="text-xs text-slate-400">
            Drag & drop PDFs or Word files to analyze with AI
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
