import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Code2, User as UserIcon, Search } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
          {user ? (
            <>
              <Link to="/dashboard" className="text-muted font-medium hover:text-main transition-colors duration-150">Dashboard</Link>
              <div className="flex items-center gap-4 pl-6 border-l border-white/10">
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
