import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const JoinCollab = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const resolveSession = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/collab/join/${sessionId}`, {
          withCredentials: true,
        });

        const data = response.data;
        setSessionInfo(data);

        if (data.isPasswordProtected) {
          setNeedsPassword(true);
          setLoading(false);
        } else {
          // Redirect directly to the project editor with session params
          navigate(`/p/${data.projectId}?session=${data.sessionId}&file=${data.fileId}`, { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join session');
        setLoading(false);
      }
    };

    resolveSession();
  }, [sessionId, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/collab/join/${sessionId}/verify`, {
        password: password.trim(),
      });

      if (response.data.verified) {
        // Store password in sessionStorage so the socket can use it
        sessionStorage.setItem(`collab_pw_${sessionId}`, password.trim());
        navigate(`/p/${sessionInfo.projectId}?session=${sessionInfo.sessionId}&file=${sessionInfo.fileId}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center bg-dark text-main">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-muted text-lg">Joining collaboration session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-73px)] flex flex-col items-center justify-center bg-dark text-main">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Unable to Join</h2>
        <p className="text-muted mb-6">{error}</p>
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          Explore Projects
        </button>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="h-[calc(100vh-73px)] flex items-center justify-center bg-dark text-main">
        <div className="glass-panel p-8 w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Lock size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Password Required</h2>
              <p className="text-sm text-muted">This session is password protected</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter session password"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-main mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <button
              type="submit"
              disabled={verifying || !password.trim()}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying && <Loader2 size={16} className="animate-spin" />}
              Join Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinCollab;
