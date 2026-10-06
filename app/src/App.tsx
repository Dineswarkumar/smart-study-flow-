import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AlarmRingingModal } from './components/timer/AlarmRingingModal';

const named = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, name: T) =>
  lazy(() => loader().then(m => ({ default: m[name] })));

const Dashboard = named(() => import('./components/dashboard/Dashboard'), 'Dashboard');
const NotesAndTasks = named(() => import('./components/notes/NotesAndTasks'), 'NotesAndTasks');
const Schedule = named(() => import('./components/schedule/Schedule'), 'Schedule');
const TimerAndAlarm = named(() => import('./components/timer/TimerAndAlarm'), 'TimerAndAlarm');
const Profile = named(() => import('./components/profile/Profile'), 'Profile');
const Settings = named(() => import('./components/settings/Settings'), 'Settings');
const Attendance = named(() => import('./components/attendance/Attendance'), 'Attendance');

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'attendance':
        return <Attendance />;
      case 'notes':
      case 'tasks':
        return <NotesAndTasks />;
      case 'schedule':
        return <Schedule />;
      case 'timer':
        return <TimerAndAlarm />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-bg text-text-main transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full lg:ml-72 min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Global Alarm Sound & Notification Modal */}
      <AlarmRingingModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
