import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarCheck, Calendar } from 'lucide-react';
import { Attendance } from '../attendance/Attendance';
import { Schedule } from '../schedule/Schedule';

export const AcademicScheduleAndAttendance: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [subTab, setSubTab] = useState<'attendance' | 'schedule'>(
    activeTab === 'schedule' ? 'schedule' : 'attendance'
  );

  // Synchronize sub-tab if activeTab is changed from an external component (e.g. Dashboard shortcuts)
  useEffect(() => {
    if (activeTab === 'schedule') {
      setSubTab('schedule');
    } else if (activeTab === 'attendance') {
      setSubTab('attendance');
    }
  }, [activeTab]);

  const handleSwitchTab = (tab: 'attendance' | 'schedule') => {
    setSubTab(tab);
    setActiveTab(tab);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="academics-page px-3 sm:px-6 py-2 max-w-7xl mx-auto space-y-3">
      {/* =========================================================================
          SLIDING SEGMENTED NAVIGATION TOGGLE (Vibrant Violet Color Slider Bar)
          ========================================================================= */}
      <div className="flex flex-col items-center justify-center pt-1 pb-1">
        <div className="relative flex items-center p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md max-w-xs sm:max-w-sm w-full">
          {/* Violet Slider Bar with silky spring animation */}
          <div 
            className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-md shadow-violet-500/35 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              subTab === 'attendance' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />

          <button
            type="button"
            onClick={() => handleSwitchTab('attendance')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-colors ${
              subTab === 'attendance' ? 'text-white drop-shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('schedule')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-colors ${
              subTab === 'schedule' ? 'text-white drop-shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timetable</span>
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      <div className="transition-opacity duration-200">
        {subTab === 'attendance' ? <Attendance /> : <Schedule />}
      </div>
    </div>
  );
};

export default AcademicScheduleAndAttendance;
