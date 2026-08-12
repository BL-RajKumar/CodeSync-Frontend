import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, UserCheck, UserX, Trash2, ShieldAlert, Loader2, Filter, AlertTriangle, X, Users, UserCheck as GuestIcon, ExternalLink, Calendar, Mail, User } from 'lucide-react';

const AdminManageUsers = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'guest_logs'

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(10);

  // Guest Logs state
  const [guestLogs, setGuestLogs] = useState([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [deleteGuestTarget, setDeleteGuestTarget] = useState(null);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);

  // Search & Filter state for Registered Users
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
      const params = {
        page: currentPage,
        limit
      };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status) params.status = status;

      const res = await axios.get(`${apiUrl}/admin/users`, { params, withCredentials: true });
      setUsers(res.data.users || []);
      if (res.data.pagination) {
        setTotalUsers(res.data.pagination.total || 0);
        setTotalPages(res.data.pagination.pages || 1);
      } else {
        setTotalUsers(res.data.users?.length || 0);
        setTotalPages(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve users directory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuestLogs = async () => {
    setLoadingGuests(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/admin/guest-logs`, { withCredentials: true });
      setGuestLogs(res.data.logs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve guest activity logs');
    } finally {
      setLoadingGuests(false);
    }
  };

  // Fetch guest logs count on component mount
  useEffect(() => {
    fetchGuestLogs();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, role, status]);

  // Fetch users when search, filters, or pagination changes
  useEffect(() => {
    if (activeTab === 'users') {
      const delayDebounce = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else if (activeTab === 'guest_logs') {
      fetchGuestLogs();
    }
  }, [search, role, status, activeTab, currentPage, limit]);

  const handleToggleSuspend = async (userId, username, currentStatus) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.put(`${apiUrl}/admin/users/${userId}/suspend`, {}, { withCredentials: true });
      
      // Update local state dynamically
      setUsers((prev) => 
        prev.map((u) => (u.userId || u._id) === userId ? { ...u, isActive: res.data.user.isActive } : u)
      );

      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.put(`${apiUrl}/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      
      // Update local state dynamically
      setUsers((prev) => 
        prev.map((u) => (u.userId || u._id) === userId ? { ...u, role: res.data.user.role } : u)
      );

      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
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
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGuestLog = async () => {
    if (!deleteGuestTarget) return;

    setIsDeletingGuest(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const { sessionId, userId } = deleteGuestTarget;
      await axios.delete(`${apiUrl}/admin/guest-logs/${sessionId}/${userId}`, { withCredentials: true });
      
      toast.success(`Guest activity log for "${deleteGuestTarget.guestName}" deleted successfully`);
      setGuestLogs((prev) => prev.filter((log) => !(log.sessionId === sessionId && log.userId === userId)));
      setDeleteGuestTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete guest activity log');
    } finally {
      setIsDeletingGuest(false);
    }
  };

  return (
    <div className="w-full text-main font-sans p-6 md:p-8 h-full overflow-y-auto">
      <div className="w-full space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-main">
              Users Directory
            </h1>
            <p className="text-muted text-sm mt-1">
              Admin Control Panel for user accounts, role authorizations, suspensions, and removals.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
            <ShieldAlert size={14} />
            Administrator Mode Active
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-main'
            }`}
          >
            <Users size={16} />
            <span>Registered Accounts ({totalUsers})</span>
          </button>
          <button
            onClick={() => setActiveTab('guest_logs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'guest_logs'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-main'
            }`}
          >
            <GuestIcon size={16} />
            <span>Guest Activity Audit Log ({guestLogs.length})</span>
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
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
                  <option value="Candidate">Candidate</option>
                  <option value="Interviewer">Interviewer</option>
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
                <>
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
                                  <img src={user.avatarUrl} alt="Avatar" referrerpolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-white/10" />
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

                            {/* Role Selector */}
                             <td className="px-6 py-4">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.userId || user._id, e.target.value)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border bg-input text-main transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                                  user.role === 'Admin'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : user.role === 'Employee' || user.role === 'Interviewer'
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : user.role === 'Candidate'
                                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                    : 'bg-white/5 border-border text-muted'
                                }`}
                              >
                                <option value="Candidate" className="bg-card text-teal-400">Candidate</option>
                                <option value="Interviewer" className="bg-card text-primary">Interviewer</option>
                                <option value="Admin" className="bg-card text-rose-400">Admin</option>
                                {user.role === 'Guest' && (
                                  <option value="Guest" className="bg-card text-muted">Guest</option>
                                )}
                              </select>
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

                  {/* Pagination Panel */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6 border-t border-white/10 bg-white/5 text-sm">
                    {/* Left Side: Page Size Selector & Indicators */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-xs font-medium">Show</span>
                        <select
                          value={limit}
                          onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-[#131324]/50 border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-primary transition-all duration-200 text-main cursor-pointer"
                        >
                          <option value={5} className="bg-[#131324]">5</option>
                          <option value={10} className="bg-[#131324]">10</option>
                          <option value={20} className="bg-[#131324]">20</option>
                          <option value={50} className="bg-[#131324]">50</option>
                        </select>
                        <span className="text-muted text-xs font-medium">per page</span>
                      </div>
                      <div className="h-4 w-px bg-white/10 hidden sm:block" />
                      <span className="text-muted text-xs font-medium">
                        showing {totalUsers === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
                      </span>
                    </div>

                    {/* Right Side: Navigation buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer text-main text-xs font-semibold"
                        title="Previous Page"
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                          return (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                currentPage === p
                                  ? 'bg-primary border-primary text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]'
                                  : 'border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-main'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        }
                        if (p === 2 || p === totalPages - 1) {
                          return (
                            <span key={p} className="px-1.5 text-muted text-xs">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer text-main text-xs font-semibold"
                        title="Next Page"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* Guest Activity Log Tab Content */
          <div className="space-y-6">
            {/* Search Bar for Guest Activity */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-lg shadow-xl relative flex items-center">
              <Search size={18} className="absolute left-6 text-muted" />
              <input 
                type="text"
                placeholder="Search by guest name, guest email, codepad name, or host..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="w-full bg-[#131324]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-white/20"
              />
            </div>

            {/* Guest Logs Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-lg">
              {loadingGuests ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <span className="text-sm font-medium">Loading guest audit records...</span>
                </div>
              ) : guestLogs.filter(log => {
                if (!guestSearch.trim()) return true;
                const q = guestSearch.toLowerCase();
                return (
                  log.guestName.toLowerCase().includes(q) ||
                  log.guestEmail.toLowerCase().includes(q) ||
                  log.projectName.toLowerCase().includes(q) ||
                  log.invitedByUsername.toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="text-center py-20 text-muted">
                  <GuestIcon size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No guest activity logs found</p>
                  <p className="text-xs text-white/30 mt-1">When guest candidates join collaboration sessions, their history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Guest Candidate</th>
                        <th className="px-6 py-4">Guest Email</th>
                        <th className="px-6 py-4">CodePad Worked On</th>
                        <th className="px-6 py-4">Invited By (Host)</th>
                        <th className="px-6 py-4">Session Status</th>
                        <th className="px-6 py-4">Joined At</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {guestLogs.filter(log => {
                        if (!guestSearch.trim()) return true;
                        const q = guestSearch.toLowerCase();
                        return (
                          log.guestName.toLowerCase().includes(q) ||
                          log.guestEmail.toLowerCase().includes(q) ||
                          log.projectName.toLowerCase().includes(q) ||
                          log.invitedByUsername.toLowerCase().includes(q)
                        );
                      }).map((log, index) => (
                        <tr key={`${log.sessionId}-${log.userId}-${index}`} className="hover:bg-white/5 transition-colors duration-150 text-sm">
                          {/* Guest Candidate */}
                          <td className="px-6 py-4 font-semibold text-main">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                                <User size={14} />
                              </div>
                              <span>{log.guestName}</span>
                            </div>
                          </td>

                          {/* Guest Email */}
                          <td className="px-6 py-4 text-xs text-muted">
                            <div className="flex items-center gap-1.5">
                              <Mail size={13} className="text-muted shrink-0" />
                              <span className={log.guestEmail && log.guestEmail !== 'Not provided' ? 'text-main font-medium' : 'text-white/30 italic'}>
                                {log.guestEmail}
                              </span>
                            </div>
                          </td>

                          {/* CodePad Worked On */}
                          <td className="px-6 py-4">
                            {log.projectId ? (
                              <Link 
                                to={`/p/${log.projectId}`}
                                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-xs"
                              >
                                <span>{log.projectName}</span>
                                <ExternalLink size={12} />
                              </Link>
                            ) : (
                              <span className="text-xs text-muted">{log.projectName}</span>
                            )}
                          </td>

                          {/* Invited By */}
                          <td className="px-6 py-4 text-xs">
                            <div className="flex flex-col">
                              <span className="font-medium text-main">@{log.invitedByUsername}</span>
                              {log.invitedByEmail && <span className="text-muted text-[11px]">{log.invitedByEmail}</span>}
                            </div>
                          </td>

                          {/* Session Status */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                              log.sessionStatus === 'Active'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-muted'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${log.sessionStatus === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-muted'}`} />
                              {log.sessionStatus}
                            </span>
                          </td>

                          {/* Joined At */}
                          <td className="px-6 py-4 text-xs text-muted">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="opacity-70" />
                              <span>{new Date(log.joinedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setDeleteGuestTarget({
                                  sessionId: log.sessionId,
                                  userId: log.userId,
                                  guestName: log.guestName,
                                  projectName: log.projectName
                                })}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted hover:bg-rose-500/15 hover:border-rose-500/20 hover:text-rose-400 transition-all duration-150 cursor-pointer flex items-center justify-center"
                                title="Delete guest activity log"
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
        )}

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
      {/* Center-Aligned Guest Log Delete Confirmation Modal */}
      {deleteGuestTarget && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#131324] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle size={20} />
                <span>Delete Guest Log?</span>
              </div>
              <button 
                onClick={() => setDeleteGuestTarget(null)}
                className="text-muted hover:text-main cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-2">
              <p className="text-sm text-muted">
                Are you sure you want to delete the activity log for guest <strong className="text-main">{deleteGuestTarget.guestName}</strong> from session <strong className="text-main">{deleteGuestTarget.projectName}</strong>?
              </p>
              <p className="text-[0.75rem] text-rose-500/80 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                Warning: This action will permanently remove this guest candidate's audit trail entry for this session.
              </p>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteGuestTarget(null)}
                disabled={isDeletingGuest}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-main transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGuestLog}
                disabled={isDeletingGuest}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingGuest ? (
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
