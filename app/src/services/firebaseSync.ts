import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { storage, subscribeToLocalChanges } from './storage';

export type FirebaseSyncStatus = 'synced' | 'syncing' | 'offline';
export type FirebaseSyncUser = Pick<User, 'uid' | 'email'>;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Firestore | null = null;

function getFirebaseServices() {
  if (!firebaseConfigured) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
  }
  return { auth: auth!, database: database! };
}

export const subscribeToFirebaseAuth = (listener: (user: FirebaseSyncUser | null) => void) => {
  const services = getFirebaseServices();
  if (!services) {
    listener(null);
    return () => {};
  }
  return onAuthStateChanged(services.auth, user => listener(user ? { uid: user.uid, email: user.email } : null));
};

export const signInToFirebase = async (email: string, password: string) => {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase is not configured yet.');
  return signInWithEmailAndPassword(services.auth, email.trim(), password);
};

export const createFirebaseAccount = async (email: string, password: string) => {
  const services = getFirebaseServices();
  if (!services) throw new Error('Firebase is not configured yet.');
  return createUserWithEmailAndPassword(services.auth, email.trim(), password);
};

export const signOutOfFirebase = async () => {
  const services = getFirebaseServices();
  if (services) await signOut(services.auth);
};

export const uploadDeviceDataToCloud = async (): Promise<{ success: boolean; message: string }> => {
  const services = getFirebaseServices();
  if (!services || !services.auth.currentUser || !database) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    // Clear pending sync flag early so immediate snapshot listener echoes don't re-trigger upload
    storage.clearPendingCloudSync();
    const localData = storage.getAllData();
    await setDoc(doc(database, 'users', user.uid), {
      ...localData,
      updatedAt: serverTimestamp(),
      updatedBy: storage.getSettings().deviceSyncId,
    });
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    storage.setLastCloudUpload(timestamp);
    return { success: true, message: `Uploaded this device's data to cloud at ${timestamp}!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to upload data to cloud.' };
  }
};

export const downloadCloudDataToDevice = async (): Promise<{ success: boolean; message: string }> => {
  const services = getFirebaseServices();
  if (!services || !services.auth.currentUser || !database) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    const snapshot = await getDoc(doc(database, 'users', user.uid));
    if (!snapshot.exists()) {
      return { success: false, message: 'No cloud backup found for this account yet.' };
    }
    const cloudData = snapshot.data();
    const success = storage.importAllData(JSON.stringify(cloudData));
    if (!success) {
      return { success: false, message: 'Failed to apply cloud data to this device.' };
    }
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    storage.setLastCloudDownload(timestamp);
    storage.clearPendingCloudSync();
    return { success: true, message: `Loaded latest cloud data onto this device at ${timestamp}!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to download data from cloud.' };
  }
};

export const safeMergeCloudAndDevice = async (): Promise<{ success: boolean; message: string }> => {
  const services = getFirebaseServices();
  if (!services || !services.auth.currentUser || !database) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    const snapshot = await getDoc(doc(database, 'users', user.uid));
    if (snapshot.exists()) {
      storage.mergeAllData(snapshot.data());
    }
    const mergedData = storage.getAllData();
    storage.clearPendingCloudSync();
    await setDoc(doc(database, 'users', user.uid), {
      ...mergedData,
      updatedAt: serverTimestamp(),
      updatedBy: storage.getSettings().deviceSyncId,
    });
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    storage.setLastCloudUpload(timestamp);
    storage.setLastCloudDownload(timestamp);
    return { success: true, message: `Merged device and cloud data without erasing anything at ${timestamp}!` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to merge cloud and device data.' };
  }
};

export function startFirebaseRealtimeSync(
  onRemoteData: (data: string) => void,
  onStatus: (status: FirebaseSyncStatus) => void,
) {
  const services = getFirebaseServices();
  if (!services) {
    onStatus('offline');
    return () => {};
  }

  let stopDocument: Unsubscribe | null = null;
  let stopLocalChanges: (() => void) | null = null;
  let applyingRemote = false;
  let isPublishing = false;
  let publishQueued = false;
  let activeUid: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const publish = async (uid: string) => {
    if (!database || applyingRemote) return;
    if (isPublishing) {
      publishQueued = true;
      return;
    }
    isPublishing = true;
    onStatus('syncing');
    try {
      storage.clearPendingCloudSync();
      await setDoc(doc(database, 'users', uid), {
        ...storage.getAllData(),
        updatedAt: serverTimestamp(),
        updatedBy: storage.getSettings().deviceSyncId,
      });
      onStatus('synced');
    } catch {
      onStatus('offline');
    } finally {
      isPublishing = false;
      if (publishQueued) {
        publishQueued = false;
        void publish(uid);
      }
    }
  };

  const schedulePublish = (uid: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void publish(uid);
    }, 600);
  };

  const stopAuth = onAuthStateChanged(services.auth, user => {
    stopDocument?.();
    stopLocalChanges?.();
    stopDocument = null;
    stopLocalChanges = null;

    activeUid = user?.uid ?? null;
    if (!user || !database) {
      onStatus('offline');
      return;
    }

    onStatus('syncing');
    const userDocument = doc(database, 'users', user.uid);
    stopDocument = onSnapshot(userDocument, { includeMetadataChanges: true }, snapshot => {
      // Ignore local optimistic writes so we don't trigger circular sync echo on mobile
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      if (snapshot.exists()) {
        applyingRemote = true;
        storage.mergeAllData(snapshot.data());
        onRemoteData(JSON.stringify(storage.getAllData()));
        storage.clearPendingCloudSync();
        queueMicrotask(() => { applyingRemote = false; });
      }
      onStatus('synced');
    }, () => onStatus('offline'));

    stopLocalChanges = subscribeToLocalChanges(() => {
      if (!applyingRemote) schedulePublish(user.uid);
    });
  });

  const handleOnline = () => {
    if (activeUid) schedulePublish(activeUid);
  };
  window.addEventListener('online', handleOnline);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    stopAuth();
    stopDocument?.();
    stopLocalChanges?.();
    window.removeEventListener('online', handleOnline);
  };
}

