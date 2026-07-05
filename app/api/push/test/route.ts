import { NextResponse } from "next/server";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { sendPush, pushConfigured } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Send a test notification to the current user's devices. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_logged_in" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, error: "push_not_configured" });
  }

  const supabase = createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: false, error: "no_subscription" });
  }

  let sent = 0;
  for (const s of subs) {
    const res = await sendPush(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      {
        title: "Test notification ✅",
        body: "Notifications are working. You'll be alerted when a new review arrives.",
        url: "/dashboard/reviews",
      },
    );
    if (res.ok) sent++;
    else if (res.gone) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }

  return NextResponse.json({ ok: sent > 0, sent });
}
