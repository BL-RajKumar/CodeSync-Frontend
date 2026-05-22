import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, GitFork, Code2, User as UserIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ExploreProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [forkingId, setForkingId] = useState(null);

  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Example languages - update if backend has a specific list
  const languages = ['JavaScript', 'Python', 'Java', 'C++', 'Ruby', 'Go', 'TypeScript', 'Rust'];

  useEffect(() => {
    fetchProjects();
  }, [searchName, searchOwner, filterLanguage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchName) queryParams.append('name', searchName);
      if (searchOwner) queryParams.append('owner', searchOwner);
      if (filterLanguage) queryParams.append('language', filterLanguage);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/projects/public?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchName(e.target.value);
  };

  const handleOwnerChange = (e) => {
    setSearchOwner(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setFilterLanguage(e.target.value);
  };

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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fork project');
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

      // Refresh user context to update starredProjects array
      await checkAuth();

      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to star project');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in mt-8 mb-16">
      <div className="mb-8 text-center">
        <h1 className="text-[2.5rem] mb-2 font-bold bg-gradient-to-br from-primary to-[#818cf8] bg-clip-text text-transparent">Explore Projects</h1>
        <p className="text-muted text-lg">Discover open source projects created by the community.</p>
      </div>

      <div className="glass-panel flex flex-col md:flex-row gap-4 p-6 mb-8 rounded-2xl items-center">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search size={20} className="text-muted mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by project name..."
            value={searchName}
            onChange={handleSearchChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none"
          />
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <UserIcon size={20} className="text-muted mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by owner..."
            value={searchOwner}
            onChange={handleOwnerChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none"
          />
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full md:w-1/3 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Filter size={20} className="text-muted mr-3 shrink-0" />
          <select 
            value={filterLanguage} 
            onChange={handleLanguageChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none cursor-pointer appearance-none"
          >
            <option value="" className="bg-dark text-main">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang} className="bg-dark text-main">{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl">
          <Loader2 className="text-primary animate-spin mb-4" size={48} />
          <p className="text-muted text-lg">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-16 text-center rounded-2xl">
          <Code2 size={48} className="text-muted mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No projects found</h2>
          <p className="text-muted">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.projectId} className="glass-panel flex flex-col p-6 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
              <div className="flex justify-between items-start mb-4">
                <Link to={`/p/${project.projectId}`} className="text-main hover:text-primary transition-colors group">
                  <h3 className="text-xl font-bold break-words m-0 group-hover:text-primary transition-colors">{project.name}</h3>
                </Link>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20 shrink-0 ml-2">{project.language}</span>
              </div>
              
              <p className="text-muted text-[0.95rem] leading-relaxed mb-6 flex-1 line-clamp-3">
                {project.description || 'No description provided.'}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex items-center">
                  <Link to={`/u/${project.ownerId?.username}`} className="flex items-center gap-2 text-sm text-main hover:text-primary transition-colors">
                    {project.ownerId?.avatarUrl ? (
                      <img src={project.ownerId.avatarUrl} alt={project.ownerId.username} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-muted">
                        <UserIcon size={14} />
                      </div>
                    )}
                    <span>{project.ownerId?.username}</span>
                  </Link>
                </div>
                
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => handleStar(project.projectId)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      user?.starredProjects?.includes(project.projectId) 
                        ? 'text-yellow-400 hover:text-yellow-500' 
                        : 'text-muted hover:text-yellow-400'
                    }`}
                  >
                    <Star 
                      size={16} 
                      fill={user?.starredProjects?.includes(project.projectId) ? 'currentColor' : 'none'} 
                    />
                    <span>{project.starCount}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-muted">
                    <GitFork size={16} />
                    <span>{project.forkCount}</span>
                  </div>
                  <button 
                    onClick={() => handleFork(project.projectId)}
                    disabled={forkingId === project.projectId}
                    className="ml-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all duration-150 disabled:opacity-50"
                  >
                    <GitFork size={14} />
                    {forkingId === project.projectId ? 'Forking...' : 'Fork'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
