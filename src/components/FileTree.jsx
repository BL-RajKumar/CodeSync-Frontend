import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, Plus, Edit2, Trash2, X, Check, FilePlus, FolderPlus } from 'lucide-react';

const FileTreeNode = ({ node, level, onSelect, onRenameFile, onDeleteFile, onRenameFolder, onDeleteFolder, onMoveNode, onCreateFileInside, onCreateFolderInside }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const toggleOpen = () => {
    if (node.type === 'folder') setIsOpen(!isOpen);
    else onSelect(node);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue !== node.name) {
      const pathParts = node.path.split('/');
      pathParts[pathParts.length - 1] = renameValue.trim();
      const newPath = pathParts.join('/');
      
      if (node.type === 'file') {
        onRenameFile(node, renameValue.trim(), newPath);
      } else {
        onRenameFolder(node, renameValue.trim(), newPath);
      }
    }
    setIsRenaming(false);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      path: node.path, 
      type: node.type, 
      fileId: node.fileId,
      name: node.name
    }));
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (node.type !== 'folder') return;
    
    try {
      const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Prevent moving into itself or its own children
      if (draggedData.path === node.path || node.path.startsWith(draggedData.path + '/')) {
        return;
      }
      
      const newPath = `${node.path}/${draggedData.name}`;
      
      if (newPath !== draggedData.path) {
        onMoveNode(draggedData, newPath);
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  return (
    <div>
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center group cursor-pointer py-1 px-2 hover:bg-white/5 transition-colors text-sm 
          ${node.type === 'folder' ? 'text-main font-medium' : 'text-muted hover:text-main'}
          ${isDragOver ? 'bg-primary/20 ring-1 ring-primary rounded-sm' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="w-4 h-4 mr-1 flex items-center justify-center text-muted shrink-0">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        <span className="w-4 h-4 mr-2 flex items-center justify-center shrink-0">
          {node.type === 'folder' ? (
            isOpen ? <FolderOpen size={14} className="text-primary" /> : <Folder size={14} className="text-primary" />
          ) : (
            <FileCode size={14} className="text-[#818cf8]" />
          )}
        </span>

        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 flex items-center" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => setIsRenaming(false)}
              className="bg-dark border border-primary/50 text-main px-1 text-xs outline-none w-full"
            />
          </form>
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}

        {isHovered && !isRenaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsRenaming(true)} className="p-1 hover:text-primary transition-colors text-muted" title={`Rename ${node.type}`}>
              <Edit2 size={12} />
            </button>
            <button onClick={() => node.type === 'file' ? onDeleteFile(node) : onDeleteFolder(node)} className="p-1 hover:text-danger transition-colors text-muted" title={`Delete ${node.type}`}>
              <Trash2 size={12} />
            </button>
            {node.type === 'folder' && (
              <>
                <button onClick={() => onCreateFileInside(node.path)} className="p-1 hover:text-primary transition-colors text-muted" title="New File Here">
                  <FilePlus size={12} />
                </button>
                <button onClick={() => onCreateFolderInside(node.path)} className="p-1 hover:text-primary transition-colors text-muted" title="New Folder Here">
                  <FolderPlus size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child, i) => (
            <FileTreeNode 
              key={child.path + i} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect}
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveNode={onMoveNode}
              onCreateFileInside={onCreateFileInside}
              onCreateFolderInside={onCreateFolderInside}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, onCreateFile, onRenameFile, onDeleteFile, onRenameFolder, onDeleteFolder, onMoveNode, onFileSelect }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createPath, setCreatePath] = useState(''); // root by default

  const tree = useMemo(() => {
    const root = { name: 'root', type: 'folder', path: '', children: [] };
    
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let currentLevel = root.children;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += `/${part}`;
        const isFile = index === parts.length - 1;
        
        // Hide .keep files entirely, their parent folders are already created
        if (isFile && part === '.keep') return;
        
        let existingNode = currentLevel.find(n => n.name === part);
        
        if (!existingNode) {
          const fid = file.fileId || file._id;
          existingNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            fileId: isFile ? fid : null,
            _id: isFile ? fid : null,
            content: isFile ? file.content : undefined,
            language: isFile ? file.language : undefined,
            size: isFile ? file.size : undefined,
            originalFile: isFile ? file : null,
            children: isFile ? null : []
          };
          currentLevel.push(existingNode);
        }
        
        if (!isFile) {
          currentLevel = existingNode.children;
        }
      });
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
      nodes.forEach(node => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(root.children);

    return root.children;
  }, [files]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      if (isCreatingFolder) {
        const path = createPath ? `${createPath}/${newFileName.trim()}/.keep` : `/${newFileName.trim()}/.keep`;
        onCreateFile('.keep', path);
      } else {
        const path = createPath ? `${createPath}/${newFileName.trim()}` : `/${newFileName.trim()}`;
        onCreateFile(newFileName.trim(), path);
      }
      setIsCreating(false);
      setIsCreatingFolder(false);
      setNewFileName('');
      setCreatePath('');
    }
  };

  const startCreateFile = (path = '') => {
    setCreatePath(path);
    setIsCreating(true);
    setIsCreatingFolder(false);
    setNewFileName('');
  };

  const startCreateFolder = (path = '') => {
    setCreatePath(path);
    setIsCreatingFolder(true);
    setIsCreating(false);
    setNewFileName('');
  };

  // Add drag and drop for root level
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleRootDrop = (e) => {
    e.preventDefault();
    setIsRootDragOver(false);
    try {
      const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
      // Moving to root
      const newPath = `/${draggedData.name}`;
      if (newPath !== draggedData.path) {
        onMoveNode(draggedData, newPath);
      }
    } catch(err) {}
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#1e1e2e] text-main border-r border-white/5 select-none"
      onDragOver={(e) => { e.preventDefault(); setIsRootDragOver(true); }}
      onDragLeave={() => setIsRootDragOver(false)}
      onDrop={handleRootDrop}
    >
      <div className={`flex items-center justify-between p-3 border-b border-white/5 uppercase text-xs font-bold tracking-wider text-muted ${isRootDragOver ? 'bg-primary/10' : ''}`}>
        <span>Explorer</span>
        <div className="flex gap-1">
          <button onClick={() => startCreateFile('')} className="p-1 hover:text-primary transition-colors" title="New File at Root">
            <FilePlus size={14} />
          </button>
          <button onClick={() => startCreateFolder('')} className="p-1 hover:text-primary transition-colors" title="New Folder at Root">
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {(isCreating || isCreatingFolder) && !createPath && (
          <div className="px-3 py-1 flex items-center">
            {isCreatingFolder ? (
              <Folder size={14} className="text-primary mr-2 shrink-0" />
            ) : (
              <FileCode size={14} className="text-[#818cf8] mr-2 shrink-0" />
            )}
            <form onSubmit={handleCreateSubmit} className="flex-1">
              <input 
                autoFocus
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onBlur={() => { setIsCreating(false); setIsCreatingFolder(false); }}
                placeholder={isCreatingFolder ? "folderName" : "filename.ext"}
                className="bg-dark border border-primary/50 text-main px-1 text-xs outline-none w-full"
              />
            </form>
          </div>
        )}

        {tree.map((node, i) => (
          <FileTreeNode 
            key={node.path + i} 
            node={node} 
            level={0} 
            onSelect={onFileSelect}
            onRenameFile={onRenameFile}
            onDeleteFile={onDeleteFile}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveNode={onMoveNode}
            onCreateFileInside={startCreateFile}
            onCreateFolderInside={startCreateFolder}
          />
        ))}

        {(isCreating || isCreatingFolder) && createPath && (
          <div className="px-3 py-1 flex items-center mt-1 text-muted text-xs italic">
            Creating {isCreatingFolder ? 'folder' : 'file'} in {createPath}...
            <form onSubmit={handleCreateSubmit} className="flex-1 ml-2">
              <input 
                autoFocus
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onBlur={() => { setIsCreating(false); setIsCreatingFolder(false); }}
                placeholder={isCreatingFolder ? "folderName" : "filename.ext"}
                className="bg-dark border border-primary/50 text-main px-1 text-xs outline-none w-full"
              />
            </form>
          </div>
        )}
        
        {/* Invisible drop zone filler for the rest of the root area */}
        <div className="flex-1 min-h-[50px]"></div>
      </div>
    </div>
  );
};

export default FileTree;
