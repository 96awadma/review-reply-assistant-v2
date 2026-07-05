"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "working" | "on" | "error";

export function NotificationsButton() {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (!sub) {
          setState("off");
          return;
        }
        // Ensure the server has this subscription stored (idempotent). This
        // self-heals if the DB table wasn't ready on the first subscribe.
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub }),
        }).catch(() => {});
        setState("on");
      })
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setState("working");
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("error");
        setMsg("Permission denied. Enable notifications in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setState("error");
        setMsg("Notifications aren't configured on the server.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      if (!res.ok) throw new Error();
      setState("on");
      setMsg("Notifications enabled ✅");
    } catch {
      setState("error");
      setMsg("Couldn't enable notifications. Please try again.");
    }
  }

  async function sendTest() {
    setMsg("Sending test…");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      setMsg(
        data.ok
          ? "Test sent — check your device! 🔔"
          : "Couldn't send a test notification.",
      );
    } catch {
      setMsg("Couldn't send a test notification.");
    }
  }

  if (state === "unsupported") {
    return (
      <p className="text-xs text-slate-400">
        🔔 Notifications aren&apos;t supported here. Install the app on your phone
        (Add to Home screen) to enable them.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "on" ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            🔔 Review notifications on
          </span>
          <button
            type="button"
            onClick={sendTest}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Send test
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={state === "working" || state === "loading"}
          onClick={enable}
          className="rounded-lg border border-brand-500 px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-50"
        >
          {state === "working" ? "Enabling…" : "🔔 Enable review notifications"}
        </button>
      )}
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
