import { ProfileData } from '../types';

const DB_NAME = 'kimi-offline-db';
const DB_VERSION = 1;

export interface KimiNotificationHistory {
  id?: number;
  type: 'LOGIN' | 'PRE_PERIOD_7' | 'PRE_PERIOD_4' | 'MOOD_SUPPORT';
  timestamp: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for active profile data (synced from localStorage)
      if (!db.objectStoreNames.contains('activeProfile')) {
        db.createObjectStore('activeProfile', { keyPath: 'id' });
      }

      // Store for notification history to prevent spam
      if (!db.objectStoreNames.contains('notificationHistory')) {
        db.createObjectStore('notificationHistory', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const syncProfileToIDB = async (profileData: ProfileData) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('activeProfile', 'readwrite');
    const store = tx.objectStore('activeProfile');
    // We use a fixed ID 'current' because the SW just needs to know who is active right now
    store.put({ id: 'current', ...profileData });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getProfileFromIDB = async (): Promise<ProfileData | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeProfile', 'readonly');
    const store = tx.objectStore('activeProfile');
    const request = store.get('current');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const logNotificationSent = async (type: KimiNotificationHistory['type']) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('notificationHistory', 'readwrite');
    const store = tx.objectStore('notificationHistory');
    store.add({ type, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getLastNotification = async (type: KimiNotificationHistory['type']): Promise<number | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notificationHistory', 'readonly');
    const store = tx.objectStore('notificationHistory');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const all = request.result as KimiNotificationHistory[];
      const filtered = all.filter(n => n.type === type).sort((a, b) => b.timestamp - a.timestamp);
      resolve(filtered.length > 0 ? filtered[0].timestamp : null);
    };
    request.onerror = () => reject(request.error);
  });
};
