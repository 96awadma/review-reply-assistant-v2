import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Narrow matcher: middleware runs ONLY on protected pages. It never touches
// public pages, /api routes, or static assets — avoiding repeated auth calls.
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
