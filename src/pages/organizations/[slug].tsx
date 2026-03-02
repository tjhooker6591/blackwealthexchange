// pages/organizations/[slug].tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type OrgItem = {
  _id: string;
  id?: string;
  slug?: string;

  name?: string;
  description?: string;

  orgType?: string; // "church"
  entityType?: string; // "organization"
  status?: string; // "approved" etc.
  source?: string;

  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;

  alias?: string;

  updatedAt?: string;
};

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeWebsite(url?: string) {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function formatUpdatedAt(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrganizationDetailPage() {
  const router = useRouter();
  const slug = useMemo(() => {
    const raw = router.query.slug;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.slug]);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<OrgItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!slug) return;

    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/organizations/${encodeURIComponent(String(slug))}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const data = await res.json().catch(() => null);

        if (!alive) return;

        if (!res.ok || !data?.ok) {
          setItem(null);
          setError(
            data?.error || `Failed to load organization (${res.status}).`,
          );
          setLoading(false);
          return;
        }

        setItem(data.item || null);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setItem(null);
        setError(e?.message || "Failed to load organization.");
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [router.isReady, slug]);

  const website = safeWebsite(item?.website);
  const updatedAt = formatUpdatedAt(item?.updatedAt);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top subtle gradient */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition"
          >
            <span className="text-yellow-400">←</span>
            <span className="text-sm">Back</span>
          </button>

          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition underline underline-offset-4"
          >
            Home
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] p-6">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-2/3 bg-white/10 rounded mb-4" />
              <div className="h-4 w-1/3 bg-white/10 rounded mb-2" />
              <div className="h-4 w-1/2 bg-white/10 rounded mb-6" />
              <div className="h-24 bg-white/10 rounded" />
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="text-lg font-semibold text-yellow-300">
                Not available
              </div>
              <div className="text-white/70">{error}</div>
              <div className="pt-2">
                <button
                  onClick={() => router.back()}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition"
                >
                  Go back
                </button>
              </div>
            </div>
          ) : !item ? (
            <div className="text-white/70">No organization found.</div>
          ) : (
            <>
              {/* Title + badges */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-yellow-300">
                    {item.name || "Organization"}
                  </h1>

                  <div className="mt-2 text-white/70">
                    {[item.city, item.state].filter(Boolean).join(", ")}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.orgType ? (
                      <span className="text-xs rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                        {item.orgType}
                      </span>
                    ) : null}
                    {item.status ? (
                      <span className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                        {item.status}
                      </span>
                    ) : null}
                    {updatedAt ? (
                      <span className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
                        Updated {updatedAt}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-yellow-500 text-black font-semibold px-4 py-2 hover:bg-yellow-400 transition"
                    >
                      Visit Website
                    </a>
                  ) : null}

                  {item.phone ? (
                    <a
                      href={`tel:${String(item.phone).replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 transition"
                    >
                      Call
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Content grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* About */}
                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-sm font-semibold text-white/90 mb-2">
                    About
                  </div>
                  <div className="text-white/75 leading-relaxed">
                    {item.description && item.description.trim().length > 0
                      ? item.description
                      : "No description available yet."}
                  </div>
                </div>

                {/* Contact / Location */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                  <div className="text-sm font-semibold text-white/90">
                    Contact
                  </div>

                  <div className="text-sm text-white/75">
                    <div className="text-white/60">Address</div>
                    <div>
                      {item.address
                        ? item.address
                        : [item.city, item.state].filter(Boolean).join(", ") ||
                          "—"}
                    </div>
                  </div>

                  <div className="text-sm text-white/75">
                    <div className="text-white/60">Phone</div>
                    <div>{item.phone || "—"}</div>
                  </div>

                  <div className="text-sm text-white/75">
                    <div className="text-white/60">Website</div>
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-300 hover:text-yellow-200 underline underline-offset-4"
                      >
                        {website}
                      </a>
                    ) : (
                      <div>—</div>
                    )}
                  </div>

                  {item.source ? (
                    <div className="pt-2 text-xs text-white/50">
                      Source: {item.source}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer space */}
        <div className="mt-8 text-center text-xs text-white/40">
          BWE Organizations Directory
        </div>
      </div>
    </div>
  );
}
