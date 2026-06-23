importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBfbY9YNKfghT784cNi5oHVJpJ005hYlSY",
  authDomain: "slimmerwoorden.firebaseapp.com",
  projectId: "slimmerwoorden",
  storageBucket: "slimmerwoorden.firebasestorage.app",
  messagingSenderId: "837901820354",
  appId: "1:837901820354:web:827f31e4cb4b172a91765b"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'SlimmerWoorden.nl';
  const options = {
    body: payload.notification?.body || 'Open de app voor het woord van de dag',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'woord-notificatie'
  };
  self.registration.showNotification(title, options);
});

// Handle push events (fallback)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.notification?.title || 'SlimmerWoorden.nl';
    const body = data.notification?.body || 'Open de app voor het woord van de dag';
    const options = {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'woord-notificatie'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Push event error:', e);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
