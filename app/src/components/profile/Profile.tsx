import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Mail, GraduationCap, Target, Clock, Save, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [major, setMajor] = useState(profile.major);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [targetGpa, setTargetGpa] = useState(profile.targetGpa);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(profile.weeklyGoalHours);
  const [bio, setBio] = useState(profile.bio);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setMajor(profile.major);
    setAcademicYear(profile.academicYear);
    setTargetGpa(profile.targetGpa);
    setWeeklyGoalHours(profile.weeklyGoalHours);
    setBio(profile.bio);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      major,
      academicYear,
      targetGpa,
      weeklyGoalHours: Number(weeklyGoalHours),
      bio,
    });

    setSavedSuccess(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Toast Save Alert */}
      {savedSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-2xl font-bold text-xs animate-fade-in w-fit mx-auto shadow-md border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Profile Saved Successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-slate-900/90 shadow-2xl shadow-indigo-500/10 space-y-8">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/20 dark:from-indigo-500/15 dark:to-purple-500/10 blur-3xl pointer-events-none" />
        
        {/* Student Badge Card Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-indigo-100/90 dark:border-slate-800 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#4338ca] to-[#6366f1] text-white flex items-center justify-center font-black text-3xl font-headline shadow-lg shadow-indigo-600/25 shrink-0">
            {name.charAt(0) || 'S'}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Official Academic Record</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white font-headline">{name || 'Student Profile'}</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{major || 'Specialization'} • {academicYear || 'Academic Year'}</p>
          </div>
        </div>

        {/* Basic Info Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              Student Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Major / Specialization
            </label>
            <input
              type="text"
              required
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Academic Year / Semester
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 3rd Year / Semester 5"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              Target GPA
            </label>
            <input
              type="text"
              value={targetGpa}
              onChange={(e) => setTargetGpa(e.target.value)}
              placeholder="e.g. 3.9"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Weekly Goal (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={weeklyGoalHours}
              onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
              placeholder="25"
              className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold shadow-xs"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="relative z-10">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">Student Academic Focus & Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write your academic goals, research interests, or study notes..."
            className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-3 px-4 text-sm border border-indigo-100 dark:border-slate-700 focus:border-indigo-600 focus:outline-none resize-none font-medium leading-relaxed shadow-xs"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 relative z-10">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-black text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>

      </form>
    </div>
  );
};
