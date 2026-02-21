"use client";

import React from "react";
import Link from "next/link";
import GlobalBlackHistoryTimeline from "@/components/GlobalBlackHistoryTimeline";

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

export default function GlobalTimelinePage() {
  return (
    <main className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 tracking-tight">
              Global Black History Timeline
            </h1>
            <p className="text-gray-300 mt-1">
              A curated timeline to educate, connect, and strengthen our shared
              history.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Home
            </Link>
            <Link
              href="/resources"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Resources
            </Link>
          </div>
        </header>

        {/* Timeline */}
        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/40 shadow-xl">
          <GlobalBlackHistoryTimeline />
        </section>
      </div>
    </main>
  );
}
