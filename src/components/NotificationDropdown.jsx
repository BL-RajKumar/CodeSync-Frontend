import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  AtSign, 
  History, 
  Check, 
  CheckCheck,
  Bell,
  X
} from 'lucide-react';

const NotificationDropdown = ({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead, 
  onClose 
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = async (n) => {
    // 1. Mark as read
    if (!n.isRead) {
      await onMarkRead(n.notificationId);
    }

    // 2. Close dropdown
    onClose();

    // 3. Deep-link redirect
    switch (n.type) {
      case 'session_invite':
        // Direct navigate to join active session
        navigate(`/collab/${n.relatedId}`);
        break;

      case 'participant_join':
        // Direct navigate to host/guest collab session
        navigate(`/collab/${n.relatedId}`);
        break;

      case 'comment_add':
      case 'reply':
      case 'mention': {
        // relatedId is formatted as "projectId/fileId/lineNumber"
        const parts = n.relatedId?.split('/') || [];
        const projectId = parts[0];
        const fileId = parts[1];
        const lineNumber = parts[2];
        
        if (projectId && fileId) {
          navigate(`/p/${projectId}?file=${fileId}${lineNumber ? `&line=${lineNumber}` : ''}`);
        }
        break;
      }

      case 'new_snapshot': {
        // relatedId is formatted as "projectId/fileId"
        const parts = n.relatedId?.split('/') || [];
        const projectId = parts[0];
        const fileId = parts[1];
        
        if (projectId && fileId) {
          navigate(`/p/${projectId}?file=${fileId}&tab=snapshots`);
        }
        break;
      }

      default:
        // Default fallback to dashboard
        navigate('/dashboard');
        break;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'session_invite':
        return <Users size={16} className="text-blue-400" />;
      case 'participant_join':
        return <UserPlus size={16} className="text-emerald-400" />;
      case 'comment_add':
        return <MessageSquare size={16} className="text-indigo-400" />;
      case 'reply':
        return <MessageSquare size={16} className="text-violet-400" />;
      case 'mention':
        return <AtSign size={16} className="text-yellow-400" />;
      case 'new_snapshot':
        return <History size={16} className="text-pink-400" />;
      default:
        return <Bell size={16} className="text-muted" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="absolute right-0 mt-3 w-[360px] bg-[#1e1e2e]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col max-h-[480px] animate-fade-in">
      {/* Dropdown Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary" />
          <span className="font-semibold text-sm tracking-wide text-main">Notifications</span>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[0.7rem] font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-all duration-150"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar divide-y divide-white/5">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted flex flex-col items-center justify-center gap-2 opacity-65">
            <Bell size={32} className="stroke-[1.5]" />
            <p className="text-xs">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.notificationId}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex gap-3 cursor-pointer relative transition-all duration-150 hover:bg-white/5 ${!n.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
            >
              {/* Icon / Avatar Wrapper */}
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
                  {getIcon(n.type)}
                  {n.actorId?.avatarUrl && (
                    <img 
                      src={n.actorId.avatarUrl} 
                      alt="Avatar" 
                      className="absolute inset-0 w-full h-full rounded-full object-cover" 
                    />
                  )}
                </div>
              </div>

              {/* Text Context */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-main truncate">
                    {n.actorId?.username || 'Collaborator'}
                  </span>
                  <span className="text-[0.65rem] text-muted whitespace-nowrap">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                
                <h4 className="text-xs font-semibold text-main mb-0.5 truncate">
                  {n.title}
                </h4>
                
                <p className="text-[0.7rem] text-muted leading-relaxed line-clamp-2">
                  {n.message}
                </p>
              </div>

              {/* Individual Mark-Read Check */}
              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(n.notificationId);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/5 hover:bg-primary/20 text-muted hover:text-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 transition-all duration-150"
                  title="Mark as read"
                >
                  <Check size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
