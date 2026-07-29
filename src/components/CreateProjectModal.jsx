import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  { value: 'react', label: 'React (Web CodePad)' },
  { value: 'node-web', label: 'Node.js (Web CodePad)' },
  { value: 'vanilla-web', label: 'Vanilla HTML/CSS/JS (Web CodePad)' }
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

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in">
      <div className="w-full max-w-[500px] p-8 bg-gradient-to-br from-[#f4f5fc] via-[#f9faff] to-[#e5e9fd] border border-indigo-200/80 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#1e1b4b] m-0">Create New CodePad</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input 
            label="CodePad Name"
            name="name"
            placeholder="e.g. awesome-app"
            value={formData.name}
            onChange={handleChange}
            required
            isLight={true}
          />

          <div className="mb-5 w-full">
            <label className="block text-sm font-medium text-[#312e81] mb-2">Description (Optional)</label>
            <textarea
              name="description"
              className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-slate-900 font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 resize-y shadow-sm"
              placeholder="What is this codepad about?"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="mb-5 w-full">
              <label className="block text-sm font-medium text-[#312e81] mb-2">Language</label>
              <select 
                name="language" 
                className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-slate-900 font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm" 
                value={formData.language} 
                onChange={handleChange}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-5 w-full">
              <label className="block text-sm font-medium text-[#312e81] mb-2">Visibility</label>
              <select 
                name="visibility" 
                className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-slate-900 font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm" 
                value={formData.visibility} 
                onChange={handleChange}
              >
                <option value="Public">Public (Anyone can see)</option>
                <option value="Private">Private (Only you)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-2 pt-6 border-t border-indigo-200/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 bg-slate-200 hover:bg-slate-300/80 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create CodePad'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateProjectModal;
