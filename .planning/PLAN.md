# Plan: Attendance Tracker, Alarms, Sync & Codebase Cleanup

See detailed artifact at [attendance_and_improvements_plan.md](file:///C:/Users/Admin/.gemini/antigravity-ide/brain/2a6ef702-04ee-49ce-a213-1e40b34b555a/attendance_and_improvements_plan.md).

## Summary
1. **Attendance Tracking Module**:
   - Timetable-linked daily marking (Present, Absent, Cancelled, Holiday).
   - Extra / Makeup classes support (any time, any day, weighted periods for labs).
   - Semester catchup (initial attended/total inputs).
   - 75% target reachability formula ("Can miss X" or "Need to attend Y").
   - Dashboard overall attendance summary widget + Today's Schedule quick-action buttons.
2. **Alarm Sound Engine Fix**:
   - Create Android high-priority notification channel (`studyflow_alarms`) with sound & vibration.
   - Enhance Web Audio chime & loop until dismissed on active screen.
3. **Sync Hardening**:
   - Add attendance records and goals to LocalStorage, 2-Way safe merge, and Firebase Firestore schema.
4. **Cleanup & Bug Fixes**:
   - Delete obsolete `studyflow_*` mockups and root `logo.jpg`.
   - Fix HTML entity parsing in notes (`&amp;` -> `&`).
   - Fix `studzflow` typo in Header.
   - Update README to state clean **Android 13+** support.
