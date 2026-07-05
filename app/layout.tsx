import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review Reply Assistant v2",
  description:
    "Professional MVP for managing Google Business Profile review replies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                  R
                </span>
                <span>Review Reply Assistant</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  v2
                </span>
              </a>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <a href="/health" className="hover:text-slate-900">
                  Health
                </a>
                <a
                  href="/login"
                  className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white transition hover:bg-brand-600"
                >
                  Sign in
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-400">
              Standalone MVP · Not connected to MasOrder or MasBooks
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
