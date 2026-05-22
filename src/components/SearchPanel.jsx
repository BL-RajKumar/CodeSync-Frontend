import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, FileCode, Loader2, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

const SearchPanel = ({ projectId, files, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/files/${projectId}/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Search failed');
      }

      const data = await response.json();
      setResults(data);
      
      // Auto-expand all files on fresh search
      const expanded = {};
      data.results.forEach(r => { expanded[r.fileId] = true; });
      setExpandedFiles(expanded);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      performSearch(query);
    }
  };

  const toggleFileExpand = (fileId) => {
    setExpandedFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const handleMatchClick = (result, match) => {
    // Find the full file object from the files prop to pass to the editor
    const fileObj = files.find(f => (f.fileId || f._id) === result.fileId);
    if (fileObj) {
      onResultClick(fileObj, match.line);
    }
  };

  // Highlight the matched text in a line
  const highlightMatch = (lineContent, searchQuery) => {
    if (!searchQuery.trim()) return lineContent;
    
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = lineContent.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded-sm px-[1px]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return lineContent;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e2e] text-main border-r border-white/5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 uppercase text-xs font-bold tracking-wider text-muted">
        <span className="flex items-center gap-1.5">
          <Search size={12} />
          Search
        </span>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 transition-all duration-200 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
          <Search size={14} className="text-muted mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search in files..."
            className="bg-transparent border-none text-main text-sm w-full focus:outline-none placeholder:text-muted/50"
          />
          {query && (
            <button
              onClick={handleClear}
              className="text-muted hover:text-main transition-colors ml-1 shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary mr-2" size={18} />
            <span className="text-muted text-sm">Searching...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-2 p-4 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* No results */}
        {results && !loading && results.totalMatches === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted">
            <Search size={28} className="mb-3 opacity-30" />
            <p className="text-sm">No results found for</p>
            <p className="text-xs font-mono mt-1 text-main/60">"{results.query}"</p>
          </div>
        )}

        {/* Results summary */}
        {results && !loading && results.totalMatches > 0 && (
          <div className="px-3 py-2 text-xs text-muted border-b border-white/5">
            <span className="text-primary font-semibold">{results.totalMatches}</span> result{results.totalMatches !== 1 ? 's' : ''} in{' '}
            <span className="text-primary font-semibold">{results.fileCount}</span> file{results.fileCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Result groups */}
        {results && !loading && results.results.map((fileResult) => (
          <div key={fileResult.fileId} className="border-b border-white/[0.03]">
            {/* File header */}
            <button
              onClick={() => toggleFileExpand(fileResult.fileId)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-muted shrink-0">
                {expandedFiles[fileResult.fileId] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <FileCode size={14} className="text-[#818cf8] shrink-0" />
              <span className="truncate text-main font-medium text-xs">{fileResult.name}</span>
              <span className="ml-auto shrink-0 bg-primary/15 text-primary text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold">
                {fileResult.matches.length}
              </span>
            </button>

            {/* Matches */}
            {expandedFiles[fileResult.fileId] && (
              <div className="bg-black/10">
                {fileResult.matches.map((match, i) => (
                  <button
                    key={`${fileResult.fileId}-${match.line}-${i}`}
                    onClick={() => handleMatchClick(fileResult, match)}
                    className="w-full flex items-start gap-2 px-4 py-1.5 text-xs hover:bg-primary/10 transition-colors text-left group cursor-pointer"
                  >
                    <span className="text-primary/60 font-mono shrink-0 w-8 text-right select-none pt-[1px]">
                      {match.line}
                    </span>
                    <span className="font-mono text-muted group-hover:text-main transition-colors truncate leading-relaxed">
                      {highlightMatch(match.content, results.query)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Initial state */}
        {!results && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-muted">
            <Search size={28} className="mb-3 opacity-20" />
            <p className="text-xs opacity-60">Type to search across all files</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
