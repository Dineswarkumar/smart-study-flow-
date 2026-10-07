import DOMPurify from 'dompurify';
import type { StudentProfile, TaskItem, NoteItem, ClassSchedule, FocusSession, AppSettings, AlarmItem, CustomTimerItem, AttendanceRecord, SubjectAttendanceGoal } from '../types';

const sanitizeHtml = (dirty: unknown): string => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'span',
      'strong', 'b', 'em', 'i', 'code', 'pre', 'blockquote', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr', 'a'
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel']
  });
};

const sanitizeText = (dirty: unknown): string => {
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

const STORAGE_KEYS = {
  PROFILE: 'studyflow_profile',
  TASKS: 'studyflow_tasks',
  NOTES: 'studyflow_notes',
  SCHEDULE: 'studyflow_schedule',
  SESSIONS: 'studyflow_sessions',
  SETTINGS: 'studyflow_settings',
  ALARMS: 'studyflow_alarms',
  CUSTOM_TIMERS: 'studyflow_custom_timers',
  ATTENDANCE: 'studyflow_attendance',
  ATTENDANCE_GOALS: 'studyflow_attendance_goals',
};
const PENDING_CLOUD_SYNC_KEY = 'studyflow_pending_cloud_sync';

export const defaultAttendance: AttendanceRecord[] = [];
export const defaultAttendanceGoals: SubjectAttendanceGoal[] = [];

const localChangeListeners = new Set<() => void>();

export const defaultProfile: StudentProfile = {
  name: '',
  major: '',
  academicYear: '',
  targetGpa: '',
  weeklyGoalHours: 15,
  email: '',
  bio: '',
};

export const defaultSettings: AppSettings = {
  themeMode: 'light',
  themePreset: 'candy',
  soundEnabled: true,
  notificationsEnabled: false,
  alarmVolume: 80,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  autoSync: true,
  deviceSyncId: 'device_' + Math.random().toString(36).substring(2, 9),
};

export const defaultTasks: TaskItem[] = [];

export const defaultNotes: NoteItem[] = [];

export const defaultAlarms: AlarmItem[] = [];

export const defaultCustomTimers: CustomTimerItem[] = [
  {
    id: 'timer-pomodoro',
    name: 'Pomodoro Focus',
    durationMinutes: 25,
    type: 'focus',
    colorTheme: 'orange',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timer-deep-study',
    name: 'Deep Study Sprint',
    durationMinutes: 45,
    type: 'focus',
    colorTheme: 'purple',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timer-quick-review',
    name: 'Quick Revision',
    durationMinutes: 15,
    type: 'focus',
    colorTheme: 'cyan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timer-power-hour',
    name: 'Power Hour',
    durationMinutes: 60,
    type: 'focus',
    colorTheme: 'emerald',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timer-short-break',
    name: 'Short Break',
    durationMinutes: 5,
    type: 'shortBreak',
    colorTheme: 'cyan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'timer-long-break',
    name: 'Long Recharge',
    durationMinutes: 15,
    type: 'longBreak',
    colorTheme: 'rose',
    createdAt: new Date().toISOString(),
  },
];

export const defaultSchedule: ClassSchedule[] = [];

export const defaultSessions: FocusSession[] = [];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isObjectArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isRecord);

