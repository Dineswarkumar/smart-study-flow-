import type { ClassSchedule, AttendanceRecord, SubjectAttendanceGoal, AttendanceStatus } from '../types';

export interface SubjectAttendanceSummary {
  subjectName: string;
  code?: string;
  color?: string;
  attendedPeriods: number;
  absentPeriods: number;
  cancelledPeriods: number;
  totalPeriods: number;
  percentage: number;
  targetPercentage: number;
  status: 'safe' | 'warning' | 'critical';
  safeToMiss: number;
  neededToAttend: number;
  initialAttended: number;
  initialTotal: number;
}

export interface OverallAttendanceSummary {
  totalAttended: number;
  totalConducted: number;
  percentage: number;
  targetPercentage: number;
  atRiskSubjectsCount: number;
  totalSubjects: number;
}

export interface DayClassItem {
  id: string; // scheduleId or extra attendance record id
  subjectName: string;
  code?: string;
  instructor?: string;
  location?: string;
  time: string;
  color?: string;
  isExtraClass: boolean;
  periodsCount: number;
  attendanceRecord?: AttendanceRecord;
  status: AttendanceStatus | 'unmarked';
  notes?: string;
}

const DAYS_OF_WEEK: ClassSchedule['dayOfWeek'][] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Returns all distinct subject names configured in either timetable, goals, or attendance records.
 */
export function getAllSubjectNames(
  schedule: ClassSchedule[],
  attendance: AttendanceRecord[],
  goals: SubjectAttendanceGoal[]
): string[] {
  const set = new Set<string>();
  schedule.forEach((s) => s.subjectName?.trim() && set.add(s.subjectName.trim()));
  goals.forEach((g) => g.subjectName?.trim() && set.add(g.subjectName.trim()));
  attendance.forEach((a) => a.subjectName?.trim() && set.add(a.subjectName.trim()));
  return Array.from(set);
}

/**
 * Calculates detailed statistics and 75% target reachability for a given subject.
 */
export function calculateSubjectAttendance(
  subjectName: string,
  schedule: ClassSchedule[],
  attendance: AttendanceRecord[],
  goals: SubjectAttendanceGoal[]
): SubjectAttendanceSummary {
  const normSubject = subjectName.trim().toLowerCase();

  // Find goal settings if any
  const goal = goals.find((g) => g.subjectName.trim().toLowerCase() === normSubject);
  const targetPercentage = goal?.targetPercentage ?? 75;
  const initialAttended = Math.max(0, goal?.initialAttended ?? 0);
  const initialTotal = Math.max(initialAttended, goal?.initialTotal ?? 0);

  // Timetable info for styling/code
  const matchingSchedule = schedule.find(
    (s) => s.subjectName.trim().toLowerCase() === normSubject
  );

  let attendedPeriods = initialAttended;
  let absentPeriods = initialTotal - initialAttended;
  let cancelledPeriods = 0;

  attendance
    .filter((a) => a.subjectName.trim().toLowerCase() === normSubject)
    .forEach((rec) => {
      const weight = Math.max(1, rec.periodsCount || 1);
      if (rec.status === 'present') {
        attendedPeriods += weight;
      } else if (rec.status === 'absent') {
        absentPeriods += weight;
      } else if (rec.status === 'cancelled' || rec.status === 'holiday') {
        cancelledPeriods += weight;
      }
    });

  const totalPeriods = attendedPeriods + absentPeriods;
  const percentage = totalPeriods > 0 ? (attendedPeriods / totalPeriods) * 100 : 100;

  // Bunk vs Recovery Math (Target criteria)
  const targetRatio = targetPercentage / 100;
  let safeToMiss = 0;
  let neededToAttend = 0;

  if (totalPeriods === 0) {
    safeToMiss = 0;
    neededToAttend = 0;
  } else if (percentage >= targetPercentage) {
    // Formula: floor((attended - targetRatio * total) / targetRatio)
    safeToMiss = Math.floor((attendedPeriods - targetRatio * totalPeriods) / targetRatio);
  } else {
    // Formula: ceil((targetRatio * total - attended) / (1 - targetRatio))
    const denom = 1 - targetRatio;
    neededToAttend = denom > 0 ? Math.ceil((targetRatio * totalPeriods - attendedPeriods) / denom) : 0;
  }

  const status: 'safe' | 'warning' | 'critical' =
    percentage >= targetPercentage
      ? 'safe'
      : percentage >= targetPercentage - 10
      ? 'warning'
      : 'critical';

  return {
    subjectName,
    code: matchingSchedule?.code,
    color: matchingSchedule?.color || '#6366f1',
    attendedPeriods,
    absentPeriods,
    cancelledPeriods,
    totalPeriods,
    percentage: Math.round(percentage * 10) / 10,
    targetPercentage,
    status,
    safeToMiss: Math.max(0, safeToMiss),
    neededToAttend: Math.max(0, neededToAttend),
    initialAttended,
    initialTotal,
  };
}

