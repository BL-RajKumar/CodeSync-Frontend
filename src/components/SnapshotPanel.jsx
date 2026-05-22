import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { History, GitCommit, GitBranch, Tag, RotateCcw, Plus, Loader2, Check, X } from 'lucide-react';

const SnapshotPanel = ({ 
  file, 
  isReadOnly, 
  onViewDiff,
  onRestore,
  onCheckout
}) => {
  const [snapshots, setSnapshots] = useState([]);
  const [branches, setBranches] = useState(['main']);
  const [activeBranch, setActiveBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  
  // Create snapshot state
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Inline forms state
  const [branchingSnapshot, setBranchingSnapshot] = useState(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [taggingSnapshot, setTaggingSnapshot] = useState(null);
  const [newTagName, setNewTagName] = useState('');

  const fetchBranches = async () => {
    if (!file) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/snapshots/file/${file.fileId || file._id}/branches`, {
        withCredentials: true
      });
      setBranches(response.data);
      if (!response.data.includes(activeBranch)) {
        setActiveBranch(response.data[0] || 'main');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSnapshots = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/snapshots/file/${file.fileId || file._id}?branch=${activeBranch}`, {
        withCredentials: true
      });
      setSnapshots(response.data);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast.error('Failed to load snapshot history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [file]);

  useEffect(() => {
    fetchSnapshots();
  }, [file]); // Removed activeBranch from deps because handleBranchChange will handle it directly

  const handleBranchChange = async (newBranch) => {
    if (newBranch === activeBranch) return;
    setActiveBranch(newBranch);
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/snapshots/file/${file.fileId || file._id}?branch=${newBranch}`, {
        withCredentials: true
      });
      const branchSnapshots = response.data;
      setSnapshots(branchSnapshots);
      
      // Automatically "checkout" the latest code of the new branch
      if (branchSnapshots.length > 0 && onCheckout) {
        onCheckout(branchSnapshots[0]);
      }
    } catch (error) {
      toast.error('Failed to load branch history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!file || !message.trim()) return;

    setIsCreating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/snapshots`, {
        fileId: file.fileId || file._id,
        message: message.trim(),
        branch: activeBranch,
        tag: tagInput.trim() || null
      }, { withCredentials: true });
      
      toast.success('Snapshot created');
      setMessage('');
      setTagInput('');
      fetchSnapshots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create snapshot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBranch = async (snapshotId) => {
    if (!newBranchName.trim()) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/snapshots/${snapshotId}/branch`, {
        branchName: newBranchName.trim()
      }, { withCredentials: true });
      
      toast.success(`Branched to ${newBranchName}`);
      setBranchingSnapshot(null);
      setNewBranchName('');
      await fetchBranches();
      setActiveBranch(newBranchName.trim());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create branch');
    }
  };

  const handleAddTag = async (snapshotId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiUrl}/snapshots/${snapshotId}/tag`, {
        tag: newTagName.trim()
      }, { withCredentials: true });
      
      toast.success('Tag updated');
      setTaggingSnapshot(null);
      setNewTagName('');
      fetchSnapshots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add tag');
    }
  };

  if (!file) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e2e] items-center justify-center p-6 text-center text-muted">
        <History size={48} className="opacity-20 mb-4" />
        <p>Select a file to view or create snapshots.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-primary" size={18} />
            <h3 className="font-semibold text-main">Snapshots</h3>
          </div>
          <span className="text-xs text-muted font-mono truncate max-w-[120px]" title={file.name}>
            {file.name}
          </span>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-muted" />
          <select 
            value={activeBranch} 
            onChange={(e) => handleBranchChange(e.target.value)}
            className="flex-1 bg-[#181825] border border-white/10 rounded px-2 py-1 text-sm text-main focus:outline-none focus:border-primary"
          >
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Snapshot Form */}
      {!isReadOnly && (
        <div className="p-4 border-b border-white/5 bg-[#181825]/50">
          <form onSubmit={handleCreateSnapshot} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Commit message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-[#1e1e2e] border border-white/10 rounded-md px-3 py-2 text-sm text-main focus:outline-none focus:border-primary"
              disabled={isCreating}
              required
            />
            <input
              type="text"
              placeholder="Tag (e.g. v1.0.0) Optional"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="bg-[#1e1e2e] border border-white/10 rounded-md px-3 py-1.5 text-xs text-main focus:outline-none focus:border-primary"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !message.trim()}
              className="flex items-center justify-center gap-2 bg-primary/20 text-primary border border-primary/30 rounded-md py-1.5 text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50 mt-1"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save Snapshot
            </button>
          </form>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center text-muted text-sm py-8 italic">
            No snapshots found on branch '{activeBranch}'.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshots.map((snap, index) => {
              const snapId = snap.snapshotId || snap._id;
              const isBranching = branchingSnapshot === snapId;
              const isTagging = taggingSnapshot === snapId;

              return (
                <div key={snapId} className="relative pl-6">
                  {/* Timeline connector */}
                  {index !== snapshots.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-white/5"></div>
                  )}
                  
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#181825] border-2 border-white/10 flex items-center justify-center z-10">
                    <GitCommit size={12} className="text-muted" />
                  </div>

                  <div className="bg-[#181825] border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-main break-words">
                          {snap.message}
                        </p>
                        <span className="text-[10px] font-mono text-muted bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                          {snap.hash?.substring(0, 7)}
                        </span>
                      </div>
                      
                      {snap.tag && (
                        <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit border border-blue-500/20">
                          <Tag size={10} />
                          {snap.tag}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span>{new Date(snap.createdAt).toLocaleDateString()} {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Inline Forms */}
                    {isBranching && (
                      <div className="flex items-center gap-1 mt-2 mb-2 bg-[#1e1e2e] p-1.5 rounded border border-white/10">
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="New branch name..." 
                          value={newBranchName}
                          onChange={e => setNewBranchName(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-main outline-none px-1"
                        />
                        <button onClick={() => handleCreateBranch(snapId)} className="text-green-400 hover:bg-white/10 p-1 rounded"><Check size={14} /></button>
                        <button onClick={() => setBranchingSnapshot(null)} className="text-red-400 hover:bg-white/10 p-1 rounded"><X size={14} /></button>
                      </div>
                    )}

                    {isTagging && (
                      <div className="flex items-center gap-1 mt-2 mb-2 bg-[#1e1e2e] p-1.5 rounded border border-white/10">
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Tag (e.g. v1.1)" 
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          className="flex-1 bg-transparent text-xs text-main outline-none px-1"
                        />
                        <button onClick={() => handleAddTag(snapId)} className="text-green-400 hover:bg-white/10 p-1 rounded"><Check size={14} /></button>
                        <button onClick={() => setTaggingSnapshot(null)} className="text-red-400 hover:bg-white/10 p-1 rounded"><X size={14} /></button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                      <button
                        onClick={() => onViewDiff(snap)}
                        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-main rounded text-[10px] transition-colors"
                        title="View Diff"
                      >
                        <History size={10} /> Diff
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => onRestore(snap)}
                          className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded text-[10px] transition-colors"
                          title="Restore Snapshot"
                        >
                          <RotateCcw size={10} /> Restore
                        </button>
                      )}
                      {!isReadOnly && !isBranching && (
                        <button
                          onClick={() => setBranchingSnapshot(snapId)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] transition-colors ml-auto"
                          title="Create branch from here"
                        >
                          <GitBranch size={10} /> Branch
                        </button>
                      )}
                      {!isReadOnly && !isTagging && (
                        <button
                          onClick={() => setTaggingSnapshot(snapId)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[10px] transition-colors"
                          title="Add Tag"
                        >
                          <Tag size={10} /> Tag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotPanel;
