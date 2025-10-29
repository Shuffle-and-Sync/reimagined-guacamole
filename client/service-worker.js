/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks
 */

/* eslint-env serviceworker */
/* global self, fetch */

// Install event
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event - handles incoming push notifications
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Shuffle & Sync",
    body: "You have a new notification",
    icon: "/icons/notification-icon-192x192.png",
    badge: "/icons/notification-badge-96x96.png",
    tag: "default",
    data: {
      url: "/notifications",
    },
  };

  // Parse notification data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Error parsing push notification data:", error);
      /* eslint-enable no-console */
      notificationData.body = event.data.text();
    }
  }

  // Show notification
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    actions: notificationData.actions || [],
    image: notificationData.image,
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationOptions,
    ),
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/notifications";

  // Open the app at the specified URL
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Focus existing window and navigate to URL
            return client.focus().then(() => {
              if ("navigate" in client) {
                return client.navigate(urlToOpen);
              }
              return undefined;
            });
          }
        }

        // No window open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
        return undefined;
      }),
  );
});

// Notification close event
self.addEventListener("notificationclose", () => {
  // Track notification dismissal if needed
});

// Fetch event (optional, for offline support)
self.addEventListener("fetch", (event) => {
  // You can add caching strategies here if needed
  // For now, we just pass through to the network
  event.respondWith(fetch(event.request));
});
