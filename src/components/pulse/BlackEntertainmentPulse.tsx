// src/components/BlackEntertainmentPulse.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import LuxeBackdrop from "@/components/pulse/LuxeBackdrop";
import MomentArcCard from "@/components/pulse/MomentArcCard";
import {
  buildPulseMoments,
  type FeedItem,
  type PulseMoment,
  type PulseVibe,
  type Region,
} from "@/lib/pulse";

type ApiResponse = {
  updatedAt: string;
  ttlSeconds: number;
  total: number;
  items: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    region: Region;
    publishedAt?: string;
    snippet?: string;
    image?: string | null;
  }>;
};

type Lens = "Blend" | "All" | Region;

const VIBES: Array<PulseVibe | "All"> = [
  "All",
  "Sonic",
  "Cinematic",
  "Iconic",
  "Diaspora",
  "DeepDive",
  "Hype",
];

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function BlackEntertainmentPulse() {
  const [lens, setLens] = useState<Lens>("Blend");
  const [vibe, setVibe] = useState<PulseVibe | "All">("All");
  const [q, setQ] = useState("");

  const [moments, setMoments] = useState<PulseMoment[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  async function refresh() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErr("");

    try {
      // We keep API region as "all" and apply Lens in UI for the special Blend behavior.
      const params = new URLSearchParams();
      params.set("limit", "150");
      params.set("region", "all");
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/news/black?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
        signal: ac.signal,
      });

      const json = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setErr("Failed to load entertainment pulse.");
        setMoments([]);
        return;
      }

      const feed: FeedItem[] = (json.items || []).map((it) => ({
        id: it.id,
        title: it.title,
        url: it.url,
        source: it.source,
        region: it.region,
        publishedAt: it.publishedAt,
        snippet: it.snippet,
        image: it.image,
      }));

      const built = buildPulseMoments(feed);
      setUpdatedAt(json.updatedAt);
      setMoments(built);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setErr("Failed to load entertainment pulse.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let out = moments.slice();

    // Lens logic
    if (lens === "All") {
      // no filter
    } else if (lens === "Blend") {
      // put multi-region Moments first (signature BWE thing)
      out.sort((a, b) => b.regionBlend.length - a.regionBlend.length);
    } else {
      out = out.filter((m) => m.regionBlend.includes(lens));
    }

    // Vibe logic
    if (vibe !== "All") out = out.filter((m) => m.vibe.includes(vibe));

    return out;
  }, [moments, lens, vibe]);

  const hero = filtered[0] || null;
  const trending = filtered.slice(0, 8);
  const grid = filtered.slice(1, 13);

  return (
    <>
      <Head>
        <title>Black Entertainment Pulse | Black Wealth Exchange</title>
        <meta
          name="description"
          content="BWE Pulse: LuxeFuturist™ entertainment moments across the diaspora."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <LuxeBackdrop />

        <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                BWE Pulse • LuxeFuturist™
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-gold tracking-tight">
                Entertainment, as Moments.
              </h1>

              <p className="text-white/70 max-w-2xl">
                We don’t list headlines. We reveal what the culture is doing —
                with proof across sources.
              </p>

              {updatedAt ? (
                <div className="text-xs text-white/50">
                  Updated:{" "}
                  <span className="text-white/70">
                    {new Date(updatedAt).toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="rounded-2xl bg-gold px-5 py-3 text-sm font-extrabold text-black hover:bg-yellow-500 transition"
              >
                Refresh
              </button>
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 transition"
              >
                Back
              </Link>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="text-xs text-white/60 mb-2">Search</div>
                <div className="flex gap-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search artists, films, shows, culture..."
                    className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF37]/40"
                  />
                  <button
                    onClick={refresh}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/15 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/60 mb-2">Diaspora Lens</div>
                <div className="flex flex-wrap gap-2">
                  {(["Blend", "All", "US", "Africa", "Global"] as Lens[]).map(
                    (k) => (
                      <button
                        key={k}
                        onClick={() => setLens(k)}
                        className={cx(
                          "px-3 py-2 rounded-2xl text-sm border transition",
                          lens === k
                            ? "bg-gold text-black border-gold"
                            : "bg-black/30 text-white/80 border-white/10 hover:bg-white/10",
                        )}
                      >
                        {k}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-white/60 mb-2">Vibe</div>
              <div className="flex flex-wrap gap-2">
                {VIBES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVibe(v as any)}
                    className={cx(
                      "px-3 py-2 rounded-2xl text-sm border transition",
                      vibe === v
                        ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-gold"
                        : "border-white/10 bg-black/30 text-white/70 hover:bg-white/10",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* State */}
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
              Loading Pulse…
            </div>
          ) : err ? (
            <div className="rounded-3xl border border-red-900/60 bg-red-950/30 p-10 text-center text-red-200">
              {err}
            </div>
          ) : !filtered.length ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
              No Moments found. Try a different vibe or search.
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-white/60">Top Moment</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-gold mt-1">
                      {hero?.title}
                    </div>
                    <div className="text-white/70 mt-2 max-w-2xl">
                      {hero?.takeaway}
                    </div>
                  </div>
                  <a
                    href={hero?.items?.[0]?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-gold px-6 py-3 font-extrabold text-black hover:bg-yellow-500 transition"
                  >
                    Open →
                  </a>
                </div>
              </div>

              {/* Trending rail */}
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <h2 className="text-2xl font-extrabold text-gold">
                    Trending
                  </h2>
                  <div className="text-sm text-white/60">
                    {filtered.length} Moments
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2">
                  {trending.map((m) => (
                    <div key={m.id} className="min-w-[320px] max-w-[320px]">
                      <MomentArcCard moment={m} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-gold">Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grid.map((m) => (
                    <MomentArcCard key={m.id} moment={m} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
