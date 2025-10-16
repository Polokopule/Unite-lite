
// Import and initialize the Firebase SDK
// It's important to include the initializeApp script first
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYlzqp4ohFgH-Nw1NdIIkKr4U3HX7xwls",
  authDomain: "unite-3409c.firebaseapp.com",
  databaseURL: "https://unite-3409c-default-rtdb.firebaseio.com",
  projectId: "unite-3409c",
  storageBucket: "unite-3409c.appspot.com",
  messagingSenderId: "608397760209",
  appId: "1:608397760209:web:96c7edde0c8d59e49b17f0"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