/**
 * Calculates overall university/semester attendance across all subjects.
 */
export function calculateOverallAttendance(
  schedule: ClassSchedule[],
  attendance: AttendanceRecord[],
  goals: SubjectAttendanceGoal[]
): OverallAttendanceSummary {
  const subjectNames = getAllSubjectNames(schedule, attendance, goals);
  if (subjectNames.length === 0) {
    return {
      totalAttended: 0,
      totalConducted: 0,
      percentage: 100,
      targetPercentage: 75,
      atRiskSubjectsCount: 0,
      totalSubjects: 0,
    };
  }

  let totalAttended = 0;
  let totalConducted = 0;
  let atRiskCount = 0;

  subjectNames.forEach((name) => {
    const summary = calculateSubjectAttendance(name, schedule, attendance, goals);
    totalAttended += summary.attendedPeriods;
    totalConducted += summary.totalPeriods;
    if (summary.totalPeriods > 0 && summary.percentage < summary.targetPercentage) {
      atRiskCount++;
    }
  });

  const percentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 100;

  return {
    totalAttended,
    totalConducted,
    percentage: Math.round(percentage * 10) / 10,
    targetPercentage: 75,
    atRiskSubjectsCount: atRiskCount,
    totalSubjects: subjectNames.length,
  };
}

/**
 * Combines timetable slots and extra classes for any chosen calendar date.
 */
export function getClassesForDate(
  dateStr: string, // YYYY-MM-DD
  schedule: ClassSchedule[],
  attendance: AttendanceRecord[]
): DayClassItem[] {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayName = DAYS_OF_WEEK[dateObj.getDay()];

  // 1. Regular timetable classes for this day of week
  const regularClasses = schedule.filter((s) => s.dayOfWeek === dayName);

  // 2. Attendance records already logged on this exact date
  const recordsOnDate = attendance.filter((a) => a.date === dateStr);

  const items: DayClassItem[] = regularClasses.map((s) => {
    const record = recordsOnDate.find((r) => r.scheduleId === s.id);
    return {
      id: s.id,
      subjectName: s.subjectName,
      code: s.code,
      instructor: s.instructor,
      location: s.location,
      time: `${s.startTime} - ${s.endTime}`,
      color: s.color,
      isExtraClass: false,
      periodsCount: 1,
      attendanceRecord: record,
      status: record ? record.status : 'unmarked',
      notes: record?.notes,
    };
  });

  // 3. Extra classes added on this date
  const extraRecords = recordsOnDate.filter((r) => r.isExtraClass);
  extraRecords.forEach((extra) => {
    items.push({
      id: extra.id,
      subjectName: extra.subjectName,
      time: extra.time || 'Extra session',
      location: extra.location || 'TBA',
      color: '#ec4899', // Vibrant pink accent for extra classes
      isExtraClass: true,
      periodsCount: extra.periodsCount || 1,
      attendanceRecord: extra,
      status: extra.status,
      notes: extra.notes,
    });
  });

  return items;
}
