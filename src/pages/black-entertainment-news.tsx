// src/pages/black-entertainment-news.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

// Uses your existing pulse builder
import {
  buildPulseMoments,
  type FeedItem,
  type PulseMoment,
  type PulseVibe,
  type Region,
} from "@/lib/pulse";

/** -----------------------------
 * Types (matches /api/news/black.ts)
 * ----------------------------- */
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
  failures?: Record<string, string>;
};

type Lens = "Blend" | "All" | Region;

/** -----------------------------
 * Entertainment filter (client-side)
 * ----------------------------- */
const ENTERTAINMENT_KEYWORDS =
  /music|album|song|artist|rapper|hip[- ]?hop|r&b|single|tour|concert|festival|dj|producer|grammy|billboard|award|naacp|oscar|emmy|film|movie|cinema|box office|trailer|premiere|director|actor|actress|tv|series|show|season|episode|streaming|netflix|hulu|prime|disney|starz|hbo|apple tv|peacock|celebrity|red carpet|fashion|style|viral|interview|cast|soundtrack/i;

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

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Big chunk of “images not showing”:
 * - http images get blocked on https sites → try upgrading to https
 */
function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  const u = String(url).trim();
  if (!u) return null;
  if (u.startsWith("http://")) return "https://" + u.slice("http://".length);
  return u;
}

/**
 * Try multiple image candidates (increases the chance you see images)
 * - moment.heroImage
 * - any item image inside moment.items
 */
function pickMomentImage(m: PulseMoment) {
  const a = normalizeImageUrl(m.heroImage || null);
  if (a) return a;

  // Some moments have images on the underlying items even if heroImage is null
  const b =
    m.items
      ?.map((it: any) => normalizeImageUrl(it?.image || null))
      .find(Boolean) || null;

  return b;
}

function heatLabel(h: number) {
  if (h >= 80) return "Nuclear";
  if (h >= 60) return "Hot";
  if (h >= 40) return "Rising";
  return "Fresh";
}

/**
 * Deterministic “poster” palette seed so each Moment has its own look.
 */
function seedToHue(seed: string, offset = 0) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h + offset) % 360;
}

function vibeEmoji(v?: PulseVibe) {
  switch (v) {
    case "Sonic":
      return "🎵";
    case "Cinematic":
      return "🎬";
    case "Iconic":
      return "🏆";
    case "Diaspora":
      return "🌍";
    case "DeepDive":
      return "🧠";
    case "Hype":
      return "🔥";
    default:
      return "✨";
  }
}

/** -----------------------------
 * Page
 * ----------------------------- */
