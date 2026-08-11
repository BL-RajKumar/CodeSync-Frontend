import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Input from '../components/Input';
import Button from '../components/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Password reset link sent to your email.');
      setEmailSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-8">
      <div className="w-full max-w-[440px] p-10 glass-panel animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] font-bold mb-2 tracking-tight">Forgot Password</h2>
          <p className="text-muted text-[0.95rem]">
            {emailSent 
              ? "We've sent a recovery link to your inbox." 
              : "Enter your registered email address and we'll send you a password reset link."}
          </p>
        </div>

        {emailSent ? (
          <div className="text-center py-4 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
              <CheckCircle2 size={36} />
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted">
              Check your email <span className="font-semibold text-main">{email}</span> for instructions to reset your password.
            </div>
            <Button variant="secondary" fullWidth onClick={() => setEmailSent(false)}>
              Send Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <Input
              type="email"
              placeholder="Email Address"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
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

export default ForgotPassword;
