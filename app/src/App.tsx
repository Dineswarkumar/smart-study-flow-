import React, { Suspense, lazy, useState, useCallback, useRef, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from './components/layout/SplashScreen';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AlarmRingingModal } from './components/timer/AlarmRingingModal';

const named = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, name: T) =>
  lazy(() => loader().then(m => ({ default: m[name] })));

const Dashboard = named(() => import('./components/dashboard/Dashboard'), 'Dashboard');
const NotesAndTasks = named(() => import('./components/notes/NotesAndTasks'), 'NotesAndTasks');
const AcademicScheduleAndAttendance = named(
  () => import('./components/academics/AcademicScheduleAndAttendance'),
  'AcademicScheduleAndAttendance'
);
const TimerAndAlarm = named(() => import('./components/timer/TimerAndAlarm'), 'TimerAndAlarm');
const Profile = named(() => import('./components/profile/Profile'), 'Profile');
const Settings = named(() => import('./components/settings/Settings'), 'Settings');

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen } = useApp();

  const activeTabRef = useRef(activeTab);
  const mobileMenuOpenRef = useRef(mobileMenuOpen);

  useEffect(() => {
    activeTabRef.current = activeTab;
    mobileMenuOpenRef.current = mobileMenuOpen;
  }, [activeTab, mobileMenuOpen]);

  // =========================================================================
  // HARDWARE BACK BUTTON & BROWSER NAVIGATION LOGIC:
  // 1. If mobile menu drawer is open -> dismiss it
  // 2. If on any other tab -> return to dashboard first
  // 3. If already on dashboard -> close the app
  // =========================================================================
  useEffect(() => {
    let removeBackListener: (() => void) | null = null;

    const registerBackButton = async () => {
      try {
        const handle = await CapApp.addListener('backButton', () => {
          // If drawer is open, close it
          if (mobileMenuOpenRef.current) {
            setMobileMenuOpen(false);
            return;
          }

          // If on another tab, navigate back to dashboard
          if (activeTabRef.current !== 'dashboard') {
            setActiveTab('dashboard');
            return;
          }

          // If on dashboard, exit app
          CapApp.exitApp();
        });

        removeBackListener = () => {
          handle.remove();
        };
      } catch (err) {
        console.warn('Capacitor App backButton listener registration:', err);
      }
    };

    registerBackButton();

    // Browser popstate back button support
    const handlePopState = () => {
      if (activeTabRef.current !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (removeBackListener) {
        removeBackListener();
      }
    };
  }, [setActiveTab, setMobileMenuOpen]);

  // Synchronize history state for browser back/forward navigation
  useEffect(() => {
    if (activeTab !== 'dashboard') {
      window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    }
  }, [activeTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'attendance':
      case 'schedule':
        return <AcademicScheduleAndAttendance />;
      case 'notes':
      case 'tasks':
        return <NotesAndTasks />;
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

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-bg text-text-main transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full lg:ml-72 min-w-0">
        <Header />
        
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 lg:pb-8">
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
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);
  return (
    <AppProvider>
      <MainContent />
      {showSplash && <SplashScreen onDone={hideSplash} />}
    </AppProvider>
  );
}

export default App;
