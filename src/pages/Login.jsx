import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      toast.success('Your email has been verified! You can now log in.', { duration: 5000 });
      // Remove query param from URL without refreshing
      window.history.replaceState({}, '', '/login');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-8">
      <div className="w-full max-w-[440px] p-10 glass-panel animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] font-bold mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-muted text-[0.95rem]">Login to continue building awesome projects.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <Input 
            type="email" 
            placeholder="Email Address" 
            icon={Mail} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            type="password" 
            placeholder="Password" 
            icon={Lock} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="flex items-center my-6 text-muted text-sm before:content-[''] before:flex-1 before:border-b before:border-white/10 after:content-[''] after:flex-1 after:border-b after:border-white/10">
          <span className="px-4">or continue with</span>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <Button variant="secondary" fullWidth onClick={handleGoogleLogin}>
             Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted">
          Don't have an account? <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
