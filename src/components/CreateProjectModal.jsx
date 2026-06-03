import React, { useState } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'react', label: 'React (Web Project)' },
  { value: 'node-web', label: 'Node.js (Web Project)' },
  { value: 'vanilla-web', label: 'Vanilla HTML/CSS/JS (Web Project)' }
];

const CreateProjectModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'javascript',
    visibility: 'Public'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in">
      <div className="w-full max-w-[500px] p-8 glass-panel shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-main m-0">Create New Project</h2>
          <button onClick={onClose} className="bg-transparent border-none text-muted cursor-pointer p-2 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-white/10 hover:text-main">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input 
            label="Project Name"
            name="name"
            placeholder="e.g. awesome-app"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className="mb-5 w-full">
            <label className="block text-sm font-medium text-muted mb-2">Description (Optional)</label>
            <textarea
              name="description"
              className="w-full bg-input border border-white/10 rounded-xl py-3 px-4 text-main font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-white/20 resize-y"
              placeholder="What is this project about?"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="mb-5 w-full">
              <label className="block text-sm font-medium text-muted mb-2">Language</label>
              <select 
                name="language" 
                className="w-full bg-input border border-white/10 rounded-xl py-3 px-4 text-main font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer" 
                value={formData.language} 
                onChange={handleChange}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value} className="bg-dark text-main">{lang.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5 w-full">
              <label className="block text-sm font-medium text-muted mb-2">Visibility</label>
              <select 
                name="visibility" 
                className="w-full bg-input border border-white/10 rounded-xl py-3 px-4 text-main font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer" 
                value={formData.visibility} 
                onChange={handleChange}
              >
                <option value="Public" className="bg-dark text-main">Public (Anyone can see)</option>
                <option value="Private" className="bg-dark text-main">Private (Only you)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-2 pt-6 border-t border-white/10">
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
