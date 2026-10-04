import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { NotesAndTasks } from './components/notes/NotesAndTasks';
import { Schedule } from './components/schedule/Schedule';
import { TimerAndAlarm } from './components/timer/TimerAndAlarm';
import { Profile } from './components/profile/Profile';
import { Settings } from './components/settings/Settings';
import { Attendance } from './components/attendance/Attendance';
import { AlarmRingingModal } from './components/timer/AlarmRingingModal';

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
          {renderActiveView()}
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
