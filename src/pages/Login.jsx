import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const [loginId, setLoginId] = useState('');
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
    const success = await login(loginId, password);
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
          <p className="text-muted text-[0.95rem]">Sign in to continue with CodeSync.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <Input
            type="text"
            placeholder="Username or Email Address"
            icon={User}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
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

          <div className="flex justify-end -mt-2 mb-6">
            <Link 
              to="/forgot-password" 
              className="text-xs text-muted hover:text-primary transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="flex items-center my-6 text-muted text-sm before:content-[''] before:flex-1 before:border-b before:border-white/10 after:content-[''] after:flex-1 after:border-b after:border-white/10">
          <span className="px-4">or continue with</span>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <Button variant="secondary" fullWidth onClick={handleGoogleLogin}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Login with Google</span>
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
