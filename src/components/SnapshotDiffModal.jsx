import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Loader2 } from 'lucide-react';

const SnapshotDiffModal = ({
  isOpen,
  onClose,
  originalContent,
  modifiedContent,
  language,
  fileName,
  snapshotHash
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[#1e1e2e] border border-white/10 rounded-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#181825]">
          <div>
            <h2 className="text-lg font-bold text-main">Diff Review: {fileName}</h2>
            <div className="flex items-center gap-4 text-sm text-muted mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500/80 rounded-full border border-red-500"></div>
                <span>Snapshot: <span className="font-mono text-white/80">{snapshotHash?.substring(0, 8) || 'Unknown'}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500/80 rounded-full border border-green-500"></div>
                <span>Current File</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Diff Editor */}
        <div className="flex-1 overflow-hidden relative">
          <DiffEditor
            height="100%"
            language={language || 'plaintext'}
            theme="vs-dark"
            original={originalContent || ''}
            modified={modifiedContent || ''}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
            loading={
              <div className="flex items-center justify-center h-full text-muted">
                <Loader2 className="animate-spin mr-2" size={24} />
                Loading Diff...
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default SnapshotDiffModal;