function readStored<T>(key: string, fallback: T, validate: (value: unknown) => boolean): T {
  const data = localStorage.getItem(key);
  if (!data) return fallback;

  try {
    const parsed: unknown = JSON.parse(data);
    return validate(parsed) ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

// Helper functions for LocalStorage
export const storage = {
  getProfile: (): StudentProfile => {
    return {
      ...defaultProfile,
      ...readStored(STORAGE_KEYS.PROFILE, defaultProfile, isRecord),
    };
  },
  saveProfile: (profile: StudentProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    notifySync();
  },
  getTasks: (): TaskItem[] => {
    return readStored(STORAGE_KEYS.TASKS, defaultTasks, isObjectArray) as TaskItem[];
  },
  saveTasks: (tasks: TaskItem[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    notifySync();
  },
  getNotes: (): NoteItem[] => {
    return readStored(STORAGE_KEYS.NOTES, defaultNotes, isObjectArray) as NoteItem[];
  },
  saveNotes: (notes: NoteItem[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    notifySync();
  },
  getSchedule: (): ClassSchedule[] => {
    return readStored(STORAGE_KEYS.SCHEDULE, defaultSchedule, isObjectArray) as ClassSchedule[];
  },
  saveSchedule: (schedule: ClassSchedule[]) => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    notifySync();
  },
  getSessions: (): FocusSession[] => {
    return readStored(STORAGE_KEYS.SESSIONS, defaultSessions, isObjectArray) as FocusSession[];
  },
  saveSessions: (sessions: FocusSession[]) => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    notifySync();
  },
  getSettings: (): AppSettings => {
    return {
      ...defaultSettings,
      ...readStored(STORAGE_KEYS.SETTINGS, defaultSettings, isRecord),
    };
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifySync();
  },
  getAlarms: (): AlarmItem[] => readStored(STORAGE_KEYS.ALARMS, defaultAlarms, isObjectArray) as AlarmItem[],
  saveAlarms: (alarms: AlarmItem[]) => {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
    notifySync();
  },
  getCustomTimers: (): CustomTimerItem[] => {
    return readStored(STORAGE_KEYS.CUSTOM_TIMERS, defaultCustomTimers, isObjectArray) as CustomTimerItem[];
  },
  saveCustomTimers: (timers: CustomTimerItem[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TIMERS, JSON.stringify(timers));
    notifySync();
  },
  getAttendance: (): AttendanceRecord[] => {
    return readStored(STORAGE_KEYS.ATTENDANCE, defaultAttendance, isObjectArray) as AttendanceRecord[];
  },
  saveAttendance: (attendance: AttendanceRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    notifySync();
  },
  getAttendanceGoals: (): SubjectAttendanceGoal[] => {
    return readStored(STORAGE_KEYS.ATTENDANCE_GOALS, defaultAttendanceGoals, isObjectArray) as SubjectAttendanceGoal[];
  },
  saveAttendanceGoals: (goals: SubjectAttendanceGoal[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_GOALS, JSON.stringify(goals));
    notifySync();
  },
  getAllData: () => ({
    profile: storage.getProfile(),
    tasks: storage.getTasks(),
    notes: storage.getNotes(),
    schedule: storage.getSchedule(),
    sessions: storage.getSessions(),
    settings: storage.getSettings(),
    alarms: storage.getAlarms(),
    customTimers: storage.getCustomTimers(),
    attendance: storage.getAttendance(),
    attendanceGoals: storage.getAttendanceGoals(),
  }),
  hasPendingCloudSync: () => localStorage.getItem(PENDING_CLOUD_SYNC_KEY) === '1',
  clearPendingCloudSync: () => localStorage.removeItem(PENDING_CLOUD_SYNC_KEY),
  exportAllData: () => {
    return JSON.stringify({
      ...storage.getAllData(),
      exportTimestamp: new Date().toISOString(),
    }, null, 2);
  },
  getLastCloudUpload: (): string | null => localStorage.getItem('study_flow_last_cloud_upload'),
  setLastCloudUpload: (time: string) => localStorage.setItem('study_flow_last_cloud_upload', time),
  getLastCloudDownload: (): string | null => localStorage.getItem('study_flow_last_cloud_download'),
  setLastCloudDownload: (time: string) => localStorage.setItem('study_flow_last_cloud_download', time),
  mergeAllData: (remote: any): boolean => {
    if (!remote || !isRecord(remote)) return false;
    try {
      // 1. Merge Tasks (Deduplicate by ID, keep all tasks, merge completion)
      const localTasks = storage.getTasks();
      const remoteTasks = (remote.tasks && Array.isArray(remote.tasks) ? remote.tasks : []) as TaskItem[];
      const taskMap = new Map<string, TaskItem>();
      localTasks.forEach(t => taskMap.set(t.id, t));
      remoteTasks.forEach(rt => {
        if (!taskMap.has(rt.id)) {
          taskMap.set(rt.id, rt);
        } else {
          const local = taskMap.get(rt.id)!;
          taskMap.set(rt.id, {
            ...local,
            ...rt,
            completed: local.completed || rt.completed,
            subtasks: Array.from(
              new Map([
                ...(local.subtasks || []).map(s => [s.id, s] as const),
                ...(rt.subtasks || []).map(s => [s.id, s] as const),
              ]).values()
            ),
          });
        }
      });
      storage.saveTasks(Array.from(taskMap.values()));

      // 2. Merge Notes (Deduplicate by ID, keep newer updatedAt)
      const localNotes = storage.getNotes();
      const remoteNotes = (remote.notes && Array.isArray(remote.notes) ? remote.notes : []) as NoteItem[];
      const noteMap = new Map<string, NoteItem>();
      localNotes.forEach(n => noteMap.set(n.id, n));
      remoteNotes.forEach(rn => {
        if (!noteMap.has(rn.id)) {
          noteMap.set(rn.id, rn);
        } else {
          const local = noteMap.get(rn.id)!;
          const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
          const remoteTime = new Date(rn.updatedAt || rn.createdAt || 0).getTime();
          if (remoteTime > localTime) {
            noteMap.set(rn.id, rn);
          }
        }
      });
      storage.saveNotes(Array.from(noteMap.values()));

      // 3. Merge Schedule (Deduplicate by ID or dayOfWeek+startTime+subjectName)
      const localSchedule = storage.getSchedule();
      const remoteSchedule = (remote.schedule && Array.isArray(remote.schedule) ? remote.schedule : []) as ClassSchedule[];
      const schedMap = new Map<string, ClassSchedule>();
      localSchedule.forEach(s => schedMap.set(s.id, s));
      remoteSchedule.forEach(rs => {
        const isDuplicate = Array.from(schedMap.values()).some(
          s => s.dayOfWeek === rs.dayOfWeek && s.startTime === rs.startTime && s.subjectName.toLowerCase() === rs.subjectName.toLowerCase()
        );
        if (!schedMap.has(rs.id) && !isDuplicate) {
          schedMap.set(rs.id, rs);
        }
      });
      storage.saveSchedule(Array.from(schedMap.values()));

      // 4. Merge Sessions (Deduplicate by ID)
      const localSessions = storage.getSessions();
      const remoteSessions = (remote.sessions && Array.isArray(remote.sessions) ? remote.sessions : []) as FocusSession[];
      const sessionMap = new Map<string, FocusSession>();
      localSessions.forEach(s => sessionMap.set(s.id, s));
      remoteSessions.forEach(rs => {
        if (!sessionMap.has(rs.id)) sessionMap.set(rs.id, rs);
      });
      storage.saveSessions(Array.from(sessionMap.values()));

      // 5. Merge Alarms
      const localAlarms = storage.getAlarms();
      const remoteAlarms = (remote.alarms && Array.isArray(remote.alarms) ? remote.alarms : []) as AlarmItem[];
      const alarmMap = new Map<string, AlarmItem>();
      localAlarms.forEach(a => alarmMap.set(a.id, a));
      remoteAlarms.forEach(ra => {
        if (!alarmMap.has(ra.id)) alarmMap.set(ra.id, ra);
      });
      storage.saveAlarms(Array.from(alarmMap.values()));

      // 6. Merge Custom Timers
      const localTimers = storage.getCustomTimers();
      const remoteTimers = (remote.customTimers && Array.isArray(remote.customTimers) ? remote.customTimers : []) as CustomTimerItem[];
      const timerMap = new Map<string, CustomTimerItem>();
      localTimers.forEach(t => timerMap.set(t.id, t));
      remoteTimers.forEach(rt => {
        if (!timerMap.has(rt.id)) timerMap.set(rt.id, rt);
      });
      storage.saveCustomTimers(Array.from(timerMap.values()));

      // 7. Merge Attendance Records (Deduplicate by ID, keep newer createdAt)
      const localAttendance = storage.getAttendance();
      const remoteAttendance = (remote.attendance && Array.isArray(remote.attendance) ? remote.attendance : []) as AttendanceRecord[];
      const attMap = new Map<string, AttendanceRecord>();
      localAttendance.forEach(a => attMap.set(a.id, a));
      remoteAttendance.forEach(ra => {
        if (!attMap.has(ra.id)) {
          attMap.set(ra.id, ra);
        } else {
          const local = attMap.get(ra.id)!;
          if (new Date(ra.createdAt || 0).getTime() >= new Date(local.createdAt || 0).getTime()) {
            attMap.set(ra.id, ra);
          }
        }
      });
      storage.saveAttendance(Array.from(attMap.values()));

      // 8. Merge Attendance Goals (Deduplicate by subjectName)
      const localGoals = storage.getAttendanceGoals();
      const remoteGoals = (remote.attendanceGoals && Array.isArray(remote.attendanceGoals) ? remote.attendanceGoals : []) as SubjectAttendanceGoal[];
      const goalMap = new Map<string, SubjectAttendanceGoal>();
      localGoals.forEach(g => goalMap.set(g.subjectName.toLowerCase(), g));
      remoteGoals.forEach(rg => {
        if (!goalMap.has(rg.subjectName.toLowerCase())) {
          goalMap.set(rg.subjectName.toLowerCase(), rg);
        }
      });
      storage.saveAttendanceGoals(Array.from(goalMap.values()));

      notifySync();
      return true;
    } catch {
      return false;
    }
  },
  importAllData: (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!isRecord(parsed)) return false;

      const hasInvalidSection =
        (parsed.profile !== undefined && !isRecord(parsed.profile)) ||
        (parsed.tasks !== undefined && !isObjectArray(parsed.tasks)) ||
        (parsed.notes !== undefined && !isObjectArray(parsed.notes)) ||
        (parsed.schedule !== undefined && !isObjectArray(parsed.schedule)) ||
        (parsed.sessions !== undefined && !isObjectArray(parsed.sessions)) ||
        (parsed.settings !== undefined && !isRecord(parsed.settings)) ||
        (parsed.customTimers !== undefined && !isObjectArray(parsed.customTimers)) ||
        (parsed.attendance !== undefined && !isObjectArray(parsed.attendance)) ||
        (parsed.attendanceGoals !== undefined && !isObjectArray(parsed.attendanceGoals));

      if (hasInvalidSection) return false;

      if (parsed.profile && isRecord(parsed.profile)) {
        const p = parsed.profile as Record<string, unknown>;
        const sanitizedProfile: StudentProfile = {
          ...defaultProfile,
          name: sanitizeText(p.name),
          major: sanitizeText(p.major),
          academicYear: sanitizeText(p.academicYear),
          targetGpa: sanitizeText(p.targetGpa),
          weeklyGoalHours: typeof p.weeklyGoalHours === 'number' ? p.weeklyGoalHours : defaultProfile.weeklyGoalHours,
          email: sanitizeText(p.email),
          bio: sanitizeText(p.bio),
        };
        storage.saveProfile(sanitizedProfile);
      }

      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        const sanitizedTasks: TaskItem[] = (parsed.tasks as TaskItem[]).map((t) => ({
          ...t,
          title: sanitizeText(t.title),
          description: t.description ? sanitizeText(t.description) : undefined,
          subject: t.subject ? sanitizeText(t.subject) : undefined,
          subtasks: Array.isArray(t.subtasks)
            ? t.subtasks.map((st) => ({ ...st, title: sanitizeText(st.title) }))
            : undefined,
        }));
        storage.saveTasks(sanitizedTasks);
      }

      if (parsed.notes && Array.isArray(parsed.notes)) {
        const sanitizedNotes: NoteItem[] = (parsed.notes as NoteItem[]).map((n) => ({
          ...n,
          title: sanitizeText(n.title),
          subject: sanitizeText(n.subject),
          content: sanitizeHtml(n.content),
          tags: Array.isArray(n.tags) ? n.tags.map(sanitizeText).filter(Boolean) : [],
        }));
        storage.saveNotes(sanitizedNotes);
      }

      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        const sanitizedSchedule: ClassSchedule[] = (parsed.schedule as ClassSchedule[]).map((s) => ({
          ...s,
          subjectName: sanitizeText(s.subjectName),
          code: s.code ? sanitizeText(s.code) : undefined,
          instructor: sanitizeText(s.instructor),
          location: sanitizeText(s.location),
        }));
        storage.saveSchedule(sanitizedSchedule);
      }

      if (parsed.sessions) storage.saveSessions(parsed.sessions as FocusSession[]);
      if (parsed.settings) storage.saveSettings({ ...defaultSettings, ...parsed.settings });
      if (parsed.alarms && Array.isArray(parsed.alarms)) {
        const sanitizedAlarms: AlarmItem[] = (parsed.alarms as AlarmItem[]).map((a) => ({
          ...a,
          label: sanitizeText(a.label),
        }));
        storage.saveAlarms(sanitizedAlarms);
      }
      if (parsed.customTimers) storage.saveCustomTimers(parsed.customTimers as CustomTimerItem[]);
      if (parsed.attendance && Array.isArray(parsed.attendance)) {
        const sanitizedAttendance: AttendanceRecord[] = (parsed.attendance as AttendanceRecord[]).map((a) => ({
          ...a,
          subjectName: sanitizeText(a.subjectName),
          location: a.location ? sanitizeText(a.location) : undefined,
          notes: a.notes ? sanitizeText(a.notes) : undefined,
        }));
        storage.saveAttendance(sanitizedAttendance);
      }
      if (parsed.attendanceGoals && Array.isArray(parsed.attendanceGoals)) {
        const sanitizedGoals: SubjectAttendanceGoal[] = (parsed.attendanceGoals as SubjectAttendanceGoal[]).map((g) => ({
          ...g,
          subjectName: sanitizeText(g.subjectName),
        }));
        storage.saveAttendanceGoals(sanitizedGoals);
      }
      notifySync();
      return true;
    } catch {
      return false;
    }
  },
  resetAllData: () => {
    storage.saveProfile({ ...defaultProfile });
    storage.saveTasks([]);
    storage.saveNotes([]);
    storage.saveSchedule([]);
    storage.saveSessions([]);
    storage.saveAlarms([]);
    storage.saveAttendance([]);
    storage.saveAttendanceGoals([]);
    storage.saveCustomTimers(defaultCustomTimers);
    localStorage.removeItem(PENDING_CLOUD_SYNC_KEY);
    localStorage.removeItem('study_flow_last_cloud_upload');
    localStorage.removeItem('study_flow_last_cloud_download');
    notifySync();
  },
};

// Purge any old fake data left over in localStorage from earlier runs
try {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
  const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (
    (storedProfile && storedProfile.includes('Alex Vance')) ||
    (storedTasks && storedTasks.includes('Finish BST & Binary Tree Assignment'))
  ) {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_GOALS);
    localStorage.removeItem(STORAGE_KEYS.ALARMS);
  }
} catch {
  // Ignore in SSR / restricted environments
}

export const subscribeToLocalChanges = (listener: () => void) => {
  localChangeListeners.add(listener);
  return () => localChangeListeners.delete(listener);
};

// Cross-tab real-time broadcast channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('studyflow_sync_channel')
  : null;

let notifyTimer: ReturnType<typeof setTimeout> | null = null;

function notifySync() {
  localStorage.setItem(PENDING_CLOUD_SYNC_KEY, '1');
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    localChangeListeners.forEach(listener => listener());
    if (syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    }
  }, 400);
}

export function subscribeToSync(onSync: () => void) {
  if (syncChannel) {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SYNC_UPDATE') {
        onSync();
      }
    };
    syncChannel.addEventListener('message', handler);
    return () => syncChannel.removeEventListener('message', handler);
  }
  return () => {};
}
