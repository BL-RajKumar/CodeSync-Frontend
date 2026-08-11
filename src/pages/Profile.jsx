import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataToUpload = new FormData();
    formDataToUpload.append('image', file);

    setUploadingImage(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${apiUrl}/upload/avatar`, formDataToUpload, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData({ ...formData, avatarUrl: res.data.url });
      toast.success('Image uploaded! Click Save Changes to update your profile.');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
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
    <div className="max-w-[700px] mx-auto mt-4 mb-4 px-4 sm:px-8 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-main m-0">Profile Settings</h2>
            <p className="text-[10px] text-muted mt-0.5">Manage your personal identification, bio, and account credentials.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            {formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt="Avatar Preview" 
                referrerPolicy="no-referrer"
                className={`w-[80px] h-[80px] rounded-full object-cover border-2 border-primary/30 transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100 group-hover:opacity-75'}`} 
              />
            ) : (
              <div className={`w-[80px] h-[80px] rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-2xl font-bold text-primary transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100 group-hover:opacity-75'}`}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40">
              <Camera className="w-5 h-5 text-white" />
            </div>
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div>
            <h3 className="text-base font-bold text-main mb-0.5">{user.username}</h3>
            <p className="text-muted text-xs mb-2">{user.email} &bull; {user.role}</p>
            <span className={getBadgeClass(user.provider)}>{user.provider} account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Username</label>
              <input 
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-[#091E42]/5 dark:bg-white/[0.04] border border-[#091E42]/10 dark:border-white/10 rounded-md px-3 py-2 text-sm text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder-zinc-600 shadow-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Full Name</label>
              <input 
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-[#091E42]/5 dark:bg-white/[0.04] border border-[#091E42]/10 dark:border-white/10 rounded-md px-3 py-2 text-sm text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder-zinc-600 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Bio</label>
              <textarea 
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className="w-full bg-[#091E42]/5 dark:bg-white/[0.04] border border-[#091E42]/10 dark:border-white/10 rounded-md px-3 py-2 text-sm text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder-zinc-600 resize-none shadow-sm transition-all h-[92px]"
              />
            </div>
            <div className="flex flex-col justify-between gap-3">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">New Password (leave blank to keep current)</label>
                <input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password..."
                  className="w-full bg-[#091E42]/5 dark:bg-white/[0.04] border border-[#091E42]/10 dark:border-white/10 rounded-md px-3 py-2 text-sm text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder-zinc-600 shadow-sm transition-all"
                />
              </div>
              <div className="flex justify-end mt-auto pt-2">
                <button 
                  type="submit" 
                  disabled={loading || uploadingImage} 
                  className="px-4 py-2 rounded-lg font-semibold text-xs bg-primary border border-primary/20 text-white hover:bg-primary-hover transition-colors shadow-sm cursor-pointer disabled:opacity-50 w-full md:w-auto"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
