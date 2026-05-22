import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import FileTree from '../components/FileTree';
import CodeEditor from '../components/CodeEditor';
import { useAuth } from '../context/AuthContext';

const ProjectEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProjectAndFiles = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Fetch project to verify it exists and we have access
        const projRes = await axios.get(`${apiUrl}/projects/${projectId}`, { withCredentials: true });
        setProject(projRes.data);

        // Fetch files
        const filesRes = await axios.get(`${apiUrl}/files/${projectId}`, { withCredentials: true });
        setFiles(filesRes.data);
      } catch (error) {
        toast.error('Failed to load project editor');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndFiles();
  }, [projectId, navigate]);

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
      const response = await axios.put(`${apiUrl}/files/${node.fileId}/rename`, {
        name: newName,
        path: newPath
      }, { withCredentials: true });
      
      setFiles(prev => prev.map(f => f.fileId === node.fileId ? response.data : f));
      
      if (selectedFile?.fileId === node.fileId) {
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
      await axios.delete(`${apiUrl}/files/${node.fileId}`, { withCredentials: true });
      
      setFiles(prev => prev.filter(f => f.fileId !== node.fileId));
      if (selectedFile?.fileId === node.fileId) {
        setSelectedFile(null);
      }
      toast.success('File deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleSaveFileContent = async (fileId, newContent) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/files/${fileId}/content`, {
        content: newContent
      }, { withCredentials: true });
      
      // Update local files state with new size/lastEditedBy
      setFiles(prev => prev.map(f => {
        if (f.fileId === fileId) {
          return { ...f, content: newContent, size: response.data.size };
        }
        return f;
      }));
      
      // Update selected file object to drop the dirty state
      if (selectedFile?.fileId === fileId) {
        setSelectedFile(prev => ({ ...prev, content: newContent }));
      }
      
      toast.success('File saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save file');
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
        const updatedIds = response.data.files.map(f => f.fileId);
        const otherFiles = prev.filter(f => !updatedIds.includes(f.fileId));
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
      setFiles(prev => prev.filter(f => !deletedIds.includes(f.fileId)));
      
      if (selectedFile && deletedIds.includes(selectedFile.fileId)) {
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

  if (loading) {
    return <div className="h-[calc(100vh-73px)] w-full flex items-center justify-center bg-dark"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  // Determine if the current user is not the owner (e.g. read-only mode for public viewing)
  // project.ownerId can be an object (if populated) or string
  const projectOwnerId = typeof project?.ownerId === 'object' ? project.ownerId._id : project?.ownerId;
  const currentUserId = user?.userId || user?._id;
  const isReadOnly = projectOwnerId !== currentUserId;

  return (
    <div className="h-[calc(100vh-73px)] w-full flex overflow-hidden bg-dark text-main">
      {/* Sidebar: File Tree */}
      <div className="w-[280px] shrink-0 border-r border-white/10 flex flex-col bg-[#1e1e2e]">
        <div className="p-3 border-b border-white/5 font-semibold text-sm truncate opacity-80 uppercase tracking-widest text-primary flex justify-between items-center">
          <span>{project?.name}</span>
          {isReadOnly && <span className="bg-white/10 text-[0.6rem] px-2 py-0.5 rounded text-muted">Read Only</span>}
        </div>
        <div className="flex-1 overflow-hidden">
          <FileTree 
            files={files}
            onCreateFile={isReadOnly ? () => toast.error('Read only') : handleCreateFile}
            onRenameFile={isReadOnly ? () => toast.error('Read only') : handleRenameFile}
            onDeleteFile={isReadOnly ? () => toast.error('Read only') : handleDeleteFile}
            onRenameFolder={isReadOnly ? () => toast.error('Read only') : handleRenameFolder}
            onDeleteFolder={isReadOnly ? () => toast.error('Read only') : handleDeleteFolder}
            onMoveNode={isReadOnly ? () => toast.error('Read only') : handleMoveNode}
            onFileSelect={setSelectedFile}
          />
        </div>
      </div>
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#181825]">
        {selectedFile ? (
          <div className="flex-1 p-4">
            <CodeEditor 
              file={selectedFile} 
              onSave={handleSaveFileContent} 
              readOnly={isReadOnly} 
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted flex-col opacity-60">
            <h2 className="text-3xl font-bold mb-4">Welcome to {project?.name}</h2>
            <p className="text-lg">Select a file from the sidebar to start coding.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
