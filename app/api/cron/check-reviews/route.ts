import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getValidAccessToken } from "@/lib/google/tokens";
import { googleFetch } from "@/lib/google/api";
import { STAR_MAP, type GoogleReview, type ReviewsPage } from "@/lib/google/reviews";
import { sendPush, pushConfigured } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled every ~15 min (see vercel.json). For each user's selected location:
 *  - fetch reviews from Google,
 *  - upsert them (dedupe),
 *  - push a notification for genuinely NEW reviews (skips the first-ever sync
 *    so we don't blast a notification for every historical review).
 *
 * Until Google approves API access, the fetch throws (quota 0) and that user is
 * skipped — the job stays healthy and starts working automatically on approval.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, error: "push_not_configured" });
  }

  const supabase = createServiceClient();
  const { data: locations } = await supabase
    .from("business_locations")
    .select("user_id, google_account_id, location_id, display_name")
    .eq("is_selected", true);

  let checked = 0;
  let notified = 0;
  let skipped = 0;

  for (const loc of locations ?? []) {
    checked++;
    try {
      const { count: existingCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", loc.user_id)
        .eq("location_id", loc.location_id);

      const token = await getValidAccessToken(loc.user_id, supabase);
      const url = `https://mybusiness.googleapis.com/v4/accounts/${loc.google_account_id}/locations/${loc.location_id}/reviews?pageSize=50`;
      const page = await googleFetch<ReviewsPage>(token, url);
      const reviews = page.reviews ?? [];

      const newReviews: GoogleReview[] = [];
      for (const r of reviews) {
        const { data: existing } = await supabase
          .from("reviews")
          .select("google_review_id")
          .eq("user_id", loc.user_id)
          .eq("google_review_id", r.reviewId)
          .maybeSingle();
        const isNew = !existing;

        const row: Record<string, unknown> = {
          user_id: loc.user_id,
          location_id: loc.location_id,
          google_review_id: r.reviewId,
          reviewer_name: r.reviewer?.displayName ?? null,
          rating: r.starRating ? STAR_MAP[r.starRating] ?? null : null,
          review_text: r.comment ?? null,
          review_created_at: r.createTime ?? null,
          existing_reply: r.reviewReply?.comment ?? null,
        };
        if (r.reviewReply?.comment) row.reply_status = "posted";
        await supabase
          .from("reviews")
          .upsert(row, { onConflict: "user_id,google_review_id" });

        if (isNew) newReviews.push(r);
      }

      // Only notify after a baseline exists (skip the first-ever sync).
      if ((existingCount ?? 0) > 0 && newReviews.length > 0) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", loc.user_id);

        for (const r of newReviews) {
          const stars = r.starRating ? STAR_MAP[r.starRating] ?? "" : "";
          const payload = {
            title: `New ${stars}★ review — ${loc.display_name ?? "your business"}`,
            body: `${r.reviewer?.displayName ?? "A customer"}: ${(r.comment ?? "(no text)").replace(/\s+/g, " ").slice(0, 90)}`,
            url: "/dashboard/reviews",
            tag: r.reviewId,
          };
          for (const s of subs ?? []) {
            const res = await sendPush(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
            );
            if (res.ok) notified++;
            else if (res.gone) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", s.endpoint);
            }
          }
        }
      }
    } catch {
      // Per-user failure (e.g. API not approved yet) — skip and continue.
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, checked, notified, skipped });
}
