import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore, Unsubscribe } from 'firebase/firestore';
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

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

// Lazy-loaded module references
let appModulePromise: Promise<typeof import('firebase/app')> | null = null;
let authModulePromise: Promise<typeof import('firebase/auth')> | null = null;
let firestoreModulePromise: Promise<typeof import('firebase/firestore')> | null = null;

function getAppModule() {
  if (!appModulePromise) {
    appModulePromise = import('firebase/app');
  }
  return appModulePromise;
}

function getAuthModule() {
  if (!authModulePromise) {
    authModulePromise = import('firebase/auth');
  }
  return authModulePromise;
}

function getFirestoreModule() {
  if (!firestoreModulePromise) {
    firestoreModulePromise = import('firebase/firestore');
  }
  return firestoreModulePromise;
}

async function getFirebaseServices() {
  if (!firebaseConfigured) return null;
  const [appMod, authMod, firestoreMod] = await Promise.all([
    getAppModule(),
    getAuthModule(),
    getFirestoreModule(),
  ]);

  if (!appInstance) {
    appInstance = appMod.getApps()[0] ?? appMod.initializeApp(firebaseConfig);
    authInstance = authMod.getAuth(appInstance);
    firestoreInstance = firestoreMod.getFirestore(appInstance);
  }

  return {
    app: appInstance,
    auth: authInstance!,
    database: firestoreInstance!,
    authMod,
    firestoreMod,
  };
}

export const subscribeToFirebaseAuth = (listener: (user: FirebaseSyncUser | null) => void) => {
  let unsubscribe: (() => void) | null = null;
  let active = true;

  getFirebaseServices().then((services) => {
    if (!active) return;
    if (!services) {
      listener(null);
      return;
    }
    unsubscribe = services.authMod.onAuthStateChanged(services.auth, (user) => {
      if (active) listener(user ? { uid: user.uid, email: user.email } : null);
    });
  }).catch(() => {
    if (active) listener(null);
  });

  return () => {
    active = false;
    unsubscribe?.();
  };
};

export const signInToFirebase = async (email: string, password: string) => {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase is not configured yet.');
  return services.authMod.signInWithEmailAndPassword(services.auth, email.trim(), password);
};

export const createFirebaseAccount = async (email: string, password: string) => {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase is not configured yet.');
  return services.authMod.createUserWithEmailAndPassword(services.auth, email.trim(), password);
};

export const signOutOfFirebase = async () => {
  const services = await getFirebaseServices();
  if (services) await services.authMod.signOut(services.auth);
};

export const uploadDeviceDataToCloud = async (): Promise<{ success: boolean; message: string }> => {
  const services = await getFirebaseServices();
  if (!services || !services.auth.currentUser) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    // Clear pending sync flag early so immediate snapshot listener echoes don't re-trigger upload
    storage.clearPendingCloudSync();
    const localData = storage.getAllData();
    const { doc, setDoc, serverTimestamp } = services.firestoreMod;
    await setDoc(doc(services.database, 'users', user.uid), {
      ...localData,
      updatedAt: serverTimestamp(),
      updatedBy: storage.getSettings().deviceSyncId,
    });
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    storage.setLastCloudUpload(timestamp);
    return { 
      success: true, 
      message: `Uploaded ${localData.tasks.length} tasks, ${localData.notes.length} notes, and ${localData.schedule.length} classes to cloud at ${timestamp}!` 
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to upload data to cloud.';
    return { success: false, message: msg };
  }
};

export const downloadCloudDataToDevice = async (): Promise<{ success: boolean; message: string }> => {
  const services = await getFirebaseServices();
  if (!services || !services.auth.currentUser) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    const { doc, getDoc } = services.firestoreMod;
    const snapshot = await getDoc(doc(services.database, 'users', user.uid));
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
    const taskCount = Array.isArray(cloudData.tasks) ? cloudData.tasks.length : 0;
    const noteCount = Array.isArray(cloudData.notes) ? cloudData.notes.length : 0;
    const classCount = Array.isArray(cloudData.schedule) ? cloudData.schedule.length : 0;
    return { 
      success: true, 
      message: `Loaded ${taskCount} tasks, ${noteCount} notes, and ${classCount} classes from cloud at ${timestamp}!` 
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to download data from cloud.';
    return { success: false, message: msg };
  }
};

export const wipeCloudData = async (): Promise<{ success: boolean; message: string }> => {
  const services = await getFirebaseServices();
  if (!services || !services.auth.currentUser) {
    return { success: true, message: 'Local data reset (not connected to cloud).' };
  }
  try {
    const user = services.auth.currentUser;
    storage.clearPendingCloudSync();
    const { doc, setDoc, serverTimestamp } = services.firestoreMod;
    await setDoc(doc(services.database, 'users', user.uid), {
      ...storage.getAllData(),
      updatedAt: serverTimestamp(),
      updatedBy: storage.getSettings().deviceSyncId,
    });
    return { success: true, message: 'Cloud backup reset to clean state.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reset cloud backup.';
    return { success: false, message: msg };
  }
};

export const safeMergeCloudAndDevice = async (): Promise<{ success: boolean; message: string }> => {
  const services = await getFirebaseServices();
  if (!services || !services.auth.currentUser) {
    return { success: false, message: 'Please sign in to your cloud account first.' };
  }
  try {
    const user = services.auth.currentUser;
    const { doc, getDoc, setDoc, serverTimestamp } = services.firestoreMod;
    const snapshot = await getDoc(doc(services.database, 'users', user.uid));
    if (snapshot.exists()) {
      storage.mergeAllData(snapshot.data());
    }
    const mergedData = storage.getAllData();
    storage.clearPendingCloudSync();
    await setDoc(doc(services.database, 'users', user.uid), {
      ...mergedData,
      updatedAt: serverTimestamp(),
      updatedBy: storage.getSettings().deviceSyncId,
    });
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    storage.setLastCloudUpload(timestamp);
    storage.setLastCloudDownload(timestamp);
    return { success: true, message: `Merged device and cloud data without erasing anything at ${timestamp}!` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to merge cloud and device data.';
    return { success: false, message: msg };
  }
};

export function startFirebaseRealtimeSync(
  onRemoteData: (data: string) => void,
  onStatus: (status: FirebaseSyncStatus) => void,
) {
  let isCancelled = false;
  let stopAuth: (() => void) | null = null;
  let stopDocument: Unsubscribe | null = null;
  let stopLocalChanges: (() => void) | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  getFirebaseServices().then((services) => {
    if (isCancelled || !services) {
      if (!isCancelled) onStatus('offline');
      return;
    }

    const { auth, database, authMod, firestoreMod } = services;
    const { doc, onSnapshot, setDoc, serverTimestamp } = firestoreMod;

    let applyingRemote = false;
    let isPublishing = false;
    let publishQueued = false;

    const publish = async (uid: string) => {
      if (applyingRemote) return;
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

    stopAuth = authMod.onAuthStateChanged(auth, (user) => {
      stopDocument?.();
      stopLocalChanges?.();
      stopDocument = null;
      stopLocalChanges = null;

      if (!user) {
        onStatus('offline');
        return;
      }

      onStatus('syncing');
      const userDocument = doc(database, 'users', user.uid);
      stopDocument = onSnapshot(userDocument, { includeMetadataChanges: true }, (snapshot) => {
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
  }).catch(() => {
    if (!isCancelled) onStatus('offline');
  });

  return () => {
    isCancelled = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    stopAuth?.();
    stopDocument?.();
    stopLocalChanges?.();
  };
}
