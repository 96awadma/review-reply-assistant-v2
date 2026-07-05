import { NextResponse } from "next/server";
import { getSessionUser, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Store (or refresh) the browser's push subscription for the current user. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_logged_in" }, { status: 401 });
  }

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const sub = body?.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json(
      { ok: false, error: "invalid_subscription" },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "store_failed" }, { status: 500 });
  }
}
