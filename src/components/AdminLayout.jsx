import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BarChart2, Users, Radio, Activity, Code, ShieldAlert, Megaphone
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/admin/analytics',
      label: 'Analytics Dashboard',
      icon: BarChart2,
      description: 'System statistics & execution metrics'
    },
    {
      path: '/admin/users',
      label: 'Users Management',
      icon: Users,
      description: 'View accounts & toggle suspensions'
    },
    {
      path: '/admin/sessions',
      label: 'Active Sessions',
      icon: Radio,
      description: 'Monitor live collab rooms'
    },
    {
      path: '/admin/jobs',
      label: 'Running Jobs',
      icon: Activity,
      description: 'Track & cancel sandbox runs'
    },
    {
      path: '/admin/languages',
      label: 'Sandbox Languages',
      icon: Code,
      description: 'Manage sandbox compilation runtimes'
    },
    {
      path: '/admin/broadcasts',
      label: 'Broadcasts',
      icon: Megaphone,
      description: 'Send global alerts to all users'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0b0b14] text-main flex flex-col lg:flex-row font-sans max-w-7xl mx-auto px-4 md:px-8 pb-12 gap-8">
      
      {/* Admin Panel Left Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
        
        {/* Navigation panel header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3 backdrop-blur-lg">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center justify-center">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">Console Control</h2>
            <span className="text-[0.65rem] text-primary font-bold uppercase tracking-wider mt-0.5 block">Admin Access</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1 backdrop-blur-lg">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-semibold' 
                    : 'text-muted hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <Icon 
                  size={18} 
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-muted group-hover:text-primary'
                  }`} 
                />
                <div className="truncate">
                  <span className="text-xs block leading-tight">{item.label}</span>
                  <span className={`text-[0.6rem] block font-normal truncate max-w-[170px] mt-0.5 ${
                    isActive ? 'text-white/70' : 'text-white/20'
                  }`}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Console info footer */}
        <div className="hidden lg:block bg-gradient-to-br from-primary/10 to-indigo-900/10 border border-white/5 rounded-2xl p-5 backdrop-blur-lg">
          <span className="text-[0.65rem] font-bold text-primary tracking-wide uppercase">Sandbox Engine Status</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Docker Sandbox: Active</span>
          </div>
          <p className="text-[0.65rem] text-muted leading-relaxed mt-2">
            All sandbox routes, history tracking, execution termination rules and language parameters are running operational.
          </p>
        </div>

      </aside>

      {/* Main Administrative Context Panel */}
      <main className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-lg shadow-2xl relative">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
