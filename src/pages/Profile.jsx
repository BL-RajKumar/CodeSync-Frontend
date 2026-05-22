import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    avatarUrl: '',
    bio: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        password: '', // Keep password empty unless changing
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const updatePayload = { ...formData };
    if (!updatePayload.password) {
      delete updatePayload.password;
    }

    await updateProfile(updatePayload);
    setLoading(false);
  };

  if (!user) return null;

  const getBadgeClass = (provider) => {
    const base = "inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase";
    switch(provider) {
      case 'local': return `${base} bg-primary/20 text-[#818cf8]`;
      case 'google': return `${base} bg-danger/20 text-[#f87171]`;
      case 'github': return `${base} bg-white/10 text-[#f3f4f6]`;
      default: return `${base} bg-white/10 text-white`;
    }
  }

  return (
    <div className="max-w-[800px] mx-auto mt-8 mb-16 px-4 sm:px-8 animate-fade-in">
      <div className="glass-panel p-8 sm:p-12">
        <h2 className="text-3xl mb-8 border-b border-white/10 pb-4 font-bold">Profile Settings</h2>
        
        <div className="flex items-center gap-8 mb-10">
          <img 
            src={formData.avatarUrl || 'https://via.placeholder.com/100'} 
            alt="Avatar Preview" 
            className="w-[100px] h-[100px] rounded-full object-cover border-2 border-primary" 
          />
          <div>
            <h3 className="text-2xl mb-1 font-semibold">{user.username}</h3>
            <p className="text-muted mb-3">{user.email} &bull; {user.role}</p>
            <span className={getBadgeClass(user.provider)}>{user.provider} account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-6">
              <label className="block mb-2 text-muted text-sm font-medium">Username</label>
              <Input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-muted text-sm font-medium">Full Name</label>
              <Input 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-muted text-sm font-medium">Avatar URL</label>
            <Input 
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-muted text-sm font-medium">Bio</label>
            <textarea 
              name="bio"
              className="resize-y bg-input border border-white/10 rounded-xl py-3 px-4 text-main font-sans w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-white/20"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-muted text-sm font-medium">New Password (leave blank to keep current)</label>
            <Input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="New password..."
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
