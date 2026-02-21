// src/components/pulse/LuxeBackdrop.tsx
"use client";

import React from "react";

export default function LuxeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Nebula (A) */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[560px] w-[560px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
      <div className="absolute top-28 right-[-160px] h-[520px] w-[520px] rounded-full bg-[#22d3ee]/10 blur-3xl" />
      <div className="absolute bottom-[-180px] left-[-160px] h-[620px] w-[620px] rounded-full bg-[#a78bfa]/10 blur-3xl" />

      {/* Constellation dust */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.10) 1px, transparent 1.6px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08) 1px, transparent 1.6px), radial-gradient(circle at 45% 75%, rgba(255,255,255,0.06) 1px, transparent 1.6px)",
          backgroundSize: "240px 240px, 320px 320px, 280px 280px",
          backgroundPosition: "0 0, 20px 60px, 80px 120px",
        }}
      />

      {/* Micro-grid (B accents only, ultra subtle) */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />
    </div>
  );
}
