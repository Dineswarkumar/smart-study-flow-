import React from 'react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { LayoutDashboard, CheckSquare, Calendar, Timer, CalendarCheck } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notes', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Focus', icon: Timer },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 lg:hidden px-3 py-2 flex justify-around items-center shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'notes' && activeTab === 'tasks');

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200
              ${isActive ? 'text-[#4338ca] dark:text-indigo-400 font-black scale-105' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              isActive 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4338ca] dark:text-indigo-400 shadow-2xs' 
                : 'bg-transparent'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 font-bold tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
