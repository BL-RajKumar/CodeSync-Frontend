import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Code2, Loader2, Search, X, ExternalLink } from 'lucide-react';

// Category badge colours
const CATEGORY_STYLE = {
  'Scripting':          'bg-amber-500/10   border-amber-500/30   text-amber-400',
  'Compiled (JVM)':     'bg-orange-500/10  border-orange-500/30  text-orange-400',
  'Compiled (Native)':  'bg-sky-500/10     border-sky-500/30     text-sky-400',
};

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 w-24 bg-white/5 rounded" />
        <div className="h-2 w-36 bg-white/[0.03] rounded" />
      </div>
    </div>
    <div className="h-2 w-full bg-white/[0.03] rounded" />
    <div className="h-2 w-3/4 bg-white/[0.03] rounded" />
  </div>
);

// Single language card
const LangCard = ({ lang }) => {
  const catStyle = CATEGORY_STYLE[lang.category] || 'bg-white/5 border-white/10 text-white/40';

  return (
    <div
      id={`lang-card-${lang.name}`}
      className="group rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04]
        hover:border-white/10 p-4 transition-all duration-200 flex flex-col gap-2.5"
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        {/* Color dot acting as language icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ backgroundColor: `${lang.color}22`, border: `1px solid ${lang.color}44`, color: lang.color }}
        >
          {lang.displayName.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white/90">{lang.displayName}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wide font-semibold ${catStyle}`}>
              {lang.category}
            </span>
          </div>
          <p className="text-[10px] text-white/35 font-mono mt-0.5 truncate">{lang.version}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-white/45 leading-[1.6]">{lang.description}</p>

      {/* Footer: extensions + Judge0 ID */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {lang.extensions.map(ext => (
          <span key={ext}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/40">
            {ext}
          </span>
        ))}
        <span className="ml-auto text-[9px] text-white/20 font-mono">
          Judge0 ID: {lang.id}
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════
// Main Panel
// ════════════════════════════════════════════════
const LanguagesPanel = () => {
  const [languages, setLanguages] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    axios.get(`${apiUrl}/sandbox/languages`, { withCredentials: true })
      .then(r => setLanguages(r.data))
      .catch(() => setLanguages([]))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  // Derive categories for filter chips
  const categories = ['All', ...new Set(languages.map(l => l.category))];

  const filtered = languages.filter(l => {
    const matchSearch = !search.trim() ||
      l.displayName.toLowerCase().includes(search.toLowerCase()) ||
      l.version.toLowerCase().includes(search.toLowerCase()) ||
      l.extensions.some(e => e.includes(search.toLowerCase()));
    const matchCat = category === 'All' || l.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
        <Code2 size={13} className="text-violet-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          Supported Languages
        </span>
        {!loading && (
          <span className="ml-auto text-[10px] text-white/25">{languages.length} languages</span>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-[#11111b] border border-white/10 rounded-lg px-3 py-2
          focus-within:border-violet-500/40 transition-colors">
          <Search size={12} className="text-white/30 shrink-0" />
          <input
            id="lang-search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search language, version, extension..."
            className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/20 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            id={`lang-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setCategory(cat)}
            className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-all duration-150 ${
              category === cat
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-white/[0.02] border-white/8 text-white/35 hover:border-white/20 hover:text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Language grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="grid gap-2.5">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-white/20">
            <Code2 size={28} className="opacity-30" />
            <p className="text-xs text-center">No languages match your search.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {filtered.map(lang => (
              <LangCard key={lang.id} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-white/5 text-[9px] text-white/20 flex items-center gap-1 shrink-0">
        <ExternalLink size={8} />
        <span>Powered by Judge0 CE · ce.judge0.com</span>
      </div>
    </div>
  );
};

export default LanguagesPanel;
