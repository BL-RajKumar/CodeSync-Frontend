import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${resetToken}`, { password });
      toast.success(res.data.message || 'Password reset successfully!');
      setResetCompleted(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-8">
      <div className="w-full max-w-[440px] p-10 glass-panel animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] font-bold mb-2 tracking-tight">Set New Password</h2>
          <p className="text-muted text-[0.95rem]">
            {resetCompleted 
              ? "Your password has been updated successfully!" 
              : "Please enter your new password below."}
          </p>
        </div>

        {resetCompleted ? (
          <div className="text-center py-4 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
              <CheckCircle2 size={36} />
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
              You will be redirected to the login page shortly...
            </div>
            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
              Go to Login Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Confirm New Password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
