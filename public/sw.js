/* Service worker — enables installability + push notifications. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler (network pass-through) — required for installability.
self.addEventListener("fetch", () => {});

// Show a notification when a push arrives (used by the review checker).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "New review";
  const options = {
    body: data.body || "You have a new Google review.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: data.tag || "new-review",
    data: { url: data.url || "/dashboard/reviews" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus/open the app when a notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) ||
    "/dashboard/reviews";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
