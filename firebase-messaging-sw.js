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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'SlimmerWoorden.nl';
  const options = {
    body: payload.notification?.body || 'Open de app voor het woord van vandaag!',
    icon: '/icon-192.png'
  };
  self.registration.showNotification(title, options);
});
