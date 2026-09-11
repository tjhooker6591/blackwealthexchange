"use client";

// A dashboard nudge to close the cold-start gap on BWE Pulse: the feed
// mechanism (follow, post, notify, comment) only retains anyone if
// businesses actually post. Reuses the existing GET /api/business/updates
// and GET /api/business/follow (businessId mode, no auth needed for the
// count) rather than adding new endpoints -- this is read-only, no new
// data model.

import { useEffect, useState } from "react";

const STALE_DAYS = 30;

export default function BusinessPostNudge({
  businessId,
}: {
  businessId: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [lastPostedAt, setLastPostedAt] = useState<string | null>(null);
  const [hasEverPosted, setHasEverPosted] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    Promise.all([
      fetch(
        `/api/business/updates?businessId=${encodeURIComponent(businessId)}`,
      )
        .then((r) => (r.ok ? r.json() : { updates: [] }))
        .then((data) => data?.updates || []),
      fetch(`/api/business/follow?businessId=${encodeURIComponent(businessId)}`)
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((data) => (typeof data?.count === "number" ? data.count : 0)),
    ])
      .then(([updates, count]) => {
        setFollowerCount(count);
        setHasEverPosted(updates.length > 0);
        setLastPostedAt(updates[0]?.createdAt || null);
      })
      .catch(() => null)
      .finally(() => setLoaded(true));
  }, [businessId]);

  if (!loaded) return null;

  const daysSinceLastPost = lastPostedAt
    ? Math.floor((Date.now() - new Date(lastPostedAt).getTime()) / 86400000)
    : null;

  let message: string | null = null;
  if (!hasEverPosted) {
    message =
      followerCount > 0
        ? `You have ${followerCount} follower${followerCount === 1 ? "" : "s"} but haven't posted anything yet -- they won't see you in their BWE Pulse feed until you do.`
        : "You haven't posted anything yet. Once you do, it'll show up in BWE Pulse for anyone who follows you.";
  } else if (daysSinceLastPost !== null && daysSinceLastPost >= STALE_DAYS) {
    message = `Your last update was ${daysSinceLastPost} days ago${followerCount > 0 ? ` -- your ${followerCount} follower${followerCount === 1 ? "" : "s"} haven't heard from you in a while` : ""}.`;
  }

  if (!message) return null;

  return (
    <div className="mb-3 rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] px-4 py-3 text-sm text-white/80">
      {message}
    </div>
  );
}
