import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Play, Loader2, Trash2, Terminal, Clock, Cpu,
  CheckCircle2, XCircle, AlertTriangle, ChevronsRight,
  Type, RotateCcw, Copy, ChevronDown, WrapText,
  Download, Search, X, AlignLeft, Hash, StopCircle, History, Code2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ExecutionHistoryPanel from './ExecutionHistoryPanel';
import LanguagesPanel from './LanguagesPanel';

/* ─── Constants ─── */
const LANGUAGES = [
  { name: 'javascript', displayName: 'JavaScript (Node 18)', ext: ['js', 'jsx'] },
  { name: 'typescript', displayName: 'TypeScript 5',         ext: ['ts', 'tsx'] },
  { name: 'python',     displayName: 'Python 3',             ext: ['py'] },
  { name: 'java',       displayName: 'Java (OpenJDK 13)',    ext: ['java'] },
  { name: 'cpp',        displayName: 'C++ (GCC 9)',          ext: ['cpp', 'cc', 'cxx'] },
  { name: 'c',          displayName: 'C (GCC 9)',            ext: ['c'] },
  { name: 'go',         displayName: 'Go 1.13',              ext: ['go'] },
  { name: 'rust',       displayName: 'Rust 1.40',            ext: ['rs'] },
  { name: 'php',        displayName: 'PHP 7.4',              ext: ['php'] },
  { name: 'ruby',       displayName: 'Ruby 2.7',             ext: ['rb'] },
];

const STDIN_PRESETS = [
  { label: '5 nums',  value: '5\n10 20 30 40 50' },
  { label: 'Hello',   value: 'Hello World' },
  { label: '1..5',    value: '1\n2\n3\n4\n5' },
  { label: 'Yes/No',  value: 'yes' },
];

const STATUS_CONFIG = {
  3:  { label: 'Accepted',          color: '#10b981', icon: CheckCircle2 },
  4:  { label: 'Wrong Answer',      color: '#f59e0b', icon: AlertTriangle },
  5:  { label: 'Time Limit',        color: '#ef4444', icon: XCircle },
  6:  { label: 'Compile Error',     color: '#f87171', icon: XCircle },
  11: { label: 'Runtime Error',     color: '#ef4444', icon: XCircle },
  12: { label: 'Runtime Error',     color: '#ef4444', icon: XCircle },
  13: { label: 'Internal Error',    color: '#6b7280', icon: AlertTriangle },
  14: { label: 'Exec Format Error', color: '#ef4444', icon: XCircle },
};
const getStatusConfig = (id) =>
  STATUS_CONFIG[id] || { label: 'Executed', color: '#10b981', icon: CheckCircle2 };

const detectLanguage = (path) => {
  if (!path) return 'javascript';
  const ext = path.split('.').pop()?.toLowerCase();
  return LANGUAGES.find(l => l.ext.includes(ext))?.name ?? 'javascript';
};

