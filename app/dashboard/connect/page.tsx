import { redirect } from "next/navigation";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { googleOAuthConfigured } from "@/lib/google/oauth";
import { DashboardShell } from "@/components/dashboard-shell";
import { DisconnectButton } from "./disconnect-button";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_google_config:
    "Google isn't configured on the server yet. Add the Google client ID, secret, and redirect URI, then try again.",
  google_denied:
    "You declined the Google permission. To connect, approve the requested access.",
  google_callback_invalid:
    "Google's response was incomplete. Please start the connection again.",
  invalid_state:
    "Security check failed (state mismatch). Please start the connection again.",
  state_store_failed:
    "Couldn't start the connection (database not ready). Ensure the schema migration has been run.",
  google_callback_failed:
    "We couldn't complete the Google connection. Please try again.",
  disconnect_failed: "Couldn't disconnect. Please try again.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  google_connected: "Google connected successfully.",
  disconnected: "Google disconnected.",
};

type Connection = {
  google_email: string | null;
  token_expiry: string | null;
  scope: string | null;
  last_error: string | null;
  updated_at: string | null;
};

async function getConnection(userId: string): Promise<Connection | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("google_connections")
      .select("google_email, token_expiry, scope, last_error, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return null; // table missing or not readable → treat as not connected
    return (data as Connection) ?? null;
  } catch {
    return null;
  }
}

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard/connect");

  const connection = await getConnection(user.id);
  const connected = Boolean(connection);
  const configured = googleOAuthConfigured();

  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? "Something went wrong. Please try again."
    : null;
  const successMessage = searchParams.success
    ? SUCCESS_MESSAGES[searchParams.success] ?? null
    : null;

  return (
    <DashboardShell email={user.email ?? ""} active="/dashboard/connect">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Connect Google
        </h1>
        <p className="text-sm text-slate-600">
          Link your Google Business Profile account so we can read reviews and
          post approved replies.
        </p>
      </div>

      {successMessage && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  connected
                    ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                }
              >
                <span
                  className={
                    connected
                      ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                      : "h-1.5 w-1.5 rounded-full bg-slate-400"
                  }
                />
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
            {connected && connection?.google_email && (
              <p className="text-sm text-slate-700">
                Google account:{" "}
                <span className="font-medium">{connection.google_email}</span>
              </p>
            )}
            {!connected && (
              <p className="text-sm text-slate-500">
                No Google account is linked yet.
              </p>
            )}
          </div>

          <div>
            {connected ? (
              <DisconnectButton />
            ) : (
              <a
                href="/api/auth/google"
                className={
                  configured
                    ? "inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                    : "pointer-events-none inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
                }
              >
                Connect Google
              </a>
            )}
          </div>
        </div>

        {!configured && !connected && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Google OAuth isn&apos;t configured on the server yet. Once the
            environment variables are set, the Connect button activates. See{" "}
            <a href="/health" className="text-brand-600 underline">
              /health
            </a>
            .
          </p>
        )}

        {connected && connection?.last_error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Last error: {connection.last_error}
          </p>
        )}
      </div>

      <p className="text-xs text-slate-400">
        We only request the Business Profile scope. Replies are never posted
        without your explicit approval.
      </p>
    </DashboardShell>
  );
}
