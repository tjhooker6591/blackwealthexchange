"use client";

// Homepage teaser for BWE Pulse (src/pages/pulse.tsx). Only rendered for
// logged-in users -- shows real content pulled from their actual feed
// (via the same /api/pulse/feed used by the Pulse page itself) rather
// than a generic "try this new feature" banner, since a real example of
// what's actually happening is a stronger hook than an announcement.

import Link from "next/link";
import { useEffect, useState } from "react";

type PulseItem = {
  type: "business" | "person";
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
};

type FeedResponse = {
  ok: boolean;
  followingCount: number;
  items: PulseItem[];
};

export default function HomepagePulsePreview() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pulse/feed", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFeed(data))
      .catch(() => setFeed(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const preview = feed?.items?.slice(0, 2) || [];

  return (
    <section className="mb-8 border-t border-white/8 pt-6">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--accent)] sm:text-base">
            BWE Pulse
          </h3>
          <p className="mt-1 text-[12px] text-white/52">
            What&apos;s happening in your BWE network right now
          </p>
        </div>
        <Link
          href="/pulse"
          className="bwe-focus-ring shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] font-semibold text-[var(--accent)] transition hover:bg-white/5"
        >
          Open Pulse →
        </Link>
      </div>

      {preview.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {preview.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href="/pulse"
              className="bwe-focus-ring flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/5"
            >
              {item.authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.authorAvatarUrl}
                  alt={item.authorName}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70">
                  {item.authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white/90">
                  {item.authorName}
                </div>
                <p className="line-clamp-2 text-xs text-white/60">
                  {item.body}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Link
          href="/pulse"
          className="bwe-focus-ring block rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65 transition hover:bg-white/5"
        >
          {feed?.followingCount === 0
            ? "Follow businesses and members to see their updates here -- or see what's trending now."
            : "No new updates yet. See what's trending on BWE."}
        </Link>
      )}
    </section>
  );
}
