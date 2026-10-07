import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Timer, 
  BookOpen, 
  Flame, 
  Sparkles,
  Calendar,
  Target,
  CalendarCheck,
  Check,
  X,
  Ban,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuickTaskModal } from '../tasks/QuickTaskModal';
import { calculateOverallAttendance } from '../../services/attendance';
import type { AttendanceStatus } from '../../types';

export const Dashboard: React.FC = () => {
  const { 
    profile, 
    tasks, 
    toggleTask, 
    schedule, 
    sessions,
    setActiveTab,
    attendance,
    attendanceGoals,
    markAttendance,
  } = useApp();
  const [quickTaskOpen, setQuickTaskOpen] = React.useState(false);

  const priorityTasks = tasks.filter(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Attendance metrics
  const overallAttendance = calculateOverallAttendance(schedule, attendance, attendanceGoals);
  const todayIso = new Date().toISOString().split('T')[0];

  const formatDueDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    const isValid = !Number.isNaN(date.getTime());
    const dateFormatted = isValid ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : dateStr;
    
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        const period = h >= 12 ? 'PM' : 'AM';
        const hours12 = h % 12 || 12;
        const minsFormatted = m.toString().padStart(2, '0');
        return `${dateFormatted} at ${hours12}:${minsFormatted} ${period}`;
      }
      return `${dateFormatted} at ${timeStr}`;
    }

    if (isValid && (date.getHours() !== 0 || date.getMinutes() !== 0)) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    return dateFormatted;
  };

  // Find today's classes
  const days: Array<'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  const todayName = days[new Date().getDay()];
  const todayClasses = schedule.filter(c => c.dayOfWeek === todayName);
  const isActualTodaySchedule = todayClasses.length > 0;
  const displayClasses = isActualTodaySchedule ? todayClasses : schedule.slice(0, 3);

  const sessionDays = new Set(sessions.map(session => new Date(session.completedAt).toDateString()));
  let studyStreak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    if (!sessionDays.has(date.toDateString())) break;
    studyStreak += 1;
  }

  const handleToggleTask = (id: string) => {
    toggleTask(id);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  const handleQuickMarkAttendance = (
    e: React.MouseEvent,
    subjectName: string,
    startTime: string,
    endTime: string,
    location: string,
    newStatus: AttendanceStatus,
    scheduleId?: string
  ) => {
    e.stopPropagation();
    markAttendance({
      date: todayIso,
      subjectName,
      status: newStatus,
      time: `${startTime} – ${endTime}`,
      location,
      periodsCount: 1,
      isExtraClass: false,
      scheduleId,
    });

    if (newStatus === 'present') {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    }
  };

  // Helper for lecture type styling
  const getTypeBadge = (index: number, subjectName: string) => {
    const lower = subjectName.toLowerCase();
    if (lower.includes('lab') || lower.includes('algebra') || index === 1) {
      return {
        pill: 'LAB',
        code: `LAB #${index + 1}`,
        style: 'bg-purple-100/90 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60'
      };
    }
    if (lower.includes('wellness') || lower.includes('data') || lower.includes('seminar') || index === 0) {
      return {
        pill: 'SEMINAR',
        code: `SEM #${index + 1}`,
        style: 'bg-emerald-100/90 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
      };
    }
    return {
      pill: 'LECTURE',
      code: `LEC #${index + 1}`,
      style: 'bg-indigo-100/90 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60'
    };
  };

  return (
    <div className="dashboard-page p-3 sm:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-8">
      
      {/* =========================================================================
          1. HERO BANNER (Enhanced Royal Indigo Gradient with Date & Day)
          ========================================================================= */}
      <div className="hero-banner-gradient text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div className="space-y-3 max-w-2xl relative z-10">
          
          {/* Top Badges: Day & Date + Academic Term */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/25 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {profile.academicYear && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300 fill-current" />
                <span>{profile.academicYear}</span>
              </div>
            )}
            <div 
              onClick={() => setActiveTab('attendance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 cursor-pointer backdrop-blur-md text-cyan-200 text-xs font-bold border border-cyan-400/30 shadow-xs transition-colors"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Attendance: {overallAttendance.totalConducted === 0 ? '100%' : `${overallAttendance.percentage}%`}</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-headline">
            Welcome back, {profile.name.split(' ')[0] || 'Student'}! 👋
          </h2>

          {/* Subtitle */}
          <p className="text-white/90 text-sm sm:text-base font-medium leading-relaxed">
            You have <span className="font-bold underline decoration-white/40">{displayClasses.length} {displayClasses.length === 1 ? 'class' : 'classes'}</span> scheduled for today and <span className="font-bold underline decoration-white/40">{priorityTasks.length} pending {priorityTasks.length === 1 ? 'task' : 'tasks'}</span>. Stay focused and keep your streak!
          </p>
        </div>

        {/* Action Buttons inside Banner */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setQuickTaskOpen(true)}
            className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-slate-50 active:scale-95 px-5 py-3 rounded-2xl font-black text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-2 bg-cyan-600/80 hover:bg-cyan-600 active:scale-95 text-white px-5 py-3 rounded-2xl font-bold text-sm border border-cyan-400/40 backdrop-blur-md transition-all shadow-xs"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white px-5 py-3 rounded-2xl font-bold text-sm border border-white/30 backdrop-blur-md transition-all shadow-xs"
          >
            <Timer className="w-4 h-4" />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. METRICS ROW: 5 VIBRANT STAT CARDS (Includes Overall Attendance)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
        
        {/* Card 1: Study Streak (Vibrant Amber Aurora) */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-amber-200/90 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/95 via-orange-50/50 to-white/95 dark:from-amber-950/40 dark:via-orange-950/25 dark:to-slate-900/90 shadow-xl shadow-amber-500/5 flex items-center gap-3.5 transition-all hover:scale-[1.02]">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-400/20 dark:bg-amber-500/10 blur-xl pointer-events-none" />
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0 border border-amber-200/60 relative z-10">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Streak</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-headline mt-0.5 block truncate">
              {studyStreak} {studyStreak === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Classes (Vibrant Indigo Aurora) */}
        <div 
          onClick={() => setActiveTab('schedule')}
          className="cursor-pointer relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/40 dark:via-purple-950/25 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 flex items-center gap-3.5 transition-all hover:scale-[1.02]"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-xl pointer-events-none" />
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs shrink-0 border border-indigo-200/60 relative z-10">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Today's Classes</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-headline mt-0.5 block">
              {displayClasses.length}
            </span>
          </div>
        </div>

        {/* Card 3: Overall Attendance (Vibrant Cyan/Blue Aurora) */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="cursor-pointer relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-cyan-200/90 dark:border-cyan-800/60 bg-gradient-to-br from-cyan-50/95 via-sky-50/50 to-white/95 dark:from-cyan-950/40 dark:via-sky-950/25 dark:to-slate-900/90 shadow-xl shadow-cyan-500/5 flex items-center gap-3.5 transition-all hover:scale-[1.02] group"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-xl pointer-events-none" />
          <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shadow-xs shrink-0 border border-cyan-200/60 relative z-10 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Attendance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-lg sm:text-xl font-black font-headline ${
                overallAttendance.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {overallAttendance.totalConducted === 0 ? '100%' : `${overallAttendance.percentage}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Tasks Done (Vibrant Emerald Aurora) */}
        <div 
          onClick={() => setActiveTab('notes')}
          className="cursor-pointer relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-white/95 dark:from-emerald-950/40 dark:via-teal-950/25 dark:to-slate-900/90 shadow-xl shadow-emerald-500/5 flex items-center gap-3.5 transition-all hover:scale-[1.02]"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-xs shrink-0 border border-emerald-200/60 relative z-10">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Tasks Done</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-headline mt-0.5 block">
              {completionRate}%
            </span>
          </div>
        </div>

        {/* Card 5: Target GPA (Vibrant Cosmic Purple Aurora) */}
        <div 
          onClick={() => setActiveTab('settings')}
          className="cursor-pointer relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-purple-200/90 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/95 via-fuchsia-50/50 to-white/95 dark:from-purple-950/40 dark:via-fuchsia-950/25 dark:to-slate-900/90 shadow-xl shadow-purple-500/5 flex items-center gap-3.5 transition-all hover:scale-[1.02]"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-xl pointer-events-none" />
          <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-xs shrink-0 border border-purple-200/60 relative z-10">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">Target GPA</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-headline mt-0.5 block">
              {profile.targetGpa || '—'}
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. MAIN CONTENT: Today's Schedule (Left) + Priority Tasks & Attendance (Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Today's Schedule (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline">Today's Schedule</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                {todayName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                Mark Extra Class +
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Full Week →
              </button>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-3.5">
            {displayClasses.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-3xl border-2 border-dashed border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                <Calendar className="w-10 h-10 text-indigo-400 dark:text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No classes scheduled for today
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3">
                  Enjoy your free time, or configure your weekly timetable.
                </p>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4338ca] text-white font-bold text-xs hover:bg-[#3730a3] transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Open Weekly Timetable</span>
                </button>
              </div>
            ) : (
              displayClasses.map((item, idx) => {
              const badge = getTypeBadge(idx, item.subjectName);
              const record = attendance.find(
                r => r.date === todayIso && r.subjectName === item.subjectName && (r.scheduleId === item.id || r.time?.includes(item.startTime))
              );
              const currentStatus = record?.status;

              return (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-indigo-100/90 dark:border-indigo-900/40 bg-gradient-to-r from-white/95 via-indigo-50/30 to-white/95 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-400 dark:hover:border-indigo-600"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* High-Contrast Color Code Badge */}
                    <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center font-black text-xs leading-none shrink-0 ${badge.style}`}>
                      <span className="text-[10px] uppercase font-bold">{badge.code.split(' ')[0]}</span>
                      <span className="text-sm font-black mt-0.5">{badge.code.split(' ')[1]}</span>
                    </div>

                    {/* Class Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg font-headline truncate">
                          {item.subjectName}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                          {badge.pill}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {item.startTime} – {item.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.location}
                        </span>
                        <span className="truncate">
                          {item.instructor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Attendance Marking Controls for Today */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    
                    {/* Current Status Pill if Marked */}
                    {currentStatus && (
                      <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                        currentStatus === 'present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : currentStatus === 'absent'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : currentStatus === 'cancelled'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      }`}>
                        {currentStatus === 'present' && <Check className="w-3 h-3 stroke-[3]" />}
                        {currentStatus === 'absent' && <X className="w-3 h-3 stroke-[3]" />}
                        {currentStatus === 'cancelled' && <Ban className="w-3 h-3" />}
                        <span>{currentStatus}</span>
                      </span>
                    )}

                    {/* Quick Action Toggle Buttons */}
                    <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 gap-1 shadow-inner">
                      
                      {/* Present Button */}
                      <button
                        type="button"
                        title="Mark Present"
                        onClick={(e) => handleQuickMarkAttendance(e, item.subjectName, item.startTime, item.endTime, item.location, 'present', item.id)}
                        className={`p-1.5 sm:px-2 sm:py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          currentStatus === 'present'
                            ? 'bg-emerald-500 text-white shadow-sm scale-105'
                            : 'hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">Present</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        title="Mark Absent"
                        onClick={(e) => handleQuickMarkAttendance(e, item.subjectName, item.startTime, item.endTime, item.location, 'absent', item.id)}
                        className={`p-1.5 sm:px-2 sm:py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          currentStatus === 'absent'
                            ? 'bg-rose-500 text-white shadow-sm scale-105'
                            : 'hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">Absent</span>
                      </button>

                      {/* Cancelled Button */}
                      <button
                        type="button"
                        title="Teacher Cancelled Class"
                        onClick={(e) => handleQuickMarkAttendance(e, item.subjectName, item.startTime, item.endTime, item.location, 'cancelled', item.id)}
                        className={`p-1.5 sm:px-2 sm:py-1 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          currentStatus === 'cancelled'
                            ? 'bg-amber-500 text-white shadow-sm scale-105'
                            : 'hover:bg-amber-100 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cancelled</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            }))}
          </div>

        </div>

        {/* Right Column: Priority Tasks & Attendance Health (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Priority Tasks Card (Vibrant Sky/Indigo Aurora) */}
          <div className="relative overflow-hidden rounded-3xl p-6 border border-sky-200/90 dark:border-sky-800/60 bg-gradient-to-br from-sky-50/95 via-indigo-50/50 to-white/95 dark:from-sky-950/40 dark:via-indigo-950/25 dark:to-slate-900/90 shadow-xl shadow-sky-500/5 space-y-4">
            
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center border border-sky-200/60">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-headline">Priority Tasks</h3>
              </div>
              <button
                onClick={() => setActiveTab('notes')}
                className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline"
              >
                All ({priorityTasks.length})
              </button>
            </div>

            {priorityTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center relative z-10 font-bold">All tasks completed! 🎉</p>
            ) : (
              <div className="space-y-3 relative z-10">
                {priorityTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-800 transition-all border border-sky-200/60 dark:border-slate-700 flex items-start justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => handleToggleTask(t.id)}
                        className="mt-0.5 w-4 h-4 rounded-md border-2 border-indigo-600 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {t.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {t.subject || 'General'} • Due {formatDueDate(t.dueDate, t.dueTime)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 shrink-0">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Health & 75% Target Watch Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 border border-cyan-200/90 dark:border-cyan-800/60 bg-gradient-to-br from-cyan-50/95 via-sky-50/50 to-white/95 dark:from-cyan-950/40 dark:via-sky-950/25 dark:to-slate-900/90 shadow-xl shadow-cyan-500/5 space-y-4">
            
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 flex items-center justify-center border border-cyan-200/60">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-headline leading-tight">
                    Attendance Health
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Target: 75% Minimum
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-0.5"
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Attendance Progress Bar */}
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Overall Attendance</span>
                <span className={overallAttendance.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black'}>
                  {overallAttendance.totalConducted === 0 ? '100%' : `${overallAttendance.percentage}%`} ({overallAttendance.totalAttended}/{overallAttendance.totalConducted})
                </span>
              </div>
              
              <div className="relative w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallAttendance.percentage >= 75 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, overallAttendance.totalConducted === 0 ? 100 : overallAttendance.percentage)}%` }}
                />
                {/* 75% tick marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 dark:bg-white/80 z-20 pointer-events-none"
                  style={{ left: '75%' }}
                  title="75% Requirement"
                />
              </div>

              {/* Status Alert Banner */}
              {overallAttendance.percentage < 75 && overallAttendance.totalConducted > 0 ? (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-300">Below 75% Target</p>
                    <p className="text-amber-700 dark:text-amber-400/90 mt-0.5">
                      Attend next classes regularly to restore your target standing without missing exams.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      {overallAttendance.totalConducted === 0 ? 'Ready for semester start' : 'Safe & On Track (>75%)'}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="font-black text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    View Subjects →
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
      <QuickTaskModal open={quickTaskOpen} onClose={() => setQuickTaskOpen(false)} />
    </div>
  );
};
