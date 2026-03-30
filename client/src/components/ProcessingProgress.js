import React from 'react';
import { FileText, Search, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ProcessingProgress = ({ status, progress, message }) => {
  const stages = [
    { key: 'uploading', label: 'Uploading', icon: FileText },
    { key: 'extracting', label: 'Extracting Text', icon: Search },
    { key: 'chunking', label: 'Chunking', icon: FileText },
    { key: 'analyzing', label: 'AI Analysis', icon: Brain },
    { key: 'completed', label: 'Complete', icon: CheckCircle }
  ];

  const getStageStatus = (stageKey) => {
    const stageOrder = ['uploading', 'processing', 'extracting', 'chunking', 'analyzing', 'completed'];
    const currentIndex = stageOrder.indexOf(status);
    const stageIndex = stageOrder.indexOf(stageKey);

    if (status === 'failed') return 'failed';
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (status === 'completed') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <CheckCircle className="w-6 h-6 text-green-400" />
        <div>
          <p className="font-medium text-green-400">Analysis Complete</p>
          <p className="text-sm text-green-300/70">Your document is ready for Q&A</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <div>
          <p className="font-medium text-red-400">Processing Failed</p>
          <p className="text-sm text-red-300/70">{message || 'An error occurred during processing'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{message || 'Processing...'}</span>
        <span className="text-sm text-primary-400">{progress}%</span>
      </div>

      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between">
        {stages.map((stage, index) => {
          const stageStatus = getStageStatus(stage.key);
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  stageStatus === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : stageStatus === 'active'
                    ? 'bg-primary-500/20 text-primary-400'
                    : stageStatus === 'failed'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-700/50 text-slate-500'
                }`}
              >
                {stageStatus === 'active' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs ${
                  stageStatus === 'completed'
                    ? 'text-green-400'
                    : stageStatus === 'active'
                    ? 'text-primary-400'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingProgress;
