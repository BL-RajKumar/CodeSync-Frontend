import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShieldAlert, Loader2, Plus, Edit2, Trash2, 
  ToggleLeft, ToggleRight, X, Check, Code, Settings
} from 'lucide-react';

const AdminManageLanguages = () => {
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formExtensions, setFormExtensions] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchLanguages = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/admin/languages`, { withCredentials: true });
      setLanguages(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve languages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const openAddModal = () => {
    setEditingLang(null);
    setFormId('');
    setFormName('');
    setFormDisplayName('');
    setFormVersion('');
    setFormCategory('Scripting');
    setFormExtensions('.js, .jsx');
    setFormAliases('js, jsx');
    setFormColor('#f7df1e');
    setFormDescription('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (lang) => {
    setEditingLang(lang);
    setFormId(lang.id.toString());
    setFormName(lang.name);
    setFormDisplayName(lang.displayName);
    setFormVersion(lang.version || '');
    setFormCategory(lang.category || '');
    setFormExtensions(lang.extensions ? lang.extensions.join(', ') : '');
    setFormAliases(lang.aliases ? lang.aliases.join(', ') : '');
    setFormColor(lang.color || '#cccccc');
    setFormDescription(lang.description || '');
    setFormIsActive(lang.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formId || !formName || !formDisplayName) {
      toast.error('Judge0 ID, Name, and Display Name are required fields.');
      return;
    }

    const payload = {
      id: parseInt(formId, 10),
      name: formName.trim().toLowerCase(),
      displayName: formDisplayName.trim(),
      version: formVersion.trim(),
      category: formCategory.trim(),
      extensions: formExtensions.split(',').map(s => s.trim()).filter(Boolean),
      aliases: formAliases.split(',').map(s => s.trim()).filter(Boolean),
      color: formColor.trim(),
      description: formDescription.trim(),
      isActive: formIsActive,
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      if (editingLang) {
        // Update
        const res = await axios.put(`${apiUrl}/admin/languages/${editingLang.mongoId}`, payload, { withCredentials: true });
        setLanguages(prev => prev.map(l => l.mongoId === editingLang.mongoId ? res.data : l));
        toast.success(`Language "${payload.displayName}" updated successfully`);
      } else {
        // Create
        const res = await axios.post(`${apiUrl}/admin/languages`, payload, { withCredentials: true });
        setLanguages(prev => [...prev, res.data]);
        toast.success(`Language "${payload.displayName}" added successfully`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save language configuration');
    }
  };

  const handleToggleActive = async (lang) => {
    const nextActive = !lang.isActive;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.put(`${apiUrl}/admin/languages/${lang.mongoId}`, {
        isActive: nextActive
      }, { withCredentials: true });
      setLanguages(prev => prev.map(l => l.mongoId === lang.mongoId ? res.data : l));
      toast.success(`Language "${lang.displayName}" ${nextActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update active status');
    }
  };

  const handleDelete = async (lang) => {
    if (lang.name === 'plaintext') {
      toast.error('Cannot delete the fallback "plaintext" language configuration.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete compiler config for "${lang.displayName}"? Users will no longer be able to select or execute this language.`)) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/admin/languages/${lang.mongoId}`, { withCredentials: true });
      setLanguages(prev => prev.filter(l => l.mongoId !== lang.mongoId));
      toast.success(`Language "${lang.displayName}" deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete configuration');
    }
  };

  return (
    <div className="w-full text-main font-sans p-6 md:p-8 h-full overflow-y-auto">
      <div className="w-full space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              Manage Sandbox Languages
              <Settings size={24} className="text-primary animate-spin-slow" />
            </h1>
            <p className="text-muted text-sm mt-1">
              Configure supported compiler environments, toggle active interpreters, and define execution parameters.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover border border-primary/20 rounded-xl text-xs font-semibold text-white shadow-lg shadow-primary/25 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              Add Language
            </button>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur-md">
              <ShieldAlert size={14} />
              Administrator Mode
            </div>
          </div>
        </div>

        {/* Configurations List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <Loader2 size={36} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Scanning compiler configurations...</span>
          </div>
        ) : languages.length === 0 ? (
          <div className="text-center py-20 text-muted bg-white/5 border border-white/10 rounded-2xl">
            <Code size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-lg font-medium text-muted">No languages registered</p>
            <p className="text-xs text-muted/50 mt-1">Click "Add Language" to register a compiler setup.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.map((lang) => (
              <div 
                key={lang.mongoId} 
                className={`bg-white/5 border rounded-2xl p-6 relative backdrop-blur-lg shadow-xl hover:shadow-primary/5 transition-all duration-350 flex flex-col justify-between ${
                  lang.isActive ? 'border-white/10' : 'border-rose-500/20 opacity-60'
                }`}
              >
                {/* Active Indicator Badge */}
                <div 
                  className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[0.65rem] font-bold tracking-wide uppercase ${
                    lang.isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <span className={`h-1 w-1 rounded-full ${lang.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {lang.isActive ? 'Active' : 'Disabled'}
                </div>

                <div className="space-y-4">
                  {/* Language Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: lang.color }} />
                      <h3 className="text-lg font-bold text-main truncate max-w-[150px]">{lang.displayName}</h3>
                    </div>
                    <span className="text-xs text-muted font-mono">{lang.category} · Judge0 ID: {lang.id}</span>
                  </div>

                  {/* Version Detail */}
                  <div className="text-xs bg-white/2 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted/70 font-semibold">Compiler Version:</span>
                      <span className="font-mono text-main/80">{lang.version || 'unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-muted/70 font-semibold">Extensions:</span>
                      <span className="font-mono text-primary/80 truncate max-w-[150px]" title={lang.extensions?.join(', ')}>
                        {lang.extensions?.join(', ') || 'none'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted leading-relaxed line-clamp-2 h-10" title={lang.description}>
                    {lang.description || 'No description provided.'}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-white/5 pt-4 mt-5 flex items-center justify-between">
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => handleToggleActive(lang)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-main cursor-pointer transition-colors"
                  >
                    {lang.isActive ? (
                      <ToggleRight size={20} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={20} className="text-muted/30" />
                    )}
                    <span>{lang.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(lang)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted hover:text-main transition-all cursor-pointer"
                      title="Edit settings"
                    >
                      <Edit2 size={13} />
                    </button>
                    {lang.name !== 'plaintext' && (
                      <button
                        onClick={() => handleDelete(lang)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title="Delete configuration"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Create/Edit Glassmorphic Dialog Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-[#f4f5fc] via-[#f9faff] to-[#e5e9fd] border border-indigo-200/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-200/60 bg-white/30 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-[#1e1b4b]">
                  {editingLang ? `Edit ${editingLang.displayName} Settings` : 'Add New Language'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col max-h-[calc(90vh-60px)]">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* ID & Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Judge0 Language ID</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 93"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Unique Key (lowercase)</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. javascript"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* Display Name & Version */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Display Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. JavaScript"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Compiler Version</label>
                    <input 
                      type="text"
                      placeholder="e.g. Node.js 18.15.0"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* Category & Extensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                    >
                      <option value="Scripting">Scripting</option>
                      <option value="Compiled (Native)">Compiled (Native)</option>
                      <option value="Compiled (JVM)">Compiled (JVM)</option>
                      <option value="Text">Text</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Extensions (comma separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. .js, .jsx"
                      value={formExtensions}
                      onChange={(e) => setFormExtensions(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* Aliases & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Aliases (comma separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. js, jsx"
                      value={formAliases}
                      onChange={(e) => setFormAliases(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#312e81]">Color Hex</label>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-10 border border-indigo-200 bg-transparent cursor-pointer rounded overflow-hidden"
                      />
                      <input 
                        type="text"
                        placeholder="#f7df1e"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#312e81]">Description</label>
                  <textarea 
                    placeholder="Short description of the sandbox runtime environment."
                    rows="2"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-slate-400 resize-none shadow-sm"
                  />
                </div>



                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="modalIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-indigo-300 bg-white text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="modalIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Enable this language configuration instantly on save
                  </label>
                </div>

                </div>

                {/* Actions Button Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-indigo-200/60 bg-indigo-900/5 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300/80 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2.5 bg-primary hover:bg-primary-hover border border-primary/20 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    <Check size={14} />
                    Save Settings
                  </button>
                </div>

              </form>
            </div>
          </div>
      , document.body)}
    </div>
  );
};

export default AdminManageLanguages;
