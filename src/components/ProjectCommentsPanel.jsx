import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MessageSquare, CheckCircle, Circle, Loader2, ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { CommentItem } from './InlineCommentWidget';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProjectCommentsPanel = ({ projectId, currentUser, files, onFileSelect }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('unresolved'); // 'all' | 'unresolved' | 'resolved'
  const [expandedComments, setExpandedComments] = useState({});

  const fetchComments = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params = filter === 'all' ? '' : `?resolved=${filter === 'resolved'}`;
      const res = await axios.get(`${API}/comments/project/${projectId}${params}`, { withCredentials: true });
      setComments(res.data);
    } catch (e) {
      toast.error('Failed to load codepad comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId, filter]);

  const toggleExpand = (id) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileJump = (comment) => {
    if (!files || !onFileSelect) return;
    const file = files.find(f => (f.fileId || f._id) === (comment.fileId?._id || comment.fileId));
    if (file) onFileSelect(file, comment.lineNumber);
  };

  const resolvedCount = comments.filter(c => c.resolved).length;

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="text-primary" size={18} />
          <h3 className="font-semibold text-main">CodePad Comments</h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#181825] rounded-lg p-0.5 text-xs">
          {['all', 'unresolved', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-md capitalize transition-colors ${
                filter === f ? 'bg-primary/20 text-primary font-semibold' : 'text-muted hover:text-main'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><Circle size={10} className="text-yellow-400" /> {comments.length - resolvedCount} open</span>
        <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> {resolvedCount} resolved</span>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted text-sm py-8 italic">
            No {filter !== 'all' ? filter : ''} comments found.
          </div>
        ) : (
          comments.map(comment => {
            const cId = comment.commentId || comment._id;
            const isExpanded = expandedComments[cId];
            const fileName = comment.fileId?.name || 'Unknown file';
            const filePath = comment.fileId?.path || '';

            return (
              <div key={cId} className="bg-[#181825] border border-white/5 rounded-lg overflow-hidden">
                {/* File & line header */}
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(cId)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {comment.resolved
                      ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                      : <Circle size={12} className="text-yellow-400 shrink-0" />}
                    <button
                      onClick={e => { e.stopPropagation(); handleFileJump(comment); }}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors truncate"
                      title={filePath}
                    >
                      <FileCode size={10} className="shrink-0" />
                      <span className="truncate">{fileName}</span>
                      <span className="shrink-0">:{comment.lineNumber}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {comment.replies?.length > 0 && (
                      <span className="text-[10px] text-muted">{comment.replies.length + 1} comments</span>
                    )}
                    {isExpanded ? <ChevronDown size={12} className="text-muted" /> : <ChevronRight size={12} className="text-muted" />}
                  </div>
                </div>

                {/* Preview (always visible) */}
                <div className="px-3 pb-2">
                  <p className="text-xs text-main/80 truncate">{comment.content}</p>
                  <p className="text-[10px] text-muted mt-0.5">
                    by {comment.authorId?.username || 'User'} · {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Expanded full thread */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-3 flex flex-col gap-2">
                    <CommentItem
                      comment={comment}
                      currentUser={currentUser}
                      onUpdate={fetchComments}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectCommentsPanel;
