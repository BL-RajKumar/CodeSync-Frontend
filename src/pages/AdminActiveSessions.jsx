import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldAlert, Loader2, Link2, Users, Calendar, Folder, FileCode, Radio, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/admin/sessions`, { withCredentials: true });
      setSessions(res.data.sessions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm(`Are you sure you want to forcibly terminate collaboration session "${sessionId}"? All connected users will be disconnected.`)) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/admin/sessions/${sessionId}`, { withCredentials: true });
      toast.success('Collaboration session terminated successfully');
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate collaboration session');
    }
  };

  useEffect(() => {
    fetchSessions();
    // Refresh sessions status every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full text-main font-sans p-6 md:p-8 h-full overflow-y-auto">
      <div className="w-full space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-main flex items-center gap-2">
              Active Sessions
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-muted text-sm mt-1">
              Platform-wide live monitoring of all active collaborative editor workspaces.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
            <ShieldAlert size={14} />
            Administrator Mode Active
          </div>
        </div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <Loader2 size={36} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Scanning live workspace rooms...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-muted bg-card border border-border rounded-2xl">
            <Radio size={48} className="mx-auto text-muted mb-4 animate-pulse" />
            <p className="text-lg font-medium text-main">No active sessions at the moment</p>
            <p className="text-xs text-muted mt-1">When users start sharing code, their live channels will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div 
                key={session.sessionId} 
                className="bg-card border border-border rounded-2xl p-6 relative backdrop-blur-lg shadow-sm hover:border-primary/30 transition-all duration-350 flex flex-col justify-between"
              >
                {/* Live Pulse Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.65rem] font-bold tracking-wide uppercase">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>

                <div className="space-y-4">
                  {/* Session Id */}
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Session Room</span>
                    <h3 className="text-sm font-mono text-main mt-0.5 truncate select-all" title="Click to select session ID">
                      {session.sessionId}
                    </h3>
                  </div>

                  {/* Project & File Metadata */}
                  <div className="space-y-2.5 bg-white/5 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Folder size={14} className="text-primary/70" />
                      <span className="font-semibold text-main truncate">
                        {session.projectId?.name || 'Deleted Project'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted border-t border-border pt-2.5">
                      <FileCode size={14} className="text-primary/70" />
                      <span className="font-mono text-main truncate">
                        {session.fileId?.name || 'Deleted File'}
                      </span>
                      <span className="text-[0.6rem] uppercase bg-white/5 border border-border text-muted px-1.5 py-0.5 rounded font-sans">
                        {session.language}
                      </span>
                    </div>
                  </div>

                  {/* Host User Info */}
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-border">
                    {session.ownerId?.avatarUrl ? (
                      <img src={session.ownerId.avatarUrl} alt="Host Avatar" referrerpolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-input border border-border flex items-center justify-center text-muted font-bold text-xs uppercase">
                        {session.ownerId?.username?.charAt(0) || 'H'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-muted">Host / Creator</span>
                      <span className="text-sm font-semibold text-main truncate">@{session.ownerId?.username || 'unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-border pt-4 mt-5 flex items-center justify-between text-xs text-muted">
                  {/* Participant count */}
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users size={14} className="text-primary/60" />
                    <span>{session.participants?.length || 0} / {session.maxParticipants} joined</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTerminateSession(session.sessionId)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all duration-200 cursor-pointer"
                      title="Terminate session forcibly"
                    >
                      <XCircle size={12} />
                      Terminate
                    </button>
                    <Link 
                      to={`/collab/${session.sessionId}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-200"
                    >
                      <Link2 size={12} />
                      Inspect
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminActiveSessions;
