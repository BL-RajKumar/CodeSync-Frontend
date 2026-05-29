import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(username, email, password, fullName);
    setLoading(false);
    
    if (success === 'requires_verification') {
      navigate('/login');
    } else if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-8">
      <div className="w-full max-w-[440px] p-10 glass-panel animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] font-bold mb-2 tracking-tight">Create Account</h2>
          <p className="text-muted text-[0.95rem]">Join CodeSync and start collaborating.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <Input 
            type="text" 
            placeholder="Username" 
            icon={UserIcon} 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input 
            type="text" 
            placeholder="Full Name" 
            icon={UserIcon} 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
