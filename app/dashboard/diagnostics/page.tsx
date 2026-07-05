import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { getConnection, getValidAccessToken } from "@/lib/google/tokens";
import { listAccounts } from "@/lib/google/accounts";
import { GoogleApiError, reasonMessage } from "@/lib/google/api";

export const dynamic = "force-dynamic";

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-none">
      <span className="text-sm text-slate-700">{label}</span>
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
    </div>
  );
}

export default async function DiagnosticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard/diagnostics");

  const conn = await getConnection(user.id);
  const connected = Boolean(conn);
  const hasRefresh = Boolean(conn?.refresh_token_encrypted);
  const hasScope = Boolean(conn?.scope?.includes("business.manage"));

  let tokenValid = false;
  let apiOk = false;
  let apiReason: string | null = null;
  let apiMessage: string | null = null;

  if (connected) {
    try {
      await getValidAccessToken(user.id);
      tokenValid = true;
    } catch (e) {
      apiMessage =
        e instanceof GoogleApiError ? reasonMessage(e.reason) : "Token error.";
    }

    if (tokenValid) {
      try {
        await listAccounts(user.id);
        apiOk = true;
      } catch (e) {
        if (e instanceof GoogleApiError) {
          apiReason = e.reason;
          apiMessage = reasonMessage(e.reason);
        } else {
          apiMessage = "Unexpected error calling Google.";
        }
      }
    }
  }

  const pendingApproval = apiReason === "not_approved";

  return (
    <DashboardShell email={user.email ?? ""} active="/dashboard/diagnostics">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Diagnostics
        </h1>
        <p className="text-sm text-slate-600">
          A live check of the Google connection and Business Profile API access.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Row label="Logged in" ok={true} />
        <Row label="Google connected" ok={connected} />
        <Row label="Refresh token exists" ok={hasRefresh} />
        <Row label="Business Profile scope granted" ok={hasScope} />
        <Row label="Access token valid" ok={tokenValid} />
        <Row label="API call test success" ok={apiOk} />
      </div>

      {pendingApproval && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Waiting on Google approval
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Google OAuth is connected, but Business Profile API access is not
            available yet. Your access request is pending Google&apos;s review
            (typically several business days). The moment it&apos;s approved,
            your real locations and reviews will appear here automatically — no
            further setup needed.
          </p>
        </div>
      )}

      {apiMessage && !pendingApproval && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-800">Last Google API result</h2>
          <p className="mt-1 text-sm text-slate-600">{apiMessage}</p>
        </div>
      )}

      {apiOk && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-900">API access is live 🎉</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Google approved API access. Head to{" "}
            <a href="/dashboard/locations" className="underline">
              Locations
            </a>{" "}
            to pick your business, then sync reviews.
          </p>
        </div>
      )}

      {!connected && (
        <p className="text-sm text-slate-600">
          Google isn&apos;t connected.{" "}
          <a href="/dashboard/connect" className="text-brand-600 underline">
            Connect Google →
          </a>
        </p>
      )}
    </DashboardShell>
  );
}
