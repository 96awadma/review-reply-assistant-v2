import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "@/lib/crypto";
import { refreshAccessToken } from "@/lib/google/oauth";
import { GoogleApiError } from "@/lib/google/api";
import type { SupabaseClient } from "@supabase/supabase-js";

// The cron job passes a service-role client (no user session); request-scoped
// callers omit it and get the cookie-based client.
type Db = SupabaseClient;

export type GoogleConnection = {
  google_email: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expiry: string | null;
  scope: string | null;
  last_error: string | null;
};

export async function getConnection(
  userId: string,
  db?: Db,
): Promise<GoogleConnection | null> {
  try {
    const supabase = db ?? createClient();
    const { data, error } = await supabase
      .from("google_connections")
      .select(
        "google_email, access_token_encrypted, refresh_token_encrypted, token_expiry, scope, last_error",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return null;
    return (data as GoogleConnection) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns a valid access token, refreshing it if it's expired or about to
 * expire. Persists the refreshed token. Throws a GoogleApiError on failure.
 */
export async function getValidAccessToken(
  userId: string,
  db?: Db,
): Promise<string> {
  const conn = await getConnection(userId, db);
  if (!conn) {
    throw new GoogleApiError("not_connected", "Google is not connected.");
  }

  const expiryMs = conn.token_expiry
    ? new Date(conn.token_expiry).getTime()
    : 0;
  const stillValid = Date.now() < expiryMs - 120_000; // 2-min safety margin

  if (stillValid && conn.access_token_encrypted) {
    return decrypt(conn.access_token_encrypted);
  }

  if (!conn.refresh_token_encrypted) {
    throw new GoogleApiError(
      "no_refresh",
      "No refresh token available. Reconnect Google.",
    );
  }

  const refreshToken = decrypt(conn.refresh_token_encrypted);
  const refreshed = await refreshAccessToken(refreshToken);
  const newExpiry = new Date(
    Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  ).toISOString();

  try {
    const supabase = db ?? createClient();
    await supabase
      .from("google_connections")
      .update({
        access_token_encrypted: encrypt(refreshed.access_token),
        token_expiry: newExpiry,
      })
      .eq("user_id", userId);
  } catch {
    // Non-fatal: we still return the fresh token for this request.
  }

  return refreshed.access_token;
}
