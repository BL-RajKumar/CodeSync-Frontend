import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, FileText, Send, Loader2, Lock } from 'lucide-react';

const ChatPanel = ({
  collabSession,
  messages = [],
  privateNotes = '',
  currentUserId,
  currentUsername,
  onSendChatMessage,
  onUpdatePrivateNotes
}) => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'notes'
  const [inputText, setInputText] = useState('');
  const [localNotes, setLocalNotes] = useState(privateNotes);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const messagesEndRef = useRef(null);

  const isHost = collabSession && currentUserId && collabSession.ownerId === currentUserId;

  // Synchronize localNotes when privateNotes changes from parent (e.g., initial load)
  useEffect(() => {
    setLocalNotes(privateNotes);
  }, [privateNotes]);

  // Scroll to bottom of messages whenever activeTab changes to chat or a new message arrives
  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Debounced auto-save effect for private notes
  useEffect(() => {
    if (activeTab !== 'notes' || !isHost || localNotes === privateNotes) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onUpdatePrivateNotes(localNotes);
      setSaveStatus('saved');
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [localNotes, onUpdatePrivateNotes, activeTab, isHost, privateNotes]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendChatMessage(inputText.trim());
    setInputText('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Render when no collaboration session is active
  if (!collabSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted select-none bg-[#1e1e2e]">
        <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4 text-primary">
          <MessageSquare size={32} />
        </div>
        <h3 className="font-bold text-main mb-2">Collaboration Chat</h3>
        <p className="text-xs leading-relaxed max-w-[240px]">
          Chat and notes are only available during active collaborative sessions. Start or join a session to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] overflow-hidden">
      {/* Header and Tab Switcher */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary" size={18} />
            <h3 className="font-semibold text-main">Chat & Notes</h3>
          </div>
          {activeTab === 'notes' && isHost && (
            <span className="text-[10px] font-medium transition-all duration-200">
              {saveStatus === 'saving' ? (
                <span className="text-primary flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</span>
              ) : (
                <span className="text-emerald-400">● Saved</span>
              )}
            </span>
          )}
        </div>

        {/* Tab Buttons (only shown to host; candidates only see public chat) */}
        {isHost ? (
          <div className="flex bg-[#181825] rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                activeTab === 'chat' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-main'
              }`}
            >
              <MessageSquare size={13} />
              Public Chat
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                activeTab === 'notes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-main'
              }`}
            >
              <FileText size={13} />
              Private Notes
            </button>
          </div>
        ) : (
          <div className="text-xs font-semibold text-muted tracking-wider uppercase bg-[#181825] py-2 px-3 rounded-lg flex items-center gap-1.5 border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Public Discussion
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative">
        {activeTab === 'chat' && (
          <>
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted/60 py-8 select-none">
                  <MessageSquare size={24} className="mb-2 opacity-30" />
                  <p className="text-xs">No messages yet. Send a message to start chatting!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  const isMsgHost = msg.senderId === collabSession.ownerId;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[85%] ${
                        isMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      {/* Sender Info (only show if not self) */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-main/80">{msg.senderName}</span>
                          {isMsgHost && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-mono">
                              Host
                            </span>
                          )}
                        </div>
                      )}
                      {/* Bubble */}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isMe
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-main rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {/* Time */}
                      <span className="text-[8px] text-muted mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            {collabSession?.status === 'Ended' ? (
              <div className="p-4 border-t border-white/5 bg-[#181825]/50 text-center text-xs text-muted font-semibold italic shrink-0">
                Collaboration session has ended. Chat is read-only.
              </div>
            ) : (
              <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2 shrink-0 bg-[#1e1e2e]">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-main font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 placeholder-white/20"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shadow-lg shadow-primary/10"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
          </>
        )}

        {activeTab === 'notes' && isHost && (
          <div className="flex-1 flex flex-col p-4 min-h-0 bg-[#1e1e2e]">
            <div className="flex items-center gap-1.5 mb-2 px-1 text-[10px] text-muted font-semibold uppercase tracking-wider">
              <Lock size={10} className="text-amber-500/80" />
              Strictly Confidential Note Space (Only visible to you)
            </div>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Take interview notes here... e.g.
- Coding structure & algorithmic efficiency
- Problem-solving approach
- Questions to ask: ..."
              className="w-full flex-grow bg-white/5 border border-white/10 rounded-xl p-4 text-main font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 placeholder-white/20 resize-none custom-scrollbar"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
