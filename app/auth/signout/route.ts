import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Sign out via POST (from a form button). Clears the session cookies and
 * returns the user to the home page.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore — we redirect home regardless.
    }
  }

  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
