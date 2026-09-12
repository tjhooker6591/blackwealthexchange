"use client";

// Logged-out counterpart to HomepagePulsePreview (same file directory).
// Before this (2026-09-12), a visitor with no account saw nothing in this
// homepage slot at all -- the section was gated `{user ? <Preview/> : null}`.
// That defeats the actual goal: Pulse is meant to be the thing that pulls
// people INTO the conversation before they join, not a reward that only
// shows up after signup. Rendered by src/pages/index.tsx only when !user;
// the instant someone has an account and is logged in, index.tsx swaps
// this out for the real feed preview and this component never shows again.

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type TeaserItem = {
  type: "business" | "person";
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
};

type TeaserResponse = {
  ok: boolean;
  weeklyActivityCount: number;
  sample: TeaserItem[];
};

const JOIN_HREF = "/signup?intent=join-bwe-pulse";

export default function HomepagePulseJoinTeaser() {
  const [data, setData] = useState<TeaserResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pulse/public-teaser")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const sample = data?.sample || [];

  return (
    <section className="mb-10 pt-2">
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
            href={JOIN_HREF}
            className="bwe-focus-ring shrink-0 rounded-full bg-[#D4AF37] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#e8c766]"
          >
            Join the Conversation →
          </Link>
        </div>

        <p className="mt-2 text-sm text-white/60">
          Black-owned businesses and members are already connecting on BWE. Join
          free to follow along, comment, and share your own.
        </p>

        {sample.length ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sample.map((item, i) => (
              <div
                key={`${item.type}-${i}`}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4"
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
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={JOIN_HREF}
          className="bwe-focus-ring mt-4 block rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-center text-sm font-semibold text-[#F1D57A] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/15"
        >
          Join free and be part of it →
        </Link>
      </motion.div>
    </section>
  );
}
