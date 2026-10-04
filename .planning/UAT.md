# User Acceptance Testing (UAT) Checklist

## 1. Attendance Tracking Module
- [ ] **Daily Marking**: Open the **Attendance** tab (`/attendance`). Verify today's date is shown with classes populated from schedule.
- [ ] **Quick Status Toggling**: Mark a scheduled class as *Present*, *Absent*, *Cancelled*, or *Holiday*. Check that clicking status updates attendance percentage instantly.
- [ ] **Extra Class**: Click "+ Extra Class". Fill in Subject, Date, Time, Location, and Periods count (e.g. 2 for 2-hour lab). Save and confirm it appears on the attendance list with an "Extra" pill.
- [ ] **Target / Catchup Goals**: Click "Goals & Initial". Enter initial attended/total classes (e.g., semester catch-up). Verify cards update to show how many classes you can safely miss or must attend to keep >=75%.
- [ ] **Dashboard Integration**: Switch to the **Dashboard** tab.
  - Verify the 5th stat card displays **Overall Attendance** percentage and attended/conducted count.
  - Check that clicking the card navigates directly to the Attendance tab.
  - Verify Today's Schedule cards show 1-tap Present / Absent / Cancelled buttons and status indicators.
  - Verify the **Attendance Health** progress bar reflects overall status and highlights any warning below 75%.

## 2. Alarm Sound & Notification Engine
- [ ] Go to **Timer & Alarms** tab.
- [ ] Set an alarm for 1 minute from now.
- [ ] When the alarm triggers, verify the **Alarm Ringing Modal** pops up with the audible chime.
- [ ] Test the **Snooze (+5m)** button and verify it schedules a new alarm 5 minutes later.
- [ ] Test the **Dismiss** button and verify chime stops immediately.

## 3. Data Synchronization & Persistence
- [ ] Refresh the browser tab. Verify all marked attendance records, goals, and alarms persist.
- [ ] In Settings -> Cloud Sync, click "Sync Now" to verify attendance data merges with device and cloud safely.

## 4. Brand & Splash Assets
- [ ] Check `app/public/logo.svg` and `app/public/favicon.svg`. Confirm modern StudyzFlow logo (open progress ring with arrow & checkmark).
- [ ] Inspect `app/android/app/src/main/res/drawable*/splash.png`. Verify Capacitor default blue cross is completely replaced by StudyzFlow branding.
