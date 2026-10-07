import { describe, it, expect } from 'vitest';
import {
  getAllSubjectNames,
  calculateSubjectAttendance,
  calculateOverallAttendance,
  getClassesForDate,
} from '../attendance';
import type { ClassSchedule, AttendanceRecord, SubjectAttendanceGoal } from '../../types';

describe('attendance service', () => {
  const mockSchedule: ClassSchedule[] = [
    {
      id: 'sched-1',
      subjectName: 'Mathematics',
      code: 'MATH101',
      instructor: 'Dr. Euler',
      location: 'Hall A',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      color: '#6366f1',
    },
    {
      id: 'sched-2',
      subjectName: 'Physics',
      code: 'PHYS101',
      instructor: 'Dr. Newton',
      location: 'Lab 2',
      dayOfWeek: 'Monday',
      startTime: '10:15',
      endTime: '11:15',
      color: '#ec4899',
    },
  ];

  describe('getAllSubjectNames', () => {
    it('returns unique trimmed subject names from schedule, attendance, and goals', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-05',
          subjectName: 'Chemistry',
          isExtraClass: true,
          status: 'present',
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const goals: SubjectAttendanceGoal[] = [
        {
          subjectName: 'Mathematics',
          targetPercentage: 80,
          initialAttended: 10,
          initialTotal: 12,
        },
        {
          subjectName: 'Computer Science',
          targetPercentage: 75,
          initialAttended: 5,
          initialTotal: 6,
        },
      ];

      const names = getAllSubjectNames(mockSchedule, attendance, goals);
      expect(names).toHaveLength(4);
      expect(names).toContain('Mathematics');
      expect(names).toContain('Physics');
      expect(names).toContain('Chemistry');
      expect(names).toContain('Computer Science');
    });

    it('handles empty inputs gracefully', () => {
      expect(getAllSubjectNames([], [], [])).toEqual([]);
    });

    it('filters out empty or whitespace-only subject names', () => {
      const scheduleWithEmpty = [
        ...mockSchedule,
        {
          id: 'sched-empty',
          subjectName: '   ',
          instructor: 'TBA',
          location: 'TBA',
          dayOfWeek: 'Tuesday' as const,
          startTime: '09:00',
          endTime: '10:00',
          color: '#6366f1',
        },
      ];
      const names = getAllSubjectNames(scheduleWithEmpty, [], []);
      expect(names).toEqual(['Mathematics', 'Physics']);
    });
  });

  describe('calculateSubjectAttendance', () => {
    it('returns 100% and safe status when no classes have occurred yet', () => {
      const summary = calculateSubjectAttendance('Mathematics', mockSchedule, [], []);
      expect(summary.totalPeriods).toBe(0);
      expect(summary.attendedPeriods).toBe(0);
      expect(summary.percentage).toBe(100);
      expect(summary.status).toBe('safe');
      expect(summary.safeToMiss).toBe(0);
      expect(summary.neededToAttend).toBe(0);
    });

    it('calculates accurate percentages with present and absent records', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-01',
          subjectName: 'Mathematics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-2',
          date: '2026-10-02',
          subjectName: 'Mathematics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-3',
          date: '2026-10-03',
          subjectName: 'Mathematics',
          status: 'absent',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-4',
          date: '2026-10-04',
          subjectName: 'Mathematics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ];

      // 3 present, 1 absent -> 3/4 = 75%
      const summary = calculateSubjectAttendance('Mathematics', mockSchedule, attendance, []);
      expect(summary.attendedPeriods).toBe(3);
      expect(summary.absentPeriods).toBe(1);
      expect(summary.totalPeriods).toBe(4);
      expect(summary.percentage).toBe(75);
      expect(summary.status).toBe('safe');
      expect(summary.safeToMiss).toBe(0);
      expect(summary.neededToAttend).toBe(0);
    });

    it('correctly calculates safeToMiss when attendance exceeds target (75%)', () => {
      // 8 present, 0 absent out of 8 total -> 100%
      // At 75% target: floor((8 - 0.75 * 8) / 0.75) = floor((8 - 6) / 0.75) = floor(2 / 0.75) = floor(2.66) = 2 safe to miss
      const attendance: AttendanceRecord[] = Array.from({ length: 8 }, (_, i) => ({
        id: `att-${i}`,
        date: `2026-10-0${i + 1}`,
        subjectName: 'Mathematics',
        status: 'present',
        isExtraClass: false,
        periodsCount: 1,
        createdAt: new Date().toISOString(),
      }));

      const summary = calculateSubjectAttendance('Mathematics', mockSchedule, attendance, []);
      expect(summary.percentage).toBe(100);
      expect(summary.safeToMiss).toBe(2);
      expect(summary.neededToAttend).toBe(0);
    });

    it('correctly calculates neededToAttend when attendance falls below target', () => {
      // 1 present, 3 absent out of 4 -> 25% (target 75%)
      // Needed formula: ceil((0.75 * 4 - 1) / (1 - 0.75)) = ceil((3 - 1) / 0.25) = ceil(2 / 0.25) = 8
      // Verification: if attends next 8 classes -> 1 + 8 = 9 present out of 4 + 8 = 12 total -> 9/12 = 75%
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-01',
          subjectName: 'Physics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `att-abs-${i}`,
          date: `2026-10-0${i + 2}`,
          subjectName: 'Physics',
          status: 'absent' as const,
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        })),
      ];

      const summary = calculateSubjectAttendance('Physics', mockSchedule, attendance, []);
      expect(summary.percentage).toBe(25);
      expect(summary.neededToAttend).toBe(8);
      expect(summary.safeToMiss).toBe(0);
      expect(summary.status).toBe('critical');
    });

    it('does not penalize student for cancelled classes or official holidays', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-01',
          subjectName: 'Mathematics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-2',
          date: '2026-10-02',
          subjectName: 'Mathematics',
          status: 'cancelled',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-3',
          date: '2026-10-03',
          subjectName: 'Mathematics',
          status: 'holiday',
          isExtraClass: false,
          periodsCount: 2,
          createdAt: new Date().toISOString(),
        },
      ];

      const summary = calculateSubjectAttendance('Mathematics', mockSchedule, attendance, []);
      expect(summary.attendedPeriods).toBe(1);
      expect(summary.absentPeriods).toBe(0);
      expect(summary.cancelledPeriods).toBe(3);
      expect(summary.totalPeriods).toBe(1);
      expect(summary.percentage).toBe(100);
    });

    it('respects weighted periods count for multi-hour practical labs', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-lab-1',
          date: '2026-10-01',
          subjectName: 'Physics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 3, // 3-hour lab attended
          createdAt: new Date().toISOString(),
        },
        {
          id: 'att-lab-2',
          date: '2026-10-02',
          subjectName: 'Physics',
          status: 'absent',
          isExtraClass: false,
          periodsCount: 2, // 2-hour lab missed
          createdAt: new Date().toISOString(),
        },
      ];

      // 3 attended, 2 absent -> 3/5 = 60% (less than target 75% - 10 = 65% -> critical)
      const summary = calculateSubjectAttendance('Physics', mockSchedule, attendance, []);
      expect(summary.attendedPeriods).toBe(3);
      expect(summary.absentPeriods).toBe(2);
      expect(summary.totalPeriods).toBe(5);
      expect(summary.percentage).toBe(60);
      expect(summary.status).toBe('critical');
    });

    it('assigns warning status when percentage is within 10% of target', () => {
      // 7 attended out of 10 -> 70% (target 75%, 70% >= 65% -> warning)
      const attendance: AttendanceRecord[] = [
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `att-w-${i}`,
          date: `2026-10-0${i + 1}`,
          subjectName: 'Physics',
          status: 'present' as const,
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `att-wa-${i}`,
          date: `2026-10-1${i + 1}`,
          subjectName: 'Physics',
          status: 'absent' as const,
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        })),
      ];

      const summary = calculateSubjectAttendance('Physics', mockSchedule, attendance, []);
      expect(summary.percentage).toBe(70);
      expect(summary.status).toBe('warning');
    });

    it('seamlessly integrates historical catchup goals', () => {
      const goals: SubjectAttendanceGoal[] = [
        {
          subjectName: 'Mathematics',
          targetPercentage: 80,
          initialAttended: 18,
          initialTotal: 20, // 90% previously
        },
      ];
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-05',
          subjectName: 'Mathematics',
          status: 'absent',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ];

      // 18 attended out of 21 total -> 18/21 = 85.7%
      const summary = calculateSubjectAttendance('Mathematics', mockSchedule, attendance, goals);
      expect(summary.initialAttended).toBe(18);
      expect(summary.initialTotal).toBe(20);
      expect(summary.attendedPeriods).toBe(18);
      expect(summary.absentPeriods).toBe(3); // (20-18) + 1 = 3
      expect(summary.totalPeriods).toBe(21);
      expect(summary.targetPercentage).toBe(80);
      expect(summary.percentage).toBe(85.7);
      expect(summary.status).toBe('safe');
    });

    describe('illegal and edge inputs', () => {
      it('clamps illegal initialAttended > initialTotal in goals', () => {
        const goals: SubjectAttendanceGoal[] = [
          {
            subjectName: 'Mathematics',
            targetPercentage: 75,
            initialAttended: 15,
            initialTotal: 10, // Illegal: attended > total
          },
        ];
        const summary = calculateSubjectAttendance('Mathematics', mockSchedule, [], goals);
        expect(summary.initialAttended).toBe(15);
        expect(summary.initialTotal).toBe(15); // Auto-clamped
        expect(summary.absentPeriods).toBe(0);
        expect(summary.percentage).toBe(100);
      });

      it('clamps negative initial counts to zero', () => {
        const goals: SubjectAttendanceGoal[] = [
          {
            subjectName: 'Mathematics',
            targetPercentage: 75,
            initialAttended: -5,
            initialTotal: -10,
          },
        ];
        const summary = calculateSubjectAttendance('Mathematics', mockSchedule, [], goals);
        expect(summary.initialAttended).toBe(0);
        expect(summary.initialTotal).toBe(0);
        expect(summary.totalPeriods).toBe(0);
        expect(summary.percentage).toBe(100);
      });

      it('handles periodsCount <= 0 by falling back to minimum weight 1', () => {
        const attendance: AttendanceRecord[] = [
          {
            id: 'att-1',
            date: '2026-10-01',
            subjectName: 'Mathematics',
            status: 'present',
            isExtraClass: false,
            periodsCount: -2, // Illegal
            createdAt: new Date().toISOString(),
          },
          {
            id: 'att-2',
            date: '2026-10-02',
            subjectName: 'Mathematics',
            status: 'absent',
            isExtraClass: false,
            periodsCount: 0, // Illegal
            createdAt: new Date().toISOString(),
          },
        ];
        const summary = calculateSubjectAttendance('Mathematics', mockSchedule, attendance, []);
        expect(summary.attendedPeriods).toBe(1);
        expect(summary.absentPeriods).toBe(1);
        expect(summary.totalPeriods).toBe(2);
        expect(summary.percentage).toBe(50);
      });

      it('handles case-insensitive and trimmed subject matching', () => {
        const attendance: AttendanceRecord[] = [
          {
            id: 'att-1',
            date: '2026-10-01',
            subjectName: '  mathematics  ',
            status: 'present',
            isExtraClass: false,
            periodsCount: 1,
            createdAt: new Date().toISOString(),
          },
        ];
        const summary = calculateSubjectAttendance('MATHEMATICS', mockSchedule, attendance, []);
        expect(summary.attendedPeriods).toBe(1);
        expect(summary.totalPeriods).toBe(1);
      });
    });
  });

  describe('calculateOverallAttendance', () => {
    it('returns default 100% when no subjects exist', () => {
      const overall = calculateOverallAttendance([], [], []);
      expect(overall.totalAttended).toBe(0);
      expect(overall.totalConducted).toBe(0);
      expect(overall.percentage).toBe(100);
      expect(overall.atRiskSubjectsCount).toBe(0);
      expect(overall.totalSubjects).toBe(0);
    });

    it('correctly aggregates statistics across multiple subjects and counts at-risk courses', () => {
      const attendance: AttendanceRecord[] = [
        // Mathematics: 4 present out of 4 (100% - safe)
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `math-${i}`,
          date: '2026-10-01',
          subjectName: 'Mathematics',
          status: 'present' as const,
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        })),
        // Physics: 1 present, 3 absent (25% - at risk)
        {
          id: 'phys-1',
          date: '2026-10-01',
          subjectName: 'Physics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `phys-abs-${i}`,
          date: '2026-10-01',
          subjectName: 'Physics',
          status: 'absent' as const,
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        })),
      ];

      // Total attended: 4 + 1 = 5
      // Total conducted: 4 + 4 = 8
      // Percentage: 5/8 = 62.5%
      // At-risk: Physics (< 75%)
      const overall = calculateOverallAttendance(mockSchedule, attendance, []);
      expect(overall.totalAttended).toBe(5);
      expect(overall.totalConducted).toBe(8);
      expect(overall.percentage).toBe(62.5);
      expect(overall.atRiskSubjectsCount).toBe(1);
      expect(overall.totalSubjects).toBe(2);
    });
  });

  describe('getClassesForDate', () => {
    it('returns timetable classes scheduled on that day with unmarked status by default', () => {
      // 2026-10-05 was a Monday
      const items = getClassesForDate('2026-10-05', mockSchedule, []);
      expect(items).toHaveLength(2);
      expect(items[0].subjectName).toBe('Mathematics');
      expect(items[0].status).toBe('unmarked');
      expect(items[0].isExtraClass).toBe(false);
      expect(items[1].subjectName).toBe('Physics');
      expect(items[1].status).toBe('unmarked');
    });

    it('attaches logged attendance records to scheduled classes', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          date: '2026-10-05',
          scheduleId: 'sched-1',
          subjectName: 'Mathematics',
          status: 'present',
          isExtraClass: false,
          periodsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ];

      const items = getClassesForDate('2026-10-05', mockSchedule, attendance);
      expect(items[0].status).toBe('present');
      expect(items[0].attendanceRecord?.id).toBe('att-1');
      expect(items[1].status).toBe('unmarked');
    });

    it('includes extra/makeup classes logged on that date', () => {
      const attendance: AttendanceRecord[] = [
        {
          id: 'extra-1',
          date: '2026-10-05',
          subjectName: 'Chemistry Lab',
          status: 'present',
          isExtraClass: true,
          periodsCount: 2,
          time: '14:00 - 16:00',
          location: 'Lab 3',
          notes: 'Special Makeup Lab',
          createdAt: new Date().toISOString(),
        },
      ];

      const items = getClassesForDate('2026-10-05', mockSchedule, attendance);
      expect(items).toHaveLength(3);
      const extraItem = items.find((i) => i.isExtraClass);
      expect(extraItem).toBeDefined();
      expect(extraItem?.subjectName).toBe('Chemistry Lab');
      expect(extraItem?.periodsCount).toBe(2);
      expect(extraItem?.status).toBe('present');
      expect(extraItem?.notes).toBe('Special Makeup Lab');
    });
  });
});
