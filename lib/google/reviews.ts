import { getValidAccessToken } from "@/lib/google/tokens";
import { googleFetch } from "@/lib/google/api";

// Google star ratings come back as words.
export const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export type GoogleReview = {
  reviewId: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: string; // "FIVE"
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
};

export type ReviewsPage = {
  reviews: GoogleReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
};

/**
 * Reviews live on the legacy v4 API (mybusiness.googleapis.com), which is the
 * one gated behind Google's approval. accountId/locationId are the numeric ids.
 */
export async function listReviews(
  userId: string,
  accountId: string,
  locationId: string,
  pageToken?: string,
): Promise<ReviewsPage> {
  const token = await getValidAccessToken(userId);
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
  );
  url.searchParams.set("pageSize", "50");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  return googleFetch<ReviewsPage>(token, url.toString());
}

/** Post (or update) a reply to a single review. */
export async function putReviewReply(
  userId: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string,
): Promise<void> {
  const token = await getValidAccessToken(userId);
  await googleFetch(
    token,
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`,
    { method: "PUT", body: JSON.stringify({ comment }) },
  );
}
