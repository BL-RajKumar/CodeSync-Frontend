import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ShieldAlert, Loader2, Play, Terminal, XOctagon, Clock, Cpu } from 'lucide-react';

const AdminActiveJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/admin/jobs`, { withCredentials: true });
      setJobs(res.data.jobs || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve active jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelJob = async (executionId) => {
    if (!window.confirm(`Are you sure you want to abort execution run "${executionId}"? This will forcibly stop the user's running code.`)) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/admin/jobs/${executionId}`, { withCredentials: true });
      toast.success('Sandbox execution aborted successfully');
      setJobs(prev => prev.filter(j => j.executionId !== executionId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel execution');
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh jobs registry every 5 seconds for fast execution tracking
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full text-main font-sans p-6 md:p-10 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              Active Sandbox Jobs
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </h1>
            <p className="text-muted text-sm mt-1">
              Live monitoring of all currently executing sandbox runs. Cancel runaway processes or infinite loops.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur-md">
            <ShieldAlert size={14} />
            Administrator Mode Active
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-lg">
          {isLoading && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
              <Loader2 size={36} className="animate-spin text-primary" />
              <span className="text-sm font-medium">Scanning sandbox runtimes...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <Terminal size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-lg font-medium text-white/60">No running sandbox jobs</p>
              <p className="text-xs text-white/20 mt-1">Sandbox requests are typically quick, so this list is usually empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Execution ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Started At</th>
                    <th className="px-6 py-4">Uptime</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.map((job) => {
                    const uptimeSec = Math.round((new Date() - new Date(job.startedAt)) / 1000);
                    return (
                      <tr key={job.executionId} className="hover:bg-white/5 transition-colors duration-150 text-sm">
                        {/* ID */}
                        <td className="px-6 py-4 font-mono text-xs text-primary font-bold">
                          {job.executionId}
                        </td>

                        {/* User */}
                        <td className="px-6 py-4 font-semibold text-main">
                          @{job.username}
                        </td>

                        {/* Language */}
                        <td className="px-6 py-4">
                          <span className="text-xs uppercase bg-[#131324] px-2.5 py-1 rounded border border-white/5 font-mono text-muted">
                            {job.language}
                          </span>
                        </td>

                        {/* Started time */}
                        <td className="px-6 py-4 text-xs text-muted">
                          {new Date(job.startedAt).toLocaleTimeString()}
                        </td>

                        {/* Uptime */}
                        <td className="px-6 py-4 text-xs text-muted flex items-center gap-1.5 mt-1 border-none">
                          <Clock size={12} className="text-rose-400" />
                          <span>{uptimeSec}s active</span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleCancelJob(job.executionId)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all duration-200 cursor-pointer text-xs font-semibold"
                            >
                              <XOctagon size={13} />
                              Abort Job
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminActiveJobs;
