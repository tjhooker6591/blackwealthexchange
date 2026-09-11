"use client";

// Homepage teaser for BWE Pulse (src/pages/pulse.tsx). Only rendered for
// logged-in users -- shows real content pulled from their actual feed
// (via the same /api/pulse/feed used by the Pulse page itself) rather
// than a generic "try this new feature" banner, since a real example of
// what's actually happening is a stronger hook than an announcement.
//
// Given real visual weight (2026-09-11) -- gold glow border, a pulsing
// "LIVE" badge, and a bold live count -- so it actually catches the eye
// on a homepage full of otherwise similarly-styled sections, instead of
// blending in as just another muted content block.

import Link from "next/link";
import { motion } from "framer-motion";
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
  const count = feed?.items?.length || 0;

  return (
    <section className="mb-10 border-t border-white/8 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="animate-pulseGlow rounded-[28px] border border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/[0.08] via-black to-black p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]">
              Live
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              BWE Pulse
            </h3>
          </div>
          <Link
            href="/pulse"
            className="bwe-focus-ring shrink-0 rounded-full bg-[#D4AF37] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#e8c766]"
          >
            Open Pulse →
          </Link>
        </div>

        <p className="mt-2 text-sm text-white/60">
          {count > 0 ? (
            <>
              <span className="text-2xl font-extrabold text-white">
                {count}
              </span>{" "}
              thing{count === 1 ? "" : "s"} happening in your BWE network right
              now.
            </>
          ) : (
            "What's happening in your BWE network right now."
          )}
        </p>

        {preview.length ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {preview.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href="/pulse"
                className="bwe-focus-ring flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-[#D4AF37]/40 hover:bg-black/60"
              >
                {item.authorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.authorAvatarUrl}
                    alt={item.authorName}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-sm font-bold text-[#D4AF37]">
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
            className="bwe-focus-ring mt-4 block rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/65 transition hover:border-[#D4AF37]/40 hover:bg-black/60"
          >
            {feed?.followingCount === 0
              ? "Follow businesses and members to see their updates here -- or see what's trending now."
              : "No new updates yet. See what's trending on BWE."}
          </Link>
        )}
      </motion.div>
    </section>
  );
}
