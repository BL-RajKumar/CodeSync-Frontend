import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, FolderTree, Search, Play, History } from 'lucide-react';
import FileTree from '../components/FileTree';
import SearchPanel from '../components/SearchPanel';
import SandboxPanel from '../components/SandboxPanel';
import SnapshotPanel from '../components/SnapshotPanel';
import SnapshotDiffModal from '../components/SnapshotDiffModal';
import CodeEditor from '../components/CodeEditor';
import WebPreviewPanel from '../components/WebPreviewPanel';
import PackageManager from '../components/PackageManager';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ProjectCommentsPanel from '../components/ProjectCommentsPanel';
import { MessageSquare } from 'lucide-react';

const ProjectEditor = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('files'); // 'files' | 'search' | 'snapshots' | 'run' | 'comments'
  const [scrollToLine, setScrollToLine] = useState(null);
  const [diffModalState, setDiffModalState] = useState({ isOpen: false, snapshot: null });

  // Collaboration state
  const [collabSession, setCollabSession] = useState(null);
  const [collabParticipants, setCollabParticipants] = useState([]);
  const [shareLink, setShareLink] = useState('');
  const [isStartingCollab, setIsStartingCollab] = useState(false);

  // Ref to hold the absolute latest code for each file (bypassing autosave delays)
  const codeRef = useRef({});
  // Ref to prevent auto-rejoining a session we were just kicked from
  const kickedSessionIdRef = useRef(null);

  // Resize State
  const [previewWidth, setPreviewWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const handleDrag = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const windowWidth = window.innerWidth;
    const sidebarWidth = 324; // Approximate width of sidebars (44px + 280px)
    const availableWidth = windowWidth - sidebarWidth;
    
    // e.clientX is absolute. The preview is on the right.
    // So the preview width in pixels is windowWidth - e.clientX
    let newWidth = ((windowWidth - e.clientX) / availableWidth) * 100;
    
    if (newWidth < 15) newWidth = 15;
    if (newWidth > 85) newWidth = 85;
    
    setPreviewWidth(newWidth);
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    // Add pointer events back to iframes if needed
    document.body.style.userSelect = 'auto';
  }, [handleDrag]);

  const handleDragStart = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const fetchProjectAndFiles = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Pass session information if we joined via a collaboration link
        const sessionParam = searchParams.get('session');
        const sessionPassword = sessionParam ? (sessionStorage.getItem(`collab_pw_${sessionParam}`) || '') : '';
        let querySuffix = '';
        if (sessionParam) {
          querySuffix = `?sessionId=${sessionParam}`;
          if (sessionPassword) {
            querySuffix += `&sessionPassword=${encodeURIComponent(sessionPassword)}`;
          }
        }

        // Fetch project to verify it exists and we have access
        const projRes = await axios.get(`${apiUrl}/projects/${projectId}${querySuffix}`, { withCredentials: true });
        setProject(projRes.data);

        // Fetch files
        const filesRes = await axios.get(`${apiUrl}/files/${projectId}${querySuffix}`, { withCredentials: true });
        const fetchedFiles = filesRes.data;
        setFiles(fetchedFiles);

        // If URL has session + file params (from share link), auto-select the file and join
        const fileParam = searchParams.get('file');
        if (sessionParam && fileParam) {
          const targetFile = fetchedFiles.find(f => (f.fileId || f._id) === fileParam);
          if (targetFile) {
            setSelectedFile(targetFile);
          }
          // Session joining happens in a separate useEffect once socket is ready
        }
      } catch (error) {
        toast.error('Failed to load project editor');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndFiles();
  }, [projectId, navigate, searchParams]);

  // ─── AUTO-JOIN session from URL params ──────────────
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    // Don't auto-join if we don't have the param, or if we are already in a session, or if we were just kicked from THIS session
    if (!sessionParam || !socket || !connected || collabSession || kickedSessionIdRef.current === sessionParam) return;

    const password = sessionStorage.getItem(`collab_pw_${sessionParam}`) || '';
    socket.emit('join-session', { sessionId: sessionParam, password });
  }, [searchParams, socket, connected, collabSession]);

  // ─── SOCKET EVENT LISTENERS ─────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleSessionJoined = (data) => {
      // Check if this is the active file (compare against searchParams file if data.fileId is missing)
      const expectedFileId = data.fileId || searchParams.get('file');
      if (selectedFile && expectedFileId && selectedFile.fileId !== expectedFileId && selectedFile._id !== expectedFileId) return;
      
      setCollabSession(prev => {
        // Prevent object reference change if data is same
        if (prev && prev.sessionId === data.sessionId) return prev;
        return {
          sessionId: data.sessionId,
          ownerId: data.ownerId,
          language: data.language,
        };
      });
      setCollabParticipants(data.participants || []);

      // Set the file content from the live session
      if (data.fileContent !== undefined && selectedFile) {
        setSelectedFile(prev => ({ ...prev, content: data.fileContent }));
      }

      setShareLink(`${window.location.origin}/collab/${data.sessionId}`);
      toast.success('Joined collaboration session!');
    };

    const handleUserJoined = (userData) => {
      setCollabParticipants(prev => {
        const exists = prev.some(p => p.userId === userData.userId);
        if (exists) return prev;
        return [...prev, userData];
      });
      toast(`${userData.username} joined`, { icon: '👋' });
    };

    const handleUserLeft = (userData) => {
      setCollabParticipants(prev => prev.filter(p => p.userId !== userData.userId));
      toast(`${userData.username} left`, { icon: '👋' });
    };

    const handleSessionEnded = ({ message, revertedContent }) => {
      setCollabSession(null);
      setCollabParticipants([]);
      setShareLink('');
      
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('session');
      newParams.delete('file');
      newParams.delete('sessionPassword');
      setSearchParams(newParams, { replace: true });
      
      if (revertedContent !== undefined) {
        setSelectedFile(prev => prev ? { ...prev, content: revertedContent } : null);
        setFiles(prev => prev.map(f => (f.fileId || f._id) === (selectedFile?.fileId || selectedFile?._id) ? { ...f, content: revertedContent } : f));
      }
      
      toast(message || 'Session ended', { icon: '🔴' });
    };

    const handleErrorMessage = ({ message }) => {
      toast.error(message);
    };

    const handleParticipantKicked = ({ kickedUserId, kickedUsername, message }) => {
      const myId = user?.userId || user?._id;
      if (kickedUserId === myId) {
        // I was kicked — mark the session to prevent auto-rejoin race condition
        kickedSessionIdRef.current = collabSession?.sessionId || searchParams.get('session');
        
        // leave the session
        socket.emit('leave-session');
        setCollabSession(null);
        setCollabParticipants([]);
        setShareLink('');
        
        // Remove session parameters from URL so we don't automatically rejoin
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('session');
        newParams.delete('file');
        newParams.delete('sessionPassword');
        setSearchParams(newParams, { replace: true });
        
        toast.error('You have been removed from the session by the host.');
      } else {
        toast(`${kickedUsername} was removed`, { icon: '🚫' });
      }
    };

    socket.on('session-joined', handleSessionJoined);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('session-ended', handleSessionEnded);
    socket.on('error-message', handleErrorMessage);
    socket.on('participant-kicked', handleParticipantKicked);

    return () => {
      socket.off('session-joined', handleSessionJoined);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('session-ended', handleSessionEnded);
      socket.off('error-message', handleErrorMessage);
      socket.off('participant-kicked', handleParticipantKicked);
    };
  }, [socket, selectedFile]);

  // ─── Cleanup: leave session on unmount ──────────────
  // Use a ref to track the current sessionId so we don't trigger cleanup on every render
  const currentSessionId = React.useRef(null);
  useEffect(() => {
    currentSessionId.current = collabSession?.sessionId;
  }, [collabSession?.sessionId]);

  useEffect(() => {
    return () => {
      if (socket && currentSessionId.current) {
        socket.emit('leave-session');
      }
    };
  }, [socket]);

  // ─── START COLLABORATION ────────────────────────────
  const handleStartCollab = useCallback(async () => {
    if (!selectedFile || !user) return;

    setIsStartingCollab(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/collab/start`, {
        projectId,
        fileId: selectedFile.fileId || selectedFile._id,
      }, { withCredentials: true });

      const { sessionId } = response.data;
      setShareLink(`${window.location.origin}/collab/${sessionId}`);

      // Join the session via socket
      if (socket) {
        socket.emit('join-session', { sessionId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start collaboration');
    } finally {
      setIsStartingCollab(false);
    }
  }, [selectedFile, user, projectId, socket]);

  // ─── END COLLABORATION ──────────────────────────────
  const handleEndCollab = useCallback(async (discard = false) => {
    if (!collabSession) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/collab/${collabSession.sessionId}/end`, {
        discardChanges: discard
      }, { withCredentials: true });

      setCollabSession(null);
      setCollabParticipants([]);
      setShareLink('');
      
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('session');
      newParams.delete('file');
      newParams.delete('sessionPassword');
      setSearchParams(newParams, { replace: true });
      
      // Update UI with reverted content directly from HTTP response for perfect reflection
      if (discard && response.data.revertedContent !== undefined) {
        setSelectedFile(prev => prev ? { ...prev, content: response.data.revertedContent } : null);
        setFiles(prev => prev.map(f => (f.fileId || f._id) === (selectedFile?.fileId || selectedFile?._id) ? { ...f, content: response.data.revertedContent } : f));
        
        // Also update the live codeRef so Sandbox reflects the discard instantly
        if (codeRef.current && (selectedFile?.fileId || selectedFile?._id)) {
          codeRef.current[selectedFile.fileId || selectedFile._id] = response.data.revertedContent;
        }
      }
      
      toast.success(discard ? 'Session ended and changes discarded' : 'Collaboration session ended');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end session');
    }
  }, [collabSession, searchParams, setSearchParams, selectedFile]);

  const handleKickParticipant = useCallback((targetUserId) => {
    if (!collabSession || !socket) return;
    socket.emit('kick-participant', {
      sessionId: collabSession.sessionId,
      targetUserId
    });
  }, [collabSession, socket]);

  const handleCreateFile = async (name, path) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/files`, {
        projectId,
        name,
        path
      }, { withCredentials: true });
      
      setFiles(prev => [...prev, response.data]);
      toast.success('File created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create file');
    }
  };

  const handleRenameFile = async (node, newName, newPath) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/files/${node.fileId || node.originalFile?._id}/rename`, {
        name: newName,
        path: newPath
      }, { withCredentials: true });
      
      setFiles(prev => prev.map(f => (f.fileId || f._id) === (node.fileId || node.originalFile?._id) ? response.data : f));
      
      if ((selectedFile?.fileId || selectedFile?._id) === (node.fileId || node.originalFile?._id)) {
        setSelectedFile(response.data);
      }
      
      toast.success('Renamed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename file');
    }
  };

  const handleDeleteFile = async (node) => {
    if (!window.confirm(`Are you sure you want to delete ${node.name}?`)) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/files/${node.fileId || node.originalFile?._id}`, { withCredentials: true });
      
      setFiles(prev => prev.filter(f => (f.fileId || f._id) !== (node.fileId || node.originalFile?._id)));
      if ((selectedFile?.fileId || selectedFile?._id) === (node.fileId || node.originalFile?._id)) {
        setSelectedFile(null);
      }
      toast.success('File deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleSaveFileContent = async (fileId, newContent, isAutoSave = false) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/files/${fileId}/content`, {
        content: newContent
      }, { withCredentials: true });
      
      // Update local files state with new size/lastEditedBy
      setFiles(prev => prev.map(f => {
        if ((f.fileId || f._id) === fileId) {
          return { ...f, content: newContent, size: response.data.size };
        }
        return f;
      }));
      
      // Update selected file object to drop the dirty state
      if ((selectedFile?.fileId || selectedFile?._id) === fileId) {
        setSelectedFile(prev => ({ ...prev, content: newContent }));
      }
      
      if (!isAutoSave) {
        toast.success('File saved');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (!isAutoSave) {
        toast.error(error.response?.data?.message || 'Failed to save file');
      }
      throw error; // Rethrow to CodeEditor so it stops the saving spinner
    }
  };

  const handleRenameFolder = async (node, newName, newPath) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/files/folder/rename`, {
        projectId,
        oldPath: node.path,
        newPath: newPath
      }, { withCredentials: true });
      
      setFiles(prev => {
        const updatedIds = response.data.files.map(f => f.fileId || f._id);
        const otherFiles = prev.filter(f => !updatedIds.includes(f.fileId || f._id));
        return [...otherFiles, ...response.data.files];
      });
      
      toast.success('Folder renamed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (node) => {
    if (!window.confirm(`Are you sure you want to delete folder ${node.name} and all its contents?`)) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.delete(`${apiUrl}/files/folder`, { 
        data: { projectId, folderPath: node.path },
        withCredentials: true 
      });
      
      const deletedIds = response.data.deletedFileIds || [];
      setFiles(prev => prev.filter(f => !deletedIds.includes(f.fileId || f._id)));
      
      if (selectedFile && deletedIds.includes(selectedFile.fileId || selectedFile._id)) {
        setSelectedFile(null);
      }
      
      toast.success('Folder deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const handleMoveNode = async (node, newPath) => {
    if (node.type === 'file') {
      const newName = newPath.split('/').pop();
      await handleRenameFile(node, newName, newPath);
    } else {
      const newName = newPath.split('/').pop();
      await handleRenameFolder(node, newName, newPath);
    }
  };

  const handleRestoreSnapshot = async (snapshot) => {
    if (!window.confirm(`Are you sure you want to restore this file to the snapshot from ${new Date(snapshot.createdAt).toLocaleString()}? This will overwrite the current content.`)) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/snapshots/${snapshot.snapshotId || snapshot._id}/restore`, {}, { withCredentials: true });
      
      const { file: updatedFile } = response.data;
      
      // Update local files state
      setFiles(prev => prev.map(f => {
        if (f.fileId === updatedFile.fileId || f._id === updatedFile._id) {
          return { ...f, content: updatedFile.content, lastEditedBy: updatedFile.lastEditedBy };
        }
        return f;
      }));
      
      // Update selected file explicitly if it is the one being restored
      if (selectedFile && (selectedFile.fileId === updatedFile.fileId || selectedFile._id === updatedFile._id)) {
        setSelectedFile(prev => ({ ...prev, content: updatedFile.content }));
      }
      
      toast.success('File restored successfully');
      // Optionally stay in snapshots tab to see the new restore snapshot
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore snapshot');
    }
  };

  const handleCheckoutBranch = async (latestSnapshot) => {
    // 1. Update the live file content on the frontend
    setFiles(prev => prev.map(f => {
      if (f.fileId === latestSnapshot.fileId || f._id === latestSnapshot.fileId) {
        return { ...f, content: latestSnapshot.content };
      }
      return f;
    }));
    
    if (selectedFile && (selectedFile.fileId === latestSnapshot.fileId || selectedFile._id === latestSnapshot.fileId)) {
      setSelectedFile(prev => ({ ...prev, content: latestSnapshot.content }));
    }
    
    // 2. Persist the change to the backend File document quietly
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiUrl}/files/${latestSnapshot.fileId || latestSnapshot._id}/content`, {
        content: latestSnapshot.content
      }, { withCredentials: true });
      
      toast.success(`Switched to branch: ${latestSnapshot.branch}`);
    } catch (error) {
      console.error('Failed to sync branch checkout to backend', error);
      toast.error('Failed to sync branch checkout');
    }
  };

  if (loading) {
    return <div className="h-[calc(100vh-73px)] w-full flex items-center justify-center bg-dark"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  // Determine if the current user is not the owner (e.g. read-only mode for public viewing)
  // project.ownerId can be an object (if populated) or string
  const projectOwnerId = typeof project?.ownerId === 'object' ? project.ownerId._id : project?.ownerId;
  const currentUserId = user?.userId || user?._id;
  const isReadOnly = collabSession ? false : (projectOwnerId !== currentUserId);

  const isWebProject = ['react', 'vanilla-web', 'node-web'].includes(project?.language);

  const handleSearchResultClick = (fileObj, lineNumber) => {
    setSelectedFile(fileObj);
    setScrollToLine(lineNumber);
  };

  return (
    <div className="h-[calc(100vh-73px)] w-full flex overflow-hidden bg-dark text-main">
      {/* Sidebar Tab Icons */}
      {!isReadOnly && (
        <div className="w-[44px] shrink-0 bg-[#181825] border-r border-white/5 flex flex-col items-center pt-3 gap-1">
          <button
            id="sidebar-tab-files"
            onClick={() => setSidebarTab('files')}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              sidebarTab === 'files' 
                ? 'text-primary bg-white/5 shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                : 'text-muted hover:text-main hover:bg-white/5'
            }`}
            title="Explorer"
          >
            <FolderTree size={18} />
          </button>
          <button
            id="sidebar-tab-search"
            onClick={() => setSidebarTab('search')}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              sidebarTab === 'search' 
                ? 'text-primary bg-white/5 shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                : 'text-muted hover:text-main hover:bg-white/5'
            }`}
            title="Search in Files"
          >
            <Search size={18} />
          </button>
          {!isWebProject && (
            <button
              id="sidebar-tab-run"
              onClick={() => setSidebarTab('run')}
              className={`p-2.5 rounded-lg transition-all duration-150 ${
                sidebarTab === 'run' 
                  ? 'text-emerald-400 bg-emerald-500/10 shadow-[inset_2px_0_0_0_#10b981]' 
                  : 'text-muted hover:text-main hover:bg-white/5'
              }`}
              title="Run Code (Sandbox)"
            >
              <Play size={18} />
            </button>
          )}
          <button
            id="sidebar-tab-snapshots"
            onClick={() => setSidebarTab('snapshots')}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              sidebarTab === 'snapshots' 
                ? 'text-primary bg-white/5 shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                : 'text-muted hover:text-main hover:bg-white/5'
            }`}
            title="File History"
          >
            <History size={18} />
          </button>
          <button
            id="sidebar-tab-comments"
            onClick={() => setSidebarTab('comments')}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              sidebarTab === 'comments' 
                ? 'text-primary bg-white/5 shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                : 'text-muted hover:text-main hover:bg-white/5'
            }`}
            title="Project Comments & Code Review"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      )}

      {/* Sidebar Panel */}
      <div className="w-[280px] shrink-0 border-r border-white/10 flex flex-col bg-[#1e1e2e]">
        <div className="p-3 border-b border-white/5 font-semibold text-sm truncate opacity-80 uppercase tracking-widest text-primary flex justify-between items-center">
          <span>{project?.name}</span>
          {isReadOnly && <span className="bg-white/10 text-[0.6rem] px-2 py-0.5 rounded text-muted">Read Only</span>}
        </div>
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'files' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                <FileTree 
                  files={files}
                  onCreateFile={isReadOnly ? () => toast.error('Read only') : handleCreateFile}
                  onRenameFile={isReadOnly ? () => toast.error('Read only') : handleRenameFile}
                  onDeleteFile={isReadOnly ? () => toast.error('Read only') : handleDeleteFile}
                  onRenameFolder={isReadOnly ? () => toast.error('Read only') : handleRenameFolder}
                  onDeleteFolder={isReadOnly ? () => toast.error('Read only') : handleDeleteFolder}
                  onMoveNode={isReadOnly ? () => toast.error('Read only') : handleMoveNode}
                  onFileSelect={(file) => { setSelectedFile(file); setScrollToLine(null); }}
                />
              </div>
              {isWebProject && (
                <PackageManager 
                  files={files}
                  onSaveFile={handleSaveFileContent}
                  isReadOnly={isReadOnly}
                />
              )}
            </div>
          )}
          {sidebarTab === 'search' && (
            <SearchPanel
              projectId={projectId}
              files={files}
              onResultClick={handleSearchResultClick}
            />
          )}
          {sidebarTab === 'run' && (
            <SandboxPanel file={selectedFile} codeRef={codeRef} />
          )}
          {sidebarTab === 'snapshots' && (
            <SnapshotPanel 
              file={selectedFile} 
              isReadOnly={isReadOnly}
              onViewDiff={(snap) => setDiffModalState({ isOpen: true, snapshot: snap })}
              onRestore={handleRestoreSnapshot}
              onCheckout={handleCheckoutBranch}
            />
          )}
          {sidebarTab === 'comments' && (
            <ProjectCommentsPanel
              projectId={projectId}
              currentUser={user}
              files={files}
              onFileSelect={(file, line) => {
                setSelectedFile(file);
                if (line) setScrollToLine(line);
              }}
            />
          )}
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex-1 flex bg-[#181825] overflow-hidden">
        <div style={{ width: isWebProject ? `${100 - previewWidth}%` : '100%' }} className="flex flex-col min-w-0 flex-shrink-0">
          {selectedFile ? (
            <div className="flex-1 p-4 h-full flex flex-col min-h-0">
              <CodeEditor 
                file={selectedFile} 
                onSave={handleSaveFileContent} 
                readOnly={isReadOnly}
                scrollToLine={scrollToLine}
                socket={socket}
                collabSession={collabSession}
                collabParticipants={collabParticipants}
                isCollabOwner={collabSession && user && (collabSession.ownerId === (user.userId || user._id))}
                onStartCollab={handleStartCollab}
                onEndCollab={handleEndCollab}
                onKickParticipant={handleKickParticipant}
                shareLink={shareLink}
                isStartingCollab={isStartingCollab}
                onOpenSandbox={isWebProject ? undefined : () => setSidebarTab('run')}
                projectId={projectId}
                currentUser={user}
                snapshotId={selectedFile?.snapshotId || null}
                codeRef={codeRef}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted flex-col opacity-60">
              <h2 className="text-3xl font-bold mb-4">Welcome to {project?.name}</h2>
              <p className="text-lg">Select a file from the sidebar to start coding.</p>
            </div>
          )}
        </div>

        {/* Resizer Handle */}
        {isWebProject && (
          <div 
            className="w-1.5 bg-white/5 hover:bg-primary/50 active:bg-primary cursor-col-resize z-50 shrink-0 transition-colors"
            onMouseDown={handleDragStart}
          />
        )}

        {/* Web Preview Panel */}
        {isWebProject && (
          <div style={{ width: `calc(${previewWidth}% - 6px)`, pointerEvents: isDragging ? 'none' : 'auto' }} className="min-w-0 flex-shrink-0 flex flex-col h-full border-l border-white/10">
            <WebPreviewPanel 
              files={files} 
              language={project?.language} 
            />
          </div>
        )}
      </div>

      <SnapshotDiffModal
        isOpen={diffModalState.isOpen}
        onClose={() => setDiffModalState({ isOpen: false, snapshot: null })}
        originalContent={diffModalState.snapshot?.content}
        modifiedContent={selectedFile?.content}
        language={selectedFile?.language || 'plaintext'}
        fileName={selectedFile?.name}
        snapshotHash={diffModalState.snapshot?.hash}
      />

      {/* Invisible overlay to prevent iframes from swallowing mouse events during drag */}
      {isDragging && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize" />
      )}
    </div>
  );
};

export default ProjectEditor;
