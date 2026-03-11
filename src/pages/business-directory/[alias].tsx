import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Business = {
  business_name?: string;
  name?: string;
  categories?: string | string[];
  address?: string;
  city?: string;
  state?: string;
  description?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  verified?: boolean;
  isVerified?: boolean;
  status?: string;
  amountPaid?: number;
  completenessScore?: number;
  isComplete?: boolean;
};

function safeStr(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
}

function getTitle(b: Business) {
  return safeStr(b.business_name) || safeStr(b.name) || "Business";
}

function toCategoryText(v: Business["categories"]) {
  if (Array.isArray(v))
    return v
      .map((x) => safeStr(x))
      .filter(Boolean)
      .join(", ");
  return safeStr(v);
}

function safeWebsite(url?: string) {
  const u = safeStr(url);
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/flow-events";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function BusinessDetail() {
  const router = useRouter();
  const alias = useMemo(() => {
    const raw = router.query.alias;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.alias]);

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const source = useMemo(() => {
    const raw = router.query.from;
    return Array.isArray(raw) ? raw[0] : raw || "directory";
  }, [router.query.from]);

  useEffect(() => {
    if (!router.isReady || !alias) return;

    let active = true;
    const ctrl = new AbortController();

    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/getBusiness?alias=${encodeURIComponent(alias)}`,
          {
            signal: ctrl.signal,
          },
        );

        const data = await res.json().catch(() => null);
        if (!active) return;

        if (!res.ok || !data) {
          setBusiness(null);
          setError(`Could not load this business (${res.status}).`);
          setIsLoading(false);
          return;
        }

        setBusiness(data as Business);
        setIsLoading(false);
      } catch (err: any) {
        if (!active || err?.name === "AbortError") return;
        setBusiness(null);
        setError("Could not load this business. Please retry.");
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      ctrl.abort();
    };
  }, [router.isReady, alias]);

  useEffect(() => {
    if (!business || !alias) return;
    trackFlowEvent({
      eventType: "business_detail_view",
      businessAlias: alias,
      source,
    });
  }, [business, alias, source]);

  const website = safeWebsite(business?.website);
  const categoryText = toCategoryText(business?.categories);
  const placeLine = [safeStr(business?.city), safeStr(business?.state)]
    .filter(Boolean)
    .join(", ");
  const locationText = [safeStr(business?.address), placeLine]
    .filter(Boolean)
    .join(", ");
  const hasLatLng =
    typeof business?.latitude === "number" &&
    typeof business?.longitude === "number";
  const mapQuery = hasLatLng
    ? `${business?.latitude},${business?.longitude}`
    : locationText;

  const status = safeStr(business?.status).toLowerCase();
  const trust = {
    verified:
      business?.verified === true ||
      business?.isVerified === true ||
      status === "verified",
    approved: status === "approved" || status === "verified" || !status,
    sponsored: Number(business?.amountPaid || 0) > 0,
    complete:
      typeof business?.isComplete === "boolean"
        ? business.isComplete
        : Number(business?.completenessScore || 0) >= 70,
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#D4AF37]/16 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[40rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]"
          >
            <span className="text-[#D4AF37]">←</span>
            Back
          </button>

          <div className="flex items-center gap-3 text-sm">
            {source === "search-results" && safeStr(router.query.q) ? (
              <Link
                href={`/search-results?search=${encodeURIComponent(safeStr(router.query.q))}`}
                className="text-white/70 underline underline-offset-4 transition hover:text-white"
              >
                Back to search results
              </Link>
            ) : null}
            <Link
              href="/business-directory"
              className="text-white/65 underline underline-offset-4 transition hover:text-white"
            >
              Directory
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] via-white/[0.035] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_80px_rgba(0,0,0,0.5)]">
          {isLoading ? (
            <div className="p-6 md:p-8">
              <div className="mb-4 h-8 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mb-6 h-4 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-white/10" />
                <div className="h-4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ) : error ? (
            <div className="p-6 md:p-8">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            </div>
          ) : !business ? (
            <div className="p-6 md:p-8 text-white/70">
              <div className="text-white/80 font-semibold">Business not found.</div>
              <p className="mt-1 text-sm text-white/55">
                This listing may have moved or the search query was too narrow.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {safeStr(router.query.q) ? (
                  <Link
                    href={`/search-results?search=${encodeURIComponent(safeStr(router.query.q))}`}
                    className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-extrabold text-black"
                  >
                    Back to Search Results
                  </Link>
                ) : null}
                <Link
                  href="/business-directory"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80"
                >
                  Browse Full Directory
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-white/10 p-6 md:p-8">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[#D4AF37]/90">
                  Business profile
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#F1D57A] md:text-3xl">
                  {getTitle(business)}
                </h1>

                <div className="mt-2 text-sm text-white/70">
                  {[categoryText, placeLine || safeStr(business.address)]
                    .filter(Boolean)
                    .join(" • ") || "Black-owned business"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {trust.verified ? (
                    <span className="rounded-full border border-emerald-400/35 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                      Verified
                    </span>
                  ) : trust.approved ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
                      Approved listing
                    </span>
                  ) : null}
                  {trust.sponsored && (
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                      Sponsored
                    </span>
                  )}
                  {!trust.complete && (
                    <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-200">
                      Incomplete profile
                    </span>
                  )}
                </div>
              </header>

              <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                <article className="md:col-span-2 rounded-2xl border border-white/12 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                    About
                  </h2>
                  <p className="leading-relaxed text-white/75">
                    {safeStr(business.description) ||
                      "No description available yet."}
                  </p>
                </article>

                <aside className="space-y-3 rounded-2xl border border-white/12 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div className="text-sm">
                    <div className="text-white/55">Address</div>
                    <div className="text-white/80 font-medium">
                      {safeStr(business.address) || placeLine || "—"}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-white/55">Phone</div>
                    <div className="text-white/80">
                      {safeStr(business.phone) || "—"}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-white/55">Website</div>
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[#D4AF37] underline underline-offset-4 hover:text-yellow-300"
                      >
                        {website}
                      </a>
                    ) : (
                      <div className="text-white/80">—</div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackFlowEvent({
                            eventType: "outbound_website_click",
                            businessAlias: alias,
                            source,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-extrabold text-black transition hover:bg-yellow-500"
                      >
                        Visit website
                      </a>
                    )}
                    {safeStr(business.phone) && (
                      <a
                        href={`tel:${safeStr(business.phone).replace(/\s+/g, "")}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/[0.08]"
                      >
                        Call
                      </a>
                    )}
                    {mapQuery ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackFlowEvent({
                            eventType: "directions_click",
                            businessAlias: alias,
                            source,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/[0.08]"
                      >
                        Directions
                      </a>
                    ) : null}
                  </div>

                  <div className="pt-2 text-xs text-white/60 space-y-2">
                    <div>Next actions</div>
                    <div className="flex flex-wrap gap-2">
                      {categoryText ? (
                        <Link
                          href={`/business-directory?search=${encodeURIComponent(categoryText)}`}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 hover:bg-white/[0.08]"
                        >
                          Similar in {categoryText}
                        </Link>
                      ) : null}
                      {safeStr(business.state) ? (
                        <Link
                          href={`/business-directory?state=${encodeURIComponent(safeStr(business.state))}`}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 hover:bg-white/[0.08]"
                        >
                          More in {safeStr(business.state)}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>

              {mapQuery && (
                <div className="border-t border-white/10 p-6 md:p-8">
                  <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                    Find on map
                  </h3>
                  {locationText ? (
                    <p className="mb-3 text-xs text-white/55">{locationText}</p>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=es;z=14&output=embed`}
                      width="100%"
                      height="280"
                      frameBorder="0"
                      style={{ border: 0 }}
                      allowFullScreen
                      title="Business location map"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
