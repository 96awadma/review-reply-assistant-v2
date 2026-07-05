import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { googleOAuthConfigured, buildGoogleAuthUrl } from "@/lib/google/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start the Google OAuth flow.
 *  1. Require a logged-in user.
 *  2. Require Google config.
 *  3. Generate + store a CSRF state tied to the user.
 *  4. Redirect to Google's consent screen.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=please_login_first`);
  }

  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      `${origin}/dashboard/connect?error=missing_google_config`,
    );
  }

  const state = crypto.randomBytes(32).toString("hex");

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("oauth_states")
      .insert({ state, user_id: user.id });
    if (error) throw new Error(error.message);
  } catch {
    return NextResponse.redirect(
      `${origin}/dashboard/connect?error=state_store_failed`,
    );
  }

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
