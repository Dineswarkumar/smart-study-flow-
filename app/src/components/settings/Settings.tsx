import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sun, 
  Moon, 
  Palette, 
  RefreshCw, 
  Download, 
  Upload, 
  Smartphone, 
  Laptop,
  CheckCircle2,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  GitMerge,
  ShieldCheck,
  LogIn,
  LogOut,
  Bell,
  BellRing,
  BellOff,
  Send,
  Sparkles,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTestNotification, 
  type NotificationPermission 
} from '../../services/notifications';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    syncStatus, 
    triggerSync, 
    lastSyncTime,
    lastCloudUpload,
    lastCloudDownload,
    uploadToCloud,
    downloadFromCloud,
    safeMergeSync,
    exportData,
    importData,
    firebaseConfigured,
    firebaseUser,
    signIn,
    createAccount,
    signOut,
    resetAllData
  } = useApp();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('prompt');
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [cloudActionMsg, setCloudActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);

  useEffect(() => {
    void getNotificationPermission().then(setNotificationPermission);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    const current = granted ? 'granted' : await getNotificationPermission();
    setNotificationPermission(current);
    updateSettings({ notificationsEnabled: granted });

    if (granted) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      await sendTestNotification();
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 4000);
    }
  };

  const handleSendTestNotification = async () => {
    const sent = await sendTestNotification();
    if (sent) {
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 4000);
    } else {
      alert('Unable to send test notification. Please verify notification permission is allowed in your device settings.');
    }
  };

  const handleCloudAuth = async (create: boolean) => {
    setSyncBusy(true);
    setSyncError(null);
    try {
      if (create) await createAccount(syncEmail, syncPassword);
      else await signIn(syncEmail, syncPassword);
      setSyncPassword('');
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to connect to Firebase.');
    } finally {
      setSyncBusy(false);
    }
  };

  const handleUploadToCloud = async () => {
    setSyncBusy(true);
    setCloudActionMsg(null);
    const res = await uploadToCloud();
    setSyncBusy(false);
    setCloudActionMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadFromCloud = () => {
    setDownloadConfirmOpen(true);
  };

  const executeDownloadFromCloud = async () => {
    setDownloadConfirmOpen(false);
    setSyncBusy(true);
    setCloudActionMsg(null);
    const res = await downloadFromCloud();
    setSyncBusy(false);
    setCloudActionMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const executeResetAllData = async () => {
    setResetBusy(true);
    await resetAllData();
    setResetBusy(false);
    setResetConfirmOpen(false);
    setImportStatus('All app data has been completely wiped and reset to a clean state!');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleSafeMerge = async () => {
    setSyncBusy(true);
    setCloudActionMsg(null);
    const res = await safeMergeSync();
    setSyncBusy(false);
    setCloudActionMsg({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyzflow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        setImportStatus('Data imported successfully! All records updated.');
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } else {
        setImportStatus('Failed to import backup JSON. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const formattedLastSync = lastSyncTime && !isNaN(new Date(lastSyncTime).getTime())
    ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not synced in this session';

  return (
    <div className="settings-page p-3 sm:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* =========================================================================
          1. THEME & VISUAL STYLING (Vibrant Cosmic Indigo & Violet Aurora)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/60 to-white/95 dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 space-y-6 transition-all">
        
        {/* Vibrant Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-500/20 dark:from-indigo-500/20 dark:to-purple-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs border border-indigo-200/60 dark:border-indigo-800/60">
              <Palette className="w-5 h-5" />
            </div>
            <span>Theme & Visual Styling</span>
          </h3>

          <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Palette</span>
          </span>
        </div>

        {/* Dark / Light Mode Options */}
        <div className="space-y-3 relative z-10">
          <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Color Scheme Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateSettings({ themeMode: 'light' })}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 font-black text-sm transition-all ${
                settings.themeMode === 'light'
                  ? 'bg-white text-indigo-700 border-indigo-600 shadow-md shadow-indigo-600/10'
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Theme</span>
            </button>

            <button
              onClick={() => updateSettings({ themeMode: 'dark' })}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 font-black text-sm transition-all ${
                settings.themeMode === 'dark'
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. NOTIFICATIONS & ALERTS (Vibrant Electric Sky & Sapphire Aurora)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-800/60 bg-gradient-to-br from-sky-50/95 via-blue-50/50 to-white/95 dark:from-sky-950/40 dark:via-blue-950/25 dark:to-slate-900/90 shadow-xl shadow-sky-500/5 space-y-6 transition-all">
        
        {/* Vibrant Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-sky-400/25 to-blue-500/20 dark:from-sky-500/20 dark:to-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center shadow-xs border border-sky-200/60 dark:border-sky-800/60">
              <BellRing className="w-5 h-5" />
            </div>
            <span>Notifications & Alerts</span>
          </h3>

          <span className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-1 rounded-full border ${
            notificationPermission === 'granted' && settings.notificationsEnabled
              ? 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
              : notificationPermission === 'denied'
              ? 'bg-rose-100/90 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
              : 'bg-sky-100/80 dark:bg-slate-800 text-sky-700 dark:text-slate-300 border-sky-200 dark:border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              notificationPermission === 'granted' && settings.notificationsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`} />
            {notificationPermission === 'granted' && settings.notificationsEnabled 
              ? 'Active' 
              : notificationPermission === 'denied' 
              ? 'Blocked' 
              : 'Not Enabled'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed relative z-10">
          Stay on top of your study routines with alerts for focus timer completion, scheduled study alarms, and priority academic deadlines.
        </p>

        {testAlertSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-300 relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Test alert sent! Check your notification bar or screen banner.</span>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2.5 relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Notifications are blocked</span>
              Please allow notifications for studyzflow in your device settings or browser permissions, then refresh this page.
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-black text-sm shadow-md shadow-sky-600/25 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 stroke-[2.5]" />
              <span>Enable Notifications</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all border ${
                  settings.notificationsEnabled
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {settings.notificationsEnabled ? <Bell className="w-4 h-4 text-emerald-600" /> : <BellOff className="w-4 h-4" />}
                <span>{settings.notificationsEnabled ? 'Notifications On' : 'Notifications Muted'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestNotification}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/90 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 font-black text-xs transition-all active:scale-95 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. CLOUD SYNC & BACKUP (Vibrant Emerald & Teal Mint Aurora)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/95 via-teal-50/50 to-white/95 dark:from-emerald-950/40 dark:via-teal-950/25 dark:to-slate-900/90 shadow-xl shadow-emerald-500/5 space-y-6 transition-all">
        
        {/* Vibrant Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-500/20 dark:from-emerald-500/20 dark:to-teal-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-xs border border-emerald-200/60 dark:border-emerald-800/60">
              <Cloud className="w-5 h-5" />
            </div>
            <span>Cloud Sync & Backup</span>
          </h3>

          <span className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-1 rounded-full border ${firebaseUser ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
            <span className={`w-2 h-2 rounded-full ${firebaseUser ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            {firebaseUser ? 'Connected to Cloud' : 'Not connected'}
          </span>
        </div>

        {/* Action Status Feedback Message */}
        {cloudActionMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 relative z-10 animate-fade-in ${
              cloudActionMsg.type === 'success'
                ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                : 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
            }`}
          >
            {cloudActionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{cloudActionMsg.text}</span>
          </div>
        )}

        {!firebaseConfigured ? (
          <p className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/50 relative z-10">
            Add the Firebase web configuration to the app environment before enabling cloud sync.
          </p>
        ) : firebaseUser ? (
          <div className="space-y-4 relative z-10">
            {/* Account Info Header */}
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 p-4 border border-emerald-200/80 dark:border-slate-700 shadow-xs">
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">Signed in as</span>
                <span className="block truncate text-sm font-black text-slate-900 dark:text-white">{firebaseUser.email}</span>
              </div>
              <button type="button" onClick={() => void signOut()} className="glass-secondary-button inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black">
                <LogOut className="h-4 w-4" />Sign out
              </button>
            </div>

            {/* THE 2 MASTER ACTION CARDS: UPLOAD VS DOWNLOAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1: Upload from this Device */}
              <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-indigo-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-sm">
                    <CloudUpload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Upload to Cloud</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Pushes this device's notes, tasks, & classes up to the cloud as master backup.
                  </p>
                  <span className="inline-block text-[11px] font-bold text-slate-400">
                    Last uploaded: {lastCloudUpload || 'Not uploaded yet'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handleUploadToCloud}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#4338ca] hover:bg-[#3730a3] active:scale-95 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{syncBusy ? 'Uploading...' : 'Upload Device Data'}</span>
                </button>
              </div>

              {/* Option 2: Download from Cloud */}
              <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-sky-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-sky-400 transition-all">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-black text-sm">
                    <CloudDownload className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <span>Download from Cloud</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Loads the latest cloud backup onto this device (useful when opening a new phone or PC).
                  </p>
                  <span className="inline-block text-[11px] font-bold text-slate-400">
                    Last downloaded: {lastCloudDownload || 'Not downloaded yet'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handleDownloadFromCloud}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-black text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>{syncBusy ? 'Downloading...' : 'Download Cloud Data'}</span>
                </button>
              </div>

            </div>

            {/* Smart 2-Way Merge (Safe Sync) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-100/90 via-teal-100/70 to-emerald-100/90 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                    Safe 2-Way Merge (Zero Data Loss)
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
                    Combines your phone notes created offline with the cloud so nothing is ever erased.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={syncBusy}
                onClick={handleSafeMerge}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Smart Merge Both</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 p-4 border border-emerald-200/60 dark:border-slate-700 shadow-xs relative z-10">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sign in with the same email on Android and PC to back up and sync your notes and tasks across devices.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Email
                <input type="email" value={syncEmail} onChange={event => setSyncEmail(event.target.value)} className="glass-input mt-1" placeholder="student@example.edu" />
              </label>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Password
                <input type="password" value={syncPassword} onChange={event => setSyncPassword(event.target.value)} className="glass-input mt-1" placeholder="••••••••" />
              </label>
            </div>
            {syncError && <p role="alert" className="text-xs font-bold text-rose-600">{syncError}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={syncBusy || !syncEmail || !syncPassword} onClick={() => void handleCloudAuth(false)} className="glass-primary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs disabled:opacity-50">
                <LogIn className="h-4 w-4" />{syncBusy ? 'Connecting...' : 'Sign in'}
              </button>
              <button type="button" disabled={syncBusy || !syncEmail || !syncPassword} onClick={() => void handleCloudAuth(true)} className="glass-secondary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs disabled:opacity-50">
                Create cloud account
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 relative z-10">
          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {formattedLastSync}
          </div>
          <button
            type="button"
            disabled={!firebaseUser || syncStatus === 'syncing'}
            onClick={() => void triggerSync()}
            className="glass-secondary-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs disabled:opacity-50 font-black"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Quick Sync'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. MANUAL DATA BACKUP & RESTORE (Vibrant Amber & Sunset Peach Aurora)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-amber-200/90 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/95 via-orange-50/50 to-white/95 dark:from-amber-950/40 dark:via-orange-950/25 dark:to-slate-900/90 shadow-xl shadow-amber-500/5 space-y-6 transition-all">
        
        {/* Vibrant Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/25 to-orange-500/20 dark:from-amber-500/20 dark:to-orange-500/10 blur-3xl pointer-events-none" />

        <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-xs border border-amber-200/60 dark:border-amber-800/60">
            <Download className="w-5 h-5" />
          </div>
          <span>Manual Data Backup & Restore</span>
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed relative z-10">
          Export an offline JSON snapshot of your entire workspace (classes, assignments, notes, timers, focus logs) or restore from a previously saved file.
        </p>

        {importStatus && (
          <div className="p-4 rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#d97706] hover:bg-[#b45309] text-white font-black text-sm shadow-md shadow-amber-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Backup (.JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-white/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 font-black text-sm cursor-pointer transition-all shadow-xs">
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Import Backup (.JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-rose-600 dark:text-rose-400">Clear All App Data</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Permanently reset all tasks, notes, attendance and timetable to a fresh start.</p>
          </div>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-300/40 dark:border-rose-800/40 font-black text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All App Data</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. PLATFORM & ANDROID INTEGRATION (Vibrant Royal Purple & Orchid Aurora)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-purple-200/90 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/95 via-indigo-50/50 to-white/95 dark:from-purple-950/40 dark:via-indigo-950/25 dark:to-slate-900/90 shadow-xl shadow-purple-500/5 space-y-4 transition-all">
        
        {/* Vibrant Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/25 to-indigo-500/20 dark:from-purple-500/20 dark:to-indigo-500/10 blur-3xl pointer-events-none" />

        <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs border border-purple-200/60 dark:border-purple-800/60">
            <Smartphone className="w-5 h-5" />
          </div>
          <span>Platform & Android Integration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 relative z-10">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm block">Capacitor Android Shell</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Native alarms, local notifications, Android 14–16 edge-to-edge support, and OriginOS 6 theming.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-purple-200/80 dark:border-slate-700 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200/60">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm block">Web Application</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Full offline localStorage support, rich markdown notes, 3D spherical liquid timer, and responsive dashboards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. IN-APP CONFIRMATION MODALS (Native & Mobile Safe - Zero window.confirm)
          ========================================================================= */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl p-6 sm:p-7 border border-rose-300/80 dark:border-rose-900/60 bg-gradient-to-br from-white via-rose-50/50 to-white dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-900 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-headline">
                  Reset All Application Data?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  This will permanently wipe all classes, timetable schedules, attendance records, tasks, study notes, and focus history. If cloud sync is connected, your cloud backup will also be reset to clean.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40 text-[11px] font-bold text-rose-700 dark:text-rose-300">
              ⚠️ Warning: This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={resetBusy}
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetBusy}
                onClick={() => void executeResetAllData()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{resetBusy ? 'Wiping Everything...' : 'Yes, Wipe Everything Clean'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true">
          <div className="relative overflow-hidden w-full max-w-md rounded-3xl p-6 sm:p-7 border border-sky-300/80 dark:border-sky-900/60 bg-gradient-to-br from-white via-sky-50/50 to-white dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                <CloudDownload className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-headline">
                  Download Cloud Backup?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  This will download the latest cloud snapshot and update your local notes, tasks, attendance records, and classes with the cloud version.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDownloadConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeDownloadFromCloud()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md shadow-sky-600/30 active:scale-95 transition-all"
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>Yes, Download Cloud Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
