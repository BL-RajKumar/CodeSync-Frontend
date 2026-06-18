import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Code, Star, GitFork, Trash2 } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import { LanguageIcon, getLanguageLabel } from '../components/LanguageIcon';


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [activeTab, setActiveTab] = useState('my_projects');
  
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  const [starredProjects, setStarredProjects] = useState([]);
  const [loadingStarred, setLoadingStarred] = useState(false);

  const fetchProjects = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/projects`, { withCredentials: true });
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load your projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchStarredProjects = async () => {
    setLoadingStarred(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/projects/starred`, { withCredentials: true });
      setStarredProjects(res.data);
    } catch (error) {
      toast.error('Failed to load starred projects');
    } finally {
      setLoadingStarred(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'starred' && starredProjects.length === 0) {
      fetchStarredProjects();
    }
  }, [activeTab]);

  const handleCreateProject = async (projectData) => {
    setCreating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${apiUrl}/projects`, projectData, {
        withCredentials: true
      });
      toast.success('Project created successfully!');
      setIsModalOpen(false);
      // Instead of navigating, just refresh the list and stay on dashboard
      fetchProjects();
      setActiveTab('my_projects');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleUnstar = async (projectId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/projects/${projectId}/star`, {}, {
        withCredentials: true
      });
      // Remove from local list
      setStarredProjects(prev => prev.filter(p => (p._id || p.projectId) !== projectId));
      toast.success('Project removed from bookmarks');
    } catch (error) {
      toast.error('Failed to unstar project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated files.')) {
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/projects/${projectId}`, {
        withCredentials: true
      });
      setProjects(prev => prev.filter(p => p.projectId !== projectId && p._id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 mt-8 animate-fade-in mb-16">
        <div className="glass-panel bg-gradient-to-r from-[rgba(0,196,204,0.06)] via-[rgba(125,42,232,0.06)] to-[rgba(226,51,109,0.06)] p-12 mb-12 border-primary/10">
          <h1 className="text-[2.5rem] mb-4 font-bold text-main">
            Welcome back, <span className="text-primary">{user?.username}</span>!
          </h1>
          <p className="text-muted text-lg mb-8">
            This is your dashboard. From here you can manage your projects, start collaborations, or update your profile.
          </p>
          
          <div className="flex gap-4">
            <Link to="/profile" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-150 bg-white/5 text-main border border-white/10 hover:bg-white/10">
              Edit Profile
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-150 bg-primary text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]" onClick={() => setIsModalOpen(true)}>
              New Project
            </button>
          </div>
        </div>

        <div>
          <div className="flex gap-6 mb-8 border-b border-white/10">
            <button 
              className={`pb-3 text-lg font-semibold transition-colors relative ${activeTab === 'my_projects' ? 'text-primary' : 'text-muted hover:text-main'}`}
              onClick={() => setActiveTab('my_projects')}
            >
              My Projects
              {activeTab === 'my_projects' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-md"></span>
              )}
            </button>
            <button 
              className={`pb-3 text-lg font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'starred' ? 'text-primary' : 'text-muted hover:text-main'}`}
              onClick={() => setActiveTab('starred')}
            >
              <Star size={18} fill={activeTab === 'starred' ? 'currentColor' : 'none'} />
              Starred Projects
              {activeTab === 'starred' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary rounded-t-md"></span>
              )}
            </button>
          </div>
          
          {activeTab === 'my_projects' && (
            <div>
              {loadingProjects ? (
                <div className="text-center p-8 text-muted">Loading projects...</div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <div key={project.projectId} className="glass-panel project-card p-6 flex flex-col hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="flex items-center gap-2 text-xl font-semibold text-main">
                          <Code size={18} className="text-muted" /> 
                          {project.name}
                        </h3>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20 shrink-0 ml-2 inline-flex items-center gap-1.5">
                          <LanguageIcon language={project.language} className="w-3.5 h-3.5" />
                          <span>{getLanguageLabel(project.language)}</span>
                        </span>
                      </div>
                      <p className="text-muted text-[0.9rem] mb-6 flex-grow line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex gap-2 items-center">
                          <span className={`visibility-chip ${
                            project.visibility === 'Public' ? 'visibility-chip-public' : 'visibility-chip-private'
                          }`}>
                            {project.visibility}
                          </span>
                          <button 
                            onClick={() => handleDeleteProject(project.projectId || project._id)}
                            className="text-muted hover:text-red-400 p-1 rounded-md transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <Link to={`/p/${project.projectId || project._id}`} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 bg-white/5 text-main border border-white/10 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
                          Open Editor
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center text-muted rounded-2xl border border-dashed border-white/20">
                  <p className="mb-4 text-lg">You haven't created any projects yet.</p>
                  <button className="text-primary hover:underline font-semibold" onClick={() => setIsModalOpen(true)}>
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'starred' && (
            <div>
              {loadingStarred ? (
                <div className="text-center p-8 text-muted">Loading bookmarks...</div>
              ) : starredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {starredProjects.map(project => {
                    const pId = project._id || project.projectId;
                    return (
                    <div key={pId} className="glass-panel project-card p-6 flex flex-col hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <Link to={`/p/${pId}`} className="text-main hover:text-primary transition-colors group flex items-center gap-2">
                          <Code size={18} className="text-muted" /> 
                          <h3 className="text-xl font-semibold m-0 group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                        </Link>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20 shrink-0 ml-2 inline-flex items-center gap-1.5">
                          <LanguageIcon language={project.language} className="w-3.5 h-3.5" />
                          <span>{getLanguageLabel(project.language)}</span>
                        </span>
                      </div>
                      <p className="text-muted text-[0.9rem] mb-6 flex-grow line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/10">
                        <div className="flex gap-4 items-center">
                          <button
                            onClick={() => handleUnstar(pId)}
                            className="flex items-center gap-1.5 text-yellow-500 hover:text-yellow-600 text-sm transition-colors"
                            title="Unstar"
                          >
                            <Star size={16} fill="currentColor" />
                            <span>{project.starCount}</span>
                          </button>
                          <span className="flex items-center gap-1.5 text-sm text-muted">
                            <GitFork size={16} />
                            {project.forkCount}
                          </span>
                        </div>
                        <Link to={`/u/${project.ownerId?.username}`} className="text-xs text-muted hover:text-main">
                          by @{project.ownerId?.username}
                        </Link>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="glass-panel p-12 text-center text-muted rounded-2xl border border-dashed border-white/20">
                  <Star size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4 text-lg">You haven't bookmarked any projects yet.</p>
                  <Link to="/explore" className="text-primary hover:underline font-semibold">
                    Explore public projects
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={creating}
      />
    </>
  );
};

export default Dashboard;
