import { useMemo, useState, lazy, Suspense } from 'react';
import type React from 'react';
import { CalendarDays, ChevronLeft, Clock, MapPin, Plus, Trash2, User, Edit2, Sparkles, Edit3, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ClassSchedule } from '../../types';

const AITimetableModal = lazy(() =>
  import('./AITimetableModal').then(m => ({ default: m.AITimetableModal }))
);

const days: ClassSchedule['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMonday = () => {
  const date = new Date();
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const Schedule: React.FC = () => {
  const { schedule, addClass, batchAddClasses, updateClass, deleteClass } = useApp();
  const currentDay = days[(new Date().getDay() + 6) % 7];
  const [selectedDay, setSelectedDay] = useState<ClassSchedule['dayOfWeek']>(currentDay);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAIScanModal, setShowAIScanModal] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<ClassSchedule['dayOfWeek']>(currentDay);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');

  const weekDates = useMemo(() => {
    const monday = getMonday();
    return days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { day, date };
    });
  }, []);

  const selectedDate = weekDates.find(item => item.day === selectedDay)?.date ?? new Date();
  const selectedClasses = schedule.filter(item => item.dayOfWeek === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openAddClassModal = () => {
    setSpeedDialOpen(false);
    setEditingClassId(null);
    setSubjectName(''); setCode(''); setInstructor(''); setLocation('');
    setDayOfWeek(selectedDay); setStartTime('10:00'); setEndTime('11:30');
    setShowClassModal(true);
  };

  const openAIScanModal = () => {
    setSpeedDialOpen(false);
    setShowAIScanModal(true);
  };

  const openEditClassModal = (item: ClassSchedule) => {
    setEditingClassId(item.id); setSubjectName(item.subjectName); setCode(item.code || '');
    setInstructor(item.instructor); setLocation(item.location); setDayOfWeek(item.dayOfWeek);
    setStartTime(item.startTime); setEndTime(item.endTime); setShowClassModal(true);
  };

  const handleSaveClassSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subjectName.trim() || startTime >= endTime) return;
    const details = { subjectName: subjectName.trim(), code: code.trim(), instructor: instructor.trim() || 'TBA', location: location.trim() || 'TBA', dayOfWeek, startTime, endTime };
    if (editingClassId) updateClass(editingClassId, details);
    else {
      const colors = ['#4338ca', '#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#0284c7'];
      addClass({ ...details, color: colors[schedule.length % colors.length] });
    }
    setSelectedDay(dayOfWeek); setShowClassModal(false);
  };

  const handleBatchImport = (classes: Omit<ClassSchedule, 'id'>[]) => {
    batchAddClasses(classes);
    if (classes.length > 0) {
      setSelectedDay(classes[0].dayOfWeek);
    }
  };

  return (
    <div className="schedule-page mx-auto min-h-full max-w-5xl px-4 pb-28 pt-6 sm:px-8 sm:pb-10 sm:pt-10 relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{getGreeting()}</p>
          <h1 className="mt-1 max-w-[18ch] text-4xl font-black leading-[1.02] tracking-tight text-slate-950 dark:text-white sm:text-5xl">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDate)}</h1>
        </div>
        <button type="button" onClick={() => setSelectedDay(currentDay)} aria-label="Jump to today" className="glass-icon-button mt-1 h-14 w-14 rounded-full"><CalendarDays className="h-6 w-6" /></button>
      </div>

      <button type="button" onClick={() => setSelectedDay(currentDay)} className="glass-dark-button mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm"><ChevronLeft className="h-4 w-4" />Back to today</button>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
        {weekDates.map(({ day, date }) => <button key={day} type="button" onClick={() => setSelectedDay(day)} className={`date-pill shrink-0 ${selectedDay === day ? 'date-pill-active' : ''}`}><span>{day.slice(0, 3).toUpperCase()}</span><strong>{date.getDate()}</strong></button>)}
      </div>

      {selectedClasses.length === 0 ? (
        <div className="flex min-h-[31rem] flex-col items-center justify-center text-center relative overflow-hidden rounded-3xl p-8 border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white/95 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 mt-6">
          <div className="schedule-empty-icon flex h-32 w-32 items-center justify-center rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 shadow-md">
            <CalendarDays className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">No classes on this day</h2>
          <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">Add a course manually or scan your weekly timetable image/PDF with AI.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button type="button" onClick={openAddClassModal} className="glass-primary-button inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-md">
              <Plus className="h-4 w-4" />Manual Add
            </button>
            <button type="button" onClick={openAIScanModal} className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95">
              <Sparkles className="h-4 w-4" />AI Scan Timetable
            </button>
          </div>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Your day</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button type="button" onClick={openAIScanModal} className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-xs hover:bg-purple-100 transition-colors">
                <Sparkles className="h-3.5 w-3.5" />Scan Timetable
              </button>
              <button type="button" onClick={openAddClassModal} className="glass-primary-button inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black shadow-md">
                <Plus className="h-4 w-4" />Add Course
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {selectedClasses.map(item => (
              <article 
                key={item.id} 
                style={{ borderRightColor: item.color, borderRightWidth: '5px' }} 
                className="schedule-card relative overflow-hidden rounded-3xl p-5 border border-indigo-100/90 dark:border-slate-800 bg-gradient-to-r from-white/95 via-indigo-50/30 to-white/95 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 shadow-md flex items-center justify-between gap-4 transition-all hover:border-indigo-400 dark:hover:border-indigo-600"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                    <Clock className="h-4 w-4" />{item.startTime} – {item.endTime}
                  </div>
                  <h3 className="mt-2 truncate text-xl font-black text-slate-950 dark:text-white">{item.subjectName}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{item.code || 'Course'}</span>
                    <span><MapPin className="mr-1 inline h-3.5 w-3.5" />{item.location}</span>
                    <span><User className="mr-1 inline h-3.5 w-3.5" />{item.instructor}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => openEditClassModal(item)} aria-label={`Edit ${item.subjectName}`} className="glass-icon-button"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteClass(item.id)} aria-label={`Delete ${item.subjectName}`} className="glass-icon-button text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SPEED-DIAL FLOATING ACTION BUTTON (2 Floating Options)
          ========================================================================= */}
      <div className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end gap-3">
        
        {/* Speed-Dial Menu Options */}
        {speedDialOpen && (
          <div className="flex flex-col items-end gap-2.5 animate-fade-in">
            {/* Option 1: AI Timetable Scan */}
            <button
              type="button"
              onClick={openAIScanModal}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xl hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              <span>Scan Timetable (Image/PDF)</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
            </button>

            {/* Option 2: Manual Add Course */}
            <button
              type="button"
              onClick={openAddClassModal}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs shadow-xl hover:scale-105 active:scale-95 transition-all border border-indigo-200 dark:border-slate-700"
            >
              <span>Manual Course Entry</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          aria-label="Add course options"
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
            speedDialOpen
              ? 'bg-rose-500 text-white rotate-45'
              : 'bg-[#4338ca] text-white shadow-indigo-600/35'
          }`}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Modal: Manual Course Entry / Edit */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="relative overflow-hidden w-full max-w-lg rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-slate-900/90 max-h-[90vh] overflow-y-auto">
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white font-headline">
                {editingClassId ? 'Edit course' : 'Add course'}
              </h3>
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassSubmit} className="mt-6 space-y-4 relative z-10">
              <div>
                <label className="glass-label">Course name</label>
                <input required value={subjectName} onChange={event => setSubjectName(event.target.value)} className="glass-input" placeholder="e.g. Operating Systems" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="glass-label">Course code</label>
                  <input value={code} onChange={event => setCode(event.target.value)} className="glass-input" placeholder="CS 320" />
                </div>
                <div>
                  <label className="glass-label">Instructor</label>
                  <input value={instructor} onChange={event => setInstructor(event.target.value)} className="glass-input" placeholder="Dr. Taylor" />
                </div>
              </div>
              <div>
                <label className="glass-label">Location</label>
                <input value={location} onChange={event => setLocation(event.target.value)} className="glass-input" placeholder="Lecture Hall 4B" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="glass-label">Day</label>
                  <select value={dayOfWeek} onChange={event => setDayOfWeek(event.target.value as ClassSchedule['dayOfWeek'])} className="glass-input">
                    {days.map(day => <option key={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="glass-label">Start</label>
                  <input required type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="glass-label">End</label>
                  <input required type="time" value={endTime} onChange={event => setEndTime(event.target.value)} className="glass-input" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowClassModal(false)} className="glass-secondary-button">Cancel</button>
                <button type="submit" className="glass-primary-button">{editingClassId ? 'Save changes' : 'Add course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Timetable Scanner */}
      {showAIScanModal && (
        <Suspense fallback={null}>
          <AITimetableModal
            open={showAIScanModal}
            onClose={() => setShowAIScanModal(false)}
            onImportClasses={handleBatchImport}
          />
        </Suspense>
      )}
    </div>
  );
};

