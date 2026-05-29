import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * UserSearchInput provides an autocomplete dropdown for searching users by username or email.
 */
const UserSearchInput = ({
  value,
  onChange,
  onSelectUser,
  placeholder,
  className,
  autoFocus = false,
  disabled = false,
  onKeyDown
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);

  const fetchUsers = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(query.trim())}`, { withCredentials: true });
      setUsers(res.data.slice(0, 5)); // show top 5 results
    } catch (error) {
      console.error('Failed to search users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    
    if (onChange) {
      onChange(e);
    }

    if (val.trim().length > 0) {
      setShowDropdown(true);
      setSelectedIndex(0);
      
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 220) // Ensure a minimum width for the dropdown
        });
      }

      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        fetchUsers(val);
      }, 300);
    } else {
      setShowDropdown(false);
      setUsers([]);
    }
  };

  const handleSelect = (user) => {
    setShowDropdown(false);
    if (onSelectUser) {
      onSelectUser(user.username); // Or user.email depending on what we want to populate
    }
  };

  const handleKeyDown = (e) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < users.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (users.length > 0) {
          e.preventDefault();
          handleSelect(users[selectedIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        disabled={disabled}
        autoComplete="off"
      />
      
      {showDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[99999] bg-[#1e1e2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {loading && users.length === 0 ? (
            <div className="p-3 text-xs text-muted text-center animate-pulse">Searching...</div>
          ) : users.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto">
              {users.map((u, i) => (
                <div
                  key={u._id}
                  onClick={() => handleSelect(u)}
                  className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
                    i === selectedIndex ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <img 
                    src={u.avatarUrl || 'https://via.placeholder.com/30'} 
                    alt={u.username}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-semibold text-main truncate">{u.username}</div>
                    <div className="text-[10px] text-muted truncate">{u.email || u.fullName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-xs text-muted text-center">No users found</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default UserSearchInput;
