const webpush = require("web-push");
const AdminPushSubscription = require("../models/AdminPushSubscription");

let configured = false;

function configureWebPush() {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contactEmail =
    process.env.VAPID_CONTACT_EMAIL ||
    "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn(
      "Admin push disabled: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are missing."
    );
    return false;
  }

  webpush.setVapidDetails(
    contactEmail,
    publicKey,
    privateKey
  );

  configured = true;
  return true;
}

async function sendPushToAdmins(notification) {
  if (!configureWebPush()) return;

  const subscriptions =
    await AdminPushSubscription.find({}).lean();

  if (!subscriptions.length) return;

  const payload = JSON.stringify({
    title:
      notification.title ||
      "SPACE WEAR — Admin Alert",

    body:
      notification.body ||
      "You have a new SPACE WEAR notification.",

    icon:
      notification.icon ||
      "/space-wear-push-icon.png",

    badge:
      notification.badge ||
      "/space-wear-push-badge.png",

    tag:
      notification.tag ||
      "space-wear-admin",

    url:
      notification.url ||
      "/admin",

    data: notification.data || {},
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload,
          {
            TTL: 60,
          }
        );
      } catch (error) {
        // Browser push services return 404/410 when a
        // subscription is no longer valid.
        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          await AdminPushSubscription.deleteOne({
            _id: subscription._id,
          });
        } else {
          console.error(
            "Admin push delivery error:",
            error.message
          );
        }
      }
    })
  );
}

module.exports = {
  sendPushToAdmins,
};
