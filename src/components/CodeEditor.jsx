import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Save, Loader2, Play, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CollaborationBar from './CollaborationBar';
import InlineCommentWidget from './InlineCommentWidget';

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

const CodeEditor = ({ 
  file, 
  onSave, 
  readOnly, 
  scrollToLine,
  // Collaboration props
  socket,
  collabSession,
  collabParticipants,
  isCollabOwner,
  onStartCollab,
  onEndCollab,
  onKickParticipant,
  shareLink,
  isStartingCollab,
  // Sandbox prop
  onOpenSandbox,
  // Comment props
  projectId,
  currentUser,
  snapshotId,
}) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isRemoteChange = useRef(false);
  const remoteCursorDecorations = useRef({});
  const remoteUserColors = useRef({});
  const injectedStyles = useRef({});
  const commentDecorations = useRef([]);

  // Inline comment state
  const [fileComments, setFileComments] = useState([]);
  const [commentWidget, setCommentWidget] = useState(null); // { line, position }

  // Determine language dynamically
  const language = file?.language && file.language !== 'plaintext' ? file.language : getLanguageFromPath(file?.path);

  // Update local content when file changes
  useEffect(() => {
    setContent(file?.content || '');
    setCommentWidget(null); // close any open widget when file changes
  }, [file?.fileId, file?.content]);

  // Fetch inline comments for this file
  const fetchFileComments = useCallback(async () => {
    if (!file?.fileId && !file?._id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/comments/file/${file.fileId || file._id}`, { withCredentials: true });
      setFileComments(res.data);
    } catch (e) {
      // silently ignore
    }
  }, [file?.fileId, file?._id]);

  useEffect(() => {
    fetchFileComments();
  }, [fetchFileComments]);

  // Update glyph decorations whenever comments change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const linesWithComments = [...new Set(fileComments.map(c => c.lineNumber))];
    const newDecorations = linesWithComments.map(line => ({
      range: new monacoRef.current.Range(line, 1, line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'comment-glyph-marker',
        glyphMarginHoverMessage: { value: 'Click to view/add comments' },
      }
    }));
    commentDecorations.current = editorRef.current.deltaDecorations(
      commentDecorations.current,
      newDecorations
    );
  }, [fileComments]);

  // Helper: inject a dynamic CSS class for a specific user's cursor color
  const injectCursorStyle = (userId, color) => {
    if (injectedStyles.current[userId]) return; // already injected
    const styleEl = document.createElement('style');
    styleEl.id = `cursor-style-${userId}`;
    styleEl.textContent = `
      .remote-cursor-${userId} {
        background-color: ${color}40 !important;
        border-left: 2px solid ${color} !important;
      }
      .remote-cursor-line-${userId} {
        border-left: 2px solid ${color}99;
      }
      .remote-cursor-label-${userId} {
        color: ${color};
        font-size: 10px;
        font-style: italic;
        padding-left: 4px;
      }
      .remote-selection-${userId} {
        background-color: ${color}25 !important;
      }
    `;
    document.head.appendChild(styleEl);
    injectedStyles.current[userId] = styleEl;
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Add Ctrl+S / Cmd+S shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // ─── Margin click: open comment widget ──────────────
    editor.onMouseDown((e) => {
      const isGlyphMargin = e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
      const isLineNumber = e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS;
      if ((isGlyphMargin || isLineNumber) && e.target.position) {
        const line = e.target.position.lineNumber;
        const editorContainer = editor.getDomNode();
        const containerRect = editorContainer?.getBoundingClientRect();
        const top = Math.min(
          (containerRect?.top ?? 0) + e.event.posy - (containerRect?.top ?? 0) + 10,
          window.innerHeight - 520
        );
        const left = Math.min(
          (containerRect?.left ?? 0) + 60,
          window.innerWidth - 380
        );
        setCommentWidget({ line, position: { top: Math.max(60, top), left: Math.max(8, left) } });
      }
    });

    // Listen for cursor position changes to broadcast
    editor.onDidChangeCursorPosition((e) => {
      if (socket && collabSession && e.reason !== 3) { // reason 3 = programmatic
        const selection = editor.getSelection();
        socket.emit('cursor-move', {
          sessionId: collabSession.sessionId,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column,
          },
          selection: selection ? {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          } : null,
        });
      }
    });

    // Listen for selection changes to broadcast
    editor.onDidChangeCursorSelection((e) => {
      if (socket && collabSession && e.reason !== 3) {
        const sel = e.selection;
        const hasSelection = sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn;
        socket.emit('cursor-move', {
          sessionId: collabSession.sessionId,
          position: {
            lineNumber: sel.positionLineNumber,
            column: sel.positionColumn,
          },
          selection: hasSelection ? {
            startLineNumber: sel.startLineNumber,
            startColumn: sel.startColumn,
            endLineNumber: sel.endLineNumber,
            endColumn: sel.endColumn,
          } : null,
        });
      }
    });
  };

  // ─── COLLABORATION: Listen for remote changes ──────
  useEffect(() => {
    if (!socket || !collabSession) return;

    const handleRemoteCodeChange = ({ userId, changes }) => {
      if (!editorRef.current) return;

      isRemoteChange.current = true;
      const editor = editorRef.current;
      const model = editor.getModel();

      if (model && changes) {
        // Apply the full content from remote
        const currentPosition = editor.getPosition();
        model.setValue(changes);
        // Restore cursor position
        if (currentPosition) {
          editor.setPosition(currentPosition);
        }
      }

      isRemoteChange.current = false;
    };

    const handleContentSync = ({ content: syncedContent }) => {
      if (!editorRef.current) return;
      isRemoteChange.current = true;
      const editor = editorRef.current;
      const model = editor.getModel();
      const currentPosition = editor.getPosition();
      
      if (model) {
        model.setValue(syncedContent);
      }
      setContent(syncedContent);
      
      if (currentPosition) {
        editor.setPosition(currentPosition);
      }
      isRemoteChange.current = false;
    };

    const handleRemoteCursor = ({ userId, username, position, selection }) => {
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const color = remoteUserColors.current[userId];
      
      // Inject dynamic CSS for this user's color if not done yet
      if (color) {
        injectCursorStyle(userId, color);
      }

      const cursorClass = color ? `remote-cursor-${userId}` : 'remote-cursor';
      const lineClass = color ? `remote-cursor-line-${userId}` : 'remote-cursor-line';
      const labelClass = color ? `remote-cursor-label-${userId}` : 'remote-cursor-label-text';
      const selectionClass = color ? `remote-selection-${userId}` : 'remote-cursor';
      
      // Clear previous decorations for this user
      const prevDecs = remoteCursorDecorations.current[userId] || [];
      
      // Build decorations array
      const decorations = [
        // Cursor position marker
        {
          range: new monacoRef.current.Range(
            position.lineNumber, position.column,
            position.lineNumber, position.column + 1
          ),
          options: {
            className: cursorClass,
            hoverMessage: { value: `**${username}**` },
            beforeContentClassName: lineClass,
            stickiness: 1,
          }
        },
        // Username label
        {
          range: new monacoRef.current.Range(
            position.lineNumber, 1,
            position.lineNumber, 1
          ),
          options: {
            isWholeLine: false,
            afterContentClassName: 'remote-cursor-label',
            after: {
              content: ` ${username}`,
              inlineClassName: labelClass,
            },
          }
        }
      ];

      // If the remote user has a text selection, highlight it
      if (selection && (
        selection.startLineNumber !== selection.endLineNumber ||
        selection.startColumn !== selection.endColumn
      )) {
        decorations.push({
          range: new monacoRef.current.Range(
            selection.startLineNumber, selection.startColumn,
            selection.endLineNumber, selection.endColumn
          ),
          options: {
            className: selectionClass,
            stickiness: 1,
          }
        });
      }

      const newDecs = editor.deltaDecorations(prevDecs, decorations);
      remoteCursorDecorations.current[userId] = newDecs;
    };

    const handleUserJoinedEditor = ({ userId, cursorColor }) => {
      // Store the color assigned by the server for this user
      if (cursorColor) {
        remoteUserColors.current[userId] = cursorColor;
        injectCursorStyle(userId, cursorColor);
      }
    };

    const handleUserLeft = ({ userId }) => {
      // Clean up cursor decorations for the user who left
      if (editorRef.current && remoteCursorDecorations.current[userId]) {
        editorRef.current.deltaDecorations(remoteCursorDecorations.current[userId], []);
        delete remoteCursorDecorations.current[userId];
      }
      // Clean up color tracking
      delete remoteUserColors.current[userId];
      // Remove injected CSS
      if (injectedStyles.current[userId]) {
        injectedStyles.current[userId].remove();
        delete injectedStyles.current[userId];
      }
    };

    const handleSessionJoinedEditor = ({ participants, cursorColor }) => {
      // Store colors for all initial participants from the server
      // cursorColor is *our* color, but we also need to set up for others
      // Others' colors arrive via user-joined events
    };

    socket.on('code-change', handleRemoteCodeChange);
    socket.on('content-sync', handleContentSync);
    socket.on('cursor-move', handleRemoteCursor);
    socket.on('user-joined', handleUserJoinedEditor);
    socket.on('user-left', handleUserLeft);
    socket.on('session-joined', handleSessionJoinedEditor);

    return () => {
      socket.off('code-change', handleRemoteCodeChange);
      socket.off('content-sync', handleContentSync);
      socket.off('cursor-move', handleRemoteCursor);
      socket.off('user-joined', handleUserJoinedEditor);
      socket.off('user-left', handleUserLeft);
      socket.off('session-joined', handleSessionJoinedEditor);
    };
  }, [socket, collabSession]);

  // ─── Handle local content changes ──────────────────
  const handleContentChange = useCallback((value) => {
    const newValue = value || '';
    setContent(newValue);

    // If this change is from a remote user, don't broadcast it back
    if (isRemoteChange.current) return;

    // If in a collab session, broadcast the change
    if (socket && collabSession) {
      socket.emit('code-change', {
        sessionId: collabSession.sessionId,
        changes: newValue,
      });
    }
  }, [socket, collabSession]);

  // Scroll to a specific line when scrollToLine changes (from search results)
  useEffect(() => {
    if (scrollToLine && editorRef.current) {
      const editor = editorRef.current;
      editor.revealLineInCenter(scrollToLine);
      editor.setPosition({ lineNumber: scrollToLine, column: 1 });
      editor.focus();

      // Briefly highlight the line
      const decorations = editor.deltaDecorations([], [
        {
          range: {
            startLineNumber: scrollToLine,
            startColumn: 1,
            endLineNumber: scrollToLine,
            endColumn: 1
          },
          options: {
            isWholeLine: true,
            className: 'search-highlight-line',
            glyphMarginClassName: 'search-highlight-glyph'
          }
        }
      ]);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        editor.deltaDecorations(decorations, []);
      }, 2000);
    }
  }, [scrollToLine, file?.fileId]);

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

      // Sync content to collaborators after save
      if (socket && collabSession) {
        socket.emit('content-sync', {
          sessionId: collabSession.sessionId,
          content: currentContent,
        });
      }

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
          {/* Collaboration Bar */}
          {!readOnly && (
            <CollaborationBar
              session={collabSession}
              participants={collabParticipants || []}
              isOwner={isCollabOwner}
              onEndSession={onEndCollab}
              onStartSession={onStartCollab}
              onKickParticipant={onKickParticipant}
              shareLink={shareLink}
              isStarting={isStartingCollab}
            />
          )}

          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded-md uppercase text-muted">
            {language}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-2">
              {/* Run in Sandbox shortcut */}
              {onOpenSandbox && (
                <button
                  id="editor-run-btn"
                  onClick={onOpenSandbox}
                  title="Run in Sandbox (opens runner panel)"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150"
                >
                  <Play size={13} className="fill-emerald-400" />
                  Run
                </button>
              )}
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
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
          onChange={handleContentChange}
          onMount={handleEditorMount}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: true,
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

        {/* Inline Comment Widget overlay */}
        {commentWidget && (
          <InlineCommentWidget
            line={commentWidget.line}
            fileId={file?.fileId || file?._id}
            projectId={projectId}
            snapshotId={snapshotId}
            comments={fileComments.filter(c => c.lineNumber === commentWidget.line)}
            currentUser={currentUser}
            onClose={() => setCommentWidget(null)}
            onUpdate={() => { fetchFileComments(); }}
            position={commentWidget.position}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