/* ═══════════════════════════════════════════════
   UC21 — Stdin Editor
═══════════════════════════════════════════════ */
const StdinEditor = ({ value, onChange, onClear }) => {
  const lines   = value.split('\n');
  const hasData = value.trim().length > 0;

  return (
    <div className={`rounded-lg overflow-hidden border transition-colors duration-200 ${
      hasData ? 'border-amber-500/40' : 'border-white/10'
    }`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200 ${
        hasData
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-white/3 border-white/5 text-white/40'
      }`}>
        <Type size={10} />
        <span>stdin</span>
        {hasData && (
          <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 rounded text-amber-300 normal-case tracking-normal">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'} · {value.length} chars
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <div className="relative group">
            <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors normal-case tracking-normal">
              Presets <ChevronDown size={9} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden">
              {STDIN_PRESETS.map(p => (
                <button key={p.label}
                  onClick={() => onChange(value ? value + '\n' + p.value : p.value)}
                  className="w-full text-left px-3 py-2 text-[11px] text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {hasData && (
            <button onClick={onClear} title="Clear stdin"
              className="p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors">
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Line numbers + textarea */}
      <div className="flex bg-[#0d0d17] min-h-[72px] max-h-[140px]">
        <div className="select-none py-2 px-2 text-right text-[11px] leading-5 text-white/15 bg-white/[0.02] border-r border-white/5 min-w-[28px]">
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          id="sandbox-stdin-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={'Enter input values, one per line\ne.g.\n5\n3 1 4 1 5'}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent py-2 px-3 text-[12px] leading-5 text-white/75 font-mono focus:outline-none placeholder:text-white/15 overflow-y-auto"
          style={{ minHeight: '72px', maxHeight: '140px' }}
        />
      </div>
      <div className="px-3 py-1 bg-[#0d0d17] border-t border-white/5 text-[9px] text-white/20 flex items-center gap-2">
        <span>↵ one value per line</span>
        {hasData && (
          <button onClick={() => { navigator.clipboard.writeText(value); toast.success('stdin copied'); }}
            className="flex items-center gap-1 ml-auto hover:text-white/50 transition-colors">
            <Copy size={9} /> copy
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   UC22 — Stream Viewer  (stdout / stderr)
═══════════════════════════════════════════════ */
const StreamViewer = ({ output, stdinLines }) => {
  const [activeTab,  setActiveTab]  = useState('stdout');   // 'stdout' | 'stderr' | 'compile'
  const [wordWrap,   setWordWrap]   = useState(true);
  const [showLines,  setShowLines]  = useState(true);
  const [filterText, setFilterText] = useState('');
  const [expanded,   setExpanded]   = useState(false);

  const statusConfig = output.status ? getStatusConfig(output.status.id) : null;
  const StatusIcon   = statusConfig?.icon;

  // Determine which tabs have content
  const tabs = useMemo(() => [
    { id: 'stdout',  label: 'stdout',  content: output.stdout        || '', color: 'emerald' },
    { id: 'stderr',  label: 'stderr',  content: output.stderr        || '', color: 'red'     },
    { id: 'compile', label: 'compile', content: output.compileOutput || '', color: 'orange'  },
  ].filter(t => t.content), [output]);

  // Auto-select first available tab
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  // Filtered lines
  const filteredLines = useMemo(() => {
    if (!currentTab) return [];
    const raw = currentTab.content.split('\n');
    if (!filterText.trim()) return raw;
    const lower = filterText.toLowerCase();
    return raw.map((line, i) => ({ line, idx: i, match: line.toLowerCase().includes(lower) }))
              .filter(r => r.match);
  }, [currentTab, filterText]);

  const matchCount = useMemo(() => {
    if (!filterText.trim() || !currentTab) return 0;
    return currentTab.content.toLowerCase().split(filterText.toLowerCase()).length - 1;
  }, [currentTab, filterText]);

  const copyContent = () => {
    if (!currentTab) return;
    navigator.clipboard.writeText(currentTab.content);
    toast.success(`${currentTab.label} copied`);
  };

  const downloadContent = () => {
    if (!currentTab) return;
    const blob = new Blob([currentTab.content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${currentTab.label}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (tabs.length === 0) {
    return (
      <div className="text-center py-4 text-white/25 text-xs border border-white/5 rounded-lg bg-[#0d0d17]">
        ✓ Program exited with no output
      </div>
    );
  }

  const TAB_COLORS = {
    emerald: { active: 'border-emerald-500 text-emerald-400', dot: 'bg-emerald-500',  text: 'text-emerald-300/90' },
    red:     { active: 'border-red-500 text-red-400',         dot: 'bg-red-500',       text: 'text-red-300/90'     },
    orange:  { active: 'border-orange-500 text-orange-400',   dot: 'bg-orange-500',    text: 'text-orange-300/90'  },
  };
  const activeColor = currentTab ? TAB_COLORS[currentTab.color] : TAB_COLORS.emerald;
  const maxH = expanded ? '70vh' : '260px';

  return (
    <div className="rounded-lg overflow-hidden border border-white/10 animate-sandbox-slide-in">

      {/* ── Status Bar ── */}
      {statusConfig && (
        <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5 text-xs"
          style={{ background: `${statusConfig.color}0d`, color: statusConfig.color }}>
          {StatusIcon && <StatusIcon size={13} />}
          <span className="font-semibold">{output.status.description}</span>
          {stdinLines > 0 && (
            <span className="text-amber-400/60 text-[10px] flex items-center gap-1">
              <Type size={9} /> {stdinLines} stdin {stdinLines === 1 ? 'line' : 'lines'}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3 text-white/35">
            {output.time   && <span className="flex items-center gap-1"><Clock size={10}/>{output.time}s</span>}
            {output.memory && <span className="flex items-center gap-1"><Cpu size={10}/>{(output.memory/1024).toFixed(1)} MB</span>}
          </div>
        </div>
      )}

      {/* ── Stream Tabs ── */}
      <div className="flex items-center bg-[#0d0d17] border-b border-white/10">
        <div className="flex flex-1">
          {tabs.map(tab => {
            const tc = TAB_COLORS[tab.color];
            const lineCount = tab.content.split('\n').length;
            const isActive  = activeTab === tab.id;
            return (
              <button key={tab.id}
                id={`stream-tab-${tab.id}`}
                onClick={() => { setActiveTab(tab.id); setFilterText(''); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-b-2 transition-all duration-150 ${
                  isActive
                    ? `${tc.active} bg-white/[0.03]`
                    : 'border-transparent text-white/35 hover:text-white/60 hover:bg-white/[0.02]'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                {tab.label}
                <span className="text-[9px] opacity-60">({lineCount})</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar icons */}
        <div className="flex items-center gap-0.5 px-2">
          <ToolBtn icon={<Hash size={11}/>}     active={showLines}  onClick={() => setShowLines(s => !s)}  title="Toggle line numbers" />
          <ToolBtn icon={<WrapText size={11}/>}  active={wordWrap}   onClick={() => setWordWrap(w => !w)}   title="Toggle word wrap" />
          <ToolBtn icon={<AlignLeft size={11}/>} active={expanded}   onClick={() => setExpanded(e => !e)}   title={expanded ? 'Collapse' : 'Expand'} />
          <ToolBtn icon={<Copy size={11}/>}                          onClick={copyContent}                   title="Copy output" />
          <ToolBtn icon={<Download size={11}/>}                      onClick={downloadContent}               title="Download as .txt" />
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d17] border-b border-white/5">
        <Search size={11} className="text-white/30 shrink-0" />
        <input
          id="stream-search-input"
          type="text"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter output..."
          className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none"
        />
        {filterText && (
          <>
            <span className="text-[9px] text-white/30">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
            <button onClick={() => setFilterText('')} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={11} />
            </button>
          </>
        )}
      </div>

      {/* ── Output Content ── */}
      <div className="flex bg-[#0d0d17]" style={{ maxHeight: maxH, overflow: 'auto' }}>
        {/* Line numbers */}
        {showLines && (
          <div className="select-none py-3 px-2 text-right text-[11px] leading-5 text-white/15
            bg-white/[0.015] border-r border-white/5 shrink-0 min-w-[36px]">
            {(filterText.trim()
              ? filteredLines.map(r => r.idx + 1)
              : (currentTab?.content || '').split('\n').map((_, i) => i + 1)
            ).map(n => <div key={n}>{n}</div>)}
          </div>
        )}

        {/* Text */}
        <pre
          id={`stream-output-${activeTab}`}
          className={`flex-1 py-3 px-3 text-[11px] leading-5 ${activeColor.text} ${
            wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
          }`}>
          {filterText.trim()
            ? filteredLines.map((r, i) => (
                <HighlightedLine key={i} line={r.line} query={filterText} />
              ))
            : <HighlightAll text={currentTab?.content || ''} query="" />}
        </pre>
      </div>

      {/* ── Footer stats ── */}
      {currentTab && (
        <div className="flex items-center gap-3 px-3 py-1 bg-[#0d0d17] border-t border-white/5 text-[9px] text-white/20">
          <span>{currentTab.content.split('\n').length} lines</span>
          <span>{currentTab.content.length} chars</span>
          {filterText && <span className="text-amber-400/50">filtered: {filteredLines.length} lines visible</span>}
          <span className="ml-auto">{new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

/* Small icon button helper */
const ToolBtn = ({ icon, active, onClick, title }) => (
  <button onClick={onClick} title={title}
    className={`p-1.5 rounded transition-colors ${
      active ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
    }`}>
    {icon}
  </button>
);

/* Renders a single line with highlighted search matches */
const HighlightedLine = ({ line, query }) => {
  if (!query) return <div>{line || '\u00A0'}</div>;
  const parts = line.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <div>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded-sm">{part}</mark>
          : part
      )}
    </div>
  );
};

const HighlightAll = ({ text }) => <>{text}</>;

/* ═══════════════════════════════════════════════
   Main SandboxPanel
═══════════════════════════════════════════════ */
const SandboxPanel = ({ file, codeRef }) => {
  const [language,     setLanguage]     = useState(() => detectLanguage(file?.path));
  const [stdin,        setStdin]        = useState('');
  const [isRunning,    setIsRunning]    = useState(false);
  const [isCancelled,  setIsCancelled]  = useState(false);
  const [output,       setOutput]       = useState(null);
  const [runCount,     setRunCount]     = useState(0);
  const [activeView,   setActiveView]   = useState('runner'); // UC24/25: 'runner' | 'history' | 'languages'
  const outputRef          = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (file?.path) setLanguage(detectLanguage(file.path));
  }, [file?.path]);

  useEffect(() => {
    if (output && outputRef.current)
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [output]);

  const handleRun = useCallback(async () => {
    if (!file) { toast.error('No file selected. Open a file first.'); return; }
    if (isRunning) return;

    // UC23: create a fresh AbortController for this execution
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    setIsCancelled(false);
    setOutput(null);
    try {
      // Pull the absolute latest code directly from the editor's live ref, bypassing autosave
      const latestCode = (codeRef && codeRef.current[file.fileId || file._id]) !== undefined 
        ? codeRef.current[file.fileId || file._id] 
        : (file.content || '');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const { data } = await axios.post(
        `${apiUrl}/sandbox/run`,
        // UC24: pass fileId so backend saves it in history
        { code: latestCode, language, stdin, fileId: file._id || file.fileId || null },
        { withCredentials: true, timeout: 15000, signal: controller.signal }
      );
      setOutput(data);
      setRunCount(c => c + 1);
      // UC24: switch to runner tab to show result
      setActiveView('runner');
    } catch (err) {
      // UC23: detect cancellation
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError' || controller.signal.aborted) {
        setIsCancelled(true);
        setOutput({
          stdout: '', compileOutput: '',
          stderr: '⚠ Execution cancelled by user.',
          status: { id: 0, description: 'Cancelled' },
          cancelled: true,
        });
        toast('Execution cancelled', { icon: '🛑' });
        return;
      }
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const msg = isTimeout
        ? 'Request timed out. The code may be in an infinite loop.'
        : (err.response?.data?.message || 'Failed to execute code.');
      setOutput({ stderr: msg, stdout: '', compileOutput: '', status: { id: isTimeout ? 5 : 13, description: isTimeout ? 'Timed Out' : 'Error' } });
      if (!isTimeout) toast.error(msg);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }, [file, language, stdin, isRunning]);

  // UC23: cancel handler
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleRun();
      if (e.key === 'Escape' && isRunning) handleCancel(); // Esc to cancel
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleCancel, isRunning]);

  const handleClear = () => { setOutput(null); setStdin(''); setIsCancelled(false); };
  const stdinActive = stdin.trim().length > 0;

  return (
    <div className="flex flex-col h-full text-sm font-mono">
      {/* Header + Tab Toggle */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1 shrink-0">
        {/* Runner tab */}
        <button
          id="sandbox-tab-runner"
          onClick={() => setActiveView('runner')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeView === 'runner'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-white/35 hover:text-white/60 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Terminal size={12} />
          Runner
          {runCount > 0 && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">{runCount}</span>
          )}
        </button>
        {/* History tab */}
        <button
          id="sandbox-tab-history"
          onClick={() => setActiveView('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeView === 'history'
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              : 'text-white/35 hover:text-white/60 hover:bg-white/5 border border-transparent'
          }`}
        >
          <History size={12} />
          History
        </button>
        {/* Languages tab */}
        <button
          id="sandbox-tab-languages"
          onClick={() => setActiveView('languages')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            activeView === 'languages'
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
              : 'text-white/35 hover:text-white/60 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Code2 size={12} />
          Languages
        </button>
        {/* stdin badge */}
        {stdinActive && activeView === 'runner' && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded text-amber-400 uppercase tracking-wide">
            stdin active
          </span>
        )}
      </div>

      {/* UC24: History view */}
      {activeView === 'history' && (
        <ExecutionHistoryPanel fileId={file?._id || file?.fileId || null} />
      )}

      {/* UC25: Languages view */}
      {activeView === 'languages' && (
        <LanguagesPanel />
      )}

      {/* Runner view */}
      {activeView === 'runner' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3">
          {/* Language */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/35 mb-1">Language</label>
            <select id="sandbox-language-select" value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#11111b] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/75 focus:outline-none focus:border-emerald-500/40 transition-all appearance-none cursor-pointer">
              {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.displayName}</option>)}
            </select>
          </div>

          {file && (
            <div className="flex items-center gap-1.5 text-[10px] text-white/25 bg-white/[0.02] rounded-lg px-2.5 py-1.5 border border-white/5">
              <ChevronsRight size={9} />
              <span className="truncate">{file.path}</span>
            </div>
          )}

          {/* UC21 — Stdin */}
          <StdinEditor value={stdin} onChange={setStdin} onClear={() => setStdin('')} />

          {/* Run / Cancel / Clear */}
          <div className="flex gap-2">
            {isRunning ? (
              <button id="sandbox-cancel-btn" onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold
                  bg-red-500/10 border border-red-500/40 text-red-400
                  hover:bg-red-500/20 hover:border-red-500/60
                  transition-all duration-150 active:scale-95 animate-pulse-border">
                <StopCircle size={13} />
                Cancel Execution
              </button>
            ) : (
              <button id="sandbox-run-btn" onClick={handleRun} disabled={!file}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold
                  bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                  hover:bg-emerald-500/20 hover:border-emerald-500/50
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
                <Play size={13} className="fill-emerald-400" />
                Run Code
              </button>
            )}
            {output && !isRunning && (
              <button id="sandbox-clear-btn" onClick={handleClear} title="Clear output"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs
                  bg-white/5 border border-white/10 text-white/35
                  hover:bg-white/10 hover:text-white/60 transition-all duration-150 active:scale-95">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <p className="text-[9px] text-white/20 text-center -mt-1">
            {isRunning ? 'Press Esc or click Cancel to stop' : 'Ctrl + Enter to run'}
          </p>

          {/* UC22 — Stream Viewer */}
          {output && (
            <div ref={outputRef}>
              <StreamViewer output={output} stdinLines={stdinActive ? stdin.split('\n').length : 0} />
            </div>
          )}

          {/* Empty state */}
          {!output && !isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-white/20">
              <Terminal size={28} className="opacity-30" />
              <p className="text-xs text-center leading-5">
                Fill stdin above then click{' '}
                <span className="text-emerald-400/60 font-semibold">Run Code</span>
              </p>
            </div>
          )}

          {/* Running animation — UC23 */}
          {isRunning && (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-white/30">
              <div className="relative">
                <Loader2 size={28} className="animate-spin text-emerald-400/50" />
                <span className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
              </div>
              <div className="text-xs text-center space-y-1">
                <p className="text-white/50">Executing in sandbox...</p>
                <div className="sandbox-dots"><span /><span /><span /></div>
                <p className="text-[10px] text-red-400/50 mt-1">Press Esc or click Cancel to abort</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SandboxPanel;
