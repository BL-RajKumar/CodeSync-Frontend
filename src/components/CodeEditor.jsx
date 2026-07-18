import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Save, Loader2, Play, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CollaborationBar from './CollaborationBar';
import InlineCommentWidget from './InlineCommentWidget';
import { useTheme } from '../context/ThemeContext';

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
  codeRef,
  // Key that bumps when content must be force-reset (e.g. snapshot restore)
  // Deliberately NOT bumped on auto-save to prevent cursor jumping
  forceContentKey = 0,
  onLocalChange,
}) => {
  const { theme: appTheme } = useTheme();
  const [content, setContent] = useState('');
  const [prevFileId, setPrevFileId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirtyState, setIsDirtyState] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    const time = file?.updatedAt || file?.createdAt;
    return time ? new Date(time) : null;
  });
  const sessionMountTimeRef = useRef(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Coding Duration Timer Effect
  useEffect(() => {
    const getStartTime = () => {
      if (collabSession?.createdAt) {
        return new Date(collabSession.createdAt);
      }
      return sessionMountTimeRef.current;
    };

    const updateTimer = () => {
      const startTime = getStartTime();
      const diffMs = Math.max(0, new Date() - startTime);
      setElapsedSeconds(Math.floor(diffMs / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [collabSession?.createdAt]);
  const isRemoteChange = useRef(false);
  const remoteCursorDecorations = useRef({});
  const remoteUserColors = useRef({});
  const injectedStyles = useRef({});
  const commentDecorations = useRef([]);
  const autoSaveTimerRef = useRef(null);

  // Refs to avoid stale closures in event listeners
  const fileIdRef = useRef(null);
  const socketRef = useRef(null);
  const collabSessionRef = useRef(null);
  const fileRef = useRef(null);

  fileIdRef.current = file?.fileId || file?._id;
  socketRef.current = socket;
  collabSessionRef.current = collabSession;
  fileRef.current = file;

  const isCollabOwnerRef = useRef(isCollabOwner);
  isCollabOwnerRef.current = isCollabOwner;
  const lastCopiedTextRef = useRef(null);

  useEffect(() => {
    const handleCopyCut = (e) => {
      let text = '';
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        const selection = editorRef.current.getSelection();
        if (model && selection && !selection.isEmpty()) {
          text = model.getValueInRange(selection);
        }
      }
      if (!text) {
        text = window.getSelection()?.toString() || '';
      }
      if (text) {
        lastCopiedTextRef.current = text;
      }
    };

    const handlePaste = (e) => {
      if (collabSessionRef.current?.isCopyPasteRestricted && !isCollabOwnerRef.current) {
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData?.getData('text') || '';
        
        const cleanText = (str) => str.replace(/\r\n/g, '\n').trim();
        const lastCopied = lastCopiedTextRef.current || '';
        
        if (cleanText(pastedText) !== cleanText(lastCopied)) {
          e.preventDefault();
          e.stopPropagation();
          toast.error('Copy-pasting from external sources is disabled by the host.', { id: 'paste-blocked-toast' });
        }
      }
    };

    const handleDrop = (e) => {
      if (collabSessionRef.current?.isCopyPasteRestricted && !isCollabOwnerRef.current) {
        const text = e.dataTransfer?.getData('text') || '';
        
        const cleanText = (str) => str.replace(/\r\n/g, '\n').trim();
        const lastCopied = lastCopiedTextRef.current || '';
        
        if (cleanText(text) !== cleanText(lastCopied)) {
          e.preventDefault();
          e.stopPropagation();
          toast.error('Dragging external text is disabled by the host.', { id: 'drop-blocked-toast' });
        }
      }
    };

    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);
    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('drop', handleDrop, true);

    return () => {
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('drop', handleDrop, true);
    };
  }, []);

  const handleToggleCopyPaste = useCallback((isCopyPasteRestricted) => {
    if (socket && collabSession) {
      socket.emit('toggle-copy-paste-restriction', {
        sessionId: collabSession.sessionId,
        isCopyPasteRestricted,
      });
    }
  }, [socket, collabSession]);

  // Inline comment state
  const [fileComments, setFileComments] = useState([]);
  const [commentWidget, setCommentWidget] = useState(null); // { line, position }
  const handleSaveRef = useRef();
  const lastSavedContentRef = useRef('');

  // Handle render-phase state updates when file changes to prevent Monaco value mismatches
  const currentFileId = file?.fileId || file?._id;
  if (file && currentFileId !== prevFileId) {
    setPrevFileId(currentFileId);
    const initialContent = (codeRef && codeRef.current && codeRef.current[currentFileId] !== undefined)
      ? codeRef.current[currentFileId]
      : (file?.content || '');
    setContent(initialContent);
    setCommentWidget(null);
    lastSavedContentRef.current = file?.content || '';
    if (codeRef && currentFileId && codeRef.current[currentFileId] === undefined) {
      codeRef.current[currentFileId] = initialContent;
    }
  }

  // Determine language dynamically
  const language = file?.language && file.language !== 'plaintext' ? file.language : getLanguageFromPath(file?.path);

  // Update local content when file identity changes or a forced reset is triggered.
  // Intentionally does NOT watch file?.content to avoid cursor jumping after auto-save.
  useEffect(() => {
    const fileId = file?.fileId || file?._id;
    const initialContent = (codeRef && codeRef.current && codeRef.current[fileId] !== undefined)
      ? codeRef.current[fileId]
      : (file?.content || '');
    setContent(initialContent);
    setIsDirtyState(false);
    lastSavedContentRef.current = file?.content || '';
    const time = file?.updatedAt || file?.createdAt;
    setLastSavedTime(time ? new Date(time) : null);
    setCommentWidget(null); // close any open widget when file changes

    // Cancel any pending auto-save from the previous file
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    // Ensure codeRef has the latest database content on load
    if (codeRef && fileId && codeRef.current[fileId] === undefined) {
      codeRef.current[fileId] = initialContent;
    }

    // For forced resets (e.g. snapshot restore on the same file path),
    // explicitly push the new content into the existing Monaco model.
    if (forceContentKey > 0 && editorRef.current) {
      editorRef.current.getModel()?.setValue(initialContent);
    }
  }, [file?.fileId, file?._id, forceContentKey, codeRef]);

  // Watch for external content updates to the active file (e.g. from the package manager or full content sync)
  useEffect(() => {
    if (!file || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const editorValue = model.getValue();
    const fileId = file.fileId || file._id;
    const latestLocalContent = (codeRef && codeRef.current) ? codeRef.current[fileId] : null;

    // Only update Monaco if the new file.content doesn't match the current editor value
    // AND does not match the latest local content in codeRef (meaning it is a genuine
    // external modification, e.g. from package manager, rather than local/collab typing).
    if (file.content !== editorValue && (latestLocalContent === null || file.content !== latestLocalContent)) {
      isRemoteChange.current = true;
      const currentPosition = editorRef.current.getPosition();
      model.setValue(file.content || '');
      if (currentPosition) {
        editorRef.current.setPosition(currentPosition);
      }
      isRemoteChange.current = false;
      setIsDirtyState(false);
      lastSavedContentRef.current = file.content || '';
    }
  }, [file?.content]);

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

  // Sync Monaco readOnly option dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

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
        position: absolute;
        height: 100%;
        border-left: 2px solid ${color} !important;
        z-index: 10;
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
      if (handleSaveRef.current) handleSaveRef.current();
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
      const currentSocket = socketRef.current;
      const currentSession = collabSessionRef.current;
      const currentFileId = fileIdRef.current;
      if (currentSocket && currentSession && !isRemoteChange.current) {
        const selection = editor.getSelection();
        currentSocket.emit('cursor-move', {
          sessionId: currentSession.sessionId,
          fileId: currentFileId,
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
      const currentSocket = socketRef.current;
      const currentSession = collabSessionRef.current;
      const currentFileId = fileIdRef.current;
      if (currentSocket && currentSession && !isRemoteChange.current) {
        const sel = e.selection;
        const hasSelection = sel.startLineNumber !== sel.endLineNumber || sel.startColumn !== sel.endColumn;
        currentSocket.emit('cursor-move', {
          sessionId: currentSession.sessionId,
          fileId: currentFileId,
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

    const handleRemoteCodeChange = ({ userId, fileId, changes }) => {
      // Update codeRef so Sandbox can access the latest remote changes immediately
      if (codeRef && fileId) {
        codeRef.current[fileId] = changes;
      }

      if (!editorRef.current) return;

      const activeFileId = fileIdRef.current;
      if (fileId !== activeFileId) return;

      isRemoteChange.current = true;
      const editor = editorRef.current;
      const model = editor.getModel();

      if (model && changes !== undefined) {
        // Apply changes via pushEditOperations to preserve cursor decorations
        const currentPosition = editor.getPosition();
        model.pushEditOperations(
          [],
          [{
            range: model.getFullModelRange(),
            text: changes,
            forceMoveMarkers: true,
          }],
          () => null
        );
        // Restore cursor position
        if (currentPosition) {
          editor.setPosition(currentPosition);
        }
      }
      setContent(changes);

      // Mark the editor dirty when receiving remote changes
      setIsDirtyState(true);

      // Small delay to allow the editor to sync internal state before clearing flag
      setTimeout(() => {
        isRemoteChange.current = false;
      }, 50);
    };

    const handleContentSync = ({ fileId, content: syncedContent, lastSavedAt }) => {
      if (codeRef && fileId) {
        codeRef.current[fileId] = syncedContent;
      }

      if (!editorRef.current) return;

      const activeFileId = fileIdRef.current;
      if (fileId !== activeFileId) return;

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

      // Update lastSavedTime state and clear dirty state
      if (lastSavedAt) {
        setLastSavedTime(new Date(lastSavedAt));
      }
      setIsDirtyState(false);
      lastSavedContentRef.current = syncedContent || '';
    };

    const handleRemoteCursor = ({ userId, username, fileId, position, selection }) => {
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const activeFileId = fileIdRef.current;

      // If remote user moved their cursor on a different file, clear their cursor on our current active file
      if (fileId !== activeFileId) {
        if (remoteCursorDecorations.current[userId]) {
          editor.deltaDecorations(remoteCursorDecorations.current[userId], []);
          delete remoteCursorDecorations.current[userId];
        }
        return;
      }

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
      if (participants && Array.isArray(participants)) {
        participants.forEach(p => {
          if (p.userId && p.cursorColor) {
            remoteUserColors.current[p.userId] = p.cursorColor;
            injectCursorStyle(p.userId, p.cursorColor);
          }
        });
      }
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
    // If this change is from a remote user, don't broadcast it back
    if (isRemoteChange.current) return;

    const newValue = value || '';
    // NOTE: We intentionally do NOT call setContent here to avoid re-renders
    // that would cause @monaco-editor/react to call model.setValue() during
    // fast typing, resetting the cursor position.

    const currentFileId = fileIdRef.current;
    if (codeRef && currentFileId) {
      codeRef.current[currentFileId] = newValue;
    }

    // Mark file as dirty (only triggers re-render once, React bails out on subsequent calls)
    setIsDirtyState(true);

    if (onLocalChange && currentFileId) {
      onLocalChange(currentFileId, newValue);
    }
    
    // If in a collab session, broadcast the change
    const currentSocket = socketRef.current;
    const currentSession = collabSessionRef.current;
    if (currentSocket && currentSession) {
      currentSocket.emit('code-change', {
        sessionId: currentSession.sessionId,
        fileId: currentFileId,
        changes: newValue,
      });
    }

    // Auto-save: debounce 1.5s after last keystroke
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (handleSaveRef.current) handleSaveRef.current(true);
    }, 1500);
  }, [codeRef, onLocalChange]);

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

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (readOnly || isSaving) return;
    
    const currentContent = editorRef.current ? editorRef.current.getValue() : content;
    const currentFileId = fileIdRef.current;
    const activeFile = fileRef.current;
    if (!activeFile) return;

    // Only save if content has actually changed compared to the last saved database state
    if (currentContent === lastSavedContentRef.current) {
      if (!isAutoSave) {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          toast.success('File saved');
        }, 300);
      }
      return;
    }

    if (!isAutoSave) setIsSaving(true);
    try {
      const saveResult = await onSave(currentFileId, currentContent, isAutoSave);

      // Mark clean after a successful save
      setIsDirtyState(false);
      lastSavedContentRef.current = currentContent;
      const savedTime = (saveResult && saveResult.updatedAt) ? new Date(saveResult.updatedAt) : new Date();
      setLastSavedTime(savedTime);

      // Sync content to collaborators after save
      const currentSocket = socketRef.current;
      const currentSession = collabSessionRef.current;
      if (currentSocket && currentSession) {
        currentSocket.emit('content-sync', {
          sessionId: currentSession.sessionId,
          fileId: currentFileId,
          content: currentContent,
          lastSavedAt: savedTime.toISOString(),
        });
      }

      // Wait a moment for UX before turning off spinning state (optional but feels good)
      if (!isAutoSave) setTimeout(() => setIsSaving(false), 300); 
    } catch (error) {
      if (!isAutoSave) setIsSaving(false);
    }
  }, [readOnly, isSaving, onSave]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Auto-save is now driven by the timer inside handleContentChange.
  // No useEffect needed — this prevents the re-render cycle that caused cursor jumps.

  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatSavedTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!file) return null;

  // isDirty is now driven by isDirtyState, set in handleContentChange and cleared after save.
  const isDirty = isDirtyState;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] border border-white/10 rounded-xl overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/10 min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted min-w-0 flex-1">
          <span className="text-primary opacity-50 flex-shrink-0">Editing:</span> 
          <span className="font-mono text-main truncate" title={file.path}>{file.path}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0 ml-1" title="Unsaved changes"></span>}
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin flex-shrink-0 max-w-[70%] py-1">
          {/* Collaboration Bar */}
          {!readOnly && (
            <div className="flex-shrink-0">
              <CollaborationBar
                session={collabSession}
                participants={collabParticipants || []}
                isOwner={isCollabOwner}
                onEndSession={onEndCollab}
                onStartSession={onStartCollab}
                onKickParticipant={onKickParticipant}
                shareLink={shareLink}
                isStarting={isStartingCollab}
                onToggleCopyPaste={handleToggleCopyPaste}
              />
            </div>
          )}

          <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded-md uppercase text-muted flex-shrink-0">
            {language}
          </span>
          {!readOnly && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Run in Sandbox shortcut */}
              {onOpenSandbox && (
                <button
                  id="editor-run-btn"
                  onClick={onOpenSandbox}
                  title="Run in Sandbox (opens runner panel)"
                  className="run-start-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150 flex-shrink-0"
                >
                  <Play size={13} className="fill-emerald-400 play-icon-fill" />
                  Run
                </button>
              )}
              <button 
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex-shrink-0"
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
          theme={appTheme === 'dark' ? 'vs-dark' : 'light'}
          path={file.path}
          defaultValue={content}
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
            fixedOverflowWidgets: true,
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

      {/* Premium Status Bar */}
      <div className="px-4 py-2 bg-[#181825] border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-[#a9b1d6] font-mono select-none gap-4">
        {/* Left: Session Start Time */}
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-primary/70" />
          <span className="text-white/60">
            {collabSession ? 'Collab Session' : 'Local Session'} Started:
          </span>
          <span className="text-white font-medium">
            {collabSession?.createdAt 
              ? new Date(collabSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : sessionMountTimeRef.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
          </span>
        </div>

        {/* Center: Live Timer Duration */}
        <div className="flex items-center gap-2">
          <span className="text-white/60">Duration:</span>
          <span className="text-primary font-bold">{formatDuration(elapsedSeconds)}</span>
        </div>

        {/* Right: Save Status */}
        <div className="flex items-center gap-2">
          {isDirty ? (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-semibold">Unsaved Changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Last Saved:</span>
              <span className="font-medium text-white/80">
                {lastSavedTime ? formatSavedTime(lastSavedTime) : 'Never'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
