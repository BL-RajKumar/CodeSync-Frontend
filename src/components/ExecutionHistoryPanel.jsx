import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Clock, Cpu, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, Trash2, RefreshCw,
  Terminal, Loader2, History, StopCircle, Eraser,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Status display config ───────────────────────────
const STATUS_CONFIG = {
  3:  { label: 'Accepted',      color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 },
  4:  { label: 'Wrong Answer',  color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/25',    icon: AlertTriangle },
  5:  { label: 'Time Limit',    color: '#ef4444', bg: 'bg-red-500/10 border-red-500/25',        icon: XCircle },
  6:  { label: 'Compile Error', color: '#f87171', bg: 'bg-red-500/10 border-red-500/25',        icon: XCircle },
  11: { label: 'Runtime Error', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/25',        icon: XCircle },
  12: { label: 'Runtime Error', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/25',        icon: XCircle },
  0:  { label: 'Cancelled',     color: '#9ca3af', bg: 'bg-white/5 border-white/10',             icon: StopCircle },
};
const getStatus = (id) =>
  STATUS_CONFIG[id] || { label: 'Executed', color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 };

// ─── Relative time helper ────────────────────────────
const relTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ─── Language badge color ────────────────────────────
const LANG_COLORS = {
  javascript: 'text-yellow-400/80',
  typescript: 'text-blue-400/80',
  python:     'text-sky-400/80',
  java:       'text-orange-400/80',
  cpp:        'text-purple-400/80',
  c:          'text-indigo-400/80',
  go:         'text-cyan-400/80',
  rust:       'text-red-400/80',
  ruby:       'text-rose-400/80',
  php:        'text-violet-400/80',
};

// ─── Single History Entry ────────────────────────────
const HistoryEntry = ({ entry, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  // status is now a plain string matching entity diagram
  const statusId = entry.cancelled ? 0 : entry.exitCode;
  const status   = getStatus(statusId);
  const Icon     = status.icon;
  const hasOut   = entry.stdout || entry.stderr;

  // Convert executionTimeMs → display string
  const timeDisplay   = entry.executionTimeMs != null ? `${entry.executionTimeMs}ms` : null;
  const memDisplay    = entry.memoryUsedKb    != null ? `${entry.memoryUsedKb}KB`    : null;

  return (
    <div className={`rounded-lg border overflow-hidden transition-all duration-200 ${status.bg}`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        onClick={() => hasOut && setExpanded(e => !e)}
      >
        {/* Status icon */}
        <Icon size={13} style={{ color: status.color }} className="shrink-0" />

        {/* Language */}
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${LANG_COLORS[entry.language] || 'text-white/50'}`}>
          {entry.language}
        </span>

        {/* Status label */}
        <span className="text-[11px] text-white/60 truncate flex-1">{status.label}</span>

        {/* Time + Memory chips */}
        <div className="flex items-center gap-2 text-[10px] text-white/30 shrink-0">
          {timeDisplay && <span className="flex items-center gap-0.5"><Clock size={9}/>{timeDisplay}</span>}
          {memDisplay  && <span className="flex items-center gap-0.5"><Cpu size={9}/>{memDisplay}</span>}
          <span>{relTime(entry.createdAt)}</span>
        </div>

        {/* Expand chevron */}
        {hasOut && (
          <span className="text-white/25 shrink-0">
            {expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
          </span>
        )}

        {/* Delete */}
        <button
          id={`history-delete-${entry._id}`}
          onClick={e => { e.stopPropagation(); onDelete(entry._id); }}
          className="shrink-0 p-0.5 rounded hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
          title="Delete this entry"
        >
          <Trash2 size={11}/>
        </button>
      </div>

      {/* Expanded output block */}
      {expanded && hasOut && (
        <div className="border-t border-white/5 bg-[#0d0d17]">
          {entry.stdout && (
            <OutputSection label="stdout" content={entry.stdout} color="text-emerald-300/80" />
          )}
          {entry.stderr && (
            <OutputSection label="stderr" content={entry.stderr} color="text-red-400/80" />
          )}
          {entry.stdin && (
            <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-amber-400/40">
              stdin: {entry.stdin.substring(0, 80)}{entry.stdin.length > 80 ? '…' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OutputSection = ({ label, content, color }) => (
  <div className="border-b border-white/5 last:border-0">
    <div className="px-3 pt-2 pb-0.5 text-[9px] uppercase tracking-widest text-white/25">{label}</div>
    <pre className={`px-3 pb-2.5 text-[11px] leading-5 whitespace-pre-wrap break-all max-h-40 overflow-y-auto ${color}`}>
      {content}
    </pre>
  </div>
);

// ─── Loading skeleton ────────────────────────────────
const Skeleton = () => (
  <div className="space-y-2">
    {[1,2,3].map(i => (
      <div key={i} className="h-10 rounded-lg bg-white/[0.03] border border-white/5 animate-pulse" />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════
// Main ExecutionHistoryPanel
// ═══════════════════════════════════════════════════
const ExecutionHistoryPanel = ({ fileId }) => {
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch history
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = fileId
      ? `${apiUrl}/sandbox/history?fileId=${fileId}`
      : `${apiUrl}/sandbox/history`;

    axios.get(url, { withCredentials: true })
      .then(res => { if (!cancelled) setEntries(res.data); })
      .catch(() => { if (!cancelled) toast.error('Failed to load history'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [fileId, refreshKey, apiUrl]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${apiUrl}/sandbox/history/${id}`, { withCredentials: true });
      setEntries(prev => prev.filter(e => e._id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  }, [apiUrl]);

  const handleClearAll = useCallback(async () => {
    if (!window.confirm('Clear all execution history?')) return;
    try {
      await axios.delete(`${apiUrl}/sandbox/history`, { withCredentials: true });
      setEntries([]);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  }, [apiUrl]);

  return (
    <div className="flex flex-col h-full text-sm font-mono">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
        <History size={13} className="text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Execution History</span>

        <div className="ml-auto flex items-center gap-1">
          <button
            id="history-refresh-btn"
            onClick={() => setRefreshKey(k => k + 1)}
            title="Refresh"
            className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
          {entries.length > 0 && (
            <button
              id="history-clear-all-btn"
              onClick={handleClearAll}
              title="Clear all"
              className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Eraser size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <Skeleton />}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-white/20">
            <Terminal size={28} className="opacity-30" />
            <p className="text-xs text-center leading-5">
              No executions yet.<br />
              Run some code to see history here.
            </p>
          </div>
        )}

        {!loading && entries.map(entry => (
          <HistoryEntry
            key={entry._id}
            entry={entry}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Footer count */}
      {!loading && entries.length > 0 && (
        <div className="px-4 py-1.5 border-t border-white/5 text-[9px] text-white/20 flex items-center justify-between">
          <span>{entries.length} record{entries.length !== 1 ? 's' : ''} (7-day retention)</span>
          <span>most recent first</span>
        </div>
      )}
    </div>
  );
};

export default ExecutionHistoryPanel;
