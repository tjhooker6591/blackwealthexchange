"use client";

// Phase 5 -- Network Effects: Follow, Save, Reviews, and (owner-only)
// Business Updates for a single business. Rendered as a client-side
// "island" on the server-rendered business profile page
// (src/pages/business/[slug].tsx) so that page can stay a simple SSR
// page for everything else. All state here comes from real API calls --
// nothing is fabricated or pre-seeded.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import CommentThread from "@/components/pulse/CommentThread";

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
};

type Update = {
  id: string;
  title: string;
  body: string;
  createdAt: string | null;
};

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="text-yellow-400" aria-hidden="true">
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </span>
  );
}

export default function BusinessEngagement({
  businessId,
  variant = "full",
}: {
  businessId: string;
  // Follow/Save/Message used to only ever render buried below the main
  // business details, well below the fold -- reported directly: "where
  // and how do i follow a business." "header" renders just that button
  // row (meant to sit right under the business name); "body" renders
  // everything else (post composer, updates, comments, reviews); "full"
  // keeps the original all-in-one behavior for any other caller.
  variant?: "header" | "body" | "full";
}) {
  const { user } = useAuth({ silentOnPublic: false });

  const [following, setFollowing] = useState(false);
  const [followCount, setFollowCount] = useState<number | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState({
    count: 0,
    averageRating: 0,
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewState, setReviewState] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [canPostUpdate, setCanPostUpdate] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateState, setUpdateState] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/business/follow?businessId=${encodeURIComponent(businessId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        setFollowing(Boolean(data?.following));
        if (typeof data?.count === "number") setFollowCount(data.count);
      })
      .catch(() => null);
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !user) return;
    fetch("/api/user/save-business", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => {
        const list: Array<{ businessId: string }> = data?.businesses || [];
        setSaved(list.some((item) => item.businessId === businessId));
      })
      .catch(() => null);
  }, [businessId, user]);

  const loadReviews = async () => {
    try {
      const res = await fetch(
        `/api/business/reviews?businessId=${encodeURIComponent(businessId)}`,
      );
      const data = await res.json();
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      setReviewSummary({
        count: data?.count || 0,
        averageRating: data?.averageRating || 0,
      });
    } catch {
      // leave reviews empty on fetch failure
    }
  };

  useEffect(() => {
    if (!businessId) return;
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadUpdates = async () => {
    try {
      const res = await fetch(
        `/api/business/updates?businessId=${encodeURIComponent(businessId)}`,
      );
      const data = await res.json();
      setUpdates(Array.isArray(data?.updates) ? data.updates : []);
    } catch {
      // leave updates empty on fetch failure
    }
  };

  useEffect(() => {
    if (!businessId) return;
    loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    fetch(
      `/api/business/owner-contact?businessId=${encodeURIComponent(businessId)}`,
    )
      .then((r) => (r.ok ? r.json() : { ownerUserId: null }))
      .then((data) => setOwnerUserId(data?.ownerUserId || null))
      .catch(() => null);
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !user) {
      setCanPostUpdate(false);
      return;
    }
    fetch("/api/user/managed-businesses", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => {
        const list: Array<{ id: string }> = data?.businesses || [];
        setCanPostUpdate(list.some((item) => item.id === businessId));
      })
      .catch(() => null);
  }, [businessId, user]);

  async function toggleFollow() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setFollowBusy(true);
    try {
      const res = await fetch("/api/business/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(Boolean(data.following));
        if (typeof data.count === "number") setFollowCount(data.count);
      }
    } finally {
      setFollowBusy(false);
    }
  }

  async function toggleSave() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setSaveBusy(true);
    try {
      const res = await fetch("/api/user/save-business", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) setSaved(!saved);
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleSubmitReview() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setSubmittingReview(true);
    setReviewState(null);
    try {
      const res = await fetch("/api/business/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReviewState(
          data?.error || "We could not save your review. Please try again.",
        );
        return;
      }
      setReviewComment("");
      setReviewState("Thanks! Your review has been saved.");
      loadReviews();
    } catch {
      setReviewState("We could not save your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handlePostUpdate() {
    setPostingUpdate(true);
    setUpdateState(null);
    try {
      const res = await fetch("/api/business/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          title: updateTitle,
          body: updateBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpdateState(
          data?.error || "We could not post this update. Please try again.",
        );
        return;
      }
      setUpdateTitle("");
      setUpdateBody("");
      setUpdateState(
        `Posted. ${data.followersNotified || 0} follower(s) notified.`,
      );
      loadUpdates();
    } catch {
      setUpdateState("We could not post this update. Please try again.");
    } finally {
      setPostingUpdate(false);
    }
  }

  return (
    <div className={variant === "header" ? "" : "mt-4 space-y-4"}>
      {variant === "body" ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followBusy}
            className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              following
                ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
                : "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
            }`}
          >
            {following ? "Following" : "Follow"}
            {typeof followCount === "number" ? (
              <span className="ml-1.5 text-white/50">({followCount})</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={toggleSave}
            disabled={saveBusy}
            className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              saved
                ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
                : "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
          {ownerUserId && ownerUserId !== ((user as any)?.id || user?._id) ? (
            <Link
              href={`/inbox?with=${encodeURIComponent(ownerUserId)}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              Message
            </Link>
          ) : null}
        </div>
      )}

      {variant === "header" ? null : canPostUpdate ? (
        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] p-4">
          <div className="text-sm font-semibold text-yellow-200">
            Post an update to your followers
          </div>
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="Update title"
              maxLength={140}
              className="bwe-input w-full"
            />
            <textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              placeholder="What's new? New hours, a promotion, a new product..."
              maxLength={2000}
              rows={3}
              className="bwe-textarea w-full"
            />
            <button
              type="button"
              onClick={handlePostUpdate}
              disabled={
                postingUpdate || !updateTitle.trim() || !updateBody.trim()
              }
              className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black disabled:opacity-50"
            >
              {postingUpdate ? "Posting…" : "Post update"}
            </button>
            {updateState ? (
              <div className="text-xs text-white/70">{updateState}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {variant === "header" ? null : updates.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-sm font-semibold text-white/90">Updates</div>
          <div className="mt-3 space-y-3">
            {updates.map((update) => (
              <div
                key={update.id}
                className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="text-sm font-semibold text-white/90">
                  {update.title}
                </div>
                <div className="mt-1 text-sm text-white/70">{update.body}</div>
                <CommentThread postType="business" postId={update.id} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Reported directly: a visitor (and the owner themselves) found no
        // way to comment on a business at all -- because comments only
        // ever attach to a posted update, and this whole section silently
        // disappeared when there were none. Explain the model instead of
        // showing nothing.
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
          {canPostUpdate
            ? "You haven't posted an update yet. Once you do, it'll show here -- and members can comment on it and follow along."
            : "This business hasn't posted an update yet. Updates -- and the ability to comment on them -- will show up here once they do."}
        </div>
      )}

      {variant === "header" ? null : (
        <div
          id="reviews"
          className="rounded-2xl border border-white/10 bg-black/30 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/90">Reviews</div>
            {reviewSummary.count > 0 ? (
              <div className="text-xs text-white/70">
                <Stars value={reviewSummary.averageRating} />{" "}
                {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.count}{" "}
                review
                {reviewSummary.count === 1 ? "" : "s"})
              </div>
            ) : (
              <div className="text-xs text-white/50">No reviews yet</div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/85">
                    {review.userName}
                  </div>
                  <Stars value={review.rating} />
                </div>
                {review.comment ? (
                  <div className="mt-1 text-sm text-white/65">
                    {review.comment}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-sm font-semibold text-white/85">
              Leave a review
            </div>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  className={`text-2xl leading-none ${
                    value <= reviewRating ? "text-yellow-400" : "text-white/25"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this business (optional)"
              maxLength={1000}
              rows={3}
              className="bwe-textarea mt-2 w-full"
            />
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="mt-2 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black disabled:opacity-50"
            >
              {submittingReview ? "Submitting…" : "Submit review"}
            </button>
            {reviewState ? (
              <div className="mt-2 text-xs text-white/70">{reviewState}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
