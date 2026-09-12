"use client";

// BWE Pulse -- lets a business owner/manager post an update from their own
// dashboard instead of only from their public profile page (the compose
// form already existed there, in BusinessEngagement.tsx, alongside Follow/
// Save/Reviews; this extracts just that piece so it can also live here,
// reusing the exact same POST /api/business/updates endpoint -- no backend
// changes, no new data model).

import { useEffect, useState } from "react";

type Update = {
  id: string;
  title: string;
  body: string;
  createdAt: string | null;
};

export default function BusinessUpdateComposer({
  businessId,
}: {
  businessId: string;
}) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [state, setState] = useState<string | null>(null);

  const loadUpdates = async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/business/updates?businessId=${encodeURIComponent(businessId)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      setUpdates(Array.isArray(data?.updates) ? data.updates : []);
    } catch {
      // leave updates empty on fetch failure
    }
  };

  useEffect(() => {
    loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function handlePost() {
    setPosting(true);
    setState(null);
    try {
      const res = await fetch("/api/business/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState(
          data?.error || "We could not post this update. Please try again.",
        );
        return;
      }
      setTitle("");
      setBody("");
      setState(`Posted. ${data.followersNotified || 0} follower(s) notified.`);
      loadUpdates();
    } catch {
      setState("We could not post this update. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  if (!businessId) return null;

  return (
    <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] p-4">
      <div className="text-sm font-semibold text-yellow-200">
        Post an update to your followers
      </div>
      <p className="mt-1 text-xs text-white/60">
        Shows up in BWE Pulse for everyone who follows this business, and sends
        them a notification.
      </p>
      <div className="mt-3 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Update title"
          maxLength={140}
          className="bwe-input w-full"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's new? New hours, a promotion, a new product..."
          maxLength={2000}
          rows={3}
          className="bwe-textarea w-full"
        />
        <button
          type="button"
          onClick={handlePost}
          disabled={posting || !title.trim() || !body.trim()}
          className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post update"}
        </button>
        {state ? <div className="text-xs text-white/70">{state}</div> : null}
      </div>

      {updates.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Recent updates
          </div>
          <div className="mt-2 space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="text-sm">
                <div className="font-semibold text-white/90">
                  {update.title}
                </div>
                <p className="text-white/65">{update.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
