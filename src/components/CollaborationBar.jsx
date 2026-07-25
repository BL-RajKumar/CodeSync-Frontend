import React, { useState } from 'react';
import { Users, Link2, X, Share2, Shield, Loader2, UserPlus, Send, Clipboard } from 'lucide-react';
<<<<<<< HEAD
import { toast } from 'react-hot-toast';
=======
import { toast } from 'react-toastify';
>>>>>>> dev
import axios from 'axios';
import UserSearchInput from './UserSearchInput';

// Deterministic avatar background from userId or username
const AVATAR_PALETTES = [
  ['#6366f1', '#818cf8'], // indigo → violet
  ['#8b5cf6', '#a78bfa'], // purple → lavender
  ['#ec4899', '#f472b6'], // pink → rose
  ['#0ea5e9', '#38bdf8'], // sky → light blue
  ['#14b8a6', '#2dd4bf'], // teal → cyan
  ['#f59e0b', '#fbbf24'], // amber → yellow
  ['#10b981', '#34d399'], // emerald → green
  ['#ef4444', '#f87171'], // red → coral
];

function getAvatarColors(userId) {
  if (!userId) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

const CollaborationBar = ({ session, participants, isOwner, onEndSession, onStartSession, onKickParticipant, shareLink, isStarting, onToggleCopyPaste }) => {
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    setIsInviting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/collab/${session.sessionId}/invite`, {
        target: inviteUsername.trim()
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
          className="collab-start-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-150 disabled:opacity-50"
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
        {participants.map((p, i) => {
          const [from, to] = getAvatarColors(p.userId);
          const hasAvatar = p.avatarUrl && p.avatarUrl !== 'undefined' && p.avatarUrl !== 'null' && p.avatarUrl !== '';
          return (
            <div
              key={p.userId || i}
              style={!hasAvatar ? { background: `linear-gradient(135deg, ${from}, ${to})` } : {}}
              className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center text-[0.6rem] font-bold text-white relative group cursor-default shadow-md flex-shrink-0"
            >
              {hasAvatar ? (
                <img src={p.avatarUrl} alt={p.username} referrerpolicy="no-referrer" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="select-none leading-none">{p.username ? p.username.charAt(0).toUpperCase() : '?'}</span>
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
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-100 text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
                {p.username} {p.userId === session.ownerId ? '(Host)' : '(Guest)'}
              </div>
            </div>
          );
        })}

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
            <UserSearchInput 
              placeholder="Username or Email..." 
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              onSelectUser={(selectedIdentifier) => setInviteUsername(selectedIdentifier)}
              className="bg-transparent border-none text-[0.7rem] text-main w-32 focus:outline-none focus:ring-0 placeholder-zinc-400 dark:placeholder-white/20 p-0 px-1 py-0.5"
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

      {/* Block Copy-Paste (owner only) */}
      {isOwner && (
        <button
          onClick={() => onToggleCopyPaste(!session.isCopyPasteRestricted)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150 ${
            session.isCopyPasteRestricted
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : 'bg-white/5 border-white/10 text-muted hover:bg-white/10 hover:text-main'
          }`}
          title={session.isCopyPasteRestricted ? "Allow external copy-pasting" : "Block external copy-pasting"}
        >
          {session.isCopyPasteRestricted ? <Shield size={12} /> : <Clipboard size={12} />}
          <span>{session.isCopyPasteRestricted ? 'Copy/Paste Blocked' : 'Block Copy/Paste'}</span>
        </button>
      )}

      {/* Guest Paste Blocked Indicator */}
      {!isOwner && session.isCopyPasteRestricted && (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
          Copy/Paste Blocked
        </div>
      )}

      {/* End session (owner only) */}
      {isOwner && (
        <div className="relative flex items-center ml-2 border-l border-white/10 pl-2">
          {showEndConfirm ? (
            <div className="flex items-center gap-1.5 animate-fade-in bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1">
              <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold mr-1 uppercase tracking-wider">End:</span>
              <button
                onClick={() => { setShowEndConfirm(false); onEndSession(false); }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Save all changes made during this session"
              >
                Keep Changes
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); onEndSession(true); }}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                title="Revert the file to its original state"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-1.5 py-0.5 text-[10px] font-semibold rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted transition-colors ml-1"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-150"
              title="End collaboration session"
            >
              <X size={12} />
              End
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaborationBar;
