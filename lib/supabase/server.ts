import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

/**
 * Server-side Supabase client bound to the request cookies. Use in Server
 * Components, Route Handlers, and Server Actions.
 *
 * Note: cookie writes throw inside a Server Component (read-only context); the
 * setAll try/catch swallows that. Token refresh is handled by middleware on
 * protected routes instead.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

/**
 * Returns the logged-in user, or null. Never throws — returns null if Supabase
 * is not configured or the session is missing/expired.
 */
export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
