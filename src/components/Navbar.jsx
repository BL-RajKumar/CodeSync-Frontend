import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Code2, User as UserIcon, Search, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Admin Dropdown State
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/notifications`, { withCredentials: true });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // WebSocket notifications listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Append to the list
      setNotifications((prev) => [notification, ...prev]);
      
      // Trigger gorgeous live toast popup
      toast.custom((t) => (
        <div 
          onClick={() => {
            // Click to dismiss toast and navigate
            toast.dismiss(t.id);
            setDropdownOpen(true);
          }}
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1e1e2e]/95 backdrop-blur-md shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-all`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="shrink-0 pt-0.5">
                {notification.actorId?.avatarUrl ? (
                  <img className="h-10 w-10 rounded-full object-cover" src={notification.actorId.avatarUrl} alt="Actor" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {notification.actorId?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs font-bold text-main">
                  {notification.actorId?.username || 'System'}
                </p>
                <p className="text-xs font-semibold text-main mb-0.5">
                  {notification.title}
                </p>
                <p className="text-[0.7rem] text-muted line-clamp-2">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4 shrink-0 flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="rounded-full bg-transparent p-1 inline-flex text-muted hover:text-main focus:outline-none"
            >
              <Bell size={14} className="text-primary animate-pulse" />
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    };

    const handleUnreadCount = ({ unreadCount }) => {
      setUnreadCount(unreadCount);
    };

    socket.on('new-notification', handleNewNotification);
    socket.on('unread-count', handleUnreadCount);

    return () => {
      socket.off('new-notification', handleNewNotification);
      socket.off('unread-count', handleUnreadCount);
    };
  }, [socket]);

  // Click outside handler for closing the notification and admin dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };

    if (dropdownOpen || adminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, adminDropdownOpen]);

  const handleMarkRead = async (notificationId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.put(`${apiUrl}/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? res.data.notification : n))
      );
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAllRead = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiUrl}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 py-4 mb-8 glass-panel !rounded-none !border-x-0 !border-t-0">
      <div className="container mx-auto px-8 grid grid-cols-[auto_1fr_auto] items-center gap-8">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold text-main tracking-tight hover:text-primary transition-colors duration-150">
          <Code2 className="text-primary" size={28} />
          <span>CodeSync</span>
        </Link>
        
        <form onSubmit={handleSearch} className="max-w-[400px] w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search developers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-white/10 rounded-full py-2 pr-4 pl-10 text-main text-sm transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-white/30"
            />
          </div>
        </form>

        <div className="flex items-center gap-6">
          <Link to="/explore" className="text-muted font-medium hover:text-main transition-colors duration-150">Explore</Link>
          
          <button
            onClick={toggleTheme}
            className="text-muted hover:text-main p-2 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer hover:bg-white/5"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            type="button"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <Link to="/dashboard" className="text-muted font-medium hover:text-main transition-colors duration-150">Dashboard</Link>
              {user && user.role === 'Admin' && (
                <div className="relative" ref={adminDropdownRef}>
                  <button
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    className="flex items-center gap-1 text-muted font-medium hover:text-main transition-colors duration-150 cursor-pointer"
                  >
                    <span>Admin Panel</span>
                    <ChevronDown size={14} className={`transition-transform duration-150 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {adminDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f0f1c]/95 border border-white/10 rounded-xl shadow-xl backdrop-blur-md overflow-hidden animate-scale-up py-1 z-50">
                      <Link 
                        to="/admin/users" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-muted hover:text-main hover:bg-white/5 transition-colors"
                      >
                        Users Management
                      </Link>
                      <Link 
                        to="/admin/sessions" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-muted hover:text-main hover:bg-white/5 transition-colors"
                      >
                        Active Sessions
                      </Link>
                      <Link 
                        to="/admin/jobs" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-muted hover:text-main hover:bg-white/5 transition-colors"
                      >
                        Running Jobs
                      </Link>
                      <Link 
                        to="/admin/analytics" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-muted hover:text-main hover:bg-white/5 transition-colors"
                      >
                        Platform Analytics
                      </Link>
                      <Link 
                        to="/admin/languages" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-muted hover:text-main hover:bg-white/5 transition-colors"
                      >
                        Sandbox Languages
                      </Link>
                      <Link 
                        to="/admin/broadcasts" 
                        onClick={() => setAdminDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border-t border-white/5"
                      >
                        Send Broadcast
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 pl-6 border-l border-white/10 relative">
                {/* Notification Bell Icon */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`relative text-muted hover:text-main p-2 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer hover:bg-white/5 ${dropdownOpen ? 'text-main bg-white/5' : ''}`}
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {dropdownOpen && (
                    <NotificationDropdown 
                      notifications={notifications}
                      onMarkRead={handleMarkRead}
                      onMarkAllRead={handleMarkAllAllRead}
                      onClose={() => setDropdownOpen(false)}
                    />
                  )}
                </div>

                <Link to="/profile" className="flex items-center gap-2 text-main font-medium hover:text-primary transition-colors duration-150">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-input flex items-center justify-center border border-white/10 text-muted">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <span>{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="bg-transparent border-none text-muted cursor-pointer flex items-center justify-center p-2 rounded-xl transition-all duration-150 hover:bg-danger/10 hover:text-danger" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted font-medium hover:text-main transition-colors duration-150">Login</Link>
              <Link to="/register" className="bg-primary text-white hover:bg-primary-hover px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 border border-white/10 shadow-[0_4px_12px_rgba(99,102,241,0.2)]">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
