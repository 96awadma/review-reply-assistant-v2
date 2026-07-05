import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Diagnostic page — works whether or not the user is logged in.
export default async function DebugSessionPage() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;
  const loggedIn = Boolean(user);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Session debug
        </h1>
        <p className="text-sm text-slate-600">
          Confirms whether the server can read your Supabase session from
          cookies.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <span className="text-sm text-slate-700">Supabase configured</span>
          <Badge ok={configured} />
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <span className="text-sm text-slate-700">Logged in</span>
          <Badge ok={loggedIn} />
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm text-slate-700">User email</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {user?.email ?? "—"}
          </span>
        </div>
      </div>

      <div className="text-sm">
        {loggedIn ? (
          <a href="/dashboard" className="text-brand-600 underline">
            Go to dashboard →
          </a>
        ) : (
          <a href="/login" className="text-brand-600 underline">
            Go to sign in →
          </a>
        )}
      </div>
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
      }
    >
      <span
        className={
          ok
            ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
            : "h-1.5 w-1.5 rounded-full bg-rose-500"
        }
      />
      {ok ? "yes" : "no"}
    </span>
  );
}
