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

const EconomicImpactSimulator = () => {
  const annualEstimate = 2_100_000_000_000;
  const historicalBaseline = 300_000_000_000;
  const dailySpend = annualEstimate / 365;
  const recapturePct = 5;
  const dailySpendRoundedPublic = "Approximately $5.75 billion per day";
  const recaptureValue = annualEstimate * (recapturePct / 100);
  const durationMs = 180_000;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      const raw = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(eased);
      if (raw < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const formatCurrency = (num: number) =>
    num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const currentValue =
    historicalBaseline + (annualEstimate - historicalBaseline) * progress;

  return (
    <section className="relative overflow-hidden py-1 sm:py-1.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(96,190,255,0.12),transparent_34%),radial-gradient(circle_at_80%_84%,rgba(212,175,55,0.1),transparent_45%)]" />

      <div className="relative grid max-w-full gap-3 overflow-hidden rounded-2xl border border-[#D4AF37]/45 bg-[#04070f]/98 p-4 shadow-[0_22px_56px_rgba(0,0,0,0.62)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-start">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#0a101c] px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-white/90 sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            BUYING POWER CONTEXT
          </div>

          <h2 className="mt-2 text-xl font-extrabold tracking-[0.01em] text-white sm:text-[1.8rem] lg:text-[2rem]">
            Black buying power is large. The opportunity is keeping more of it
            circulating with us.
          </h2>

          <p className="mt-2 text-sm text-white/82 sm:text-[15px]">
            BWE is built to help people discover Black-owned businesses faster,
            support them more consistently, and make it easier for more dollars
            to stay in the community.
          </p>

          <div
            className="mt-3 text-[1.7rem] font-black tracking-tight text-[#D4AF37] tabular-nums sm:text-[2.1rem] lg:text-[2.3rem]"
            data-counter-value={Math.floor(currentValue)}
          >
            {formatCurrency(Math.floor(currentValue))}
          </div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-white/65 sm:text-xs">
            PROJECTED ANNUAL BUYING POWER
          </p>

          <div className="mt-3 grid gap-2 text-[11px] text-white/80 sm:grid-cols-3 sm:text-[12px]">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">
                Historical baseline
              </div>
              <div>{formatCurrency(historicalBaseline)} in 2010</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">
                Projected annual scale
              </div>
              <div>{formatCurrency(annualEstimate)} in 2026</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="font-semibold text-white">
                Illustrative daily spend
              </div>
              <div>
                {formatCurrency(dailySpend)} per day ({dailySpendRoundedPublic})
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 md:flex md:h-full md:flex-col md:justify-center md:gap-3">
          <div className="rounded-xl border border-[#D4AF37]/40 bg-[#151309]/72 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/75">
              Recapture example
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              If just <span className="font-extrabold text-[#D4AF37]">5%</span>{" "}
              of projected annual buying power is intentionally redirected
              through Black-owned businesses and tools that strengthen
              circulation, that represents:
            </p>
            <p className="mt-3 break-words text-[1.35rem] font-black leading-tight tracking-tight text-[#D4AF37]">
              {formatCurrency(recaptureValue)}
            </p>
            <p className="mt-1 text-[11px] text-white/70">
              This is a simple recapture example, not a claim that BWE controls
              the full market.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <Link
              href="/1.8trillionimpact"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/14 px-3 py-2 shadow-sm transition hover:border-[#D4AF37]/80"
            >
              <span className="text-xs leading-tight text-white/85 lg:text-sm">
                See the full impact story{" "}
                <span className="text-[#D4AF37]">→</span>
              </span>
            </Link>

            <Link
              href="/economic-freedom"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-3 py-2 transition hover:border-white/40"
            >
              <span className="text-xs leading-tight text-white/85 lg:text-sm">
                Learn more <span className="text-[#D4AF37]">→</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
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
        const [inventoryRes, jobsRes] = await Promise.all([
          fetch("/api/stats/inventory", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/jobs/list?limit=300", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const [inventoryData, jobsData] = await Promise.all([
          inventoryRes.json().catch(() => null),
          jobsRes.json().catch(() => null),
        ]);

        if (cancelled) return;

        const jobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];

        setTrustStats({
          businesses: Number.isFinite(Number(inventoryData?.businesses))
            ? Number(inventoryData.businesses)
            : null,
          organizations: Number.isFinite(Number(inventoryData?.organizations))
            ? Number(inventoryData.organizations)
            : null,
          opportunities: Number.isFinite(Number(inventoryData?.opportunities))
            ? Number(inventoryData.opportunities)
            : jobs.length,
          products: Number.isFinite(Number(inventoryData?.products))
            ? Number(inventoryData.products)
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
    "Black-Owned Business Directory, Jobs & Marketplace | Black Wealth Exchange";
  const description = truncateMeta(
    "Black Wealth Exchange is a discovery and growth platform centered on Black-owned businesses. Search the directory, find jobs, shop the marketplace, and build wealth with practical financial literacy resources.",
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

      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
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
                BLACK WEALTH EXCHANGE
              </span>
            </div>

            <div className="relative isolate mx-auto mt-4 max-w-4xl overflow-hidden rounded-[28px] border border-white/10 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
                style={{
                  backgroundImage: "url('/images/story3.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-black/76" />
              <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />

              <div className="mx-auto max-w-2xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37] sm:text-[11px]">
                  CLAIM. STRENGTHEN. TRACK.
                </div>

                <h1 className="mt-3 flex flex-col gap-1 text-3xl font-black leading-[1.14] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.45rem]">
                  <span>Claim your business.</span>
                  <span>Strengthen your profile.</span>
                  <span>Track your visibility.</span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/84 sm:text-base sm:leading-7">
                  Join the $49/month Founding Membership to begin ownership
                  review, improve your BWE profile, and receive monthly
                  performance reporting.
                </p>
              </div>

              <div className="mx-auto mt-5 flex w-full max-w-md flex-col gap-3 sm:items-center">
                <Link
                  href="/business-directory?mode=claim"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    trackHomepageEvent("homepage_cta_clicked", {
                      section: "hero",
                      ctaId: "hero_claim_business",
                      ctaLabel: "Claim Your Business",
                      destination: "/business-directory?mode=claim",
                    })
                  }
                >
                  <button className="h-12 w-full rounded-xl bg-[#D4AF37] px-6 text-sm font-extrabold text-black transition hover:-translate-y-0.5 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:min-w-[220px]">
                    Claim Your Business
                  </button>
                </Link>
                <Link
                  href="/founding-membership"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    trackHomepageEvent("homepage_cta_clicked", {
                      section: "hero",
                      ctaId: "hero_review_membership",
                      ctaLabel: "See Membership Details",
                      destination: "/founding-membership",
                    })
                  }
                >
                  <button className="h-11 w-full rounded-xl border border-white/25 bg-white/[0.03] px-5 text-sm font-semibold text-white/88 transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 sm:min-w-[220px]">
                    See Membership Details
                  </button>
                </Link>
                <Link
                  href="/business-directory/add-business"
                  className="text-sm text-white/74 underline underline-offset-4 hover:text-[#F1D57A]"
                  onClick={() =>
                    trackHomepageEvent("homepage_cta_clicked", {
                      section: "hero",
                      ctaId: "hero_list_business",
                      ctaLabel: "Don’t see your business? List it here.",
                      destination: "/business-directory/add-business",
                    })
                  }
                >
                  Don’t see your business? List it here.
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                  Trust signal
                </div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Black-owned business discovery
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                  Trust signal
                </div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Community-powered economic support
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                  Trust signal
                </div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Listings, jobs, marketplace, and wealth tools
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                  Trust signal
                </div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  Built to help dollars circulate longer
                </div>
              </div>
            </div>

            <div className="mx-auto mt-3 grid w-full max-w-4xl grid-cols-2 gap-2 text-left sm:grid-cols-4">
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
            <div className="mx-auto mt-1 max-w-4xl text-left text-[11px] text-white/50">
              Live platform inventory snapshot.
            </div>
          </div>

          {showHomepageBanner ? (
            <section className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black/35 p-3 shadow-[0_0_0_1px_rgba(212,175,55,0.2)]">
              <a
                href={homepageBanner!.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={homepageBanner!.image}
                  alt={homepageBanner!.name}
                  className="h-24 w-full rounded-xl object-cover sm:h-28"
                />
                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {homepageBanner!.name}
                    </div>
                    <div className="truncate text-xs text-white/70">
                      {homepageBanner!.tagline}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-bold text-[#F1D57A]">
                    Sponsored Banner · Limited Slot
                  </span>
                </div>
              </a>
            </section>
          ) : null}

          <section id="search-dominant" className="mt-5 sm:mt-6 scroll-mt-24">
            <div className="mx-auto max-w-4xl">
              <div className="mb-2.5">
                <div className="text-[10px] font-bold tracking-[0.08em] text-[#D4AF37] uppercase">
                  Start here
                </div>
                <div className="text-sm font-semibold text-white/88 sm:text-[15px]">
                  Search first, then take the next best action
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
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-5 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#D4AF37]">
                How BWE works
              </div>
              <div className="mt-1 text-sm text-white/75 sm:text-base">
                A simpler path to finding, supporting, and growing Black-owned
                businesses.
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]">
                  1
                </div>
                <h3 className="mt-1 text-sm font-extrabold text-white">
                  Search
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Find Black-owned businesses, organizations, products, and
                  opportunities.
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]">
                  2
                </div>
                <h3 className="mt-1 text-sm font-extrabold text-white">
                  Support
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Buy, book, hire, share, and direct more spending toward
                  businesses you want to see grow.
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]">
                  3
                </div>
                <h3 className="mt-1 text-sm font-extrabold text-white">List</h3>
                <p className="mt-1 text-xs text-white/70">
                  Create a listing and make your business easier to discover.
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D4AF37]">
                  4
                </div>
                <h3 className="mt-1 text-sm font-extrabold text-white">
                  Build Wealth
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Use BWE tools that help dollars circulate longer and compound
                  impact.
                </p>
              </article>
            </div>
          </section>

          <section className="mx-auto mt-5 max-w-5xl rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-black via-[#121212] to-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(212,175,55,0.14)]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                  Claim your existing listing
                </p>
                <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Find your public BWE business, start the claim process, and
                  move into monthly growth support.
                </h3>
                <p className="mt-2 text-sm text-white/75">
                  This pilot path is for an existing public business listing.
                  Payment starts membership and claim processing, but ownership
                  verification is still reviewed separately.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                <div className="text-[10px] uppercase tracking-[0.08em] text-white/45">
                  Founding membership path
                </div>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  <li>• Find existing business in the directory</li>
                  <li>• Claim the business and start ownership review</li>
                  <li>• Activate the $49/year founding pilot membership</li>
                  <li>
                    • Move into profile review, baseline setup, and monthly
                    reporting
                  </li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/business-directory"
                    className="inline-flex rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500"
                  >
                    Find Existing Business
                  </Link>
                  <Link
                    href="/founding-membership"
                    className="inline-flex rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2.5 text-sm font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
                  >
                    Review Membership
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto mt-5 max-w-4xl rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3 sm:p-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-300">
                  Black Card Membership
                </div>
                <div className="mt-0.5 text-xs text-white/85 sm:text-sm">
                  Explore Black Card benefits, member access, and premium
                  ecosystem advantages in a clearly separate path from Join BWE.
                </div>
              </div>
              <Link
                href="/pricing"
                onClick={() =>
                  trackHomepageEvent("homepage_cta_clicked", {
                    section: "membership",
                    ctaId: "membership_black_card",
                    ctaLabel: "Explore Black Card",
                    destination: "/pricing",
                  })
                }
                className="inline-flex w-full justify-center rounded-lg border border-yellow-400/35 bg-black/35 px-4 py-2 text-xs font-semibold text-yellow-200 hover:bg-black/55 sm:w-auto"
              >
                Explore Black Card
              </Link>
            </div>
          </div>

          <section className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                  0.5% Challenge
                </p>
                <p className="text-sm text-white">
                  Search Black first. Buy, review, refer, repeat.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/challenge"
                  className="rounded-lg bg-[#D4AF37] px-3 py-2 text-center text-xs font-extrabold text-black"
                >
                  Join the Challenge
                </Link>
                <Link
                  href="/business-directory"
                  className="rounded-lg border border-[#D4AF37]/50 px-3 py-2 text-center text-xs font-bold text-[#F1D57A]"
                >
                  Search Black-Owned Businesses
                </Link>
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-yellow-300">
                    Jobs
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Featured opportunities from active employers
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
                      <p className="truncate font-bold text-white">
                        {job.title}
                      </p>
                      <span className="rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
                        Featured
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-white/75">
                      {job.company} • {job.location} • {job.type}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              Supporting ecosystem paths
            </div>
            <p className="mb-3 text-xs text-white/65">
              Once the core action is clear, you can go deeper into the rest of
              the platform.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Marketplace
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Shop products from Black-owned brands and support commerce
                  directly.
                </p>
                <Link
                  href="/marketplace"
                  className="mt-3 inline-flex rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-2 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
                >
                  Shop Marketplace
                </Link>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Student Opportunities
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Explore internships, scholarships, grants, and mentorship
                  pathways.
                </p>
                <Link
                  href="/black-student-opportunities"
                  className="mt-3 inline-flex rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15"
                >
                  Explore Student Hub
                </Link>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="text-sm font-extrabold text-white">
                  Advertising
                </h3>
                <p className="mt-1 text-xs text-white/70">
                  Premium placements for brands that want more visibility inside
                  the BWE ecosystem.
                </p>
                <Link
                  href="/advertise-with-us"
                  className="mt-3 inline-flex rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/10"
                >
                  Advertise with BWE
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      <main className="container relative z-10 mx-auto max-w-6xl px-4 pb-0">
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
            <span className="rounded border border-white/15 px-2 py-1 text-[10px] text-white/55">
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

        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/65">
            More from the ecosystem
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
            Explore the broader BWE platform
          </h3>

          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">Music</h4>
              <p className="mt-1 text-xs text-white/70">
                Support artists, creators, and music commerce.
              </p>
              <Link
                href="/music"
                className="mt-3 inline-flex rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-2 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                Explore Music
              </Link>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h4 className="text-sm font-extrabold text-white">Real Estate</h4>
              <p className="mt-1 text-xs text-white/70">
                Explore ownership and investment pathways.
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
                Connect employers with talent pathways and consulting support.
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
                Join Creator or Consulting Waitlist
              </h4>
              <p className="mt-1 text-xs text-white/70">
                Stay close to new launches without cluttering the top of the
                homepage.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-3 inline-flex rounded-lg border border-yellow-400/35 bg-black/35 px-3 py-2 text-xs font-semibold text-yellow-200 hover:bg-black/55"
              >
                Notify Me
              </button>
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
