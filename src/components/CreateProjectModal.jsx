import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Code2, Terminal, Folder, FileText, Globe, Lock, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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

const CreateProjectModal = ({ isOpen, onClose, onSubmit, loading, isPlayground = false }) => {
  const { theme } = useTheme();
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Theme-aware dynamic style mappings
  const isDark = theme === 'dark';
  const inputBg = isDark ? "bg-input" : "bg-[#091E42]/[0.03]";
  
  const inputClass = `w-full ${inputBg} border-0 border-b border-border/60 rounded-t-lg rounded-b-none pl-10 pr-4 py-2.5 text-sm text-main placeholder-zinc-500 hover:border-border-focus focus:border-primary focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 outline-none transition-colors duration-150`;
  const textareaClass = `w-full ${inputBg} border-0 border-b border-border/60 rounded-t-lg rounded-b-none pl-10 pr-4 py-2.5 text-sm text-main placeholder-zinc-500 hover:border-border-focus focus:border-primary focus:ring-0 focus:outline-none resize-none transition-colors duration-150`;
  const selectClass = `w-full ${inputBg} border-0 border-b border-border/60 rounded-t-lg rounded-b-none pl-10 pr-10 py-2.5 text-sm text-main hover:border-border-focus focus:border-primary focus:ring-0 focus:outline-none cursor-pointer appearance-none transition-colors duration-150`;

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 w-screen h-screen bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[1000] animate-fade-in"
    >
      <div className="w-full max-w-[460px] bg-card border border-border/80 rounded-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] relative text-main overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <div className="flex items-center gap-3">
            <div className="text-primary flex items-center justify-center">
              {isPlayground ? <Terminal size={22} /> : <Code2 size={22} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-main tracking-tight m-0">
                {isPlayground ? 'Create Playground' : 'New CodePad'}
              </h2>
              <p className="text-[11px] text-muted/70 mt-0.5">
                {isPlayground 
                  ? 'Launch a sandbox environment to test snippets.' 
                  : 'Start a collaborative real-time editor.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-muted hover:text-main hover:bg-white/10 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-8 py-6 space-y-6">
            
            {/* Input Name */}
            <div className="space-y-1.5 group animate-fade-in">
              <label className="block text-xs font-semibold text-muted tracking-wide">
                {isPlayground ? 'Playground Name' : 'CodePad Name'}
              </label>
              <div className="relative flex items-center">
                <Folder className="absolute left-3.5 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" size={16} />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={isPlayground ? 'e.g. math-sandbox' : 'e.g. backend-api'}
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Input Description */}
            <div className="space-y-1.5 group animate-fade-in">
              <label className="block text-xs font-semibold text-muted tracking-wide">
                Description <span className="text-[10px] font-normal text-muted/50">(Optional)</span>
              </label>
              <div className="relative flex items-start">
                <FileText className="absolute left-3.5 top-3 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" size={16} />
                <textarea
                  name="description"
                  rows="2"
                  placeholder={isPlayground ? 'Describe your playground experiments...' : 'What is this codepad about?'}
                  value={formData.description}
                  onChange={handleChange}
                  className={textareaClass}
                />
              </div>
            </div>

            {/* Language & Visibility Settings */}
            <div className="grid grid-cols-2 gap-5">
              <div className={`${isPlayground ? 'col-span-2' : ''} group`}>
                <label className="block text-xs font-semibold text-muted tracking-wide mb-1.5">Language</label>
                <div className="relative flex items-center">
                  <Code2 className="absolute left-3.5 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" size={16} />
                  <select 
                    name="language" 
                    value={formData.language} 
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value} className="bg-card text-main">{lang.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 text-muted pointer-events-none" size={16} />
                </div>
              </div>

              {!isPlayground && (
                <div className="group">
                  <label className="block text-xs font-semibold text-muted tracking-wide mb-1.5">Visibility</label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 text-muted group-focus-within:text-primary transition-colors duration-200 pointer-events-none" size={16} />
                    <select 
                      name="visibility" 
                      value={formData.visibility} 
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="Public" className="bg-card text-main">Public</option>
                      <option value="Private" className="bg-card text-main">Private</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 text-muted pointer-events-none" size={16} />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-8 py-6 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-lg font-semibold text-sm bg-transparent hover:bg-white/5 text-muted hover:text-main active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all duration-150 shadow-[0_4px_12px_rgba(var(--color-primary-rgb),0.2)] hover:shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.35)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {loading ? 'Creating...' : (isPlayground ? 'Create Playground' : 'Create CodePad')}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateProjectModal;
