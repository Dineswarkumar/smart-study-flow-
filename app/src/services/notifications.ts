import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export const ALARM_CHANNEL_ID = 'studyflow_alarms_v1';

export async function ensureNotificationChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'Study Alarms & Focus Timers',
      description: 'Critical loud alarms and timer completion alerts for studyzflow',
      importance: 5, // MAX importance for heads-up display & loud sound
      visibility: 1, // Visible on secure lock screens
      vibration: true,
      lights: true,
      lightColor: '#4338CA',
    });
  } catch (err) {
    console.warn('Could not register notification channel:', err);
  }
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'prompt';
    }

    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission === 'default' ? 'prompt' : Notification.permission;
  } catch {
    return 'unsupported';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await ensureNotificationChannels();
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }

    if (typeof Notification === 'undefined') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  const permission = await getNotificationPermission();
  if (permission !== 'granted') return false;

  try {
    if (Capacitor.isNativePlatform()) {
      await ensureNotificationChannels();
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000) + 1,
          title: 'studyzflow Notifications Active! 🎓',
          body: 'You will receive loud alerts for focus timers and study alarms.',
          channelId: ALARM_CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 400) },
        }],
      });
      return true;
    }

    if (typeof Notification !== 'undefined') {
      new Notification('studyzflow Notifications Active! 🎓', {
        body: 'You will receive loud alerts for focus timers and study alarms.',
        icon: '/favicon.svg',
      });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function notifyTimerComplete(subject: string): Promise<void> {
  if (Capacitor.isNativePlatform()) return;
  const permission = await getNotificationPermission();
  if (permission !== 'granted') return;

  try {
    new Notification('Focus session complete! 🎓', {
      body: `${subject} focus time is finished. Take a well-deserved break!`,
      icon: '/favicon.svg',
      tag: 'studyflow-timer',
    });
  } catch {
    // Notification support can be unavailable in restricted webviews.
  }
}

export async function scheduleTimerNotification(id: number, subject: string, seconds: number): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || (await getNotificationPermission()) !== 'granted') return false;

  try {
    await ensureNotificationChannels();
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: 'Focus session complete! 🎓',
        body: `${subject} focus time is finished. Take a break!`,
        channelId: ALARM_CHANNEL_ID,
        schedule: { at: new Date(Date.now() + Math.max(1, seconds) * 1000) },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelTimerNotification(id: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    // The notification may already have fired or been dismissed.
  }
}

const alarmNotificationId = (alarmId: string) => Math.abs([...alarmId].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7)) % 2147483647;

export async function scheduleAlarmNotification(alarmId: string, label: string, time: string, repeat: 'once' | 'daily'): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || (await getNotificationPermission()) !== 'granted') return false;
  const [hour, minute] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  try {
    await ensureNotificationChannels();
    await LocalNotifications.schedule({
      notifications: [{
        id: alarmNotificationId(alarmId),
        title: label || 'studyzflow alarm',
        body: 'Your scheduled study alarm is ringing!',
        channelId: ALARM_CHANNEL_ID,
        schedule: repeat === 'daily' ? { on: { hour, minute } } : { at: next },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelAlarmNotification(alarmId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: alarmNotificationId(alarmId) }] });
  } catch {
    /* already cleared */
  }
}

/**
 * Rich Web Audio alarm chime that loops until stopped by the student.
 * Scales with user's configured volume (0 - 100).
 */
export function playRichAlarmChime(volume: number = 80): { stop: () => void } {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return { stop: () => {} };
    const ctx = new AudioCtx();
    const gainVal = Math.max(0.15, Math.min(1.0, (volume || 80) / 100));
    let isStopped = false;

    const playNotes = () => {
      if (isStopped || ctx.state === 'closed') return;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      // High-visibility harmonic chord sequence
      const chords = [
        [587.33, 880.00],   // D5 + A5
        [659.25, 987.77],   // E5 + B5
        [783.99, 1174.66],  // G5 + D6
        [1046.50, 1567.98], // C6 + G6
      ];
      chords.forEach(([f1, f2], idx) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const masterGain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.value = f1;
        osc2.frequency.value = f2;

        masterGain.gain.setValueAtTime(gainVal * 0.75, now + idx * 0.18);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.85);

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start(now + idx * 0.18);
        osc2.start(now + idx * 0.18);
        osc1.stop(now + idx * 0.18 + 0.85);
        osc2.stop(now + idx * 0.18 + 0.85);
      });
    };

    playNotes();
    const interval = setInterval(playNotes, 2200);

    return {
      stop: () => {
        isStopped = true;
        clearInterval(interval);
        setTimeout(() => {
          try {
            void ctx.close();
          } catch {}
        }, 1000);
      }
    };
  } catch {
    return { stop: () => {} };
  }
}
