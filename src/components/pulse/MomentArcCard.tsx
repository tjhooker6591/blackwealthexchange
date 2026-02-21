// src/components/pulse/MomentArcCard.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { PulseMoment, PulseVibe } from "@/lib/pulse";

function cx(...c: Array<string | false | null | undefined>) {
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

export default function MomentArcCard({ moment }: { moment: PulseMoment }) {
  const [openProof, setOpenProof] = useState(false);

  const hero = moment.heroImage || null;
  const regions = moment.regionBlend.join(" • ");

  const arc = useMemo(() => {
    const max = Math.max(1, moment.arc.last7d);
    const w24 = Math.round((moment.arc.last24h / max) * 100);
    const w3d = Math.round((moment.arc.last3d / max) * 100);
    const w7d = 100;
    return { w24, w3d, w7d };
  }, [moment.arc]);

  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl",
        "transition hover:-translate-y-1 hover:border-[#D4AF37]/30",
      )}
    >
      {/* Cinematic image */}
      <div className="relative h-40 w-full">
        {hero ? (
          <img
            src={hero}
            alt=""
            className="h-full w-full object-cover opacity-85"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Gold halo */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
          <div className="absolute -inset-10 rounded-full bg-[#D4AF37]/10 blur-2xl" />
        </div>

        {/* micro-grid reveal (B accent on hover only) */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.10] transition"
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

      <div className="p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {moment.vibe.map(vibePill)}
          <span className="ml-auto text-[11px] text-white/50">
            {moment.updatedAt ? fmt(moment.updatedAt) : ""}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-white leading-snug">
            {moment.title}
          </h3>
          <p className="text-sm text-white/70 line-clamp-2">
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
            <ArcBar label="24h" width={arc.w24} count={moment.arc.last24h} />
            <ArcBar label="3d" width={arc.w3d} count={moment.arc.last3d} />
            <ArcBar label="7d" width={arc.w7d} count={moment.arc.last7d} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <a
            href={moment.items[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl bg-gold px-4 py-2.5 text-center text-sm font-extrabold text-black hover:bg-yellow-500 transition"
          >
            Open Moment →
          </a>
          <button
            onClick={() => setOpenProof((v) => !v)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 transition"
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
                  className="block rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 hover:border-[#D4AF37]/30 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{it.source}</span>
                    <span className="text-white/50 whitespace-nowrap">
                      {it.publishedAt ? fmt(it.publishedAt) : ""}
                    </span>
                  </div>
                  <div className="mt-1 text-white/60 line-clamp-1">
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
      <div className="relative h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#D4AF37]/70"
          style={{ width: `${Math.max(3, Math.min(100, width))}%` }}
        />
      </div>
      <div className="w-8 text-right text-[11px] text-white/55">{count}</div>
    </div>
  );
}
