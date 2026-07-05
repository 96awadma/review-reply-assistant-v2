import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/supabase/server";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "Review Reply Assistant v2",
  description:
    "Professional MVP for managing Google Business Profile review replies.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Reviews",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="min-h-full">
        <PwaRegister />
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
              <a href="/" className="flex min-w-0 items-center gap-2 font-semibold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                  R
                </span>
                <span className="hidden truncate sm:inline">
                  Review Reply Assistant
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  v2
                </span>
              </a>
              <nav className="flex shrink-0 items-center gap-3 text-sm text-slate-600 sm:gap-4">
                <a href="/health" className="hover:text-slate-900">
                  Health
                </a>
                {user ? (
                  <a
                    href="/dashboard"
                    className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white transition hover:bg-brand-600"
                  >
                    Dashboard
                  </a>
                ) : (
                  <a
                    href="/login"
                    className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white transition hover:bg-brand-600"
                  >
                    Sign in
                  </a>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-400 sm:px-6">
              Standalone MVP · Not connected to MasOrder or MasBooks
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
