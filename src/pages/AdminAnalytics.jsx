import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  ShieldAlert, Loader2, Users, Folder, 
  Terminal, Activity, TrendingUp, Cpu, 
  CheckCircle2, AlertOctagon, RefreshCw, Layers
} from 'lucide-react';

/* ─── Custom Inline SVG Line Chart Component ─── */
const SVGLineChart = ({ data, color, title, gradientId }) => {
  const width = 600;
  const height = 240;
  const paddingX = 50;
  const paddingY = 40;

  const maxVal = Math.max(...data.map(d => d.count), 5); // default floor is 5 to look nice

  // Generate coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - (d.count / maxVal) * (height - 2 * paddingY);
    return { x, y, val: d.count, label: d.date.substring(5) }; // MM-DD format
  });

  // SVG Path generator
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Fill path generator (closes the area for background gradient)
  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col justify-between h-[340px] shadow-xl relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[80px]" style={{ backgroundColor: color }} />

      <div>
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <TrendingUp size={14} style={{ color }} />
          {title}
        </h3>
      </div>

      <div className="flex-1 w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + ratio * (height - 2 * paddingY);
            const valLabel = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i} className="opacity-40">
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" className="font-mono">{valLabel}</text>
              </g>
            );
          })}

          {/* Area under the line */}
          {fillD && <path d={fillD} fill={`url(#${gradientId})`} />}

          {/* Sparkline line */}
          {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />}

          {/* Sparkline dots */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              {/* Invisible fixed hit target prevents mouse-leave jitter */}
              <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

              {/* Visible dot with radius transition */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="var(--bg-dark)" 
                stroke={color} 
                strokeWidth="2.5" 
                className="transition-all duration-200 group-hover:r-7 group-hover:stroke-[3.5]" 
              />
              
              {/* Tooltip background & text */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect x={p.x - 24} y={p.y - 28} width="48" height="18" rx="4" fill="var(--bg-dark)" stroke="var(--color-border)" strokeWidth="1" />
                <text x={p.x} y={p.y - 16} fill="var(--text-main)" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-mono">
                  {p.val}
                </text>
              </g>

              {/* Date label at bottom */}
              <text x={p.x} y={height - paddingY + 20} fill="var(--text-muted)" fontSize="10" textAnchor="middle" className="font-mono">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (showRefreshToast = false) => {
    if (showRefreshToast) setIsRefreshing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${apiUrl}/admin/analytics`, { withCredentials: true });
      setData(res.data);
      if (showRefreshToast) toast.success('Analytics refreshed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve platform analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-3 text-muted">
        <Loader2 size={36} className="animate-spin text-primary" />
        <span className="text-sm font-medium">Aggregating platform metrics...</span>
      </div>
    );
  }

  const { users, projects, files, sessions, executions } = data || {};

  return (
    <div className="w-full text-main font-sans p-6 md:p-8 h-full overflow-y-auto">
      <div className="w-full space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-main flex items-center gap-2">
              Platform Analytics
              <Activity size={24} className="text-primary animate-pulse" />
            </h1>
            <p className="text-muted text-sm mt-1">
              Deep insights, sandbox performance metrics, and growth indicators for CodeSync.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl text-xs font-semibold hover:text-main transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh Metrics
            </button>
            <div className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-4 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur-md">
              <ShieldAlert size={14} />
              Administrator Mode
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Users Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative backdrop-blur-lg shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Members</span>
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-mono text-main">{users?.total}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span className="text-emerald-500 font-semibold">{users?.active} Active</span>
                <span className="text-rose-500 font-semibold">{users?.suspended} Suspended</span>
              </div>
            </div>
          </div>

          {/* Projects Card */}
          <div className="bg-white/5 border border-border rounded-2xl p-6 relative backdrop-blur-lg shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-2xl group-hover:bg-primary/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Codepads</span>
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                <Folder size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-mono text-main">{projects?.total}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span className="text-primary font-semibold">{projects?.public} Public</span>
                <span className="text-muted">{projects?.private} Private</span>
                <span className="text-muted/60">· {files?.total} Files</span>
              </div>
            </div>
          </div>

          {/* Sessions Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative backdrop-blur-lg shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Collaboration</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Activity size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-mono text-main">{sessions?.total}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {sessions?.active} Live Rooms
                </span>
                <span className="text-muted">Total created</span>
              </div>
            </div>
          </div>

          {/* Code Runs Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative backdrop-blur-lg shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Sandbox Runtimes</span>
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
                <Terminal size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-mono text-main">{executions?.total}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
                <span className="text-emerald-500 font-semibold">{executions?.successRate}% Success</span>
                <span className="text-rose-500 font-semibold">
                  {executions?.total > 0 ? 100 - (executions?.successRate ?? 0) : 0}% Failed
                </span>
                <span className="text-muted">{executions?.averageTimeMs}ms avg speed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Timeline Line Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users?.timeline && (
            <SVGLineChart 
              data={users.timeline} 
              color="rgb(var(--color-primary-rgb))" 
              title="Daily Registrations (7 Days)" 
              gradientId="userTimelineGrad" 
            />
          )}

          {executions?.timeline && (
            <SVGLineChart 
              data={executions.timeline} 
              color="#f59e0b" 
              title="Daily Code Runs (7 Days)" 
              gradientId="executionTimelineGrad" 
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
