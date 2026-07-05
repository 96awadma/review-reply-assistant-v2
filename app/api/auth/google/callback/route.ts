import { NextResponse } from "next/server";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import {
  googleOAuthConfigured,
  exchangeCodeForTokens,
  fetchGoogleEmail,
} from "@/lib/google/oauth";
import { encrypt, isEncryptionConfigured } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google OAuth callback.
 *  1. Validate state (RLS scopes the lookup to the current user).
 *  2. Exchange code for tokens.
 *  3. Encrypt + store access/refresh tokens + expiry + google email.
 *  4. Redirect back to the connect page with success/error.
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const connect = (query: string) =>
    NextResponse.redirect(`${origin}/dashboard/connect?${query}`);

  // User declined consent, or Google returned an error.
  if (searchParams.get("error")) {
    return connect("error=google_denied");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return connect("error=google_callback_invalid");
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=please_login_first`);
  }

  if (!googleOAuthConfigured() || !isEncryptionConfigured()) {
    return connect("error=missing_google_config");
  }

  const supabase = createClient();

  // Validate + consume the CSRF state. RLS ensures we only see our own state.
  const { data: stateRow } = await supabase
    .from("oauth_states")
    .select("state")
    .eq("state", state)
    .maybeSingle();

  if (!stateRow) {
    return connect("error=invalid_state");
  }
  await supabase.from("oauth_states").delete().eq("state", state);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleEmail(tokens.access_token);
    const tokenExpiry = new Date(
      Date.now() + (tokens.expires_in ?? 3600) * 1000,
    ).toISOString();

    const row: Record<string, unknown> = {
      user_id: user.id,
      google_email: email,
      access_token_encrypted: encrypt(tokens.access_token),
      token_expiry: tokenExpiry,
      scope: tokens.scope ?? null,
      last_error: null,
    };
    // Only overwrite the refresh token if Google sent a new one.
    if (tokens.refresh_token) {
      row.refresh_token_encrypted = encrypt(tokens.refresh_token);
    }

    const { error } = await supabase
      .from("google_connections")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw new Error(error.message);

    return connect("success=google_connected");
  } catch {
    // Record a friendly last_error for the connect page (best-effort).
    try {
      await supabase
        .from("google_connections")
        .update({ last_error: "Google token exchange failed" })
        .eq("user_id", user.id);
    } catch {
      // ignore
    }
    return connect("error=google_callback_failed");
  }
}