export default function BlackEntertainmentNewsPage() {
  const [lens, setLens] = useState<Lens>("Blend");
  const [vibe, setVibe] = useState<PulseVibe | "All">("All");

  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");

  const [moments, setMoments] = useState<PulseMoment[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [proofOpen, setProofOpen] = useState(false);
  const [proofMoment, setProofMoment] = useState<PulseMoment | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErr("");

    try {
      const params = new URLSearchParams();
      params.set("limit", "150");
      params.set("region", "all");
      if (qApplied.trim()) params.set("q", qApplied.trim());

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

      // Entertainment tightening BEFORE building moments
      const entertainmentFeed: FeedItem[] = (json.items || [])
        .map((it) => ({
          id: it.id,
          title: it.title,
          url: it.url,
          source: it.source,
          region: it.region,
          publishedAt: it.publishedAt,
          snippet: it.snippet,
          image: normalizeImageUrl(it.image),
        }))
        .filter((it) =>
          ENTERTAINMENT_KEYWORDS.test(`${it.title} ${it.snippet || ""}`),
        );

      const built = buildPulseMoments(entertainmentFeed);

      setUpdatedAt(json.updatedAt);
      setMoments(built);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setErr("Failed to load entertainment pulse.");
    } finally {
      setLoading(false);
    }
  }, [qApplied]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let out = moments.slice();

    if (lens === "All") {
      // no filter
    } else if (lens === "Blend") {
      out.sort(
        (a, b) =>
          b.regionBlend.length - a.regionBlend.length || b.heat - a.heat,
      );
    } else {
      out = out.filter((m) => m.regionBlend.includes(lens));
    }

    if (vibe !== "All") out = out.filter((m) => m.vibe.includes(vibe));
    return out;
  }, [moments, lens, vibe]);

  const hero = filtered[0] || null;
  const feed = filtered.slice(0, 24);

  function openProof(m: PulseMoment) {
    setProofMoment(m);
    setProofOpen(true);
  }

  function applySearch() {
    setQApplied(qInput.trim());
  }

  return (
    <>
      <Head>
        <title>Black Entertainment Pulse | Black Wealth Exchange</title>
        <meta
          name="description"
          content="BWE Pulse: Entertainment moments across the Black diaspora — music, film, TV, creators, and culture."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
          <div className="absolute top-28 right-[-160px] h-[520px] w-[520px] rounded-full bg-[#22d3ee]/10 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[-160px] h-[620px] w-[620px] rounded-full bg-[#a78bfa]/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
              backgroundSize: "96px 96px",
            }}
          />
        </div>

        {/* Header */}
        <header className="mx-auto max-w-6xl px-4 pt-8 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Live • BWE Pulse
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#D4AF37]">
                Black Entertainment Pulse
              </h1>

              <p className="max-w-2xl text-white/70">
                Clean, mobile-first Moments — even when publishers don’t provide
                images.
              </p>

              {updatedAt ? (
                <p className="text-xs text-white/50">
                  Updated:{" "}
                  <span className="text-white/70">{fmtDate(updatedAt)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-extrabold text-black hover:bg-yellow-500 transition"
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
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="text-xs text-white/60 mb-2">Search</div>
                <div className="flex gap-2">
                  <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applySearch();
                    }}
                    placeholder="Search artists, movies, shows..."
                    className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#D4AF37]/40"
                  />
                  <button
                    onClick={applySearch}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/15 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/60 mb-2">Diaspora Lens</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["Blend", "All", "US", "Africa", "Global"] as Lens[]).map(
                    (k) => (
                      <button
                        key={k}
                        onClick={() => setLens(k)}
                        className={cx(
                          "shrink-0 px-3 py-2 rounded-2xl text-sm border transition",
                          lens === k
                            ? "bg-[#D4AF37] text-black border-[#D4AF37]"
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
              <div className="flex gap-2 overflow-x-auto pb-1">
                {VIBES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVibe(v as any)}
                    className={cx(
                      "shrink-0 px-3 py-2 rounded-2xl text-sm border transition",
                      vibe === v
                        ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "border-white/10 bg-black/30 text-white/70 hover:bg-white/10",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-6xl px-4 pb-16 space-y-8">
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
              {/* HERO (always looks good, image or not) */}
              {hero ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
                  <div className="relative h-44 sm:h-56">
                    <PosterImage
                      seed={hero.id}
                      title={hero.title}
                      src={pickMomentImage(hero)}
                      metaLeft="TOP MOMENT"
                      metaRight={hero.regionBlend.join(" • ")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      <span className="rounded-full bg-[#D4AF37] px-2.5 py-1 text-[11px] font-extrabold text-black">
                        TOP MOMENT
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white/70">
                        HEAT {hero.heat} • {heatLabel(hero.heat)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="text-[11px] text-white/50">
                      {hero.updatedAt ? fmtDate(hero.updatedAt) : ""}
                    </div>

                    <div className="text-xl sm:text-2xl font-extrabold text-white">
                      {hero.title}
                    </div>

                    <div className="text-white/70">{hero.takeaway}</div>

                    <div className="flex flex-wrap gap-2">
                      {hero.vibe.slice(0, 3).map((v) => (
                        <span
                          key={v}
                          className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-white/75"
                        >
                          {v}
                        </span>
                      ))}
                      <span className="ml-auto rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-white/65">
                        {hero.sources.length} sources •{" "}
                        {hero.regionBlend.join(" • ")}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap pt-1">
                      <a
                        href={hero.items?.[0]?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-extrabold text-black hover:bg-yellow-500 transition"
                      >
                        Open →
                      </a>
                      <button
                        onClick={() => openProof(hero)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 transition"
                      >
                        Proof
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Feed */}
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#D4AF37]">
                    Pulse Feed
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {filtered.length} Moments • posters fill the “image space”
                    so nothing looks empty
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feed.map((m) => (
                  <MomentCard
                    key={m.id}
                    moment={m}
                    onProof={() => openProof(m)}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Proof Modal */}
        {proofOpen && proofMoment ? (
          <ProofModal
            moment={proofMoment}
            onClose={() => {
              setProofOpen(false);
              setProofMoment(null);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

/** -----------------------------
 * UI Components
 * ----------------------------- */

function PosterImage({
  seed,
  title,
  src,
  metaLeft,
  metaRight,
}: {
  seed: string;
  title: string;
  src?: string | null;
  metaLeft?: string;
  metaRight?: string;
}) {
  const hueA = seedToHue(seed, 0);
  const hueB = seedToHue(seed, 120);
  const hueC = seedToHue(seed, 240);

  const [bad, setBad] = useState(false);
  const s = normalizeImageUrl(src);

  return (
    <div className="absolute inset-0">
      {/* Always-present poster background (kills “black empty blocks”) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, hsla(${hueA}, 85%, 60%, 0.35) 0%, transparent 55%),
            radial-gradient(circle at 85% 25%, hsla(${hueB}, 85%, 60%, 0.22) 0%, transparent 55%),
            radial-gradient(circle at 55% 85%, hsla(${hueC}, 85%, 60%, 0.22) 0%, transparent 55%),
            linear-gradient(to bottom right, rgba(212,175,55,0.16), rgba(0,0,0,0.65))
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.10) 1px, transparent 1.6px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08) 1px, transparent 1.6px), radial-gradient(circle at 45% 75%, rgba(255,255,255,0.06) 1px, transparent 1.6px)",
          backgroundSize: "240px 240px, 320px 320px, 280px 280px",
          backgroundPosition: "0 0, 20px 60px, 80px 120px",
        }}
      />

      {/* Overlay title stamp so the poster looks intentional */}
      <div className="absolute inset-0 flex items-end p-4">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3 text-[11px] text-white/70">
            <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1">
              {metaLeft || "BWE"}
            </span>
            {metaRight ? (
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1">
                {metaRight}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-sm sm:text-base font-extrabold text-white/90 line-clamp-2">
            {title}
          </div>
        </div>
      </div>

      {/* Real image on top if it loads */}
      {s && !bad ? (
        <img
          src={s}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBad(true)}
        />
      ) : null}

      {/* Slight darkening for legibility */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

function MomentCard({
  moment,
  onProof,
}: {
  moment: PulseMoment;
  onProof: () => void;
}) {
  const img = pickMomentImage(moment);
  const topVibe = moment.vibe?.[0];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-xl"
    >
      <div className="relative h-32">
        <PosterImage
          seed={moment.id}
          title={`${vibeEmoji(topVibe)} ${moment.title}`}
          src={img}
          metaLeft={`HEAT ${moment.heat} • ${heatLabel(moment.heat)}`}
          metaRight={moment.regionBlend.join(" • ")}
        />
      </div>

      <div className="p-5 space-y-3">
        <div className="text-[11px] text-white/50">
          {moment.updatedAt ? fmtDate(moment.updatedAt) : ""}
        </div>

        <div className="text-lg font-extrabold text-white leading-snug line-clamp-2">
          {moment.title}
        </div>

        <div className="text-sm text-white/70 line-clamp-2">
          {moment.takeaway}
        </div>

        <div className="flex flex-wrap gap-2">
          {moment.vibe.slice(0, 3).map((v) => (
            <span
              key={v}
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-bold text-white/75"
            >
              {v}
            </span>
          ))}
          <span className="ml-auto rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-bold text-white/65">
            {moment.sources.length} sources
          </span>
        </div>

        <div className="flex gap-2">
          <a
            href={moment.items?.[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl bg-[#D4AF37] px-4 py-2.5 text-center text-sm font-extrabold text-black hover:bg-yellow-500 transition"
          >
            Open →
          </a>
          <button
            onClick={onProof}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 transition"
          >
            Proof
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProofModal({
  moment,
  onClose,
}: {
  moment: PulseMoment;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3">
        <div className="w-full sm:max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/95 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/60">Proof • Sources</div>
              <div className="text-lg font-extrabold text-[#D4AF37] mt-1 line-clamp-2">
                {moment.title}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {moment.sources.length} sources •{" "}
                {moment.regionBlend.join(" • ")}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto p-5 space-y-3">
            {moment.items.slice(0, 12).map((it: any) => (
              <a
                key={it.id}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/10 bg-black/40 p-4 hover:border-[#D4AF37]/30 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-white/90 line-clamp-1">
                    {it.source}
                  </div>
                  <div className="text-xs text-white/50 whitespace-nowrap">
                    {it.publishedAt ? fmtDate(it.publishedAt) : ""}
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/70 line-clamp-2">
                  {it.title}
                </div>
              </a>
            ))}
          </div>

          <div className="p-5 border-t border-white/10 text-xs text-white/50">
            Some publishers don’t provide images or block hotlinking—so we
            render a Luxe poster background so nothing looks empty.
          </div>
        </div>
      </div>
    </div>
  );
}
