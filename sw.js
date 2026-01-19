// sw.js - Service Worker for Study Ping v1.5

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            // Otherwise open new window
            return clients.openWindow('./');
        })
    );
});

// Listen for Push events
self.addEventListener('push', (event) => {
    if (event.data) {
        // Fallback if data structure varies, but usually we just show title/body
        const data = event.data.json ? event.data.json() : { title: 'Study Ping', body: 'Time to study!' };
        self.registration.showNotification(data.title || 'Study Ping', {
            body: data.body || 'You have a task due!',
            icon: 'icon-192.png', 
            vibrate: [200, 100, 200]
        });
    }
});