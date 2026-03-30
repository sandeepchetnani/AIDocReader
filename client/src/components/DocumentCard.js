import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Loader2, AlertCircle, Trash2, MessageSquare } from 'lucide-react';

const DocumentCard = ({ document, onDelete }) => {
  const getStatusBadge = () => {
    switch (document.status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="glass rounded-xl p-3 sm:p-4 hover:bg-slate-700/30 transition-all group">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-white truncate text-sm sm:text-base">{document.originalName}</h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-400 flex-wrap">
                <span>{formatFileSize(document.size)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(document.createdAt)}
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {document.summary && (
            <p className="mt-3 text-sm text-slate-400 line-clamp-2">{document.summary}</p>
          )}

          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            {document.status === 'completed' && (
              <Link
                to={`/document/${document._id}`}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg text-xs sm:text-sm hover:bg-primary-500/30 transition-colors"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                Chat
              </Link>
            )}
            <button
              onClick={() => onDelete(document._id)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-700/50 text-slate-400 rounded-lg text-xs sm:text-sm hover:bg-red-500/20 hover:text-red-400 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
