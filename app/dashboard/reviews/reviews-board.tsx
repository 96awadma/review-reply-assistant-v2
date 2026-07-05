"use client";

import { useState, useTransition } from "react";
import {
  syncReviews,
  generateDraftFor,
  saveDraft,
  postReply,
  type ActionResult,
} from "./actions";
import { NotificationsButton } from "./notifications-button";

export type ReviewRow = {
  google_review_id: string;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_created_at: string | null;
  existing_reply: string | null;
  reply_status: string;
  draft_reply: string | null;
};

function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <span className="text-amber-500" aria-label={`${r} stars`}>
      {"★".repeat(r)}
      <span className="text-slate-300">{"★".repeat(5 - r)}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    posted: "bg-emerald-50 text-emerald-700",
    drafted: "bg-amber-50 text-amber-700",
    none: "bg-slate-100 text-slate-500",
  };
  const label: Record<string, string> = {
    posted: "Replied",
    drafted: "Draft ready",
    none: "No reply",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.none}`}
    >
      {label[status] ?? "No reply"}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const [draft, setDraft] = useState(review.draft_reply ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function run(fn: () => Promise<ActionResult>) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (!res.ok && res.message) setMsg(res.message);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {review.reviewer_name || "Anonymous"}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-sm">
            <Stars rating={review.rating} />
            <span className="text-slate-400">{fmtDate(review.review_created_at)}</span>
          </div>
        </div>
        <StatusBadge status={review.reply_status} />
      </div>

      {review.review_text ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {review.review_text}
        </p>
      ) : (
        <p className="mt-3 text-sm italic text-slate-400">(no review text)</p>
      )}

      {review.existing_reply && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-medium text-slate-500">Your reply on Google: </span>
          {review.existing_reply}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <label className="block text-xs font-medium text-slate-500">
          Draft reply (manual approval required before posting)
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Generate a draft, or write your own…"
          className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => generateDraftFor(review.google_review_id))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {pending ? "…" : "Generate draft"}
          </button>
          <button
            type="button"
            disabled={pending || !draft.trim()}
            onClick={() => run(() => saveDraft(review.google_review_id, draft))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending || !draft.trim()}
            onClick={() => setConfirming(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            Approve &amp; Post
          </button>
        </div>

        {msg && <p className="text-sm text-rose-600">{msg}</p>}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Post this reply to Google?
            </h3>
            {review.existing_reply && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This review already has a reply — posting will overwrite it.
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {draft}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirming(false);
                  run(() => postReply(review.google_review_id, draft));
                }}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Yes, post it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewsBoard({
  reviews,
  hasLocation,
  locationName,
}: {
  reviews: ReviewRow[];
  hasLocation: boolean;
  locationName: string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function doSync() {
    setMsg(null);
    start(async () => {
      const res = await syncReviews();
      if (res.ok) setMsg(`Synced ${res.count ?? 0} review(s).`);
      else setMsg(res.message ?? "Sync failed.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <div className="text-sm text-slate-600">
          {hasLocation ? (
            <>
              Location: <span className="font-medium">{locationName}</span>
            </>
          ) : (
            <>
              No location selected.{" "}
              <a href="/dashboard/locations" className="text-brand-600 underline">
                Choose one →
              </a>
            </>
          )}
        </div>
        <button
          type="button"
          disabled={pending || !hasLocation}
          onClick={doSync}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? "Syncing…" : "Sync reviews now"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
        <NotificationsButton />
      </div>

      {msg && (
        <p className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {msg}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No reviews synced yet. Once Google approves API access, click{" "}
          <span className="font-medium">Sync reviews now</span> to pull your real
          reviews. No demo data is ever shown.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.google_review_id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
