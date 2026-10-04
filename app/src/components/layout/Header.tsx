import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun, 
  Moon, 
  RefreshCw, 
  Menu, 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Timer, 
  User, 
  Settings as SettingsIcon,
  Sparkles,
  Flame,
  Plus,
  CalendarCheck
} from 'lucide-react';
import { QuickTaskModal } from '../tasks/QuickTaskModal';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    settings, 
    toggleThemeMode, 
    syncStatus, 
    triggerSync,
    setActiveTab,
    setMobileMenuOpen,
    tasks
  } = useApp();
  const [quickTaskOpen, setQuickTaskOpen] = React.useState(false);

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  const getViewMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Academic Command Center',
          icon: LayoutDashboard,
        };
      case 'attendance':
        return {
          title: 'Attendance Hub',
          subtitle: 'Daily class marking & 75% criteria tracker',
          icon: CalendarCheck,
        };
      case 'notes':
      case 'tasks':
        return {
          title: 'Tasks & Notes',
          subtitle: 'Lectures, assignments & to-dos',
          icon: BookOpen,
        };
      case 'schedule':
        return {
          title: 'Weekly Timetable',
          subtitle: 'Timetable, venues & instructors',
          icon: Calendar,
        };
      case 'timer':
        return {
          title: 'Focus Timer',
          subtitle: 'Pomodoro timer & study logs',
          icon: Timer,
        };
      case 'profile':
        return {
          title: 'Student Profile',
          subtitle: 'Academic records & personal info',
          icon: User,
        };
      case 'settings':
        return {
          title: 'Settings & Backup',
          subtitle: 'Preferences & same-browser synchronization',
          icon: SettingsIcon,
        };
      default:
        return {
          title: 'studyzflow',
          subtitle: 'Academic Workspace',
          icon: Sparkles,
        };
    }
  };

  const meta = getViewMeta();
  const IconComponent = meta.icon;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Drawer Trigger & Context Indicator */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4338ca] dark:text-indigo-400 flex items-center justify-center shadow-xs border border-indigo-100 dark:border-indigo-900/50">
              <IconComponent className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-headline tracking-tight">
                  {meta.title}
                </h2>
                {/* Crisp High-Contrast Date Pill */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  📅 {todayFormatted}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden xs:block">
                {meta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions, Live Sync, Dark/Light Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action: New Task Trigger on Desktop */}
          <button
            onClick={() => setQuickTaskOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
            title="Add Quick Task"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ New Task</span>
          </button>

          {/* Quick Focus Mode Button on Desktop */}
          {activeTab !== 'timer' && (
            <button
              onClick={() => setActiveTab('timer')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 active:scale-95 transition-all border border-amber-200/90 dark:border-amber-900/50 shadow-2xs"
              title="Launch Focus Session"
            >
              <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>Start Focus</span>
            </button>
          )}

          {/* Task Countdown Pill */}
          {pendingTasksCount > 0 && activeTab !== 'notes' && (
            <button
              onClick={() => setActiveTab('notes')}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
              title="View pending tasks"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span>{pendingTasksCount} Tasks Left</span>
            </button>
          )}

          {/* Real-time Sync Status Pill */}
          <button
            onClick={triggerSync}
            className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold border transition-all ${
              syncStatus === 'syncing' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 animate-pulse dark:bg-indigo-950/60 dark:text-indigo-300' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
            }`}
            title="Force synchronization"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="hidden sm:inline">
              {syncStatus === 'syncing' ? 'Syncing...' : 'Live Sync'}
            </span>
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleThemeMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={`Switch to ${settings.themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {settings.themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-700 transition-transform" />
            )}
          </button>
        </div>

      </div>
      <QuickTaskModal open={quickTaskOpen} onClose={() => setQuickTaskOpen(false)} />
    </header>
  );
};
