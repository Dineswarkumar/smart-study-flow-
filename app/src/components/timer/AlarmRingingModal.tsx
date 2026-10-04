import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, BellOff, Clock } from 'lucide-react';

export const AlarmRingingModal: React.FC = () => {
  const { ringingAlarm, dismissRingingAlarm, addAlarm } = useApp();

  if (!ringingAlarm) return null;

  const handleSnooze = () => {
    // Snooze by adding a one-time alarm in 5 minutes
    const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
    const snoozeHM = `${String(snoozeDate.getHours()).padStart(2, '0')}:${String(snoozeDate.getMinutes()).padStart(2, '0')}`;
    addAlarm({
      label: `${ringingAlarm.label} (Snooze)`,
      time: snoozeHM,
      repeat: 'once',
      enabled: true,
    });
    dismissRingingAlarm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border-2 border-indigo-500 shadow-2xl text-center relative overflow-hidden">
        {/* Pulsing ring visual */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />

        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 animate-bounce">
          <Bell className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Study Alarm Ringing!
        </h3>
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
          {ringingAlarm.label}
        </p>

        <p className="text-xs text-slate-500 mt-2">
          Time for your scheduled study session or focus sprint.
        </p>

        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={dismissRingingAlarm}
            className="w-full py-3 rounded-full bg-[#4338ca] hover:bg-[#3730a3] text-white font-black text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <BellOff className="w-4 h-4" />
            <span>Dismiss Alarm</span>
          </button>

          <button
            onClick={handleSnooze}
            className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Snooze for 5 minutes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
