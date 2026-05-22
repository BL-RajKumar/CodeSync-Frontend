import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Send, Loader2, Check, Edit2, Trash2, X, Reply, MessageSquare } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CommentItem = ({ comment, currentUser, onUpdate, isReply = false }) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [repliesExpanded, setRepliesExpanded] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [saving, setSaving] = useState(false);

  const isAuthor = currentUser && (
    comment.authorId?._id === (currentUser.userId || currentUser._id) ||
    comment.authorId?.id === (currentUser.userId || currentUser._id)
  );

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await axios.put(`${API}/comments/${comment.commentId || comment._id}`, 
        { content: editContent }, { withCredentials: true });
      toast.success('Comment updated');
      setEditing(false);
      onUpdate();
    } catch (e) {
      toast.error('Failed to update comment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment and all replies?')) return;
    try {
      await axios.delete(`${API}/comments/${comment.commentId || comment._id}`, 
        { withCredentials: true });
      toast.success('Comment deleted');
      onUpdate();
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  const handleToggleResolve = async () => {
    try {
      await axios.put(`${API}/comments/${comment.commentId || comment._id}/resolve`, 
        {}, { withCredentials: true });
      onUpdate();
    } catch (e) {
      toast.error('Failed to toggle resolve');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/comments`, {
        fileId: comment.fileId?._id || comment.fileId,
        projectId: comment.projectId?._id || comment.projectId,
        snapshotId: comment.snapshotId?._id || comment.snapshotId,
        lineNumber: comment.lineNumber,
        content: replyContent.trim(),
        parentCommentId: comment.commentId || comment._id,
      }, { withCredentials: true });
      setReplyContent('');
      onUpdate();
    } catch (e) {
      toast.error('Failed to post reply');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-6 border-l-2 border-white/10 pl-3' : ''}`}>
      <div className={`rounded-lg p-3 ${comment.resolved ? 'opacity-50' : ''} ${isReply ? 'bg-[#181825]/50' : 'bg-[#181825]'} border border-white/5`}>
        {/* Author & meta */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
              {comment.authorId?.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-xs font-semibold text-main">{comment.authorId?.username || 'User'}</span>
            <span className="text-[10px] text-muted">Line {comment.lineNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            {!isReply && (
              <button
                onClick={handleToggleResolve}
                title={comment.resolved ? 'Unresolve' : 'Resolve'}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${comment.resolved ? 'text-green-400' : 'text-muted'}`}
              >
                <Check size={12} />
              </button>
            )}
            {isAuthor && (
              <>
                <button onClick={() => setEditing(!editing)} className="p-1 rounded hover:bg-white/10 text-muted transition-colors">
                  <Edit2 size={11} />
                </button>
                <button onClick={handleDelete} className="p-1 rounded hover:bg-white/10 text-red-400 transition-colors">
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content / Edit mode */}
        {editing ? (
          <div className="flex gap-1.5">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="flex-1 bg-[#1e1e2e] border border-white/10 rounded p-2 text-xs text-main outline-none resize-none min-h-[50px]"
            />
            <div className="flex flex-col gap-1">
              <button onClick={handleEdit} disabled={saving} className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded hover:bg-white/10 text-muted">
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-main/90 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
        )}

        {/* Replies toggle pill (only on top-level and only if replies exist) */}
        {!isReply && comment.replies?.length > 0 && (
          <button
            onClick={() => setRepliesExpanded(!repliesExpanded)}
            className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted hover:text-primary transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-full border border-white/5"
            title={repliesExpanded ? 'Collapse replies' : 'Expand replies'}
          >
            <MessageSquare size={10} />
            <span className="font-medium text-main">{comment.replies.length}</span>
            <span>{comment.replies.length === 1 ? 'reply' : 'replies'}</span>
            <span className="text-[8px] opacity-50 ml-0.5">
              ({repliesExpanded ? 'click to hide' : 'click to show'})
            </span>
          </button>
        )}
      </div>

      {/* Nested Replies */}
      {!isReply && comment.replies?.length > 0 && repliesExpanded && (
        <div className="mt-2 flex flex-col gap-2">
          {comment.replies.map(r => (
            <CommentItem key={r.commentId || r._id} comment={r} currentUser={currentUser} onUpdate={onUpdate} isReply />
          ))}
        </div>
      )}

      {/* Reply input — always visible under top-level threads */}
      {!isReply && (
        <div className="mt-2.5 ml-6 flex gap-2 items-center bg-[#181825]/30 p-1.5 rounded-lg border border-white/5">
          <input
            type="text"
            placeholder="Write a reply... (@mention supported)"
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
            className="flex-1 bg-transparent px-2 py-1 text-xs text-main outline-none placeholder:text-muted/50"
          />
          <button
            onClick={handleReply}
            disabled={saving || !replyContent.trim()}
            className="p-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-all"
            title="Send reply"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * InlineCommentWidget — shown as a floating panel near a line.
 * Props:
 *   line           {number}   - line number the thread belongs to
 *   fileId         {string}
 *   projectId      {string}
 *   snapshotId     {string|null}
 *   comments       {array}    - pre-filtered comments for this line
 *   currentUser    {object}
 *   onClose        {fn}
 *   onUpdate       {fn}       - called after any mutation so parent can refetch
 *   position       {object}   - {top, left} px offset (editor coordinates)
 */
const InlineCommentWidget = ({
  line,
  fileId,
  projectId,
  snapshotId,
  comments = [],
  currentUser,
  onClose,
  onUpdate,
  position,
}) => {
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/comments`, {
        fileId,
        projectId,
        snapshotId: snapshotId || null,
        lineNumber: line,
        content: newComment.trim(),
        parentCommentId: null,
      }, { withCredentials: true });
      setNewComment('');
      toast.success('Comment added');
      onUpdate();
    } catch (e) {
      toast.error('Failed to post comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed z-50 w-[360px] max-h-[500px] flex flex-col bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: position?.top ?? 100, left: position?.left ?? 100 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-white/10">
        <span className="text-xs font-semibold text-primary">Line {line} — Comments</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-muted transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Existing threads */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-3 custom-scrollbar">
        {comments.length === 0 && (
          <p className="text-xs text-muted italic text-center py-3">No comments yet. Be the first to review!</p>
        )}
        {comments.map(c => (
          <CommentItem
            key={c.commentId || c._id}
            comment={c}
            currentUser={currentUser}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {/* New comment input */}
      <div className="border-t border-white/10 p-3 flex gap-2 bg-[#181825]">
        <textarea
          placeholder="Add a code review comment... (@mention supported)"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={2}
          className="flex-1 bg-[#1e1e2e] border border-white/10 rounded p-2 text-xs text-main outline-none resize-none focus:border-primary"
        />
        <button
          onClick={handlePost}
          disabled={saving || !newComment.trim()}
          className="self-end p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};

export { CommentItem };
export default InlineCommentWidget;
