import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Middleware also guards this route; this is the authoritative check and
  // gives us the user's email to display.
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <DashboardShell email={user.email ?? ""} active="/dashboard">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          You&apos;re signed in. Google connection, locations, and reviews arrive
          in the next phases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Signed in</h2>
          <p className="mt-1 text-sm text-slate-600">
            Account: <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Connect Google</h2>
          <p className="mt-1 text-sm text-slate-600">
            Link your Google Business Profile to read reviews and post approved
            replies.
          </p>
          <a
            href="/dashboard/connect"
            className="mt-3 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            Go to Connect →
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}
