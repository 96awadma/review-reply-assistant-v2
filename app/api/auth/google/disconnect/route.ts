import { NextResponse } from "next/server";
import { getSessionUser, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disconnect Google: delete the stored connection for the current user. */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=please_login_first`, {
      status: 303,
    });
  }

  try {
    const supabase = createClient();
    await supabase.from("google_connections").delete().eq("user_id", user.id);
  } catch {
    return NextResponse.redirect(
      `${origin}/dashboard/connect?error=disconnect_failed`,
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard/connect?success=disconnected`,
    { status: 303 },
  );
}
