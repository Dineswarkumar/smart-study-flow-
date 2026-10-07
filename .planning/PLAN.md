# StudyzFlow Implementation Plan

## Architectural & Feature Milestones

1. **Attendance Tracking Module**:
   - Timetable-linked daily marking (Present, Absent, Cancelled, Holiday).
   - Extra / Makeup classes support (any time, any day, weighted periods for labs).
   - Semester catchup (initial attended/total inputs).
   - 75% target reachability formula ("Can miss X" or "Need to attend Y").
   - Dashboard overall attendance summary widget + Today's Schedule quick-action buttons.

2. **Alarm Sound Engine**:
   - Android high-priority notification channel (`studyflow_alarms_v1`) with sound & vibration.
   - Enhanced Web Audio harmonic chime loop until dismissed on active screen.

3. **Storage & Cloud Sync Hardening**:
   - Attendance records and goals in LocalStorage with 2-way safe merge.
   - Firebase Firestore multi-device synchronization with atomic wipes on reset.

4. **Security, Testing & Performance Sprint**:
   - Root error boundary for resilient runtime failure recovery.
   - HTML sanitization using DOMPurify on note exports and workspace import.
   - Vitest unit testing suite for attendance calculations and edge cases.
   - Continuous Integration (CI) pipeline via GitHub Actions.
   - Dynamic lazy-loading of Firebase authentication and Firestore SDKs.
   - Consolidated `useReducer` state management in AppContext.
