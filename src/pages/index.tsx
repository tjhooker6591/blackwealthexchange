"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ComponentType,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { canonicalUrl, getBaseUrl, truncateMeta } from "@/lib/seo";
import {
  Sparkles,
  Search,
  ShoppingBag,
  Newspaper,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { normalizeScope } from "@/lib/directory/queryState";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { FEATURED_SPONSOR_RAIL_CAP } from "@/lib/advertising/placementDefinitions";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** -----------------------------
 *  TOOLS (Filters) — inline panel
 *  ----------------------------- */
function SearchToolsInlinePanel({
  verifiedOnly,
  onVerifiedOnly,
  sponsoredFirst,
  onSponsoredFirst,
  stateFilter,
  onStateFilter,
  sort,
  onSort,
  category,
  onCategory,
}: {
  verifiedOnly: boolean;
  onVerifiedOnly: (v: boolean) => void;
  sponsoredFirst: boolean;
  onSponsoredFirst: (v: boolean) => void;
  stateFilter: string;
  onStateFilter: (v: string) => void;
  sort: "relevance" | "newest" | "completeness";
  onSort: (v: "relevance" | "newest" | "completeness") => void;
  category: string;
  onCategory: (v: string) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-extrabold tracking-wide text-white/70">
          Filters
        </div>
        <div className="text-[11px] text-white/45">Applies to Directory</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <span className="font-semibold text-white/80">Verified only</span>
          <button
            type="button"
            onClick={() => onVerifiedOnly(!verifiedOnly)}
            className={cx(
              "relative h-6 w-11 rounded-full border transition",
              verifiedOnly
                ? "border-emerald-400/40 bg-emerald-400/20"
                : "border-white/10 bg-black/30",
            )}
            aria-pressed={verifiedOnly}
            title="Show verified listings only"
          >
            <span
              className={cx(
                "absolute top-0.5 h-5 w-5 rounded-full transition",
                verifiedOnly ? "left-5 bg-emerald-300" : "left-0.5 bg-white/60",
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <span className="font-semibold text-white/80">Sponsored first</span>
          <button
            type="button"
            onClick={() => onSponsoredFirst(!sponsoredFirst)}
            className={cx(
              "relative h-6 w-11 rounded-full border transition",
              sponsoredFirst
                ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
                : "border-white/10 bg-black/30",
            )}
            aria-pressed={sponsoredFirst}
            title="Boost sponsored listings"
          >
            <span
              className={cx(
                "absolute top-0.5 h-5 w-5 rounded-full transition",
                sponsoredFirst ? "left-5 bg-[#D4AF37]" : "left-0.5 bg-white/60",
              )}
            />
          </button>
        </label>

        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[11px] font-bold text-white/55">
            State (optional)
          </div>
          <input
            value={stateFilter}
            onChange={(e) =>
              onStateFilter(e.target.value.toUpperCase().slice(0, 2))
            }
            placeholder="CA"
            className="mt-1 w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[11px] font-bold text-white/55">Sort</div>
          <select
            value={sort}
            onChange={(e) =>
              onSort(e.target.value as "relevance" | "newest" | "completeness")
            }
            className="mt-1 w-full bg-transparent text-sm text-white outline-none"
          >
            <option value="relevance">Relevance (best match)</option>
            <option value="newest">Newest</option>
            <option value="completeness">Completeness</option>
          </select>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[11px] font-bold text-white/55">
            Category (optional)
          </div>
          <input
            value={category}
            onChange={(e) => onCategory(e.target.value)}
            placeholder='e.g. "Barbershop", "Restaurant", "Church"'
            className="mt-1 w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
          />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-white/45">
        Tip: Filters are optional. Use them only when you want to narrow
        results.
      </div>
    </div>
  );
}

/** -----------------------------
 *  MODAL COMPONENT
 *  ----------------------------- */
function ConsultingInterestModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/consulting-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName("");
        setEmail("");
        onClose();
      }, 1400);
    } catch {
      setError("Could not submit. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/90 p-6 shadow-2xl backdrop-blur">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[26rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/15 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg px-2 py-1 text-xl font-bold leading-none text-white/60 transition hover:text-[#D4AF37]"
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <h2 className="text-lg font-extrabold tracking-tight text-white">
          Notify Me <span className="text-[#D4AF37]">Consulting</span>
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Get notified when BWE Recruiting & Consulting launches.
        </p>

        <div className="mt-5">
          {submitted ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center font-semibold text-emerald-300">
              Thank you! We will notify you at launch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/25"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Your Email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/25"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-center text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#D4AF37] py-2.5 font-extrabold text-black shadow transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** -----------------------------
 *  ECONOMIC IMPACT (2026 projection)
 *  ----------------------------- */
const EconomicImpactSimulator = () => {
  const currentYear = 2026;
  const projected = 2_100_000_000_000;
  const baseline = 300_000_000_000;
  const current = 1_700_000_000_000;
  const perDay = 4_200_000_000;
  const perSecond = 48_000;
  const recapturePct = 5;
  const recaptureValue = projected * (recapturePct / 100);
  const bars = [24, 30, 38, 45, 42, 56, 61, 58, 69, 74, 80, 88];

  const formatCurrency = (num: number) =>
    num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <section className="relative overflow-hidden py-2 sm:py-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_88%_76%,rgba(212,175,55,0.13),transparent_40%)]" />

      <div className="relative grid gap-3 rounded-xl border border-white/10 bg-[#05090c]/92 p-2 shadow-[0_12px_34px_rgba(0,0,0,0.42)] backdrop-blur sm:p-3.5 lg:grid-cols-[0.38fr_0.62fr] lg:items-stretch">
        <div className="min-w-0 lg:pr-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-wide text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            BUYING POWER (ANNUAL ESTIMATE)
          </div>

          <h2 className="mt-1.5 text-sm font-extrabold tracking-[0.01em] text-white sm:mt-2 sm:text-xl">
            African American Buying Power{" "}
            <span className="text-[#D4AF37]">({currentYear})</span>
          </h2>

          <p className="mt-1.5 text-xs text-white/78 sm:text-sm">
            Black buying power is massive. Most flow exits our ecosystem.
            Redirecting a small share into BWE creates major retained impact.
          </p>

          <div className="mt-2 text-[1.7rem] font-black tracking-tight text-[#D4AF37] tabular-nums sm:text-4xl">
            {formatCurrency(projected)}
          </div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/56 sm:text-[11px]">
            Annual Buying Power
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <p className="text-white/55">Baseline (2010)</p>
              <p className="font-semibold text-white">
                {formatCurrency(baseline)}
              </p>
              <p className="mt-0.5 text-white/55">Current</p>
              <p className="font-semibold text-white">
                {formatCurrency(current)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <p className="text-white/55">Daily flow</p>
              <p className="font-semibold text-white">
                {formatCurrency(perDay)} / day
              </p>
              <p className="mt-0.5 text-white/55">Second-level flow</p>
              <p className="font-semibold text-white">
                {formatCurrency(perSecond)} / sec
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="mb-1.5 text-center text-[10px] font-medium tracking-wide text-white/66 sm:mb-2 sm:text-[11px]">
            Spending Flow Progress
          </div>

          <div className="viz-shell relative h-[168px] overflow-hidden rounded-lg border border-white/12 bg-[#060b10]/90 p-2 sm:h-[208px] sm:p-2.5">
            <div className="viz-grid pointer-events-none absolute inset-0" />
            <div className="ambient-shift pointer-events-none absolute inset-0" />
            <div className="recapture-zone pointer-events-none absolute inset-y-0 right-0 w-[28%]" />

            <svg
              viewBox="0 0 120 70"
              className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)]"
              preserveAspectRatio="none"
            >
              {bars.map((h, i) => {
                const x = 6 + i * 9.1;
                const y = 64 - h * 0.58;
                return (
                  <rect
                    key={x}
                    x={x}
                    y={y}
                    width="5.1"
                    height={h * 0.58}
                    rx="0.8"
                    fill={
                      i > 8 ? "rgba(212,175,55,0.58)" : "rgba(16,185,129,0.52)"
                    }
                  />
                );
              })}

              <path
                d="M8 50 C 20 45, 30 42, 42 38 C 55 33, 67 29, 80 24 C 92 20, 101 17, 112 14"
                fill="none"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.2"
              />
              <path
                d="M8 50 C 20 45, 30 42, 42 38 C 55 33, 67 29, 80 24 C 92 20, 101 17, 112 14"
                fill="none"
                stroke="url(#flowGradient)"
                strokeWidth="2.2"
              />

              <defs>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(16,185,129,0.7)" />
                  <stop offset="70%" stopColor="rgba(16,185,129,1)" />
                  <stop offset="100%" stopColor="rgba(212,175,55,0.92)" />
                </linearGradient>
              </defs>

              <circle cx="8" cy="50" r="1.8" fill="rgba(255,255,255,0.88)" />
              <circle cx="80" cy="24" r="2" fill="rgba(16,185,129,1)" />
              <circle cx="112" cy="14" r="2.2" fill="rgba(212,175,55,1)" />

              <circle r="2.6" fill="rgba(255,255,255,0.96)">
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  path="M8 50 C 20 45, 30 42, 42 38 C 55 33, 67 29, 80 24 C 92 20, 101 17, 112 14"
                />
              </circle>
            </svg>

            <div className="leak leak-1" aria-hidden>
              →
            </div>
            <div className="leak leak-2" aria-hidden>
              →
            </div>
            <div className="leak leak-3" aria-hidden>
              →
            </div>

            <div className="absolute bottom-1 left-2 right-2 grid grid-cols-3 text-center text-[9px] text-white/66 sm:text-[10px]">
              <span>Baseline</span>
              <span>Current</span>
              <span>Projected</span>
            </div>

            <div className="absolute right-2 top-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-2 py-1 text-[9px] font-medium text-[#D4AF37] sm:text-[10px]">
              BWE Recapture Opportunity
            </div>

            <div className="absolute left-2 top-2 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[9px] text-white/68 sm:text-[10px]">
              Black Spending Power → Outside Economy Flow
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/8 px-3 py-1.5 text-center text-[10px] text-white/86 sm:py-2 sm:text-[11px]">
            <span className="font-semibold text-[#D4AF37]">
              If {recapturePct}% stays within our ecosystem →{" "}
              {formatCurrency(recaptureValue)} retained annually
            </span>
          </div>

          <div className="mt-1.5 grid w-full gap-2 sm:mt-2 sm:grid-cols-2 sm:gap-3">
            <Link
              href="/1.8trillionimpact"
              className="group inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-center shadow-sm transition hover:border-[#D4AF37]/80 hover:bg-gradient-to-r hover:from-[#D4AF37]/20 hover:to-emerald-400/10 sm:px-4 sm:py-2.5"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold tracking-wide text-[#D4AF37] sm:text-sm">
                  Knowledge is Power
                </span>
                <span className="truncate text-[10px] text-white/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white sm:text-sm">
                  Where the money goes →
                </span>
              </div>
            </Link>

            <Link
              href="/economic-freedom"
              className="group inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-center transition hover:border-[#D4AF37]/30 hover:bg-gradient-to-r hover:from-white/10 hover:to-[#D4AF37]/10 sm:px-4 sm:py-2.5"
            >
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold tracking-wide text-[#D4AF37] sm:text-sm">
                  Economic Slavery
                </span>
                <span className="truncate text-[10px] text-white/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white sm:text-sm">
                  Learn more →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .viz-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 20px 20px;
          opacity: 0.32;
        }

        .ambient-shift {
          background: linear-gradient(
            105deg,
            transparent 8%,
            rgba(16, 185, 129, 0.16) 42%,
            rgba(212, 175, 55, 0.14) 72%,
            transparent 92%
          );
          background-size: 230% 100%;
          animation: ambientMove 8s ease-in-out infinite;
          opacity: 0.45;
        }

        .recapture-zone {
          background: linear-gradient(
            90deg,
            rgba(212, 175, 55, 0.04),
            rgba(212, 175, 55, 0.22)
          );
          border-left: 1px solid rgba(212, 175, 55, 0.24);
        }

        .leak {
          position: absolute;
          right: 7%;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.55);
          animation: leakFlow 1.9s linear infinite;
        }

        .leak-1 {
          top: 40%;
          animation-delay: 0s;
        }

        .leak-2 {
          top: 48%;
          animation-delay: 0.5s;
        }

        .leak-3 {
          top: 56%;
          animation-delay: 1s;
        }

        @keyframes ambientMove {
          0% {
            background-position: 118% 0;
          }
          100% {
            background-position: -24% 0;
          }
        }

        @keyframes leakFlow {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translateX(18px);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};

type VerticalKey = "all" | "shopping" | "news";

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cx(
        "inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg sm:rounded-xl border px-2 py-2 sm:px-3 sm:py-2 text-[10px] sm:text-[12px] font-extrabold tracking-wide transition",
        active
          ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
          : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
      )}
    >
      <Icon
        className={cx(
          "h-3.5 w-3.5 sm:h-4 sm:w-4",
          active ? "text-[#D4AF37]" : "text-white/70",
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [aiMode, setAiMode] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const [vertical, setVertical] = useState<VerticalKey>("all");

  const [leftScope, setLeftScope] = useState<"businesses" | "organizations">(
    "businesses",
  );

  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sponsoredFirst, setSponsoredFirst] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [sort, setSort] = useState<"relevance" | "newest" | "completeness">(
    "relevance",
  );
  const [category, setCategory] = useState("");

  const router = useRouter();
  const { user } = useAuth();

  const trackHomepageEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/",
      section: "homepage",
      isAuthenticated: Boolean(user),
      accountType: user?.accountType || "anonymous",
      environment: process.env.NODE_ENV || "unknown",
      ...extras,
    });
  };

  const placeholder =
    vertical !== "all"
      ? vertical === "shopping"
        ? "Search products…"
        : "Search news…"
      : leftScope === "organizations"
        ? "Search churches, nonprofits, orgs…"
        : "Search Black-owned businesses…";

  const runSearch = (opts?: {
    verticalOverride?: VerticalKey;
    aiOverride?: boolean;
    scopeOverride?: "businesses" | "organizations";
    queryOverride?: string;
  }) => {
    const v = opts?.verticalOverride ?? vertical;
    const ai = opts?.aiOverride ?? aiMode;
    const scope = normalizeScope(opts?.scopeOverride ?? leftScope) as
      | "businesses"
      | "organizations";
    const q = (opts?.queryOverride ?? searchQuery).trim();

    if (v === "shopping") {
      return router.push({
        pathname: "/marketplace",
        query: q
          ? { q, search: q, ai: ai ? "1" : "0" }
          : { ai: ai ? "1" : "0" },
      });
    }

    if (v === "news") {
      return router.push({
        pathname: "/news",
        query: q ? { q, ai: ai ? "1" : "0" } : { ai: ai ? "1" : "0" },
      });
    }

    if (!q) {
      return router.push({
        pathname: "/business-directory",
        query: {
          q: "",
          search: "",
          scope,
          type: scope,
          tab: scope,
          verifiedOnly: verifiedOnly ? "1" : "0",
          sponsoredFirst: sponsoredFirst ? "1" : "0",
          sort,
          state: stateFilter.trim().toUpperCase(),
          ...(category.trim() ? { category: category.trim() } : {}),
          ai: ai ? "1" : "0",
        },
      });
    }

    return router.push({
      pathname: "/business-directory",
      query: {
        q,
        search: q,
        scope,
        type: scope,
        tab: scope,
        verifiedOnly: verifiedOnly ? "1" : "0",
        sponsoredFirst: sponsoredFirst ? "1" : "0",
        sort,
        state: stateFilter.trim().toUpperCase(),
        ...(category.trim() ? { category: category.trim() } : {}),
        ai: ai ? "1" : "0",
      },
    });
  };

  const submitHomepageSearch = (
    trigger: string,
    queryOverride?: string,
    opts?: {
      verticalOverride?: VerticalKey;
      scopeOverride?: "businesses" | "organizations";
    },
  ) => {
    const q = (queryOverride ?? searchQuery).trim();
    const trackedVertical = opts?.verticalOverride ?? vertical;
    const trackedScope = opts?.scopeOverride ?? leftScope;

    trackHomepageEvent("homepage_search_submitted", {
      section: "hero_search",
      source: "homepage_search_box",
      query: q,
      ctaId: "homepage_search_submit",
      ctaLabel: trigger,
      destination:
        trackedVertical === "shopping"
          ? "/marketplace"
          : trackedVertical === "news"
            ? "/news"
            : "/business-directory",
      vertical: trackedVertical,
      aiMode,
      scope: trackedScope,
    });

    runSearch({
      queryOverride: queryOverride ?? searchQuery,
      verticalOverride: opts?.verticalOverride,
      scopeOverride: opts?.scopeOverride,
    });
  };

  const onToggleAi = () => {
    const next = !aiMode;
    setAiMode(next);
    runSearch({ aiOverride: next });
  };

  const stableSponsorFallback = useMemo(() => [], []);

  const [sponsors, setSponsors] = useState<
    Array<{ img: string; name: string; url?: string; tagline?: string }>
  >([]);
  const [homepageBanner, setHomepageBanner] = useState<{
    id: string;
    image: string;
    name: string;
    tagline: string;
    targetUrl: string;
  } | null>(null);
  const [sponsorFeedLoaded, setSponsorFeedLoaded] = useState(false);
  const [trustStats, setTrustStats] = useState<{
    businesses: number | null;
    organizations: number | null;
    opportunities: number | null;
    products: number | null;
  }>({
    businesses: null,
    organizations: null,
    opportunities: null,
    products: null,
  });
  const [featuredJobs, setFeaturedJobs] = useState<
    Array<{
      _id: string;
      title: string;
      company: string;
      location: string;
      type: string;
      createdAt?: string;
      isFeatured?: boolean;
    }>
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const [sponsorsRes, placementsRes] = await Promise.all([
          fetch("/api/sponsored-businesses", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/advertising/public-placements", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const data = await sponsorsRes.json().catch(() => ({}));
        if (!sponsorsRes.ok || !Array.isArray(data?.sponsors) || cancelled) {
          if (!cancelled) setSponsors([]);
        } else {
          const normalized = data.sponsors.map((s: any) => ({
            img:
              typeof s?.img === "string" && s.img
                ? s.img
                : "/default-image.jpg",
            name:
              typeof s?.name === "string" && s.name
                ? s.name
                : "Featured Sponsor",
            url: typeof s?.url === "string" ? s.url : undefined,
            tagline: typeof s?.tagline === "string" ? s.tagline : undefined,
          }));

          setSponsors(normalized);
        }

        const placementData = await placementsRes.json().catch(() => ({}));
        if (!cancelled && placementsRes.ok) {
          const topBanner = Array.isArray(
            placementData?.placements?.bannerHomepageTop,
          )
            ? placementData.placements.bannerHomepageTop[0]
            : null;

          if (topBanner) {
            setHomepageBanner({
              id: String(topBanner.id || "banner-homepage-top"),
              image:
                typeof topBanner.image === "string" && topBanner.image
                  ? topBanner.image
                  : "/default-image.jpg",
              name:
                typeof topBanner.name === "string" && topBanner.name
                  ? topBanner.name
                  : "Homepage Banner",
              tagline:
                typeof topBanner.tagline === "string"
                  ? topBanner.tagline
                  : "Sponsored campaign",
              targetUrl:
                typeof topBanner.targetUrl === "string" && topBanner.targetUrl
                  ? topBanner.targetUrl
                  : "#",
            });
          } else {
            setHomepageBanner(null);
          }
        }
      } catch {
        if (!cancelled) {
          setSponsors([]);
          setHomepageBanner(null);
        }
      } finally {
        if (!cancelled) setSponsorFeedLoaded(true);
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stableSponsorFallback]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const [businessesRes, orgsRes, jobsRes, productsRes] =
          await Promise.all([
            fetch("/api/search/businesses?type=businesses&limit=1&page=1", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/search/businesses?type=organizations&limit=1&page=1", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/jobs/list?limit=300", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/marketplace/get-products?limit=1&page=1", {
              cache: "no-store",
              signal: controller.signal,
            }),
          ]);

        const [businessesData, orgsData, jobsData, productsData] =
          await Promise.all([
            businessesRes.json().catch(() => null),
            orgsRes.json().catch(() => null),
            jobsRes.json().catch(() => null),
            productsRes.json().catch(() => null),
          ]);

        if (cancelled) return;

        const jobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];

        setTrustStats({
          businesses: Number.isFinite(Number(businessesData?.total))
            ? Number(businessesData.total)
            : null,
          organizations: Number.isFinite(Number(orgsData?.total))
            ? Number(orgsData.total)
            : null,
          opportunities: jobs.length,
          products: Number.isFinite(Number(productsData?.total))
            ? Number(productsData.total)
            : null,
        });

        setFeaturedJobs(
          jobs
            .filter((j: any) => Boolean(j?.isFeatured))
            .slice(0, 4)
            .map((j: any) => ({
              _id: String(j._id),
              title: String(j.title || "Featured role"),
              company: String(j.company || "Hiring Company"),
              location: String(j.location || "Location flexible"),
              type: String(j.type || "Role"),
              createdAt:
                typeof j.createdAt === "string" ? j.createdAt : undefined,
              isFeatured: Boolean(j.isFeatured),
            })),
        );
      } catch {
        if (!cancelled) {
          setTrustStats({
            businesses: null,
            organizations: null,
            opportunities: null,
            products: null,
          });
          setFeaturedJobs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const sponsorRail = sponsors.slice(0, FEATURED_SPONSOR_RAIL_CAP);
  const showHomepageBanner =
    Boolean(homepageBanner) && sponsorRail.length === 0;

  const base = getBaseUrl();
  const canonical = canonicalUrl("/");
  const title =
    "Black Wealth Exchange | Black-Owned Businesses, Jobs, Marketplace & Financial Literacy";
  const description = truncateMeta(
    "Discover Black-owned businesses, shop Black-owned brands, explore jobs and career opportunities, and access financial literacy resources built to strengthen Black economic power.",
  );

  const formatStat = (value: number | null) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("en-US")
      : "Live";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Black Wealth Exchange",
    url: canonical,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base.replace(/\/$/, "")}/business-directory?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Black Wealth Exchange",
    url: canonical,
    logo: `${base.replace(/\/$/, "")}/favicon.png`,
    sameAs: [
      "https://www.instagram.com/blackwealthexchange/",
      "https://www.linkedin.com/company/black-wealth-exchange/",
    ],
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={`${base.replace(/\/$/, "")}/images/hero1.jpg`}
        />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <header className="relative z-10 pb-5 pt-8 sm:pb-7 sm:pt-11">
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-3 py-1.5 text-[11px] text-[#EFD27A] sm:px-3.5 sm:text-xs">
              <Image
                src="/black-wealth-future.png"
                alt="Black Wealth"
                width={30}
                height={30}
                className="inline-block sm:h-[34px] sm:w-[34px]"
                priority
              />
              <span className="font-extrabold tracking-wide">
                BLACK WEALTH EXCHANGE • DIRECTORY • JOBS • MARKETPLACE
              </span>
            </div>

            <div className="relative isolate overflow-hidden mx-auto mt-4 max-w-3xl rounded-2xl px-3 py-3 sm:px-4 sm:py-4">
              <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]"
                style={{
                  backgroundImage: "url('/images/story3.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-black/82" />

              <h1 className="text-3xl font-black tracking-tight leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="text-white">Build Black </span>
                <span className="bg-gradient-to-r from-[#D4AF37] via-[#F2D77C] to-[#D4AF37] bg-clip-text text-transparent">
                  Economic Power
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/72 sm:text-base md:text-lg">
                Black Wealth Exchange helps you find Black-owned businesses,
                explore jobs and opportunities, and support sellers in one
                place. Every action keeps more dollars circulating in Black
                communities.
              </p>

              <div className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-2 gap-2 text-left sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                    Businesses
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-white">
                    {formatStat(trustStats.businesses)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                    Organizations
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-white">
                    {formatStat(trustStats.organizations)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                    Opportunities
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-white">
                    {formatStat(trustStats.opportunities)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                    Products
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-white">
                    {formatStat(trustStats.products)}
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-1 max-w-3xl text-left text-[11px] text-white/50">
                Live platform inventory snapshot.
              </div>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:justify-center">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_go_to_dashboard",
                        ctaLabel: "Go to Dashboard",
                        destination: "/dashboard",
                      })
                    }
                  >
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      Go to Dashboard
                    </button>
                  </Link>
                  <Link
                    href={
                      user?.accountType === "admin"
                        ? "/admin/dashboard"
                        : "/business-directory"
                    }
                    className="w-full sm:w-auto"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId:
                          user?.accountType === "admin"
                            ? "hero_admin_dashboard"
                            : "hero_explore_directory",
                        ctaLabel:
                          user?.accountType === "admin"
                            ? "Admin Dashboard"
                            : "Find Black-owned businesses",
                        destination:
                          user?.accountType === "admin"
                            ? "/admin/dashboard"
                            : "/business-directory",
                      })
                    }
                  >
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      {user?.accountType === "admin"
                        ? "Admin Dashboard"
                        : "Find Black-owned businesses"}
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/job-listings"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_jobs",
                        ctaLabel: "Explore jobs and opportunities",
                        destination: "/job-listings",
                      })
                    }
                  >
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      Explore jobs and opportunities
                    </button>
                  </Link>
                  <Link
                    href="/marketplace/become-a-seller"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_start_selling",
                        ctaLabel: "Start selling your products",
                        destination: "/marketplace/become-a-seller",
                        category: "seller",
                      })
                    }
                    className="w-full sm:w-auto"
                  >
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      Start selling your products
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {showHomepageBanner ? (
            <section className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black/35 p-3 shadow-[0_0_0_1px_rgba(212,175,55,0.2)]">
              <a
                href={homepageBanner.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={homepageBanner.image}
                  alt={homepageBanner.name}
                  className="h-24 w-full rounded-xl object-cover sm:h-28"
                />
                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {homepageBanner.name}
                    </div>
                    <div className="truncate text-xs text-white/70">
                      {homepageBanner.tagline}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-bold text-[#F1D57A]">
                    Sponsored Banner · Limited Slot
                  </span>
                </div>
              </a>
            </section>
          ) : null}

          <div className="mx-auto mt-4 max-w-4xl rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-yellow-300">
                  Flagship Membership Advantage
                </div>
                <div className="mt-1 text-sm font-semibold text-white sm:text-base">
                  BWE Black Card unlocks verified member identity, faster
                  opportunities, and reward-based savings
                </div>
              </div>
              <Link
                href="/black-card"
                onClick={() =>
                  trackHomepageEvent("homepage_cta_clicked", {
                    section: "hero",
                    ctaId: "hero_black_card",
                    ctaLabel: "Join Black Card",
                    destination: "/black-card",
                  })
                }
                className="inline-flex w-full sm:w-auto min-w-[12rem] justify-center whitespace-nowrap rounded-xl border border-yellow-400/40 bg-black/40 px-5 py-2.5 text-sm font-semibold text-yellow-200 hover:bg-black/60"
              >
                Join Black Card
              </Link>
            </div>
          </div>

          <section id="search-dominant" className="mt-5 sm:mt-6 scroll-mt-24">
            <div className="mx-auto max-w-4xl">
              <div className="mb-2.5">
                <div className="text-[10px] font-bold tracking-[0.08em] text-[#D4AF37] uppercase">
                  Primary action
                </div>
                <div className="text-sm font-semibold text-white/88 sm:text-[15px]">
                  Start with search, then take action
                </div>
              </div>

              <div>
                <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2.5 sm:p-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[30rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-3xl" />

                  <div className="relative">
                    <div className="mb-3 grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
                      <TabButton
                        active={vertical === "news"}
                        onClick={() => {
                          setVertical("news");
                          setToolsOpen(false);
                          runSearch({ verticalOverride: "news" });
                        }}
                        icon={Newspaper}
                        label="News"
                        title="News search"
                      />

                      <TabButton
                        active={vertical === "all"}
                        onClick={() => {
                          setVertical("all");
                          setToolsOpen(false);
                          runSearch({ verticalOverride: "all" });
                        }}
                        icon={Search}
                        label="Directory"
                        title="Directory search"
                      />

                      <TabButton
                        active={vertical === "shopping"}
                        onClick={() => {
                          setVertical("shopping");
                          setToolsOpen(false);
                          runSearch({ verticalOverride: "shopping" });
                        }}
                        icon={ShoppingBag}
                        label="Shopping"
                        title="Marketplace search"
                      />

                      <button
                        type="button"
                        onClick={onToggleAi}
                        className={cx(
                          "inline-flex w-full sm:w-auto items-center justify-center gap-1 rounded-lg sm:rounded-xl border px-2 py-2 sm:px-3 sm:py-2 text-[10px] sm:text-[12px] font-extrabold tracking-wide transition",
                          aiMode
                            ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                            : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                        )}
                        title="Toggle AI Mode"
                      >
                        <Sparkles
                          className={cx(
                            "h-3.5 w-3.5 sm:h-4 sm:w-4",
                            aiMode ? "text-[#D4AF37]" : "text-white/70",
                          )}
                        />
                        <span className="truncate">AI Mode</span>
                      </button>

                      {vertical === "all" && (
                        <button
                          type="button"
                          onClick={() => setToolsOpen((v) => !v)}
                          className={cx(
                            "hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-extrabold tracking-wide transition",
                            toolsOpen
                              ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                          )}
                          title="Open filters"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                          Tools
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex w-full items-stretch overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus-within:border-[#D4AF37]/40 focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                      {vertical === "all" && (
                        <div className="flex items-center gap-1 border-r border-white/10 p-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLeftScope("businesses");
                              if (searchQuery.trim()) {
                                runSearch({ scopeOverride: "businesses" });
                              }
                            }}
                            className={cx(
                              "rounded-lg px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2 text-[10px] sm:text-[12px] font-extrabold transition",
                              leftScope === "businesses"
                                ? "bg-[#D4AF37] text-black shadow"
                                : "bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                            )}
                          >
                            <span className="sm:hidden">Biz</span>
                            <span className="hidden sm:inline">Businesses</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setLeftScope("organizations");
                              if (searchQuery.trim()) {
                                runSearch({ scopeOverride: "organizations" });
                              }
                            }}
                            className={cx(
                              "rounded-lg px-2 py-1.5 sm:rounded-xl sm:px-3 sm:py-2 text-[10px] sm:text-[12px] font-extrabold transition",
                              leftScope === "organizations"
                                ? "bg-[#D4AF37] text-black shadow"
                                : "bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                            )}
                          >
                            <span className="sm:hidden">Orgs</span>
                            <span className="hidden sm:inline">
                              Organizations
                            </span>
                          </button>
                        </div>
                      )}

                      <input
                        type="search"
                        enterKeyHint="search"
                        inputMode="search"
                        placeholder={placeholder}
                        value={searchQuery}
                        onFocus={() =>
                          trackHomepageEvent("homepage_search_focused", {
                            section: "hero_search",
                            source: "homepage_search_box",
                            vertical,
                            scope: leftScope,
                          })
                        }
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            submitHomepageSearch("search_input_enter");
                        }}
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[13px] text-white placeholder:text-white/35 outline-none sm:px-5 sm:py-4 sm:text-[15px]"
                      />

                      {vertical === "all" && (
                        <button
                          type="button"
                          onClick={() => setToolsOpen((v) => !v)}
                          className={cx(
                            "sm:hidden shrink-0 border-l border-white/10 px-2.5 transition",
                            toolsOpen ? "bg-[#D4AF37]/15" : "bg-white/[0.03]",
                          )}
                          aria-label="Filters"
                          title="Filters"
                        >
                          <SlidersHorizontal
                            className={cx(
                              "h-4 w-4",
                              toolsOpen ? "text-[#D4AF37]" : "text-white/75",
                            )}
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          submitHomepageSearch("search_button_click")
                        }
                        aria-label="Search"
                        className="shrink-0 bg-[#D4AF37] px-3 text-[13px] font-extrabold text-black transition hover:bg-yellow-500 sm:px-8 sm:text-[14px]"
                      >
                        <Search className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:inline">Search</span>
                      </button>
                    </div>

                    {toolsOpen && vertical === "all" && (
                      <SearchToolsInlinePanel
                        verifiedOnly={verifiedOnly}
                        onVerifiedOnly={setVerifiedOnly}
                        sponsoredFirst={sponsoredFirst}
                        onSponsoredFirst={setSponsoredFirst}
                        stateFilter={stateFilter}
                        onStateFilter={setStateFilter}
                        sort={sort}
                        onSort={setSort}
                        category={category}
                        onCategory={setCategory}
                      />
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55 sm:text-[12px]">
                      <span>
                        Real listings, clear trust labels, and direct next
                        steps.
                        <span className="text-white/40">
                          {" "}
                          Filters are optional.
                        </span>
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] sm:text-[11px]">
                        Opens full results with filters and scope controls
                      </span>
                    </div>

                    {vertical === "all" && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("restaurant");
                            setLeftScope("businesses");
                            submitHomepageSearch(
                              "quick_intent_restaurant",
                              "restaurant",
                              { scopeOverride: "businesses" },
                            );
                          }}
                          className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:bg-white/[0.07]"
                        >
                          Restaurants
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("financial advisor");
                            setLeftScope("businesses");
                            submitHomepageSearch(
                              "quick_intent_finance",
                              "financial advisor",
                              { scopeOverride: "businesses" },
                            );
                          }}
                          className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:bg-white/[0.07]"
                        >
                          Financial advisors
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("nonprofit");
                            setLeftScope("organizations");
                            submitHomepageSearch(
                              "quick_intent_nonprofit",
                              "nonprofit",
                              { scopeOverride: "organizations" },
                            );
                          }}
                          className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:bg-white/[0.07]"
                        >
                          Nonprofits
                        </button>
                        <Link
                          href="/business-directory"
                          className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1.5 text-[11px] font-bold text-[#F1D57A] transition hover:bg-[#D4AF37]/16"
                        >
                          Open full directory
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 sm:mt-6">
            <EconomicImpactSimulator />
          </section>
        </div>
      </header>

      <section className="relative z-10 pt-3 pb-8 sm:pt-4 sm:pb-10">
        <div className="container mx-auto max-w-6xl px-4">
          {featuredJobs.length ? (
            <div className="mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-yellow-300">
                    Featured Jobs
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Premium placements from active hiring employers
                  </div>
                </div>
                <Link
                  href="/job-listings"
                  className="text-xs text-yellow-200 hover:underline"
                >
                  View all jobs
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {featuredJobs.map((job) => (
                  <Link
                    key={job._id}
                    href={`/job/${job._id}`}
                    className="rounded-xl border border-yellow-400/30 bg-black/30 p-3 hover:bg-black/45"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-white truncate">
                        {job.title}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-400 text-black font-bold">
                        Featured
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/75 truncate">
                      {job.company} • {job.location} • {job.type}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              Choose your next move
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-[#D4AF37]/30 bg-black/35 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Find Black-owned businesses
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Search trusted listings, compare options, and open full
                  profiles fast.
                </p>
                <Link
                  href="/business-directory"
                  className="mt-3 inline-flex rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-extrabold text-black hover:bg-yellow-500"
                >
                  Open Directory Search
                </Link>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Explore jobs and opportunities
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Find internships, jobs, and growth pathways aligned with your
                  goals.
                </p>
                <Link
                  href="/job-listings"
                  className="mt-3 inline-flex rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-2 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
                >
                  Explore Opportunities
                </Link>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Start selling your products
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Launch your storefront, list products, and reach buyers on
                  BWE.
                </p>
                <Link
                  href="/marketplace/become-a-seller"
                  className="mt-3 inline-flex rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15"
                >
                  Start Selling
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      <main className="container relative z-10 mx-auto max-w-6xl px-4 pb-0">
        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
            Core platform pillars
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl">
            What you can do on Black Wealth Exchange
          </h2>

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-base font-extrabold text-white">
                Businesses
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Discover trusted Black-owned businesses, products, and services.
              </p>
              <Link
                href="/business-directory"
                className="mt-3 inline-flex rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-sm font-bold text-white/85 hover:bg-white/10"
              >
                Browse Directory
              </Link>
            </article>

            <article className="rounded-2xl border border-[#D4AF37]/30 bg-black/30 p-4">
              <h3 className="text-base font-extrabold text-white">
                Marketplace
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Shop curated products from independent Black-owned sellers.
              </p>
              <Link
                href="/marketplace"
                className="mt-3 inline-flex rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3.5 py-2 text-sm font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                Open Marketplace
              </Link>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-base font-extrabold text-white">
                Opportunities
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Access jobs, pathways, and career advancement opportunities.
              </p>
              <Link
                href="/job-listings"
                className="mt-3 inline-flex rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-sm font-bold text-white/85 hover:bg-white/10"
              >
                View Opportunities
              </Link>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-base font-extrabold text-white">Learn</h3>
              <p className="mt-1 text-sm text-white/70">
                Build financial literacy and long-term wealth strategy.
              </p>
              <Link
                href="/financial-literacy"
                className="mt-3 inline-flex rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3.5 py-2 text-sm font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                Go to Learn
              </Link>
            </article>
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-black via-[#0f1511] to-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-300">
                Active opportunity lane
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Student Opportunities
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Access internships, scholarships, grants, and mentorship in one
                focused student opportunities hub.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/black-student-opportunities"
                className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-extrabold text-black hover:bg-emerald-200"
              >
                Explore Student Hub
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-5 overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-black via-[#0f0f0f] to-black p-3.5 sm:p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.15)]">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-[#D4AF37] sm:text-base">
                Featured Sponsors
              </h3>
              <p className="text-[11px] text-white/55">
                Active partners supporting verified discovery and visibility
              </p>
            </div>
            <span className="text-[10px] rounded border border-white/15 px-2 py-1 text-white/55">
              Weekly slots · max {FEATURED_SPONSOR_RAIL_CAP}
            </span>
          </div>

          <div className="relative h-20 w-full overflow-hidden rounded-xl border border-white/10 bg-black/25 sm:h-24">
            {!sponsorFeedLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/55">
                Loading live sponsors...
              </div>
            ) : null}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/70 to-transparent" />

            {sponsorRail.length ? (
              <div className="animate-scroll absolute flex space-x-3 px-3 py-3 sm:space-x-4">
                {[...sponsorRail, ...sponsorRail].map((sponsor, index) => {
                  const card = (
                    <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-white/10 shadow sm:h-16 sm:w-32">
                      <img
                        src={sponsor.img}
                        alt={sponsor.name}
                        className="h-full w-full object-cover"
                        loading={index < 4 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 text-center text-[9px] font-semibold text-[#F1D57A] sm:text-[10px]">
                        {sponsor.name}
                      </div>
                      <span className="absolute left-1.5 top-1.5 rounded border border-[#D4AF37]/40 bg-black/55 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#F1D57A]">
                        Sponsored
                      </span>
                    </div>
                  );

                  if (sponsor.url) {
                    return (
                      <a
                        key={index}
                        href={sponsor.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {card}
                      </a>
                    );
                  }

                  return <div key={index}>{card}</div>;
                })}
              </div>
            ) : sponsorFeedLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/55">
                No active featured sponsors in this slot right now.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-black via-[#121212] to-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(212,175,55,0.14)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                Growth lane
              </p>
              <h3 className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl">
                Advertise with BWE
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Turn sponsor visibility into customer action with premium
                placements designed for trusted Black-owned brands.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/advertise-with-us"
                className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500"
              >
                Become a Sponsor
              </Link>
              <Link
                href="/advertise/featured-sponsor"
                className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2.5 text-sm font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                View Sponsor Packages
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-0 mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/65">
            Expansion areas
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
            Go deeper across the BWE ecosystem
          </h3>

          <section className="relative mb-3 overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, rgba(0,0,0,0.88) 14%, rgba(0,0,0,0.72) 52%, rgba(0,0,0,0.9) 100%), url('/ads/sample-banner8.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/55" />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                  Creator Economy
                </p>
                <h4 className="mt-1 text-base font-extrabold tracking-tight text-white sm:text-lg">
                  BWE Music / Creator Platform
                </h4>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">
                  Explore artists, launch creator storefronts, and support music
                  commerce through canonical checkout and fulfillment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/music"
                  className="rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-extrabold text-black hover:bg-yellow-500 sm:text-sm"
                >
                  Explore Music
                </Link>
                <Link
                  href="/music/join"
                  className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-3.5 py-2 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18 sm:text-sm"
                >
                  Join as Creator
                </Link>
              </div>
            </div>
          </section>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">
                Music & Creator Economy
              </h4>
              <p className="mt-1 text-xs text-white/70">
                Explore artists and launch creator storefronts.
              </p>
              <Link
                href="/music"
                className="mt-3 inline-flex rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-extrabold text-black hover:bg-yellow-500"
              >
                Explore Music
              </Link>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">
                Real Estate & Investment
              </h4>
              <p className="mt-1 text-xs text-white/70">
                Find ownership and investment pathways.
              </p>
              <Link
                href="/real-estate-investment"
                className="mt-3 inline-flex rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/10"
              >
                Explore Real Estate
              </Link>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">
                Recruiting & Consulting
              </h4>
              <p className="mt-1 text-xs text-white/70">
                Connect employers with vetted talent pathways.
              </p>
              <Link
                href="/recruiting-consulting?type=employer"
                className="mt-3 inline-flex rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-2 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                Open Recruiting
              </Link>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">
                Advertise with BWE
              </h4>
              <p className="mt-1 text-xs text-white/70">
                Reach high-intent audiences with premium placements.
              </p>
              <Link
                href="/advertise-with-us"
                className="mt-3 inline-flex rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/10"
              >
                View Ad Options
              </Link>
            </article>
          </div>
        </section>
      </main>

      <ConsultingInterestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <style jsx>{`
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-pulseGlow {
          animation: pulseGlow 2.1s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
          }
          50% {
            box-shadow: 0 0 24px rgba(212, 175, 55, 0.45);
          }
        }
      `}</style>
    </div>
  );
}
