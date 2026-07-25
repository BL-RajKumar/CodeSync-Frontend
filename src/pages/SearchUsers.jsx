import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, User as UserIcon } from 'lucide-react';

const SearchUsers = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/users/search?q=${encodeURIComponent(query)}`, { withCredentials: true });
        setUsers(res.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [query]);

  return (
    <div className="container mx-auto px-4 mt-8 mb-16 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 font-bold">Search Results</h1>
        <p className="text-muted">Showing results for: <strong>"{query}"</strong></p>
      </div>

      {loading ? (
        <div className="text-center p-12 text-muted text-lg">Searching...</div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map(user => (
            <Link to={`/u/${user.username}`} key={user._id} className="flex flex-col p-6 glass-panel transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.4)] hover:border-primary">
              <div className="flex items-center gap-4 mb-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} referrerpolicy="no-referrer" className="w-12 h-12 rounded-full object-cover border-2 border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-input flex items-center justify-center border-2 border-white/10 text-muted">
                    <UserIcon size={24} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg text-main font-semibold leading-tight">{user.username}</h3>
                  <p className="text-sm text-muted">{user.fullName}</p>
                </div>
              </div>
              {user.bio && <p className="text-sm text-muted mb-4 flex-grow line-clamp-2">{user.bio}</p>}
              <div className="mt-auto">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase bg-white/10 text-main">{user.role}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-panel text-center py-16 px-8">
          <Search size={48} className="text-muted mb-4 opacity-50 mx-auto" />
          <h2 className="text-2xl mb-2 font-bold">No developers found</h2>
          <p className="text-muted">We couldn't find anyone matching "{query}".</p>
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
