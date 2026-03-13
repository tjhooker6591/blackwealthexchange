// src/components/pulse/MomentArcCard.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { PulseMoment, PulseVibe } from "@/lib/pulse";

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function heatLabel(h: number) {
  if (h >= 80) return "Nuclear";
  if (h >= 60) return "Hot";
  if (h >= 40) return "Rising";
  return "Fresh";
}

function vibePill(v: PulseVibe) {
  return (
    <span
      key={v}
      className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/80"
    >
      {v}
    </span>
  );
}

function fmt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

function safeCount(n: unknown) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
}

type LegacyArcShape = {
  last24h?: number;
  last3d?: number;
  last7d?: number;
};

type PulseMomentWithOptionalArc = PulseMoment & {
  arc?: LegacyArcShape;
};

function deriveArcFromItems(moment: PulseMoment) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  let last24h = 0;
  let last3d = 0;
  let last7d = 0;
  let validDatedItems = 0;

  for (const it of moment.items ?? []) {
    const publishedAt = it?.publishedAt;
    if (!publishedAt) continue;

    const t = new Date(publishedAt).getTime();
    if (!Number.isFinite(t)) continue;

    validDatedItems += 1;
    const age = now - t;

    if (age <= 7 * DAY) last7d += 1;
    if (age <= 3 * DAY) last3d += 1;
    if (age <= 1 * DAY) last24h += 1;
  }

  // Fallback if items don't have usable dates
  if (validDatedItems === 0) {
    const total = Math.max(
      1,
      Array.isArray(moment.sources) ? moment.sources.length : 0,
      Array.isArray(moment.items) ? moment.items.length : 0,
    );

    // Keep bars visually useful while preserving hierarchy
    last7d = total;
    last3d = Math.max(1, Math.min(total, Math.ceil(total * 0.6)));
    last24h = Math.max(1, Math.min(last3d, Math.ceil(total * 0.3)));
  }

  return { last24h, last3d, last7d };
}

export default function MomentArcCard({ moment }: { moment: PulseMoment }) {
  const [openProof, setOpenProof] = useState(false);

  const hero = moment.heroImage || null;
  const regions = moment.regionBlend.join(" • ");

  const arc = useMemo(() => {
    // Backward-compatible support if runtime data still includes `arc`
    const legacyArc = (moment as PulseMomentWithOptionalArc).arc;

    const counts = legacyArc
      ? {
          last24h: safeCount(legacyArc.last24h),
          last3d: safeCount(legacyArc.last3d),
          last7d: safeCount(legacyArc.last7d),
        }
      : deriveArcFromItems(moment);

    const max = Math.max(1, counts.last7d, counts.last3d, counts.last24h);
    const w24 = Math.round((counts.last24h / max) * 100);
    const w3d = Math.round((counts.last3d / max) * 100);
    const w7d = Math.round((counts.last7d / max) * 100);

    return {
      ...counts,
      w24,
      w3d,
      w7d,
    };
  }, [moment]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl",
        "transition hover:-translate-y-1 hover:border-[#D4AF37]/30",
      )}
    >
      {/* Cinematic image */}
      <div className="relative h-40 w-full">
        {hero ? (
          <Image
            src={hero}
            alt=""
            fill
            className="object-cover opacity-85"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Gold halo */}
        <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute -inset-10 rounded-full bg-[#D4AF37]/10 blur-2xl" />
        </div>

        {/* micro-grid reveal (B accent on hover only) */}
        <div
          className="absolute inset-0 opacity-0 transition group-hover:opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.20) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.20) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-black">
            HEAT {moment.heat}
          </span>
          <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white/70">
            {heatLabel(moment.heat)}
          </span>
        </div>

        <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white/70">
          {regions}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {moment.vibe.map(vibePill)}
          <span className="ml-auto text-[11px] text-white/50">
            {moment.updatedAt ? fmt(moment.updatedAt) : ""}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold leading-snug text-white">
            {moment.title}
          </h3>
          <p className="line-clamp-2 text-sm text-white/70">
            {moment.takeaway}
          </p>
        </div>

        {/* Arc strip */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between text-[11px] text-white/55">
            <span>Arc</span>
            <span>{moment.sources.length} sources</span>
          </div>
          <div className="mt-2 space-y-2">
            <ArcBar label="24h" width={arc.w24} count={arc.last24h} />
            <ArcBar label="3d" width={arc.w3d} count={arc.last3d} />
            <ArcBar label="7d" width={arc.w7d} count={arc.last7d} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <a
            href={moment.items[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl bg-gold px-4 py-2.5 text-center text-sm font-extrabold text-black transition hover:bg-yellow-500"
          >
            Open Moment →
          </a>
          <button
            onClick={() => setOpenProof((v) => !v)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10"
          >
            Proof
          </button>
        </div>

        {openProof ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs font-bold text-gold">Sources</div>
            <div className="mt-2 space-y-2">
              {moment.items.slice(0, 6).map((it) => (
                <a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 transition hover:border-[#D4AF37]/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{it.source}</span>
                    <span className="whitespace-nowrap text-white/50">
                      {it.publishedAt ? fmt(it.publishedAt) : ""}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-1 text-white/60">
                    {it.title}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ArcBar({
  label,
  width,
  count,
}: {
  label: string;
  width: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-[11px] text-white/55">{label}</div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#D4AF37]/70"
          style={{ width: `${Math.max(3, Math.min(100, width))}%` }}
        />
      </div>
      <div className="w-8 text-right text-[11px] text-white/55">{count}</div>
    </div>
  );
}
