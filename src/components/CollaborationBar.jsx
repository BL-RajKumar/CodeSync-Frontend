import React, { useState } from 'react';
import { Users, Link2, X, Share2, Shield, Loader2, UserPlus, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CollaborationBar = ({ session, participants, isOwner, onEndSession, onStartSession, onKickParticipant, shareLink, isStarting }) => {
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    setIsInviting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/collab/${session.sessionId}/invite`, {
        username: inviteUsername.trim()
      }, { withCredentials: true });
      
      toast.success(`Invitation sent to ${inviteUsername.trim()}!`);
      setInviteUsername('');
      setShowInviteInput(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  // No active session — show "Start Collab" button
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onStartSession}
          disabled={isStarting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-150 disabled:opacity-50"
        >
          {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
          Start Collab
        </button>
      </div>
    );
  }

  // Active session — show collab bar
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
      </div>

      {/* Participant avatars */}
      <div className="flex items-center -space-x-2">
        {participants.map((p, i) => (
          <div
            key={p.userId || i}
            className="w-7 h-7 rounded-full border-2 border-[#181825] flex items-center justify-center text-[0.6rem] font-bold bg-gradient-to-br from-primary/60 to-[#818cf8]/60 text-white relative group cursor-default"
          >
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={p.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              p.username?.charAt(0).toUpperCase()
            )}
            
            {/* Kick Button (only for owner, and cannot kick self) */}
            {isOwner && p.userId !== session.ownerId && (
              <button
                onClick={() => {
                  if (window.confirm(`Kick ${p.username} from the session?`)) {
                    onKickParticipant(p.userId);
                  }
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-sm"
                title={`Kick ${p.username}`}
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}

            {/* Tooltip */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-dark border border-white/10 text-main text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {p.username} {p.userId === session.ownerId ? '(Host)' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Participant count */}
      <span className="text-xs text-muted">
        {participants.length} online
      </span>

      {/* Password protected indicator */}
      {session.isPasswordProtected && (
        <Shield size={14} className="text-yellow-400" title="Password protected" />
      )}

      {/* Share link */}
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all duration-150 text-muted"
        title="Copy share link"
      >
        <Link2 size={12} />
        Share
      </button>

      {/* Invite Collaborator Inline Form */}
      <div className="relative flex items-center">
        {showInviteInput ? (
          <form onSubmit={handleSendInvite} className="flex items-center gap-1 bg-[#1e1e2e]/90 border border-white/15 rounded-md px-2 py-0.5 shadow-lg border-primary/30">
            <input 
              type="text" 
              placeholder="Username..." 
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              className="bg-transparent border-none text-[0.7rem] text-main w-24 focus:outline-none focus:ring-0 placeholder-white/20 p-0 px-1 py-0.5"
              disabled={isInviting}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isInviting}
              className="p-1 text-primary hover:text-primary-hover disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isInviting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
            </button>
            <button 
              type="button" 
              onClick={() => { setShowInviteInput(false); setInviteUsername(''); }}
              className="p-1 text-muted hover:text-main flex items-center justify-center cursor-pointer"
            >
              <X size={10} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowInviteInput(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-150"
            title="Invite collaborator by username"
          >
            <UserPlus size={12} />
            Invite
          </button>
        )}
      </div>

      {/* End session (owner only) */}
      {isOwner && (
        <button
          onClick={onEndSession}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-150"
          title="End collaboration session"
        >
          <X size={12} />
          End
        </button>
      )}
    </div>
  );
};

export default CollaborationBar;
