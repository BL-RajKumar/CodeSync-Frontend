import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const getLanguageFromPath = (path) => {
  if (!path) return 'plaintext';
  const ext = path.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'md':
      return 'markdown';
    case 'go':
      return 'go';
    case 'cpp':
    case 'c':
      return 'cpp';
    default:
      return 'plaintext';
  }
};

const CodeEditor = ({ file, onSave, readOnly }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);

  // Determine language dynamically
  const language = file?.language && file.language !== 'plaintext' ? file.language : getLanguageFromPath(file?.path);

  // Update local content when file changes
  useEffect(() => {
    setContent(file?.content || '');
  }, [file?.fileId]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add Ctrl+S / Cmd+S shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleSave = async () => {
    if (readOnly || isSaving) return;
    
    const currentContent = editorRef.current ? editorRef.current.getValue() : content;
    
    // Only save if content has actually changed
    if (currentContent === file.content) {
      toast('No changes to save.', { icon: 'ℹ️' });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(file.fileId, currentContent);
      // Wait a moment for UX before turning off spinning state (optional but feels good)
      setTimeout(() => setIsSaving(false), 300); 
    } catch (error) {
      setIsSaving(false);
    }
  };

  if (!file) return null;

  // Simple check for dirtiness (not perfectly robust, but good enough for UI cue)
  const isDirty = content !== file.content;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/10">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="text-primary opacity-50">Editing:</span> 
          <span className="font-mono text-main">{file.path}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2" title="Unsaved changes"></span>}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded-md uppercase text-muted">
            {language}
          </span>
          {!readOnly && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={(value) => setContent(value || '')}
          onMount={handleEditorMount}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-muted">
              <Loader2 className="animate-spin mr-2" size={24} />
              Loading Editor...
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CodeEditor;
