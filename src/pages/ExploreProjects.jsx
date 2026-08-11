import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, GitFork, Code2, User as UserIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LanguageIcon, getLanguageLabel } from '../components/LanguageIcon';


const ExploreProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [forkingId, setForkingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Exact language values as stored in the DB, synced with CreateProjectModal
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'react', label: 'React' },
    { value: 'node-web', label: 'Node.js' },
    { value: 'vanilla-web', label: 'Vanilla HTML/CSS/JS' },
  ];

  useEffect(() => {
    fetchProjects();
  }, [searchName, searchOwner, filterLanguage, currentPage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchName) queryParams.append('name', searchName);
      if (searchOwner) queryParams.append('owner', searchOwner);
      if (filterLanguage) queryParams.append('language', filterLanguage);

      queryParams.append('page', currentPage);
      queryParams.append('limit', 9);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/projects/public?${queryParams.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.totalPages);
      setTotalProjects(data.totalProjects);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchName(e.target.value);
    setCurrentPage(1);
  };

  const handleOwnerChange = (e) => {
    setSearchOwner(e.target.value);
    setCurrentPage(1);
  };

  const handleLanguageChange = (e) => {
    setFilterLanguage(e.target.value);
    setCurrentPage(1);
  };

  const handleFork = async (projectId) => {
    if (!user) {
      toast.error('You must be logged in to fork a codepad.');
      navigate('/login');
      return;
    }
    setForkingId(projectId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/projects/${projectId}/fork`, {}, {
        withCredentials: true
      });

      toast.success('Code pad forked successfully!');
      navigate(`/p/${response.data.projectId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fork codepad');
    } finally {
      setForkingId(null);
    }
  };

  const handleStar = async (projectId) => {
    if (!user) {
      toast.error('You must be logged in to star a codepad.');
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
      toast.error(error.response?.data?.message || 'Failed to star codepad');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in mt-8 mb-16">
      <div className="mb-8 text-center">
        <h1 className="text-[2.5rem] mb-2 font-bold text-main">Explore CodePads</h1>
        <p className="text-muted text-lg">discover open source codepads created by the community.</p>
      </div>

      <div className="glass-panel flex flex-col md:flex-row gap-4 p-6 mb-8 rounded-2xl items-center">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search size={20} className="text-muted mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by codepad name..."
            value={searchName}
            onChange={handleSearchChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none placeholder-muted"
          />
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <UserIcon size={20} className="text-muted mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by owner..."
            value={searchOwner}
            onChange={handleOwnerChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none placeholder-muted"
          />
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg py-3 px-4 w-full md:w-1/3 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Filter size={20} className="text-muted mr-3 shrink-0" />
          <select 
            value={filterLanguage} 
            onChange={handleLanguageChange}
            className="bg-transparent border-none text-main text-base w-full focus:outline-none cursor-pointer appearance-none"
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl">
          <Loader2 className="text-primary animate-spin mb-4" size={48} />
          <p className="text-muted text-lg">Loading codepads...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-16 text-center rounded-2xl">
          <Code2 size={48} className="text-muted mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2 text-main">No codepads found</h2>
          <p className="text-muted">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.projectId} className="glass-panel project-card flex flex-col p-6 hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <Link to={`/p/${project.projectId}`} className="text-main hover:text-primary transition-colors group">
                  <h3 className="text-xl font-bold break-words m-0 group-hover:text-primary transition-colors">{project.name}</h3>
                </Link>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20 shrink-0 ml-2 inline-flex items-center gap-1.5">
                  <LanguageIcon language={project.language} className="w-3.5 h-3.5" />
                  <span>{getLanguageLabel(project.language)}</span>
                </span>
              </div>
              
              <p className="text-muted text-[0.95rem] leading-relaxed mb-6 flex-1 line-clamp-3">
                {project.description || 'No description provided.'}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex items-center">
                  <Link to={`/u/${project.ownerId?.username}`} className="flex items-center gap-2 text-sm text-main hover:text-primary transition-colors">
                    {project.ownerId?.avatarUrl ? (
                      <img src={project.ownerId.avatarUrl} alt={project.ownerId.username} referrerpolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {project.ownerId?.username?.charAt(0).toUpperCase()}
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
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-muted hover:text-yellow-500'
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
                    className="ml-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-main hover:bg-white/10 hover:text-primary transition-all duration-150 disabled:opacity-50"
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

      {!loading && projects.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-main hover:bg-white/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          
          <div className="text-muted text-sm font-medium">
            Page <span className="text-main">{currentPage}</span> of <span className="text-main">{totalPages}</span>
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-main hover:bg-white/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
