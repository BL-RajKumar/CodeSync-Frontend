import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
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
    <div className="max-w-[800px] mx-auto mt-4 mb-4 px-4 sm:px-8 animate-fade-in">
      <div className="glass-panel p-6 sm:p-8">
        <h2 className="text-2xl mb-4 border-b border-white/10 pb-3 font-bold">Profile Settings</h2>
        
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt="Avatar Preview" 
                referrerpolicy="no-referrer"
                className={`w-[80px] h-[80px] rounded-full object-cover border-2 border-primary transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100 group-hover:opacity-75'}`} 
              />
            ) : (
              <div className={`w-[80px] h-[80px] rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary text-2xl font-bold text-primary transition-opacity ${uploadingImage ? 'opacity-50' : 'opacity-100 group-hover:opacity-75'}`}>
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
            <h3 className="text-xl mb-0.5 font-semibold">{user.username}</h3>
            <p className="text-muted text-sm mb-2">{user.email} &bull; {user.role}</p>
            <span className={getBadgeClass(user.provider)}>{user.provider} account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-muted text-xs font-semibold uppercase tracking-wider">Username</label>
              <Input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-muted text-xs font-semibold uppercase tracking-wider">Full Name</label>
              <Input 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 text-muted text-xs font-semibold uppercase tracking-wider">Bio</label>
              <textarea 
                name="bio"
                className="resize-none bg-input border border-white/10 rounded-xl py-2.5 px-4 text-main font-sans w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-white/20 h-[88px] text-sm"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex flex-col justify-between gap-3">
              <div>
                <label className="block mb-1 text-muted text-xs font-semibold uppercase tracking-wider">New Password (leave blank to keep current)</label>
                <Input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || uploadingImage} className="w-full md:w-auto">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
