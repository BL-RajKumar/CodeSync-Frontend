import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * MentionInput is a drop-in replacement for <textarea> or <input type="text">
 * that automatically handles `@username` autocompletion.
 */
const MentionInput = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  multiline = false,
  rows = 1,
  autoFocus = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Track cursor position to know where to parse mentions
  const [cursorPos, setCursorPos] = useState(0);

  // Debounce search function
  const searchTimeout = useRef(null);

  const fetchUsers = useCallback(async (query) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}`, { withCredentials: true });
      setUsers(res.data.slice(0, 5)); // show top 5 results
    } catch (error) {
      console.error('Failed to search users for mentions:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    const curPos = e.target.selectionStart;
    setCursorPos(curPos);
    
    if (onChange) {
      onChange(e);
    }

    // Check for @mention before cursor
    const textBeforeCursor = val.slice(0, curPos);
    const match = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setShowDropdown(true);
      setSelectedIndex(0);
      
      // Calculate position relative to viewport using getBoundingClientRect
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        // Position below the input. If it's too close to the bottom of the screen, we could position above, 
        // but for simplicity we position just below it.
        setDropdownPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width // match input width roughly, or set a min-width
        });
      }

      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        fetchUsers(query);
      }, 300);
    } else {
      setShowDropdown(false);
    }
  };

  const insertMention = (username) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    
    // Replace the `@query` with `@username `
    const newTextBeforeCursor = textBeforeCursor.replace(/(?:^|\s)@(\w*)$/, (match) => {
      // Preserve the leading space if it exists
      if (match.startsWith(' ')) return ` @${username} `;
      return `@${username} `;
    });

    const newValue = newTextBeforeCursor + textAfterCursor;
    
    // Create a synthetic event to trigger onChange
    if (onChange) {
      onChange({ target: { value: newValue, name: inputRef.current?.name } });
    }
    
    setShowDropdown(false);
    
    // Refocus and set cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = newTextBeforeCursor.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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
          insertMention(users[selectedIndex].username);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const InputElement = multiline ? 'textarea' : 'input';

  return (
    <div className="relative flex-1 w-full">
      <InputElement
        ref={inputRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={multiline ? rows : undefined}
        autoFocus={autoFocus}
      />
      
      {showDropdown && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[99999] bg-[#1e1e2e] border border-white/20 rounded-lg shadow-2xl overflow-hidden min-w-[200px]"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {loading && users.length === 0 ? (
            <div className="p-3 text-xs text-muted text-center animate-pulse">Searching...</div>
          ) : users.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto">
              {users.map((u, i) => (
                <div
                  key={u._id}
                  onClick={() => insertMention(u.username)}
                  className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
                    i === selectedIndex ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <img 
                    src={u.avatarUrl || 'https://via.placeholder.com/30'} 
                    alt={u.username}
                    referrerpolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-semibold text-main">{u.username}</div>
                    <div className="text-[10px] text-muted">{u.fullName || u.email}</div>
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
    </div>
  );
};

export default MentionInput;
