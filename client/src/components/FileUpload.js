import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { documentService } from '../services/api';

const FileUpload = ({ userId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setSelectedFile(file);
    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      const result = await documentService.uploadDocument(file, userId, (progress) => {
        setUploadProgress(progress);
      });

      setUploadStatus('success');
      if (onUploadComplete) {
        onUploadComplete(result.document);
      }

      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus(null);
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  }, [userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled: uploading
  });

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary-500 bg-primary-500/10'
            : uploading
            ? 'border-slate-600 bg-slate-800/50 cursor-not-allowed'
            : 'border-slate-600 hover:border-primary-500/50 hover:bg-slate-800/30'
        }`}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-slate-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!uploading && uploadStatus !== 'success' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Upload successful! Processing document...</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center justify-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>Upload failed. Please try again.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
              <Upload className={`w-8 h-8 text-primary-400 ${isDragActive ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-white">
                {isDragActive ? 'Drop your document here' : 'Drag & drop your document'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                or click to browse • PDF, Word, TXT up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
