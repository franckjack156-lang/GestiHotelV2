/**
 * Firebase Messaging Service Worker
 *
 * Ce service worker gère les notifications push en arrière-plan
 * Il est nécessaire pour recevoir des notifications même quand l'app n'est pas au premier plan
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase (doit correspondre à votre configuration)
// Note: Ces valeurs sont publiques et sûres à exposer
firebase.initializeApp({
  apiKey: "AIzaSyB9pMSG3ZnUOQEeQSMGpxJfJJIE5_Q1Rwg",
  authDomain: "gestihotel-v2.firebaseapp.com",
  projectId: "gestihotel-v2",
  storageBucket: "gestihotel-v2.firebasestorage.app",
  messagingSenderId: "1025432730689",
  appId: "1:1025432730689:web:a30d11cb3b0a75389f4c03"
});

const messaging = firebase.messaging();

/**
 * Gérer les messages en arrière-plan
 * Cette fonction est appelée quand l'app n'est pas au premier plan
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || 'GestiHôtel';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data || {},
    // Actions rapides sur la notification
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
      },
    ],
    // Comportement
    requireInteraction: payload.data?.priority === 'urgent',
    renotify: true,
    silent: false,
    // Vibration pour mobile (motif en millisecondes)
    vibrate: payload.data?.priority === 'urgent' ? [200, 100, 200, 100, 200] : [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Gérer le clic sur la notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clic sur notification:', event);

  event.notification.close();

  // Déterminer l'URL vers laquelle naviguer
  let targetUrl = '/app/notifications';

  if (event.notification.data) {
    const data = event.notification.data;

    // Si une URL d'action est fournie, l'utiliser
    if (data.actionUrl) {
      targetUrl = data.actionUrl;
    }
    // Sinon, naviguer selon le type de notification
    else if (data.interventionId) {
      targetUrl = `/app/interventions/${data.interventionId}`;
    } else if (data.messageId) {
      targetUrl = `/app/messages/${data.messageId}`;
    }
  }

  // Gérer les actions rapides
  if (event.action === 'dismiss') {
    return; // Juste fermer la notification
  }

  // Ouvrir ou focus l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher si une fenêtre est déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Naviguer vers l'URL cible
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetUrl,
            data: event.notification.data,
          });
          return;
        }
      }

      // Aucune fenêtre ouverte, en ouvrir une nouvelle
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Gérer la fermeture de la notification (swipe away)
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification fermée:', event);

  // Optionnel: Envoyer une analytics ou marquer comme vue
  if (event.notification.data?.notificationId) {
    // On pourrait envoyer un event au serveur ici
  }
});

/**
 * Gérer l'installation du service worker
 */
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installé');
  self.skipWaiting();
});

/**
 * Gérer l'activation du service worker
 */
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activé');
  event.waitUntil(clients.claim());
});

/**
 * Gérer les messages du client
 */
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message du client:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
