import webpush from "web-push";

let vapidReady = false;

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function ensureVapid(): boolean {
  if (vapidReady) return true;
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  vapidReady = true;
  return true;
}

export type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Send one web-push notification. Returns { gone: true } if the subscription
 * is expired (404/410) so the caller can delete it.
 */
export async function sendPush(
  sub: PushSubscription,
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean }> {
  if (!ensureVapid()) return { ok: false };
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    return { ok: false, gone: status === 404 || status === 410 };
  }
}
