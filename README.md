<p align="center">
  <img src="app/public/logo.svg" alt="studyzflow logo" width="120" />
</p>

# studyzflow 🎓⚡

**studyzflow** is an intelligent, modern academic productivity suite built with React 19, TypeScript, Tailwind CSS, and Capacitor for Android (Android 13+) and Web.

🌐 **Live Web App:** [smart-study-flow-7bbb.vercel.app](https://smart-study-flow-nu.vercel.app/)

---

## 📸 Screenshots

### 🖥️ Web (Desktop)

<p align="center">
  <img src="docs/screenshots/dashboard-desktop.png" alt="Dashboard – Academic Command Center" width="100%" />
  <br/><sub><b>Dashboard</b> — today's classes, priority tasks, streak &amp; GPA at a glance</sub>
</p>

<table>
  <tr>
    <td width="50%" align="center">
      <img src="docs/screenshots/timetable-desktop.png" alt="Weekly Timetable" />
      <br/><sub><b>Weekly Timetable</b> — manual add or AI scan</sub>
    </td>
    <td width="50%" align="center">
      <img src="docs/screenshots/notes-desktop.png" alt="Tasks and Notes" />
      <br/><sub><b>Tasks &amp; Notes</b> — tags, pins &amp; importance filters</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/screenshots/settings-desktop.png" alt="Settings and Backup" width="75%" />
      <br/><sub><b>Settings &amp; Backup</b> — notifications, cloud sync, JSON export/import</sub>
    </td>
  </tr>
</table>

### 📱 Android

<p align="center">
  <img src="docs/screenshots/dashboard-mobile.png" alt="Mobile Dashboard" width="300" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/timer-mobile.png" alt="Mobile Focus Timer" width="300" />
  <br/><sub><b>Dashboard</b> &nbsp;•&nbsp; <b>3D Liquid Focus Timer</b></sub>
</p>

---

## ✨ Phase 5 Highlights & Key Features

### 1. 🎓 Daily Attendance Tracker & 75% Target Analytics
- **Timetable-Linked Daily Marking**: Mark scheduled lectures with one tap as **Present**, **Absent**, **Cancelled**, or **Holiday**.
- **Teacher Cancellations Don't Penalize You**: Cancelled classes and holidays are automatically excluded from the denominator.
- **Extra & Makeup Classes**: Support for unscheduled lectures or weekend makeup sessions with **Periods Multipliers** (e.g. 2-hour or 3-hour practical labs).
- **75% Minimum Reachability Formula**: Real-time mathematical guidance telling you exactly how many upcoming classes you can safely miss, or how many you must attend to regain 75% exam eligibility.
- **Mid-Semester Catchup Mode**: Enter past attendance counts (`Attended / Total`) to seamlessly sync with existing university ERP portals.

### 2. 📊 Academic Dashboard Integration
- **5th Metric Card**: Real-time overall attendance percentage and attended/conducted counts in the top Aurora stat row.
- **1-Tap Schedule Quick-Marking**: Mark today's classes directly from the Dashboard schedule with celebratory confetti.
- **Attendance Health Monitor**: Live progress bar with a 75% requirement tick marker and instant risk alerts.

### 3. ⏰ Loud Alarms & Android Notification Channels
- **High-Priority Android Channel**: Configured `studyflow_alarms_v1` with max importance (5), custom vibration, and sound.
- **Rich Harmonic Audio Engine**: Multi-tone Web Audio chime loop that rings continuously until dismissed.
- **Foreground Ringing Modal**: Global popup with animated ringing bell, audio chime, **Snooze (+5m)**, and **Dismiss**.

### 4. 🔮 3D Draining Spherical Liquid Glass Timer
- **Realistic Physics & Depletion**: The 3D liquid sphere starts **100% full** and smoothly drains down to **0% (empty)** as the countdown completes.
- **Convex Glass Aesthetics**: Specular highlights, depth rings, rim lighting, glare arcs, and animated rising bubbles.
- **Color Themes**: Electric Indigo, Sunset Orange, Emerald Focus, Rose Bloom, and Cosmic Violet presets.

### 5. 🎨 Custom Branding & Native Splash Screens
- **Modern StudyzFlow Vector Logo**: Custom open progress ring, flow arrow, and checkmark replacing the template Capacitor icon.
- **11 High-Res Android Splash Screens**: Custom obsidian slate splash screens for all phone and tablet screen densities.
- **AAPT2 Adaptive Icons**: Material You dynamic theming and universal vector compatibility.

### 6. 📝 Tasks & Full-Page Rich Note Editor
- **Date & Time Tracking**: Tasks support due dates with specific due times (e.g. `Aug 25, 2026 at 5:00 PM`).
- **Enlarged Formatting Toolbar**: High-contrast controls for Bold, Italic, Headings, Quotes, Code, Alignment, Lists, Tables, and Checklists.
- **Subtasks & Categorization**: Subtasks with progress bars, priority flags (Important / General), and tag filtering.

### 7. ☁️ Real-time Cloud Sync & Offline-First
- **Firebase Auth & Firestore**: Multi-device live synchronization between PC and Android.
- **Offline Storage**: Full localStorage fallback with automatic sync replay on reconnection.
- **JSON Backup**: One-click encrypted JSON workspace export and import.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Effects** | Tailwind CSS, Custom 3D Glassmorphism CSS |
| **Mobile Runtime** | Capacitor 8 (Android 13+, API 33+) |
| **Cloud Backend** | Firebase Auth (Email/Password), Cloud Firestore |
| **Notifications** | `@capacitor/local-notifications`, Web Notifications API |
| **Icons & Visuals** | Lucide React, Canvas Confetti |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or newer
- **npm**: v10 or newer
- **Android Studio**: Ladybug / Jellyfish with Java 17 (for Android builds)

### 2. Run the Web Application
```bash
# Clone the repository
git clone https://github.com/Dineswarkumar/smart-study-flow-.git
cd smart-study-flow-

# Navigate into app and install dependencies
cd app
npm install

# Start Vite development server
npm run dev
```

### 3. Firebase Configuration
Copy `app/.env.example` to `app/.env` and supply your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Publish Firestore rules from [`firestore.rules`](./firestore.rules) in the Firebase console.

---

## 📱 Building & Installing on Android

```bash
# From the /app directory
npm run build
npx cap sync android
```

1. Open `app/android` in **Android Studio**.
2. Ensure Gradle JDK is configured to **Java 17** (`Settings → Build Tools → Gradle → Gradle JDK`).
3. Connect your Android device with USB debugging enabled.
4. Click **Run** (`Shift + F10`) to build and deploy **studyzflow** directly to your phone.

---

## 📋 Useful Commands

```bash
cd app
npm run dev           # Start Vite hot-reload server
npm run build         # Type-check and build production assets
npx cap sync android  # Sync web build and plugins to Android
```

---

## 📄 License
MIT License. Created for students and lifelong learners.
