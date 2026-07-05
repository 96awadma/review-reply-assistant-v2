"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectTo,
      )}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo },
      });

      if (error) {
        setStatus("error");
        setMessage(
          "We couldn't send the magic link. Please check the email address and try again.",
        );
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setMessage(
        "Something went wrong reaching the sign-in service. Please try again in a moment.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        <p className="font-medium">Check your email</p>
        <p className="mt-1">
          We sent a magic sign-in link to{" "}
          <span className="font-medium">{email}</span>. Open it on this device to
          finish signing in.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending link…" : "Send magic link"}
      </button>

      <p className="text-xs text-slate-400">
        We&apos;ll email you a one-time link — no password needed.
      </p>
    </form>
  );
}
