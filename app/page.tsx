export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
          Phase 3 · Google OAuth
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Review Reply Assistant v2
        </h1>
        <p className="max-w-2xl text-slate-600">
          A clean, standalone MVP for replying to Google Business Profile
          reviews. This rebuild is intentionally phased: we prove the real
          Google connection works before building any dashboard. No demo data,
          no silent fallbacks.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Current status</h2>
          <p className="mt-1 text-sm text-slate-600">
            Phase 0 scaffold is running. Tailwind, TypeScript, and the app
            shell are wired up.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/login"
              className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Sign in →
            </a>
            <a
              href="/health"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Health check
            </a>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Build plan</h2>
          <ol className="mt-2 space-y-1 text-sm text-slate-600">
            <li>0 · Fresh project setup ✓</li>
            <li>1 · Deploy to Vercel ✓</li>
            <li>2 · Supabase magic-link login ✓</li>
            <li>3 · Google OAuth connection ← you are here</li>
            <li>4 · Verify Business Profile API access</li>
            <li>5 · Real accounts &amp; locations</li>
            <li>6 · Real reviews</li>
            <li>7 · AI reply drafts</li>
            <li>8 · Manual post to Google</li>
            <li>9 · UI polish</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
