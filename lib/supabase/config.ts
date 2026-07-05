/**
 * Shared Supabase config. Referencing the NEXT_PUBLIC_* vars directly here lets
 * Next.js inline them into the client bundle at build time.
 *
 * The app must never CRASH when these are missing — until the user sets them in
 * Vercel/.env.local, we treat the app as "logged out" and show friendly notices
 * (no raw errors). See isSupabaseConfigured().
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.trim().length > 0 && SUPABASE_ANON_KEY.trim().length > 0;
}
