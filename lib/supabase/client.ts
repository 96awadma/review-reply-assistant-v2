import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Browser-side Supabase client for Client Components (e.g. the login form).
 *
 * @supabase/ssr keeps the session in cookies (so the server can read it).
 * persistSession + autoRefreshToken keep the user signed in across app opens
 * and silently refresh the access token while the app is open.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
