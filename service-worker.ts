/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { checkPeriodicNotifications } from './utils/scheduler';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// 1. Precache Assets (VitePWA handles the manifest generation)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Install & Activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. Periodic Background Sync (Chrome/Android only)
// Note: This relies on the "periodic-background-sync" permission and site engagement score.
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'kimi-pms-notification-sync') {
    event.waitUntil(checkPeriodicNotifications());
  }
});

// 4. Message Handler (Fallback for when app is active or opened)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    checkPeriodicNotifications();
  }
});

// 5. Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Focus the app if open, or open it
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});