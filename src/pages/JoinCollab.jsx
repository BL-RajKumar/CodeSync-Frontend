import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const generateGuestUserId = () => {
  // Generates a valid 24-character hex string representing a MongoDB ObjectId
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = '1234567890ab'.substring(0, 6);
  const processId = '1234'.substring(0, 4);
  const increment = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + increment;
};

const JoinCollab = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
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

        // Prepopulate guest username and email if already set
        const savedGuestName = sessionStorage.getItem(`collab_guest_name_${sessionId}`);
        if (savedGuestName) {
          setGuestName(savedGuestName);
        }
        const savedGuestEmail = sessionStorage.getItem(`collab_guest_email_${sessionId}`);
        if (savedGuestEmail) {
          setGuestEmail(savedGuestEmail);
        }

        if (data.isPasswordProtected) {
          setNeedsPassword(true);
          setLoading(false);
        } else if (!user) {
          setShowGuestForm(true);
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
  }, [sessionId, navigate, user]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();

    const isGuest = !user;
    if (isGuest && !guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (needsPassword && !password.trim()) {
      toast.error('Please enter the password');
      return;
    }

    setVerifying(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      if (needsPassword) {
        const response = await axios.post(`${apiUrl}/collab/join/${sessionId}/verify`, {
          password: password.trim(),
        });

        if (!response.data.verified) {
          toast.error('Incorrect password');
          setVerifying(false);
          return;
        }

        // Store password in sessionStorage so the socket and Axios interceptor can use it
        sessionStorage.setItem(`collab_pw_${sessionId}`, password.trim());
      }

      if (isGuest) {
        // Generate a 24-character hexadecimal guest user ID if not already cached
        let guestUserId = sessionStorage.getItem(`collab_guest_uid_${sessionId}`);
        if (!guestUserId) {
          guestUserId = generateGuestUserId();
          sessionStorage.setItem(`collab_guest_uid_${sessionId}`, guestUserId);
        }
        sessionStorage.setItem(`collab_guest_name_${sessionId}`, guestName.trim());
        sessionStorage.setItem(`collab_guest_email_${sessionId}`, guestEmail.trim());
      }

      navigate(`/p/${sessionInfo.projectId}?session=${sessionInfo.sessionId}&file=${sessionInfo.fileId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
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
          Explore CodePads
        </button>
      </div>
    );
  }

  if (needsPassword || showGuestForm) {
    return (
      <div className="h-[calc(100vh-73px)] flex items-center justify-center bg-dark text-main">
        <div className="glass-panel p-8 w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {needsPassword ? <Lock size={24} className="text-primary" /> : <AlertCircle size={24} className="text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">Join Collaboration</h2>
              <p className="text-sm text-muted">
                {needsPassword ? 'Password protection is active' : 'Enter details to join the session'}
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            {!user && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Your Full Name (Guest)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name (e.g. Candidate)"
                    autoFocus={!needsPassword}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Your Email Address (Guest)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email (e.g. candidate@example.com)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </>
            )}

            {needsPassword && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Session Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter session password"
                  autoFocus={!!user}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || (!user && !guestName.trim()) || (needsPassword && !password.trim())}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
            >
              {verifying && <Loader2 size={16} className="animate-spin" />}
              Join Collaboration Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinCollab;
