"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { listReviews, putReviewReply, STAR_MAP } from "@/lib/google/reviews";
import { generateDraft } from "@/lib/ai/draft";
import { GoogleApiError, reasonMessage } from "@/lib/google/api";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { ok: boolean; message?: string; count?: number };

async function getSelectedLocation(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("business_locations")
    .select("google_account_id, location_id, display_name")
    .eq("user_id", userId)
    .eq("is_selected", true)
    .maybeSingle();
  return data as
    | { google_account_id: string; location_id: string; display_name: string | null }
    | null;
}

export async function syncReviews(): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Not logged in." };

  const supabase = createClient();
  const loc = await getSelectedLocation(supabase, user.id);
  if (!loc) {
    return { ok: false, message: "No location selected — pick a location first." };
  }

  try {
    let pageToken: string | undefined;
    let total = 0;
    let pages = 0;
    do {
      const page = await listReviews(
        user.id,
        loc.google_account_id,
        loc.location_id,
        pageToken,
      );
      for (const r of page.reviews ?? []) {
        const row: Record<string, unknown> = {
          user_id: user.id,
          location_id: loc.location_id,
          google_review_id: r.reviewId,
          reviewer_name: r.reviewer?.displayName ?? null,
          rating: r.starRating ? STAR_MAP[r.starRating] ?? null : null,
          review_text: r.comment ?? null,
          review_created_at: r.createTime ?? null,
          existing_reply: r.reviewReply?.comment ?? null,
        };
        // Reflect an existing Google reply; otherwise leave our status untouched.
        if (r.reviewReply?.comment) row.reply_status = "posted";
        await supabase
          .from("reviews")
          .upsert(row, { onConflict: "user_id,google_review_id" });
        total++;
      }
      pageToken = page.nextPageToken;
      pages++;
    } while (pageToken && pages < 10);

    revalidatePath("/dashboard/reviews");
    return { ok: true, count: total };
  } catch (e) {
    if (e instanceof GoogleApiError) return { ok: false, message: reasonMessage(e.reason) };
    return { ok: false, message: "Failed to sync reviews." };
  }
}

export async function generateDraftFor(
  googleReviewId: string,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Not logged in." };

  const supabase = createClient();
  const { data: rev } = await supabase
    .from("reviews")
    .select("rating, review_text, reviewer_name, reply_status")
    .eq("user_id", user.id)
    .eq("google_review_id", googleReviewId)
    .maybeSingle();
  if (!rev) return { ok: false, message: "Review not found." };

  const loc = await getSelectedLocation(supabase, user.id);
  const draft = generateDraft({
    rating: rev.rating,
    text: rev.review_text,
    reviewerName: rev.reviewer_name,
    businessName: loc?.display_name,
  });

  await supabase
    .from("reviews")
    .update({
      draft_reply: draft,
      reply_status: rev.reply_status === "posted" ? "posted" : "drafted",
    })
    .eq("user_id", user.id)
    .eq("google_review_id", googleReviewId);

  revalidatePath("/dashboard/reviews");
  return { ok: true };
}

export async function saveDraft(
  googleReviewId: string,
  text: string,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Not logged in." };

  const supabase = createClient();
  const { data: rev } = await supabase
    .from("reviews")
    .select("reply_status")
    .eq("user_id", user.id)
    .eq("google_review_id", googleReviewId)
    .maybeSingle();

  await supabase
    .from("reviews")
    .update({
      draft_reply: text,
      reply_status: rev?.reply_status === "posted" ? "posted" : "drafted",
    })
    .eq("user_id", user.id)
    .eq("google_review_id", googleReviewId);

  revalidatePath("/dashboard/reviews");
  return { ok: true };
}

export async function postReply(
  googleReviewId: string,
  text: string,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Not logged in." };
  if (!text.trim()) return { ok: false, message: "The reply is empty." };

  const supabase = createClient();
  const loc = await getSelectedLocation(supabase, user.id);
  if (!loc) return { ok: false, message: "No location selected." };

  try {
    await putReviewReply(
      user.id,
      loc.google_account_id,
      loc.location_id,
      googleReviewId,
      text,
    );
    await supabase
      .from("reviews")
      .update({
        existing_reply: text,
        draft_reply: text,
        reply_status: "posted",
      })
      .eq("user_id", user.id)
      .eq("google_review_id", googleReviewId);
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "reply_posted",
      detail: `Posted reply to review ${googleReviewId}`,
    });

    revalidatePath("/dashboard/reviews");
    return { ok: true };
  } catch (e) {
    if (e instanceof GoogleApiError) return { ok: false, message: reasonMessage(e.reason) };
    return { ok: false, message: "Failed to post the reply to Google." };
  }
}
