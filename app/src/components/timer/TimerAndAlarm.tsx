import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import type { CustomTimerItem, TimerColorTheme } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Award, 
  Sparkles, 
  Edit3, 
  Flame, 
  AlarmClock, 
  Bell, 
  Trash2, 
  Plus, 
  X,
  Clock,
  Coffee,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cancelTimerNotification, notifyTimerComplete, scheduleTimerNotification } from '../../services/notifications';

const getThemeClass = (colorTheme: TimerColorTheme) => {
  switch (colorTheme) {
    case 'orange': return 'theme-liquid-orange';
    case 'cyan': return 'theme-liquid-cyan';
    case 'purple': return 'theme-liquid-purple';
    case 'emerald': return 'theme-liquid-emerald';
    case 'rose': return 'theme-liquid-rose';
    default: return 'theme-liquid-orange';
  }
};

const getThemeGradient = (colorTheme: TimerColorTheme) => {
  switch (colorTheme) {
    case 'orange': return 'from-orange-500 to-amber-500 shadow-orange-500/30';
    case 'cyan': return 'from-cyan-500 to-blue-500 shadow-cyan-500/30';
    case 'purple': return 'from-purple-500 to-indigo-500 shadow-purple-500/30';
    case 'emerald': return 'from-emerald-500 to-teal-500 shadow-emerald-500/30';
    case 'rose': return 'from-rose-500 to-pink-500 shadow-rose-500/30';
    default: return 'from-orange-500 to-amber-500 shadow-orange-500/30';
  }
};

const getThemeBadgeStyle = (colorTheme: TimerColorTheme) => {
  switch (colorTheme) {
    case 'orange': return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/70';
    case 'cyan': return 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/70';
    case 'purple': return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/70';
    case 'emerald': return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70';
    case 'rose': return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/70';
    default: return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200/70';
  }
};

