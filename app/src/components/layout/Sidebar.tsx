import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Calendar, 
  User, 
  Settings as SettingsIcon, 
  X,
  Radio,
  Edit2,
  CalendarCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    mobileMenuOpen, 
    setMobileMenuOpen, 
    profile, 
    tasks,
    syncStatus,
    triggerSync
  } = useApp();

  const pendingCount = tasks.filter(t => !t.completed).length;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance Hub', icon: CalendarCheck },
    { id: 'schedule', label: 'Weekly Timetable', icon: Calendar },
    { id: 'notes', label: 'Tasks & Notes', icon: CheckSquare, count: pendingCount },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'profile', label: 'Student Profile', icon: User },
    { id: 'settings', label: 'Settings & Backup', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 pt-6 pb-24 lg:py-6 px-4 z-50 flex flex-col justify-between transition-transform duration-300 shadow-xs
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Header Branding */}
          <div className="flex items-center justify-between px-3 mb-8">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <img
                src="/logo.svg"
                alt="studyzflow logo"
                className="w-10 h-10 rounded-2xl shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-xl font-black tracking-tight font-headline flex items-center gap-1">
                  <span className="text-slate-900 dark:text-white">studyz</span>
                  <span className="text-indigo-600 dark:text-indigo-400">flow</span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wide">Academic Planner</p>
              </div>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'notes' && activeTab === 'tasks');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-[#4338ca] text-white shadow-md shadow-indigo-600/20' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/25 text-white' 
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Cards */}
        <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Same-browser tab sync pill */}
          <div 
            onClick={triggerSync}
            className="px-3.5 py-2.5 rounded-2xl bg-indigo-50/90 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-indigo-100/80 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Radio className={`w-4 h-4 text-indigo-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Tab Sync</span>
            </div>
            <span className="text-[10px] font-black bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-2 py-0.5 rounded-lg">
              Same Browser
            </span>
          </div>

          {/* Student Profile Card */}
          <div 
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#4338ca] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {profile.name ? profile.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate leading-tight">
                  {profile.name || 'Set Up Profile'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                  {profile.major ? `${profile.major}${profile.academicYear ? ` • ${profile.academicYear}` : ''}` : 'Tap to add course details'}
                </span>
              </div>
            </div>
            <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0" />
          </div>

        </div>
      </aside>
    </>
  );
};
