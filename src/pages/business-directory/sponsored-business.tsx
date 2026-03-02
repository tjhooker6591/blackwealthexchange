"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/legacy/image";

const ITEMS_PER_PAGE = 9;

type Business = {
  _id: string;
  name: string;
  description: string;
  slug: string;
  logo?: string;
  tier: string;

  // new (expected from API)
  category?: string | string[];
  categories?: string | string[];
  city?: string;
  state?: string;
};

function normalizeCategories(b: Business): string[] {
  const raw = b.categories ?? b.category;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  // support comma-separated
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SponsoredBusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // NEW: discovery tools
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const res = await fetch("/api/sponsored-businesses");
        const data = await res.json();
        setBusinesses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load sponsored businesses:", e);
        setBusinesses([]);
      }
    };
    fetchSponsors();
  }, []);

  // Build filter options
  const categories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) =>
      normalizeCategories(b).forEach((c) => set.add(c)),
    );
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [businesses]);

  const states = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => {
      if (b.state) set.add(String(b.state).trim());
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [businesses]);

  // Apply filters to both Top + Standard lists (substance: people can actually find sponsors)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return businesses.filter((b) => {
      const name = (b.name || "").toLowerCase();
      const desc = (b.description || "").toLowerCase();
      const city = (b.city || "").toLowerCase();
      const state = (b.state || "").toLowerCase();
      const cats = normalizeCategories(b).map((c) => c.toLowerCase());

      const matchesQuery =
        !query ||
        name.includes(query) ||
        desc.includes(query) ||
        city.includes(query) ||
        state.includes(query) ||
        cats.some((c) => c.includes(query));

      const matchesCategory =
        categoryFilter === "All" ||
        normalizeCategories(b).some((c) => c === categoryFilter);

      const matchesState =
        stateFilter === "All" || (b.state || "") === stateFilter;

      return matchesQuery && matchesCategory && matchesState;
    });
  }, [businesses, q, categoryFilter, stateFilter]);

  const topSponsors = filtered.filter((b) => b.tier === "top");
  const standardSponsors = filtered.filter((b) => b.tier !== "top");

  // Pagination (only for standard sponsors)
  const totalPages = Math.max(
    1,
    Math.ceil(standardSponsors.length / ITEMS_PER_PAGE),
  );
  const currentItems = standardSponsors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, categoryFilter, stateFilter]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Soft gold glow like index */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
        <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute left-20 bottom-20 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gold">
              Sponsored Business Directory
            </h1>
            <p className="mt-2 text-sm md:text-base text-white/70 max-w-3xl">
              Discover and support Black-owned businesses featured on our
              platform. Use search and filters to find sponsors by category and
              location.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              ← Back
            </Link>
            <Link
              href="/advertise-with-us"
              className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
            >
              Become a Sponsor
            </Link>
          </div>
        </div>

        {/* NEW: Discovery tools */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs text-white/60 mb-1">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, category, city, state…"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs text-white/60 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs text-white/60 mb-1">State</label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/60">
              Showing <span className="text-white">{filtered.length}</span>{" "}
              sponsored listings •{" "}
              <span className="text-white">{topSponsors.length}</span> top
              sponsors
            </div>

            <button
              onClick={() => {
                setQ("");
                setCategoryFilter("All");
                setStateFilter("All");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Top Sponsors */}
        {topSponsors.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Top Sponsors
              </h2>
              <span className="text-xs text-white/60">Priority placement</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topSponsors.map((biz) => {
                const cats = normalizeCategories(biz);
                return (
                  <div
                    key={biz._id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#D4AF37]/14 to-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:border-white/20 transition"
                  >
                    <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-bold text-gold">
                      Top Sponsor
                    </div>

                    <div className="relative h-44 w-full">
                      <Image
                        src={biz.logo || "/ads/default-banner.jpg"}
                        alt={biz.name}
                        layout="fill"
                        objectFit="cover"
                        className="opacity-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        {biz.name}
                      </h3>

                      {/* NEW: location */}
                      {(biz.city || biz.state) && (
                        <p className="mt-1 text-xs text-white/60">
                          {[biz.city, biz.state].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {/* NEW: category chips */}
                      {cats.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cats.slice(0, 3).map((c) => (
                            <span
                              key={c}
                              className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70"
                            >
                              {c}
                            </span>
                          ))}
                          {cats.length > 3 && (
                            <span className="text-[11px] text-white/50">
                              +{cats.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {biz.description}
                      </p>

                      <div className="mt-4">
                        <Link
                          href={`/business/${biz.slug}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                        >
                          View Business
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Standard Sponsors */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Featured Sponsored Listings
            </h2>
            <span className="text-xs text-white/60">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {currentItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
              No sponsored businesses match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((biz) => {
                const cats = normalizeCategories(biz);
                return (
                  <div
                    key={biz._id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:border-white/20 transition"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={biz.logo || "/ads/default-banner.jpg"}
                        alt={biz.name}
                        layout="fill"
                        objectFit="cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    <div className="p-4">
                      <h3 className="text-base md:text-lg font-bold text-white">
                        {biz.name}
                      </h3>

                      {(biz.city || biz.state) && (
                        <p className="mt-1 text-xs text-white/60">
                          {[biz.city, biz.state].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {cats.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cats.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70"
                            >
                              {c}
                            </span>
                          ))}
                          {cats.length > 2 && (
                            <span className="text-[11px] text-white/50">
                              +{cats.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {biz.description}
                      </p>

                      <div className="mt-4">
                        <Link
                          href={`/business/${biz.slug}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                        >
                          View Business
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pagination */}
        {standardSponsors.length > ITEMS_PER_PAGE && (
          <div className="mt-10 flex justify-center items-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition"
            >
              Previous
            </button>

            <span className="text-sm text-white/70">
              Page <span className="text-white">{currentPage}</span> of{" "}
              <span className="text-white">{totalPages}</span>
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition"
            >
              Next
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-gold">
            Want to See Your Business Here?
          </h3>
          <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
            Sponsored placement increases visibility across the platform and
            helps fund free access to tools and discovery for the community.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/advertise-with-us"
              className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 transition"
            >
              Become a Sponsor
            </Link>
            <Link
              href="/business-directory"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
