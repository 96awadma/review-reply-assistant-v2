import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/settings");

  return (
    <DashboardShell email={user.email ?? ""} active="/settings">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-sm text-slate-600">
          Account details. More options (Google connection, reply preferences)
          come in later phases.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-slate-500">User ID</dt>
            <dd className="font-mono text-xs text-slate-600">{user.id}</dd>
          </div>
        </dl>
      </div>
    </DashboardShell>
  );
}