export const TimerAndAlarm: React.FC = () => {
  const { 
    settings, 
    logSession, 
    sessions, 
    alarms, 
    addAlarm, 
    updateAlarm, 
    deleteAlarm, 
    toggleAlarm 
  } = useApp();

  const [activePanel, setActivePanel] = useState<'timer' | 'alarms'>('timer');
  
  // Custom Timers State
  const [customTimers, setCustomTimers] = useState<CustomTimerItem[]>(storage.getCustomTimers);
  const [activeTimerId, setActiveTimerId] = useState<string>(customTimers[0]?.id || 'timer-pomodoro');
  
  // Active Timer state
  const activeTimer = useMemo(() => {
    return customTimers.find(t => t.id === activeTimerId) || customTimers[0] || {
      id: 'timer-default',
      name: 'Pomodoro Focus',
      durationMinutes: 25,
      type: 'focus' as const,
      colorTheme: 'orange' as const,
      createdAt: new Date().toISOString(),
    };
  }, [customTimers, activeTimerId]);

  const [timeLeft, setTimeLeft] = useState<number>(activeTimer.durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Modal State for Add / Edit Timer
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);
  const [formTimerName, setFormTimerName] = useState('');
  const [formTimerMins, setFormTimerMins] = useState(25);
  const [formTimerType, setFormTimerType] = useState<'focus' | 'shortBreak' | 'longBreak' | 'custom'>('focus');
  const [formTimerTheme, setFormTimerTheme] = useState<TimerColorTheme>('orange');

  // Alarm Form State
  const [alarmLabel, setAlarmLabel] = useState('Study reminder');
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [alarmRepeat, setAlarmRepeat] = useState<'once' | 'daily'>('daily');
  const [alarmFormOpen, setAlarmFormOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIdRef = useRef(0);

  // Sync timer when activeTimer changes
  useEffect(() => {
    setTimeLeft(activeTimer.durationMinutes * 60);
    setIsRunning(false);
  }, [activeTimer.id, activeTimer.durationMinutes]);

  // Web Audio Alarm Chime
  const playAlarmSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.9);
      });
    } catch {
      // Audio context error
    }
  }, [settings.soundEnabled]);

  // Timer Tick Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playAlarmSound();
            if (settings.notificationsEnabled) {
              void notifyTimerComplete(activeTimer.name);
            }

            // Log session if focus type
            if (activeTimer.type === 'focus' || activeTimer.type === 'custom') {
              logSession({
                subject: activeTimer.name,
                durationMinutes: activeTimer.durationMinutes,
                type: 'pomodoro',
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeTimer.name, activeTimer.durationMinutes, activeTimer.type, logSession, playAlarmSound, settings.notificationsEnabled]);

  const handleReset = () => {
    setIsRunning(false);
    if (notificationIdRef.current) void cancelTimerNotification(notificationIdRef.current);
    setTimeLeft(activeTimer.durationMinutes * 60);
  };

  const handleRunToggle = async () => {
    if (isRunning) {
      if (notificationIdRef.current) await cancelTimerNotification(notificationIdRef.current);
      setIsRunning(false);
      return;
    }

    if (settings.notificationsEnabled) {
      notificationIdRef.current = Date.now() % 2147483647;
      await scheduleTimerNotification(notificationIdRef.current, activeTimer.name, timeLeft);
    }
    setIsRunning(true);
  };

  const handleAddBoost = (minsToAdd: number) => {
    setTimeLeft(prev => prev + minsToAdd * 60);
  };

  // Open Create Timer Modal
  const openAddTimerModal = () => {
    setEditingTimerId(null);
    setFormTimerName('');
    setFormTimerMins(25);
    setFormTimerType('focus');
    setFormTimerTheme('orange');
    setTimerModalOpen(true);
  };

  // Open Edit Timer Modal
  const openEditTimerModal = (timer: CustomTimerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTimerId(timer.id);
    setFormTimerName(timer.name);
    setFormTimerMins(timer.durationMinutes);
    setFormTimerType(timer.type);
    setFormTimerTheme(timer.colorTheme);
    setTimerModalOpen(true);
  };

  const handleSaveCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formTimerName.trim() || 'Focus Session';
    const duration = Math.min(240, Math.max(1, Number(formTimerMins) || 25));

    if (editingTimerId) {
      const updated = customTimers.map(t => t.id === editingTimerId ? {
        ...t,
        name: cleanName,
        durationMinutes: duration,
        type: formTimerType,
        colorTheme: formTimerTheme,
      } : t);
      setCustomTimers(updated);
      storage.saveCustomTimers(updated);
      if (activeTimerId === editingTimerId) {
        setTimeLeft(duration * 60);
      }
    } else {
      const newTimer: CustomTimerItem = {
        id: 'timer_' + Date.now(),
        name: cleanName,
        durationMinutes: duration,
        type: formTimerType,
        colorTheme: formTimerTheme,
        createdAt: new Date().toISOString(),
      };
      const updated = [...customTimers, newTimer];
      setCustomTimers(updated);
      storage.saveCustomTimers(updated);
      setActiveTimerId(newTimer.id);
    }

    setTimerModalOpen(false);
  };

  const handleDeleteTimer = (timerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (customTimers.length <= 1) return;
    const updated = customTimers.filter(t => t.id !== timerId);
    setCustomTimers(updated);
    storage.saveCustomTimers(updated);
    if (activeTimerId === timerId) {
      setActiveTimerId(updated[0]?.id || '');
    }
  };

  // Alarms Handlers
  const openAlarmForm = (alarm?: typeof alarms[number]) => {
    setEditingAlarmId(alarm?.id || null);
    setAlarmLabel(alarm?.label || 'Study reminder');
    setAlarmTime(alarm?.time || '08:00');
    setAlarmRepeat(alarm?.repeat || 'daily');
    setAlarmFormOpen(true);
  };

  const saveAlarm = () => {
    const details = { label: alarmLabel.trim() || 'Study reminder', time: alarmTime, repeat: alarmRepeat, enabled: true } as const;
    if (editingAlarmId) updateAlarm(editingAlarmId, details);
    else addAlarm(details);
    setAlarmFormOpen(false);
    setEditingAlarmId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDurationSecs = activeTimer.durationMinutes * 60;
  // Sphere starts full (100%) and drains down to empty (0%) as timer runs
  const liquidPercent = totalDurationSecs > 0 
    ? Math.max(0, Math.min(100, (timeLeft / totalDurationSecs) * 100))
    : 100;
  const elapsedPercent = totalDurationSecs > 0
    ? Math.round(((totalDurationSecs - timeLeft) / totalDurationSecs) * 100)
    : 0;

  // Calculate daily focus stats
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.completedAt);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const totalFocusMinsToday = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const focusHours = Math.floor(totalFocusMinsToday / 60);
  const focusRemainderMins = totalFocusMinsToday % 60;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-5 pb-28">
      
      {/* Top Toggle: Timers vs Native Alarms with Fixed Sliding Indicator */}
      <div className="relative mx-auto flex max-w-md items-center rounded-full border border-slate-200 bg-white p-1.5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div 
          className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-indigo-600 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            activePanel === 'timer' ? 'translate-x-0' : 'translate-x-full'
          }`} 
        />
        <button 
          type="button" 
          onClick={() => setActivePanel('timer')} 
          className={`relative z-10 flex-1 rounded-full py-2.5 text-xs font-black transition-colors ${activePanel === 'timer' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <Play className="mr-1 inline h-4 w-4" />Liquid Timer ({customTimers.length})
        </button>
        <button 
          type="button" 
          onClick={() => setActivePanel('alarms')} 
          className={`relative z-10 flex-1 rounded-full py-2.5 text-xs font-black transition-colors ${activePanel === 'alarms' ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <AlarmClock className="mr-1 inline h-4 w-4" />Alarms ({alarms.length})
        </button>
      </div>

      {activePanel === 'alarms' ? (
        /* ALARMS VIEW (Vibrant Sky/Indigo Aurora Glass) */
        <section className="relative mx-auto max-w-2xl space-y-4 rounded-3xl border border-sky-200/90 dark:border-sky-800/60 bg-gradient-to-br from-sky-50/95 via-indigo-50/50 to-white/95 dark:from-sky-950/40 dark:via-indigo-950/25 dark:to-slate-900/90 p-5 pb-24 shadow-xl shadow-sky-500/5 sm:p-7 sm:pb-24 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200/60">
              <AlarmClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Study Alarms</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Native alarms work in background on Android & PC.</p>
            </div>
          </div>
          
          {alarmFormOpen && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white/85 dark:bg-slate-800/85 p-4 border border-sky-200/60 dark:border-slate-700 shadow-xs sm:grid-cols-[1fr_auto_auto_auto] sm:items-end relative z-10">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Alarm name
                <input value={alarmLabel} onChange={event => setAlarmLabel(event.target.value)} className="glass-input mt-1" placeholder="Study reminder" />
              </label>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Time
                <input type="time" value={alarmTime} onChange={event => setAlarmTime(event.target.value)} className="glass-input mt-1" />
              </label>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Repeat
                <select value={alarmRepeat} onChange={event => setAlarmRepeat(event.target.value as 'once' | 'daily')} className="glass-input mt-1">
                  <option value="daily">Daily</option>
                  <option value="once">Once</option>
                </select>
              </label>
              <button type="button" onClick={saveAlarm} className="glass-primary-button inline-flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-xs font-black">
                <Plus className="h-4 w-4" />{editingAlarmId ? 'Save' : 'Add'}
              </button>
            </div>
          )}

          {alarms.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-slate-400 relative z-10">No alarms yet. Tap the bottom right + button to add a reminder.</p>
          ) : (
            <div className="space-y-2 relative z-10">
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200/60 bg-white/85 p-3.5 dark:border-slate-700 dark:bg-slate-800/85 shadow-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <Bell className={`h-5 w-5 shrink-0 ${alarm.enabled ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">{alarm.label}</p>
                      <p className="text-xs font-semibold text-slate-500">{alarm.time} · {alarm.repeat === 'daily' ? 'Every day' : 'Once'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.label}`} onClick={() => toggleAlarm(alarm.id)} className={`rounded-full px-3 py-1.5 text-xs font-black ${alarm.enabled ? 'bg-[#0284c7] text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                      {alarm.enabled ? 'Enabled' : 'Off'}
                    </button>
                    <button type="button" aria-label={`Edit ${alarm.label}`} onClick={() => openAlarmForm(alarm)} className="glass-icon-button h-8 w-8 p-1.5 text-sky-600">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Delete ${alarm.label}`} onClick={() => deleteAlarm(alarm.id)} className="glass-icon-button h-8 w-8 p-1.5 text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* =========================================================================
           DYNAMIC 3D ROUND SPHERICAL LIQUID GLASS TIMER
           ========================================================================= */
        <div className="space-y-4 sm:space-y-5">
          
          {/* Main 3D Spherical Liquid Glass Card (Vibrant Cosmic Indigo Aurora) */}
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-slate-900/90 shadow-2xl shadow-indigo-500/10 max-w-2xl mx-auto text-center space-y-3 sm:space-y-4">
            
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/20 dark:from-indigo-500/15 dark:to-purple-500/10 blur-3xl pointer-events-none" />

            {/* Header: Active Preset Name & Duration Info */}
            <div className="flex items-center justify-between border-b border-indigo-100/90 dark:border-slate-800/80 pb-2.5 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl border ${getThemeBadgeStyle(activeTimer.colorTheme)}`}>
                  {activeTimer.name}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {activeTimer.durationMinutes} Minutes Preset
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D Flow Sphere</span>
              </div>
            </div>

            {/* =========================================================================
                THE 3D SPHERICAL LIQUID GLASS ORB
                ========================================================================= */}
            <div className={`liquid-sphere-wrapper ${getThemeClass(activeTimer.colorTheme)}`}>
              
              {/* Dynamic Ambient Glow Behind Sphere */}
              <div className="liquid-sphere-ambient-glow" />

              {/* 3D Convex Glass Sphere */}
              <div className="liquid-sphere-orb">
                
                {/* 3D Glass Depth Ring & Specular Reflections */}
                <div className="liquid-sphere-depth-ring" />
                <div className="liquid-sphere-highlight" />
                <div className="liquid-sphere-glare-arc" />
                <div className="liquid-sphere-rim-light" />

                {/* Animated Liquid Reservoir (Draining towards 0%) */}
                <div 
                  className="liquid-container" 
                  style={{ height: `${liquidPercent}%` }}
                >
                  <div className="liquid-fill" />
                  
                  {/* Wave Layer 1 */}
                  <svg className="liquid-wave-layer liquid-wave-1 text-white/30 dark:text-white/20" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,20 C150,80 350,-20 500,40 C650,100 900,10 1200,30 L1200,120 L0,120 Z" fill="currentColor" />
                  </svg>
                  
                  {/* Wave Layer 2 */}
                  <svg className="liquid-wave-layer liquid-wave-2 text-white/45 dark:text-white/35" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,40 C200,90 400,-10 600,50 C800,110 1000,20 1200,40 L1200,120 L0,120 Z" fill="currentColor" />
                  </svg>

                  {/* Rising Liquid Bubbles */}
                  {isRunning && liquidPercent > 5 && (
                    <>
                      <div className="liquid-bubble w-3 h-3 left-1/4 bottom-4" style={{ animationDelay: '0s' }} />
                      <div className="liquid-bubble w-2 h-2 left-1/2 bottom-2" style={{ animationDelay: '1.4s' }} />
                      <div className="liquid-bubble w-3.5 h-3.5 left-2/3 bottom-5" style={{ animationDelay: '2.6s' }} />
                    </>
                  )}
                </div>

                {/* Inner Content Floating over the 3D Liquid Glass */}
                <div className="liquid-sphere-content space-y-2.5 p-6">
                  
                  {/* Focus Badge */}
                  <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest px-3.5 py-1 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xs flex items-center gap-1.5 mx-auto">
                    {activeTimer.type === 'focus' ? (
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
                    ) : (
                      <Coffee className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{activeTimer.type === 'focus' ? 'Deep Focus' : activeTimer.type === 'shortBreak' ? 'Short Break' : 'Recharge'}</span>
                  </span>

                  {/* Big 3D Digital Countdown Timer */}
                  <div className="text-5xl sm:text-6xl font-black font-headline tracking-tighter text-slate-900 dark:text-white drop-shadow-lg select-none">
                    {formatTime(timeLeft)}
                  </div>

                  {/* Flow State Status */}
                  <div className="text-xs font-black text-slate-700 dark:text-slate-200 drop-shadow-xs flex items-center justify-center gap-1">
                    <span>{isRunning ? '⚡ Flowing Now' : '✨ Ready to Begin'}</span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                    {elapsedPercent}% elapsed ({Math.ceil(timeLeft / 60)}m left)
                  </div>

                </div>
              </div>
            </div>

            {/* Playback Controls & Time Boost */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              
              {/* Quick Boosts */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddBoost(1)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
                  title="Add 1 Minute"
                >
                  +1m
                </button>
                <button
                  onClick={() => handleAddBoost(5)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
                  title="Add 5 Minutes"
                >
                  +5m
                </button>
              </div>

              {/* Main Playback Bar */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 transition-all shadow-xs"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => void handleRunToggle()}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getThemeGradient(activeTimer.colorTheme)} text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all`}
                >
                  {isRunning ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={() => {
                    const currentIndex = customTimers.findIndex(t => t.id === activeTimerId);
                    const nextTimer = customTimers[(currentIndex + 1) % customTimers.length];
                    if (nextTimer) setActiveTimerId(nextTimer.id);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 transition-all shadow-xs"
                  title="Next Preset Timer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

            </div>

          </div>

          {/* =========================================================================
              CUSTOM TIMERS PRESETS GRID (Clean without subject clutter)
              ========================================================================= */}
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-headline">
                  Timer Presets ({customTimers.length})
                </h3>
              </div>
              <button
                onClick={openAddTimerModal}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add custom timer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {customTimers.map((t) => {
                const isActive = t.id === activeTimerId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTimerId(t.id)}
                    className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                      isActive 
                        ? 'bg-white dark:bg-slate-800/95 border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                        : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${getThemeGradient(t.colorTheme)}`} />
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border ${getThemeBadgeStyle(t.colorTheme)}`}>
                          {t.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => openEditTimerModal(t, e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit timer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTimer(t.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete timer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-black text-base font-headline ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.durationMinutes} minutes • {t.type === 'focus' ? 'Deep Focus' : 'Break'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-black text-slate-700 dark:text-slate-300">
                        {t.durationMinutes} mins
                      </span>
                      <span className={`text-[11px] font-bold flex items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                        {isActive ? 'Active Now' : 'Select Timer'}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              DAILY FOCUS STATS & COMPLETED SESSIONS (Vibrant Aurora Cards)
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            
            {/* Stat Card 1: Today's Focus Hours (Vibrant Sunset Amber Aurora) */}
            <div className="relative overflow-hidden rounded-3xl p-6 border border-orange-200/90 dark:border-orange-800/60 bg-gradient-to-br from-orange-50/95 via-amber-50/50 to-white/95 dark:from-orange-950/40 dark:via-amber-950/25 dark:to-slate-900/90 shadow-xl shadow-orange-500/5 flex items-center gap-4">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-orange-400/20 dark:bg-orange-500/10 blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-200/60 relative z-10 shrink-0">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Focus Time</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-headline">
                  {focusHours > 0 ? `${focusHours}h ` : ''}{focusRemainderMins}m
                </h4>
              </div>
            </div>

            {/* Stat Card 2: Completed Sessions Count (Vibrant Indigo Aurora) */}
            <div className="relative overflow-hidden rounded-3xl p-6 border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/40 dark:via-purple-950/25 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 flex items-center gap-4">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold border border-indigo-200/60 relative z-10 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sessions Completed</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-headline">
                  {todaySessions.length} sessions
                </h4>
              </div>
            </div>

            {/* Stat Card 3: Total Recorded (Vibrant Emerald Aurora) */}
            <div className="relative overflow-hidden rounded-3xl p-6 border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-white/95 dark:from-emerald-950/40 dark:via-teal-950/25 dark:to-slate-900/90 shadow-xl shadow-emerald-500/5 flex items-center gap-4">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold border border-emerald-200/60 relative z-10 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifetime Sessions</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-headline">
                  {sessions.length} total
                </h4>
              </div>
            </div>

          </div>

          {/* Completed Focus Sessions List (Vibrant Orchid/Purple Aurora) */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-purple-200/90 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/95 via-indigo-50/50 to-white/95 dark:from-purple-950/40 dark:via-indigo-950/25 dark:to-slate-900/90 shadow-xl shadow-purple-500/5 max-w-5xl mx-auto space-y-4">
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-headline flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200/60">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <span>Recent Focus Sessions History</span>
              </h3>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500 font-bold py-6 text-center relative z-10">No focus sessions recorded yet today. Hit play above to begin!</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 relative z-10">
                {sessions.slice(0, 10).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/85 dark:bg-slate-800/85 border border-purple-200/60 dark:border-slate-700 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 flex items-center justify-center font-bold border border-orange-200/60">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.subject}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(s.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-orange-600 font-headline text-base">
                      +{s.durationMinutes} mins
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          BOTTOM-RIGHT FLOATING ACTION BUTTON (FAB) FOR ADDING/EDITING TIMERS
          ========================================================================= */}
      <button
        type="button"
        onClick={activePanel === 'timer' ? openAddTimerModal : () => openAlarmForm()}
        aria-label={activePanel === 'timer' ? 'Add custom timer' : 'Add alarm'}
        className="timer-fab glass-fab shadow-xl hover:scale-110 active:scale-95 transition-transform"
      >
        <Plus className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
      </button>

      {/* =========================================================================
          MODAL: ADD / EDIT CUSTOM TIMER
          ========================================================================= */}
      {timerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-headline">
                {editingTimerId ? 'Edit Timer Preset' : 'Create Custom Timer'}
              </h3>
              <button
                type="button"
                onClick={() => setTimerModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTimer} className="space-y-4">
              
              {/* Timer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Timer Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formTimerName}
                  onChange={(e) => setFormTimerName(e.target.value)}
                  placeholder="e.g. Deep Coding Sprint, Exam Review"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                />
              </div>

              {/* Duration & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    required
                    value={formTimerMins}
                    onChange={(e) => setFormTimerMins(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                  <select
                    value={formTimerType}
                    onChange={(e) => setFormTimerType(e.target.value as 'focus' | 'shortBreak' | 'longBreak' | 'custom')}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                  >
                    <option value="focus">🎯 Focus Session</option>
                    <option value="shortBreak">☕ Short Break</option>
                    <option value="longBreak">🌿 Long Recharge</option>
                    <option value="custom">⚡ Custom</option>
                  </select>
                </div>
              </div>

              {/* Liquid Color Theme */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Liquid Glow Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['orange', 'cyan', 'purple', 'emerald', 'rose'] as TimerColorTheme[]).map((theme) => {
                    const isSelected = formTimerTheme === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setFormTimerTheme(theme)}
                        className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getThemeGradient(theme)}`} />
                        <span className="text-[10px] font-bold capitalize text-slate-600 dark:text-slate-300">{theme}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-3">
                {editingTimerId ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteTimer(editingTimerId);
                      setTimerModalOpen(false);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    Delete Timer
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-[#4338ca] text-white text-xs font-black shadow-md hover:bg-[#3730a3]"
                  >
                    {editingTimerId ? 'Save Changes' : 'Create Timer'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
