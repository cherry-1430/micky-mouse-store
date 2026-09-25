self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: "SPACE WEAR — Admin Alert",
      body: event.data
        ? event.data.text()
        : "New admin notification",
    };
  }

  const title =
    data.title ||
    "SPACE WEAR — Admin Alert";

  const options = {
    body:
      data.body ||
      "You have a new SPACE WEAR notification.",

    icon:
      data.icon ||
      "/space-wear-push-icon.png",

    badge:
      data.badge ||
      "/space-wear-push-badge.png",

    tag:
      data.tag ||
      "space-wear-admin",

    renotify: true,

    requireInteraction: true,

    data: {
      url:
        data.url ||
        "/admin",

      ...(data.data || {}),
    },

    actions: [
      {
        action: "open-admin",
        title: "View Admin",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      event.notification?.data?.url ||
      "/admin";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "focus" in client &&
              client.url.includes(
                new URL(targetUrl, self.location.origin)
                  .pathname
              )
            ) {
              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(
              new URL(
                targetUrl,
                self.location.origin
              ).href
            );
          }

          return undefined;
        })
    );
  }
);
