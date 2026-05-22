import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User as UserIcon, Code, Star, GitFork } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forkingId, setForkingId] = useState(null);

  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Fetch profile
        const profileRes = await axios.get(`${apiUrl}/users/${username}`);
        setProfile(profileRes.data);

        // Fetch public projects
        const projectsRes = await axios.get(`${apiUrl}/users/${username}/projects`);
        setProjects(projectsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  const handleFork = async (projectId) => {
    if (!user) {
      toast.error('You must be logged in to fork a project.');
      navigate('/login');
      return;
    }
    setForkingId(projectId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/projects/${projectId}/fork`, {}, {
        withCredentials: true
      });

      toast.success('Project forked successfully!');
      navigate(`/p/${response.data.projectId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fork project');
    } finally {
      setForkingId(null);
    }
  };

  const handleStar = async (projectId) => {
    if (!user) {
      toast.error('You must be logged in to star a project.');
      navigate('/login');
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/projects/${projectId}/star`, {}, {
        withCredentials: true
      });
      
      // Update local projects state
      setProjects(prev => prev.map(p => {
        if ((p._id || p.projectId) === projectId) {
          return { ...p, starCount: response.data.starCount };
        }
        return p;
      }));

      // Refresh user context
      await checkAuth();

      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to star project');
    }
  };

  if (loading) return <div className="container mx-auto px-4 mt-8">Loading profile...</div>;
  if (error) return <div className="container mx-auto px-4 mt-8"><h2 className="text-2xl font-bold">Error</h2><p className="text-danger">{error}</p></div>;
  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 mt-8 mb-16 animate-fade-in">
      {/* Profile Header section */}
      <div className="glass-panel flex flex-col sm:flex-row items-start gap-8 p-8 sm:p-12 mb-12">
        <div className="shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="w-[120px] h-[120px] rounded-full object-cover border-4 border-primary shadow-[0_8px_24px_rgba(99,102,241,0.4)]" />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-input flex items-center justify-center border-4 border-primary text-muted shadow-[0_8px_24px_rgba(99,102,241,0.4)]">
              <UserIcon size={48} />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl mb-1 font-bold">{profile.fullName || profile.username}</h1>
          <p className="text-lg text-primary mb-4">@{profile.username}</p>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase bg-white/10 text-main">{profile.role}</span>
          {profile.bio && <p className="mt-4 text-base leading-relaxed max-w-[600px]">{profile.bio}</p>}
          <p className="mt-4 text-sm text-muted">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <h2 className="text-2xl mb-6 border-b border-white/10 pb-3 font-bold">Public Projects ({projects.length})</h2>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => {
              const pId = project._id || project.projectId;
              return (
              <div key={pId} className="glass-panel p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl flex items-center gap-2 font-semibold">
                    <Code size={18} className="text-muted" /> {project.name}
                  </h3>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-main">{project.language}</span>
                </div>
                <p className="text-muted text-[0.95rem] mb-6 flex-grow">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center text-sm text-muted">
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() => handleStar(pId)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        user?.starredProjects?.includes(pId) 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-muted hover:text-yellow-400'
                      }`}
                      title="Star"
                    >
                      <Star 
                        size={16} 
                        fill={user?.starredProjects?.includes(pId) ? 'currentColor' : 'none'} 
                      />
                      <span>{project.starCount}</span>
                    </button>
                    <span title="Forks" className="flex items-center gap-1"><GitFork size={16} /> {project.forkCount}</span>
                    <button 
                      onClick={() => handleFork(pId)}
                      disabled={forkingId === pId}
                      className="ml-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all duration-150 disabled:opacity-50"
                    >
                      <GitFork size={14} />
                      {forkingId === pId ? 'Forking...' : 'Fork'}
                    </button>
                  </div>
                  <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center text-muted">
            <p>@{profile.username} doesn't have any public projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
