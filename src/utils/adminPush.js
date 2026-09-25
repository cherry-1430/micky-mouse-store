import API_URL from "../api/apiConfig";

const SERVICE_WORKER_PATH = "/admin-push-sw.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}

export async function registerAdminPushNotifications() {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      console.warn(
        "This browser does not support web push notifications."
      );
      return {
        enabled: false,
        reason: "unsupported",
      };
    }

    const publicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      console.warn(
        "VITE_VAPID_PUBLIC_KEY is missing."
      );
      return {
        enabled: false,
        reason: "missing_public_key",
      };
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      return {
        enabled: false,
        reason: "not_logged_in",
      };
    }

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      return {
        enabled: false,
        reason: "permission_denied",
      };
    }

    const registration =
      await navigator.serviceWorker.register(
        SERVICE_WORKER_PATH,
        {
          scope: "/",
        }
      );

    await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(publicKey),
        });
    }

    const response = await fetch(
      `${API_URL}/api/admin/push/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to register push subscription"
      );
    }

    return {
      enabled: true,
      subscription,
    };
  } catch (error) {
    console.error(
      "Admin push registration failed:",
      error
    );

    return {
      enabled: false,
      reason: "registration_error",
      error,
    };
  }
}

export async function unregisterAdminPushNotifications() {
  try {
    if (!("serviceWorker" in navigator)) return;

    const registration =
      await navigator.serviceWorker.getRegistration(
        SERVICE_WORKER_PATH
      );

    if (!registration) return;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) return;

    const token =
      localStorage.getItem("token");

    if (token) {
      await fetch(
        `${API_URL}/api/admin/push/subscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        }
      );
    }

    await subscription.unsubscribe();
  } catch (error) {
    console.error(
      "Admin push unregister failed:",
      error
    );
  }
}
