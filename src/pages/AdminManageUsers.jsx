import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, UserCheck, UserX, Trash2, ShieldAlert, Loader2, Filter, AlertTriangle, X } from 'lucide-react';

const AdminManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status) params.status = status;

      const res = await axios.get(`${apiUrl}/admin/users`, { params, withCredentials: true });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve users directory');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when search or filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce on search input

    return () => clearTimeout(delayDebounce);
  }, [search, role, status]);

  const handleToggleSuspend = async (userId, username, currentStatus) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.put(`${apiUrl}/admin/users/${userId}/suspend`, {}, { withCredentials: true });
      
      // Update local state dynamically
      setUsers((prev) => 
        prev.map((u) => (u.userId || u._id) === userId ? { ...u, isActive: res.data.user.isActive } : u)
      );

      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/admin/users/${deleteTarget.userId}`, { withCredentials: true });
      
      toast.success(`User "${deleteTarget.username}" deleted successfully`);
      setUsers((prev) => prev.filter((u) => (u.userId || u._id) !== deleteTarget.userId));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full text-main font-sans p-6 md:p-10 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Users Directory
            </h1>
            <p className="text-muted text-sm mt-1">
              Admin Control Panel for user accounts, role authorizations, suspensions, and removals.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur-md">
            <ShieldAlert size={14} />
            Administrator Mode Active
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-lg shadow-xl">
          {/* Search bar */}
          <div className="md:col-span-2 relative flex items-center">
            <Search size={18} className="absolute left-4 text-muted" />
            <input 
              type="text"
              placeholder="Search by username, email, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#131324]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-white/20"
            />
          </div>

          {/* Role selector */}
          <div className="relative flex items-center">
            <Filter size={14} className="absolute left-4 text-muted" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#131324]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 appearance-none text-muted"
            >
              <option value="">All Roles</option>
              <option value="Developer">Developer</option>
              <option value="Guest">Guest</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Status selector */}
          <div className="relative flex items-center">
            <Filter size={14} className="absolute left-4 text-muted" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#131324]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 appearance-none text-muted"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Main Users Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 size={36} className="animate-spin text-primary" />
              <span className="text-sm font-medium">Scanning user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <p className="text-lg font-medium">No users found</p>
              <p className="text-xs text-white/20 mt-1">Try relaxing search terms or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">User Info</th>
                    <th className="px-6 py-4">Join Date</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user.userId || user._id} className="hover:bg-white/5 transition-colors duration-150 text-sm">
                      
                      {/* User Info (Avatar + Name) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#131324] border border-white/10 flex items-center justify-center text-muted font-bold text-sm">
                              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-main">{user.fullName || user.username}</span>
                            <span className="text-xs text-muted">@{user.username} &bull; {user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4 text-xs text-muted">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          user.role === 'Admin' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : user.role === 'Guest'
                            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          user.isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.1)] animate-pulse'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-4">
                        <span className="text-xs capitalize text-muted bg-[#131324] px-2 py-0.5 rounded border border-white/5">
                          {user.provider}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Suspend / Active Toggle button */}
                          <button
                            onClick={() => handleToggleSuspend(user.userId || user._id, user.username, user.isActive)}
                            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-center ${
                              user.isActive 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={user.isActive ? "Suspend user account" : "Activate user account"}
                          >
                            {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>

                          {/* Delete user button */}
                          <button
                            onClick={() => setDeleteTarget({ userId: user.userId || user._id, username: user.username })}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted hover:bg-rose-500/15 hover:border-rose-500/20 hover:text-rose-400 transition-all duration-150 cursor-pointer flex items-center justify-center"
                            title="Permanently delete user"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Center-Aligned Custom Confirmation Modal */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#131324] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle size={20} />
                <span>Delete Account?</span>
              </div>
              <button 
                onClick={() => setDeleteTarget(null)}
                className="text-muted hover:text-main cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-2">
              <p className="text-sm text-muted">
                Are you sure you want to permanently delete user <strong className="text-main">@{deleteTarget.username}</strong>?
              </p>
              <p className="text-[0.75rem] text-rose-500/80 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                Warning: This action is irreversible. All of this user's profile metadata and settings will be permanently erased.
              </p>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-main transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default AdminManageUsers;
