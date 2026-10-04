import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateOverallAttendance,
  calculateSubjectAttendance,
  getAllSubjectNames,
  getClassesForDate,
} from '../../services/attendance';
import type { AttendanceStatus, SubjectAttendanceGoal } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Ban,
  SunMedium,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Sliders,
  Info,
  Clock,
  MapPin,
  Trash2,
  X,
  TrendingUp,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const {
    schedule,
    attendance,
    attendanceGoals,
    markAttendance,
    deleteAttendanceRecord,
    saveAttendanceGoal,
    setActiveTab,
  } = useApp();

  // Selected date state (defaults to today in local YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Modal states
  const [extraClassModalOpen, setExtraClassModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedSubjectForGoal, setSelectedSubjectForGoal] = useState<string | null>(null);

  // Form states for extra class
  const [extraSubject, setExtraSubject] = useState('');
  const [extraCustomSubject, setExtraCustomSubject] = useState('');
  const [extraTime, setExtraTime] = useState('14:00 - 15:30');
  const [extraPeriods, setExtraPeriods] = useState(1);
  const [extraStatus, setExtraStatus] = useState<AttendanceStatus>('present');
  const [extraLocation, setExtraLocation] = useState('Lecture Hall');
  const [extraNotes, setExtraNotes] = useState('');

  // Form states for catchup / goal modal
  const [targetPercentageInput, setTargetPercentageInput] = useState(75);
  const [initialAttendedInput, setInitialAttendedInput] = useState(0);
  const [initialTotalInput, setInitialTotalInput] = useState(0);

  const subjectNames = getAllSubjectNames(schedule, attendance, attendanceGoals);
  const overall = calculateOverallAttendance(schedule, attendance, attendanceGoals);
  const dayClasses = getClassesForDate(selectedDate, schedule, attendance);

  // Navigate date
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const isToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return selectedDate === `${year}-${month}-${day}`;
  };

  const formattedDateHeading = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(selectedDate + 'T00:00:00'));

  // Mark all classes on this date as Holiday / College Off
  const handleMarkAllHoliday = () => {
    if (dayClasses.length === 0) return;
    dayClasses.forEach((cls) => {
      markAttendance({
        date: selectedDate,
        subjectName: cls.subjectName,
        scheduleId: cls.isExtraClass ? undefined : cls.id,
        isExtraClass: cls.isExtraClass,
        status: 'holiday',
        periodsCount: cls.periodsCount,
        time: cls.time,
        location: cls.location,
        notes: 'Holiday / Campus Closed',
      });
    });
  };

  // Submit extra class
  const handleCreateExtraClass = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = extraSubject === '__custom__' ? extraCustomSubject.trim() : extraSubject.trim();
    if (!subject) return;

    markAttendance({
      date: selectedDate,
      subjectName: subject,
      isExtraClass: true,
      status: extraStatus,
      periodsCount: Math.max(1, Number(extraPeriods) || 1),
      time: extraTime.trim() || 'Extra Session',
      location: extraLocation.trim() || 'TBA',
      notes: extraNotes.trim() || 'Makeup Lecture',
    });

    setExtraClassModalOpen(false);
    setExtraCustomSubject('');
    setExtraNotes('');
  };

  // Open Goal / Catchup Modal
  const openGoalModal = (subjectName: string) => {
    setSelectedSubjectForGoal(subjectName);
    const existing = attendanceGoals.find(
      (g) => g.subjectName.toLowerCase() === subjectName.toLowerCase()
    );
    setTargetPercentageInput(existing?.targetPercentage ?? 75);
    setInitialAttendedInput(existing?.initialAttended ?? 0);
    setInitialTotalInput(existing?.initialTotal ?? 0);
    setGoalModalOpen(true);
  };

  // Save Goal / Catchup
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForGoal) return;
    const goal: SubjectAttendanceGoal = {
      subjectName: selectedSubjectForGoal,
      targetPercentage: Math.max(1, Math.min(100, Number(targetPercentageInput) || 75)),
      initialAttended: Math.max(0, Number(initialAttendedInput) || 0),
      initialTotal: Math.max(Number(initialAttendedInput) || 0, Number(initialTotalInput) || 0),
    };
    saveAttendanceGoal(goal);
    setGoalModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP HERO OVERVIEW: Glassmorphic Attendance Command Header */}
      <div className="liquid-glass-panel rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 border border-white/60 dark:border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto text-center sm:text-left">
          {/* Circular Progress Ring */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="10"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(100, overall.percentage) / 100)}`}
                strokeLinecap="round"
                className={`transition-all duration-700 ease-out ${
                  overall.percentage >= 75
                    ? 'stroke-emerald-500'
                    : overall.percentage >= 65
                    ? 'stroke-amber-500'
                    : 'stroke-rose-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {overall.percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Overall
              </span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-headline">
                Attendance Hub
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  overall.percentage >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50'
                    : overall.percentage >= 65
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50'
                }`}
              >
                {overall.percentage >= 75
                  ? '75%+ Safe Target'
                  : overall.percentage >= 65
                  ? 'At Risk (Below 75%)'
                  : 'Critical Shortage'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Conducted: <strong className="text-slate-900 dark:text-white">{overall.totalConducted}</strong> periods | Attended: <strong className="text-slate-900 dark:text-white">{overall.totalAttended}</strong> periods
            </p>

            {overall.atRiskSubjectsCount > 0 && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overall.atRiskSubjectsCount} {overall.atRiskSubjectsCount === 1 ? 'subject' : 'subjects'} currently below minimum 75% criteria.
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              setExtraSubject(subjectNames[0] || '__custom__');
              setExtraClassModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Extra Class</span>
          </button>

          <button
            onClick={handleMarkAllHoliday}
            disabled={dayClasses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all disabled:opacity-50"
            title="Mark all classes on this date as Holiday / Cancelled"
          >
            <SunMedium className="w-4 h-4 text-amber-500" />
            <span>Mark Today as Holiday</span>
          </button>
        </div>
      </div>

      {/* 2. DATE NAVIGATION & DAILY ATTENDANCE MARKER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Daily Class Marking
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Mark each lecture as Present, Absent, Cancelled, or Holiday.
            </p>
          </div>

          {/* Date Picker Controls */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2 min-w-[130px] text-center">
              {isToday() ? 'Today, ' : ''}
              {formattedDateHeading}
            </span>

            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                title="Select Specific Date"
              />
              <button className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Classes List on Selected Date */}
        <div className="mt-5 flex flex-col gap-3">
          {dayClasses.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No scheduled classes on this day
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Did your teacher take an unexpected makeup class or extra lecture? You can record it right now.
              </p>
              <button
                onClick={() => {
                  setExtraSubject(subjectNames[0] || '__custom__');
                  setExtraClassModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Extra Class for this day</span>
              </button>
            </div>
          ) : (
            dayClasses.map((cls) => {
              const currentStatus = cls.status;

              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    currentStatus === 'present'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : currentStatus === 'absent'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : currentStatus === 'cancelled'
                      ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-80'
                      : currentStatus === 'holiday'
                      ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70 shadow-xs'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-3 h-12 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: cls.color || '#6366f1' }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {cls.subjectName}
                        </h3>
                        {cls.code && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cls.code}
                          </span>
                        )}
                        {cls.isExtraClass && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                            Extra Class
                          </span>
                        )}
                        {cls.periodsCount > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Counts as {cls.periodsCount} periods
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {cls.time}
                        </span>
                        {cls.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {cls.location}
                          </span>
                        )}
                        {cls.notes && (
                          <span className="italic text-slate-400">
                            "{cls.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Switcher */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
                    {/* Present */}
                    <button
                      onClick={() =>
                        markAttendance({
                          date: selectedDate,
                          subjectName: cls.subjectName,
                          scheduleId: cls.isExtraClass ? undefined : cls.id,
                          isExtraClass: cls.isExtraClass,
                          status: 'present',
                          periodsCount: cls.periodsCount,
                          time: cls.time,
                          location: cls.location,
                          notes: cls.notes,
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs scale-102'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </button>

                    {/* Absent */}
                    <button
                      onClick={() =>
                        markAttendance({
                          date: selectedDate,
                          subjectName: cls.subjectName,
                          scheduleId: cls.isExtraClass ? undefined : cls.id,
                          isExtraClass: cls.isExtraClass,
                          status: 'absent',
                          periodsCount: cls.periodsCount,
                          time: cls.time,
                          location: cls.location,
                          notes: cls.notes,
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs scale-102'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>

                    {/* Cancelled */}
                    <button
                      onClick={() =>
                        markAttendance({
                          date: selectedDate,
                          subjectName: cls.subjectName,
                          scheduleId: cls.isExtraClass ? undefined : cls.id,
                          isExtraClass: cls.isExtraClass,
                          status: 'cancelled',
                          periodsCount: cls.periodsCount,
                          time: cls.time,
                          location: cls.location,
                          notes: cls.notes || 'Teacher cancelled lecture',
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        currentStatus === 'cancelled'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                      title="Teacher didn't take class (not counted against percentage)"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancelled</span>
                    </button>

                    {/* Delete extra class button if applicable */}
                    {cls.isExtraClass && (
                      <button
                        onClick={() => deleteAttendanceRecord(cls.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete extra class entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. COURSE-BY-COURSE ATTENDANCE ANALYTICS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Subject Attendance & 75% Tracker
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Live criteria analysis, bunk limit calculations, and historical catchup.
            </p>
          </div>

          {subjectNames.length === 0 && (
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              + Configure timetable first
            </button>
          )}
        </div>

        {/* Subjects Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectNames.map((name) => {
            const stats = calculateSubjectAttendance(name, schedule, attendance, attendanceGoals);

            return (
              <div
                key={name}
                className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: stats.color }}
                        />
                        <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                          {stats.subjectName}
                        </h3>
                        {stats.code && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {stats.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        Attended: <strong className="text-slate-900 dark:text-white">{stats.attendedPeriods}</strong> / {stats.totalPeriods} conducted periods
                      </p>
                    </div>

                    {/* Percentage Pill */}
                    <div
                      className={`px-3 py-1 rounded-2xl text-center shrink-0 border ${
                        stats.percentage >= stats.targetPercentage
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : stats.percentage >= stats.targetPercentage - 10
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-lg font-black block leading-none">
                        {stats.percentage}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5">
                        Target {stats.targetPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar with 75% Target Notch */}
                  <div className="mt-4 relative">
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.percentage >= stats.targetPercentage
                            ? 'bg-emerald-500'
                            : stats.percentage >= stats.targetPercentage - 10
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, stats.percentage)}%` }}
                      />
                    </div>
                    {/* Visual target tick marker at target % */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70"
                      style={{ left: `${stats.targetPercentage}%` }}
                      title={`Target line (${stats.targetPercentage}%)`}
                    />
                  </div>

                  {/* Reachability Advice */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    {stats.percentage >= stats.targetPercentage ? (
                      <p className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>
                          Safe! You can miss up to <strong>{stats.safeToMiss}</strong> more {stats.safeToMiss === 1 ? 'class' : 'classes'} and still stay above {stats.targetPercentage}%.
                        </span>
                      </p>
                    ) : (
                      <p className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>
                          Action needed! Attend the next <strong>{stats.neededToAttend}</strong> {stats.neededToAttend === 1 ? 'class' : 'classes'} in a row to reach {stats.targetPercentage}%.
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Card Controls: Catchup button */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {stats.initialTotal > 0
                      ? `Includes +${stats.initialAttended}/${stats.initialTotal} catchup`
                      : 'No catchup counts set'}
                  </span>

                  <button
                    onClick={() => openGoalModal(stats.subjectName)}
                    className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Set Initial / Goal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL: ADD EXTRA / MAKEUP CLASS */}
      {extraClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Add Extra / Makeup Class
                </h3>
              </div>
              <button
                onClick={() => setExtraClassModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExtraClass} className="mt-4 flex flex-col gap-4">
              {/* Subject Selection */}
              <div>
                <label className="glass-label">Select Course / Subject</label>
                <select
                  value={extraSubject}
                  onChange={(e) => setExtraSubject(e.target.value)}
                  className="glass-input"
                  required
                >
                  {subjectNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter custom / new course name</option>
                </select>

                {extraSubject === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter Course Name e.g. Quantum Computing"
                    value={extraCustomSubject}
                    onChange={(e) => setExtraCustomSubject(e.target.value)}
                    className="glass-input mt-2"
                    required
                  />
                )}
              </div>

              {/* Time & Period Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="glass-label">Time Window</label>
                  <input
                    type="text"
                    value={extraTime}
                    onChange={(e) => setExtraTime(e.target.value)}
                    placeholder="14:00 - 15:30"
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Periods Weight</label>
                  <select
                    value={extraPeriods}
                    onChange={(e) => setExtraPeriods(Number(e.target.value))}
                    className="glass-input"
                  >
                    <option value={1}>1 Period (Standard Lecture)</option>
                    <option value={2}>2 Periods (Double Lecture)</option>
                    <option value={3}>3 Periods (Lab Session)</option>
                  </select>
                </div>
              </div>

              {/* Room Location & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="glass-label">Location</label>
                  <input
                    type="text"
                    value={extraLocation}
                    onChange={(e) => setExtraLocation(e.target.value)}
                    placeholder="Hall 4B / Lab"
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Status</label>
                  <select
                    value={extraStatus}
                    onChange={(e) => setExtraStatus(e.target.value as AttendanceStatus)}
                    className="glass-input font-bold"
                  >
                    <option value="present">✓ Present</option>
                    <option value="absent">✕ Absent</option>
                    <option value="cancelled">⊘ Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="glass-label">Optional Notes</label>
                <input
                  type="text"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder="e.g. Makeup lecture for Friday's cancellation"
                  className="glass-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setExtraClassModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#4338ca] text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
                >
                  Save Extra Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADJUST CATCHUP & GOALS */}
      {goalModalOpen && selectedSubjectForGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  {selectedSubjectForGoal}
                </h3>
              </div>
              <button
                onClick={() => setGoalModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 flex flex-col gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  Started using studyzflow mid-semester? Enter your existing past counts below so your percentage stays 100% accurate.
                </span>
              </div>

              <div>
                <label className="glass-label">Target Attendance Criteria (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetPercentageInput}
                  onChange={(e) => setTargetPercentageInput(Number(e.target.value))}
                  className="glass-input font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="glass-label">Past Attended Count</label>
                  <input
                    type="number"
                    min="0"
                    value={initialAttendedInput}
                    onChange={(e) => setInitialAttendedInput(Number(e.target.value))}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="glass-label">Past Total Classes</label>
                  <input
                    type="number"
                    min="0"
                    value={initialTotalInput}
                    onChange={(e) => setInitialTotalInput(Number(e.target.value))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-2 rounded-full font-bold text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#4338ca] text-white font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
