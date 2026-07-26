import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShieldAlert, Send, Info, AlertTriangle, 
  AlertOctagon, MessageSquare, Radio
} from 'lucide-react';

const AdminBroadcasts = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Broadcast title and message are required.');
      return;
    }

    if (!window.confirm('Are you sure you want to broadcast this message to ALL online users immediately?')) {
      return;
    }

    setIsSending(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/admin/broadcast`, {
        title: title.trim(),
        message: message.trim(),
        type
      }, { withCredentials: true });

      toast.success('Platform broadcast transmitted successfully');
      
      // Clear form after successful send
      setTitle('');
      setMessage('');
      setType('info');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full text-main font-sans p-6 md:p-8 h-full overflow-y-auto">
      <div className="w-full space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              Platform Broadcasts
              <Radio size={24} className="text-primary animate-pulse" />
            </h1>
            <p className="text-muted text-sm mt-1">
              Dispatch real-time announcements, alerts, and system notices to all currently connected users.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur-md">
            <ShieldAlert size={14} />
            Administrator Mode Active
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Composer Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg shadow-xl h-fit">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Compose Message
            </h2>

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              
              {/* Type Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Severity Level</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('info')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      type === 'info' 
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'bg-[#131324] border-white/5 text-muted hover:bg-white/5'
                    }`}
                  >
                    <Info size={20} className="mb-2" />
                    <span className="text-xs font-bold">Information</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('warning')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      type === 'warning' 
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                        : 'bg-[#131324] border-white/5 text-muted hover:bg-white/5'
                    }`}
                  >
                    <AlertTriangle size={20} className="mb-2" />
                    <span className="text-xs font-bold">Warning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('critical')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      type === 'critical' 
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.15)]' 
                        : 'bg-[#131324] border-white/5 text-muted hover:bg-white/5'
                    }`}
                  >
                    <AlertOctagon size={20} className="mb-2" />
                    <span className="text-xs font-bold">Critical</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Maintenance Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#131324]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-white/20 font-medium"
                />
              </div>

              {/* Message Body Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Message Body</label>
                <textarea
                  placeholder="Enter the details of the broadcast here..."
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#131324]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-white/20 resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !message.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all shadow-lg text-white ${
                    type === 'info' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' :
                    'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 animate-pulse-slow'
                  } disabled:opacity-50 disabled:pointer-events-none cursor-pointer`}
                >
                  <Send size={18} className={isSending ? 'animate-bounce' : ''} />
                  {isSending ? 'Transmitting Broadcast...' : 'Transmit Broadcast Live'}
                </button>
              </div>

            </form>
          </div>

          {/* Live Preview Panel */}
          <div className="bg-[#10101c] border border-white/5 rounded-2xl p-6 shadow-inner h-fit flex flex-col justify-center items-center relative overflow-hidden group">
            
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-sm mb-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-6 text-center">Live User View Preview</h3>
              
              {/* Mock Toast Popup */}
              <div className={`p-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
                type === 'info' ? 'bg-blue-950/40 border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.15)]' :
                type === 'warning' ? 'bg-amber-950/40 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.15)]' :
                'bg-rose-950/40 border-rose-500/30 shadow-[0_10px_30px_rgba(225,29,72,0.15)]'
              }`}>
                <div className="flex gap-3">
                  <div className={`shrink-0 mt-0.5 ${
                    type === 'info' ? 'text-blue-400' :
                    type === 'warning' ? 'text-amber-400' :
                    'text-rose-400 animate-pulse'
                  }`}>
                    {type === 'info' && <Info size={22} />}
                    {type === 'warning' && <AlertTriangle size={22} />}
                    {type === 'critical' && <AlertOctagon size={22} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">
                      {title.trim() || 'Announcement Title'}
                    </h4>
                    <p className="text-[0.8rem] text-white/70 leading-relaxed break-words">
                      {message.trim() || 'The contents of the broadcast message will appear here for all online users to read immediately.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[0.65rem] text-white/30 text-center relative z-10 max-w-xs mt-4">
              Note: This broadcast operates via WebSockets. It will be delivered instantly to all users currently connected to the platform.
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminBroadcasts;
