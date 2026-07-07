import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Run on all PAGE navigations so the Supabase session is refreshed and kept
// alive as the user browses (prevents premature "logged out"). Still excludes
// /api, static assets, the service worker, manifest and icons — so we never
// re-introduce the v1 auth rate-limit trap (which came from firing on assets).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|woff2?)).*)",
  ],
};
