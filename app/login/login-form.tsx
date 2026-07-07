"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";
type Notice = { kind: "error" | "ok"; text: string } | null;

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("magic");
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [magicSent, setMagicSent] = useState(false);

  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo,
    )}`;
  }

  async function handleGoogle() {
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      if (error) {
        setBusy(false);
        setNotice({
          kind: "error",
          text: "Google sign-in isn't enabled yet. Use magic link or password below.",
        });
      }
      // On success the browser is redirected to Google — nothing more to do.
    } catch {
      setBusy(false);
      setNotice({ kind: "error", text: "Couldn't start Google sign-in. Please try again." });
    }
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: callbackUrl() },
      });
      setBusy(false);
      if (error) {
        setNotice({
          kind: "error",
          text: "Couldn't send the magic link. Check the email and try again.",
        });
      } else {
        setMagicSent(true);
      }
    } catch {
      setBusy(false);
      setNotice({ kind: "error", text: "Something went wrong. Please try again." });
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        setBusy(false);
        if (error) {
          setNotice({ kind: "error", text: signUpError(error.message) });
          return;
        }
        if (data.session) {
          window.location.assign(redirectTo);
          return;
        }
        setNotice({
          kind: "ok",
          text: "Account created. Check your email to confirm, then sign in.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        setBusy(false);
        if (error) {
          setNotice({ kind: "error", text: "Wrong email or password." });
          return;
        }
        window.location.assign(redirectTo);
      }
    } catch {
      setBusy(false);
      setNotice({ kind: "error", text: "Something went wrong. Please try again." });
    }
  }

  if (magicSent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        <p className="font-medium">Check your email</p>
        <p className="mt-1">
          We sent a magic sign-in link to{" "}
          <span className="font-medium">{email}</span>. Open it{" "}
          <span className="font-medium">on this device</span> to finish signing
          in.
        </p>
        <button
          type="button"
          onClick={() => setMagicSent(false)}
          className="mt-3 text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <GoogleIcon />
        Sign in with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or continue with email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setNotice(null);
          }}
          className={
            mode === "magic"
              ? "rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm"
              : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-500"
          }
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setNotice(null);
          }}
          className={
            mode === "password"
              ? "rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm"
              : "rounded-md px-3 py-1.5 text-sm font-medium text-slate-500"
          }
        >
          Password
        </button>
      </div>

      {notice && (
        <p
          className={
            notice.kind === "error"
              ? "rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
              : "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {notice.text}
        </p>
      )}

      {mode === "magic" ? (
        <form onSubmit={handleMagic} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
          <p className="text-xs text-slate-400">
            We&apos;ll email you a one-time link — no password needed.
          </p>
        </form>
      ) : (
        <form onSubmit={handlePassword} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="password"
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setNotice(null);
            }}
            className="w-full text-xs text-slate-500 hover:text-slate-700"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </form>
      )}
    </div>
  );
}

function signUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "This email already has an account. Switch to Sign in.";
  }
  if (m.includes("password")) {
    return "Password must be at least 6 characters.";
  }
  return "Couldn't create the account. Please try again.";
}
