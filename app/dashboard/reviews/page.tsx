import { redirect } from "next/navigation";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { ReviewsBoard, type ReviewRow } from "./reviews-board";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard/reviews");

  const supabase = createClient();

  const { data: loc } = await supabase
    .from("business_locations")
    .select("location_id, display_name")
    .eq("user_id", user.id)
    .eq("is_selected", true)
    .maybeSingle();

  let reviews: ReviewRow[] = [];
  if (loc) {
    const { data } = await supabase
      .from("reviews")
      .select(
        "google_review_id, reviewer_name, rating, review_text, review_created_at, existing_reply, reply_status, draft_reply",
      )
      .eq("user_id", user.id)
      .eq("location_id", loc.location_id)
      .order("review_created_at", { ascending: false });
    reviews = (data as ReviewRow[]) ?? [];
  }

  return (
    <DashboardShell email={user.email ?? ""} active="/dashboard/reviews">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reviews
        </h1>
        <p className="text-sm text-slate-600">
          Sync your real Google reviews, draft replies, and post them after your
          approval.
        </p>
      </div>

      <ReviewsBoard
        reviews={reviews}
        hasLocation={Boolean(loc)}
        locationName={loc?.display_name ?? null}
      />
    </DashboardShell>
  );
}
