"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ComponentType,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
  Lock,
  Sparkles,
  Search,
  ShoppingBag,
  Newspaper,
  SlidersHorizontal,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bell,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import {
  buildHomepageDirectoryQuery,
  normalizeScope,
} from "@/lib/directory/queryState";

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
  const initialValue = 300_000_000_000;
  const impactSecondsToReach = 8 * 60;

  const [total, setTotal] = useState<number>(initialValue);

  const perSecond = useMemo(() => {
    const span = Math.max(1, projected - initialValue);
    return span / Math.max(1, impactSecondsToReach);
  }, [projected, initialValue, impactSecondsToReach]);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const totalRef = useRef<number>(initialValue);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  useEffect(() => {
    setTotal(initialValue);
    totalRef.current = initialValue;
    lastRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastRef.current) / 1000));
      lastRef.current = now;

      const next = Math.min(projected, totalRef.current + perSecond * dt);
      totalRef.current = next;
      setTotal(next);

      if (next < projected) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initialValue, perSecond, projected]);

  const formatCurrency = (num: number) =>
    num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const progressPct = Math.min(100, (total / projected) * 100);
  const perMonth = projected / 12;
  const perDay = perMonth / 30.44;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[34rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-[-6rem] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-wide text-white/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          BUYING POWER (ANNUAL ESTIMATE)
        </div>

        <h2 className="mt-2 text-base font-extrabold tracking-tight text-white sm:text-xl md:text-2xl">
          African American Buying Power{" "}
          <span className="text-[#D4AF37]">({currentYear})</span>
        </h2>

        <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums sm:text-4xl md:text-5xl">
          <span className="bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            {formatCurrency(Math.floor(total))}
          </span>
        </div>

        <div className="mt-3 w-full max-w-4xl">
          <div className="flex items-center justify-between text-[11px] text-white/55">
            <span>{formatCurrency(initialValue)} baseline</span>
            <span>{formatCurrency(projected)} estimate</span>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-emerald-400 to-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.18)] transition-[width] duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="mt-2 text-center text-[11px] text-white/50">
            A simple visual tracker to keep the impact front-and-center.
          </p>
        </div>

        <div className="mt-2 hidden flex-wrap items-center justify-center gap-2 text-[11px] text-white/70 sm:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            ~{formatCurrency(perMonth)} / month
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            ~{formatCurrency(perDay)} / day
          </span>
        </div>

        <div className="mt-4 grid w-full gap-2 sm:gap-3 sm:grid-cols-2">
          <Link
            href="/1.8trillionimpact"
            className="group inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 sm:px-4 sm:py-2.5 text-center shadow-sm transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-[11px] font-extrabold tracking-wide text-[#D4AF37] sm:text-sm">
                Knowledge is Power
              </span>
              <span className="truncate text-[10px] text-white/70 group-hover:text-white sm:text-sm">
                Where the money goes →
              </span>
            </div>
          </Link>

          <Link
            href="/economic-freedom"
            className="group inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 text-center transition hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-[11px] font-extrabold tracking-wide text-[#D4AF37] sm:text-sm">
                Economic Slavery
              </span>
              <span className="truncate text-[10px] text-white/70 group-hover:text-white sm:text-sm">
                Learn more →
              </span>
            </div>
          </Link>
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
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);

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
        pathname: "/shop",
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
          type: scope,
          scope,
          tab: scope,
          q: "",
          search: "",
          limit: 20,
          sort,
          ai: ai ? "1" : "0",
        },
      });
    }

    return router.push({
      pathname: "/business-directory",
      query: buildHomepageDirectoryQuery({
        q,
        scope,
        sort,
        ai,
        verifiedOnly,
        sponsoredFirst,
        state: stateFilter,
        category,
      }),
    });
  };

  const onToggleAi = () => {
    const next = !aiMode;
    setAiMode(next);
    runSearch({ aiOverride: next });
  };

  const sponsors = [
    { img: "/ads/sample-banner1.jpg", name: "Pamfa Hoodies" },
    { img: "/ads/sample-banner2.jpg", name: "Titan Era" },
    { img: "/ads/sample-banner3.jpg", name: "Legacy FoodMart" },
    { img: "/ads/sample-banner4.jpg", name: "Ujamaa Eats" },
    { img: "/ads/sample-banner5.jpg", name: "Pamfa United Citizens" },
    { img: "/ads/sample-banner6.jpg", name: "Harlem Apparel" },
    { img: "/ads/sample-banner7.jpg", name: "Ebony Roots" },
    { img: "/ads/sample-banner8.jpg", name: "Coco and Breezy Eyewear" },
  ];

  const studentOpportunities = [
    {
      title: "Scholarships",
      icon: BookOpen,
      href: "/black-student-opportunities/scholarships",
    },
    {
      title: "Grants",
      icon: GraduationCap,
      href: "/black-student-opportunities/grants",
    },
    {
      title: "Mentorship",
      icon: Users,
      href: "/black-student-opportunities/mentorship",
    },
    {
      title: "Internships",
      icon: Briefcase,
      href: "/black-student-opportunities/internships",
    },
  ];

  const publicRoutes = [
    "/about",
    "/global-timeline",
    "/events",
    "/library-of-black-history",
    "/black-entertainment-news",
  ];

  const keySections = [
    {
      title: "Our Marketplace",
      href: "/marketplace",
      description: "Buy & sell Black-owned products securely.",
    },
    {
      title: "Sponsored Businesses",
      href: "/business-directory/sponsored-business",
      description: "Premium featured businesses with more visibility.",
    },
    {
      title: "Affiliate & Partnership",
      href: "/affiliate",
      description: "Curated affiliate offers and partnership opportunities.",
    },
    {
      title: "Black Entertainment Pulse",
      href: "/black-entertainment-news",
      description: "Black entertainment and news — stay tapped in.",
    },
    {
      title: "Jobs & Careers",
      href: "/jobs",
      description: "Jobs, internships & networking opportunities.",
    },
    {
      title: "Investment & Wealth",
      href: "/investment",
      description: "Invest in Black businesses & build your future.",
    },
  ];

  const gate = (href: string) => {
    if (publicRoutes.includes(href)) return router.push(href);
    if (!user) return router.push(`/login?redirect=${href}`);
    return router.push(href);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <header className="relative z-10 pb-6 pt-10 sm:pb-8 sm:pt-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 sm:px-4 sm:text-sm">
              <Image
                src="/black-wealth-future.png"
                alt="Black Wealth"
                width={30}
                height={30}
                className="inline-block sm:h-[34px] sm:w-[34px]"
                priority
              />
              <span className="font-semibold tracking-wide">
                Our Dollars. Our Businesses. Our Ecosystem.
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Black Wealth Exchange<span className="text-[#D4AF37]">.</span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
              Search Black-owned businesses, discover jobs & opportunities, shop
              the marketplace, and build economic power — with a trusted, modern
              flow.
            </p>

            <div className="mx-auto mt-5 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              {user ? (
                <>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <button className="w-full rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 sm:px-6 sm:py-3 sm:text-base">
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
                  >
                    <button className="w-full rounded-xl border border-[#D4AF37]/60 bg-transparent px-5 py-2.5 text-sm font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:px-6 sm:py-3 sm:text-base">
                      {user?.accountType === "admin"
                        ? "Admin Dashboard"
                        : "Explore Directory"}
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="w-full sm:w-auto">
                    <button className="w-full rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 sm:px-6 sm:py-3 sm:text-base">
                      Login
                    </button>
                  </Link>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <button className="w-full rounded-xl border border-[#D4AF37]/60 bg-transparent px-5 py-2.5 text-sm font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:px-6 sm:py-3 sm:text-base">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <section className="mt-6 sm:mt-8">
            <EconomicImpactSimulator />
          </section>

          <section className="mt-6 sm:mt-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold tracking-wide text-white/70">
                  Search the Directory
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/50">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    Trusted Flow
                  </span>
                </div>
              </div>

              <div className="sticky top-2 z-30 sm:static sm:top-auto sm:z-auto">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 right-[-6rem] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

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

                      <div className="ml-auto hidden sm:flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/60">
                          Trusted Flow
                        </span>
                      </div>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") runSearch();
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
                        onClick={() => runSearch()}
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
                        Trusted ranking + clean results.
                        <span className="text-white/40">
                          {" "}
                          Filters are optional.
                        </span>
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] sm:text-[11px]">
                        Tap{" "}
                        <span className="font-black text-white/75">Search</span>
                      </span>
                    </div>

                    {vertical === "all" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "Restaurants",
                          "Barbershop",
                          "Beauty Supply",
                          "Church",
                          "Nonprofit",
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setSearchQuery(chip);
                              runSearch({ queryOverride: chip });
                            }}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:border-white/20 hover:bg-white/[0.08]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-3 sm:mt-5">
                <button
                  className="animate-pulseGlow rounded-xl bg-[#D4AF37] px-5 py-2.5 text-center text-sm font-extrabold text-black shadow transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/35 sm:px-6 sm:text-base"
                  onClick={() => {
                    if (!user) {
                      router.push(
                        "/login?redirect=/marketplace/become-a-seller",
                      );
                    } else {
                      router.push("/marketplace/become-a-seller");
                    }
                  }}
                >
                  <span className="sm:hidden">Start Selling</span>
                  <span className="hidden sm:inline">
                    Start Selling on the Marketplace — Join as a Seller
                  </span>
                </button>

                <Link href="/library-of-black-history">
                  <span className="text-sm font-extrabold text-[#D4AF37] transition hover:underline sm:text-base">
                    📚 Explore the Library of Black History 🏛️
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </header>

      <section className="relative z-10 pt-3 pb-8 sm:pt-4 sm:pb-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4 sm:mb-5">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#D4AF37] sm:text-3xl">
                  Student Opportunities
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Scholarships, grants, mentorship, internships — and a
                  launchpad to join BWE.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Public Access
                </span>
                <Link
                  href="/black-student-opportunities"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-[11px] font-extrabold text-[#D4AF37] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/15 sm:text-xs"
                >
                  <GraduationCap className="h-4 w-4" />
                  Open Hub
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/12 via-white/[0.03] to-white/[0.02] p-4 sm:p-5">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[34rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 right-[-6rem] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-wide text-white/75 sm:text-[11px]">
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    STUDENT OPPORTUNITIES HUB
                  </div>

                  <h4 className="mt-3 text-lg font-extrabold tracking-tight text-white sm:text-2xl">
                    Your Launchpad to Scholarships, Internships, Mentorship —
                    and Real Access
                    <span className="text-[#D4AF37]">.</span>
                  </h4>

                  <p className="mt-2 text-sm text-white/70">
                    This is the student “power drawer” of BWE. We keep it clean,
                    trusted, and easy to use — so students can move fast, apply
                    faster, and connect with real opportunity.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/black-student-opportunities"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500 sm:px-5"
                    >
                      Enter Student Hub <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/signup?redirect=/black-student-opportunities"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white/80 transition hover:border-white/20 hover:bg-white/10 sm:px-5"
                    >
                      <UserPlus className="h-4 w-4 text-white/70" />
                      Create Free Student Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => setStudentDrawerOpen((v) => !v)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-extrabold text-white/75 transition hover:bg-white/[0.06] sm:px-5"
                      aria-expanded={studentDrawerOpen}
                    >
                      Power Drawer
                      {studentDrawerOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs font-extrabold text-white/70">
                      Why students stay on BWE
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-white/70">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                        Trusted links + clean info (no clutter)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
                        Everything in one place (hub style)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-sky-300" />
                        Fast navigation (apply / learn more instantly)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className={cx(
                  "relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition-all duration-300",
                  studentDrawerOpen
                    ? "max-h-[520px] opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                <div className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold tracking-tight text-white">
                      What’s inside the Student Hub
                    </div>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/60">
                      Built for 2026+
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                        <Bell className="h-4 w-4" />
                        Scholarship & grant updates (expandable)
                      </div>
                      <p className="mt-1 text-xs text-white/65">
                        Pages are structured to support feeds later (so content
                        stays current).
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                        <Users className="h-4 w-4" />
                        Mentorship pathways
                      </div>
                      <p className="mt-1 text-xs text-white/65">
                        Guidance + networks + professional readiness. Simple and
                        trusted.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                        <Briefcase className="h-4 w-4" />
                        Internships & career acceleration
                      </div>
                      <p className="mt-1 text-xs text-white/65">
                        A clear pipeline from student → internship → job →
                        career.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                        <BookOpen className="h-4 w-4" />
                        Application playbooks (next)
                      </div>
                      <p className="mt-1 text-xs text-white/65">
                        “Scholarship kit” templates and step-by-step checklists
                        will live here.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/black-student-opportunities"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500 sm:px-5"
                    >
                      Go to Student Hub <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/signup?redirect=/black-student-opportunities"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-extrabold text-[#D4AF37] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/15 sm:px-5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Join BWE as a Student
                    </Link>
                  </div>

                  <p className="mt-3 text-[11px] text-white/45">
                    Student pages remain public. Creating a profile unlocks
                    future features (saved opportunities, alerts, and student
                    networking).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-4">
              {studentOpportunities.map((item, index) => (
                <Link key={index} href={item.href}>
                  <div className="group flex cursor-pointer flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center transition hover:bg-white/[0.06] sm:p-4">
                    <item.icon className="mb-2 h-8 w-8 text-[#D4AF37] sm:h-10 sm:w-10" />
                    <span className="text-sm font-semibold text-white sm:text-base">
                      {item.title}
                    </span>
                    <span className="mt-1 text-[11px] text-white/55 group-hover:text-white/70 sm:text-xs">
                      Tap to explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container relative z-10 mx-auto max-w-6xl px-4 pb-0">
        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
                Real Estate & Investment
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Explore Black-owned real estate options and investments.
              </p>
            </div>
            <button
              className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
              onClick={() => {
                if (!user) {
                  router.push("/login?redirect=/real-estate-investment");
                } else {
                  router.push("/real-estate-investment");
                }
              }}
            >
              Learn More
            </button>
          </div>
        </section>

        <section className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold tracking-tight text-[#D4AF37] sm:text-lg">
              Featured Sponsors
            </h3>
            <span className="text-[11px] text-white/50">Hover to pause</span>
          </div>

          <div className="relative h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:h-28">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/70 to-transparent" />

            <div className="animate-scroll absolute flex space-x-3 px-3 py-3 sm:space-x-4">
              {[...sponsors, ...sponsors].map((sponsor, index) => (
                <div
                  key={index}
                  className="relative h-16 w-28 overflow-hidden rounded-xl border border-white/10 shadow sm:h-20 sm:w-40"
                >
                  <Image
                    src={sponsor.img}
                    alt={sponsor.name}
                    width={160}
                    height={80}
                    className="h-full w-full object-cover"
                    priority={index < 4}
                  />
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-[#D4AF37] sm:bottom-2 sm:text-[11px]">
                    {sponsor.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {keySections.map((item, index) => {
            const isMarket = item.title === "Our Marketplace";
            const isPublic = publicRoutes.includes(item.href);

            return (
              <div
                key={index}
                className={cx(
                  "group cursor-pointer rounded-2xl border p-4 shadow transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5",
                  isMarket
                    ? "border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/12 via-white/[0.03] to-white/[0.02]"
                    : "border-white/10 bg-white/[0.03]",
                )}
                onClick={() => gate(item.href)}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold sm:px-3 sm:text-xs",
                      isMarket
                        ? "border-[#D4AF37]/40 bg-black/30 text-[#D4AF37]"
                        : "border-white/10 bg-white/5 text-white/70",
                    )}
                  >
                    {isMarket ? "🔥 Popular" : isPublic ? "Public" : "Member"}
                    {!isPublic && !isMarket && (
                      <Lock className="h-3 w-3 text-white/60 sm:h-3.5 sm:w-3.5" />
                    )}
                  </span>

                  <span className="text-[10px] text-white/45 transition group-hover:text-white/70 sm:text-xs">
                    Open →
                  </span>
                </div>

                <h2 className="text-base font-extrabold tracking-tight text-white group-hover:underline sm:text-xl">
                  {item.title}
                </h2>
                <p className="mt-2 text-[12px] text-white/65 sm:text-sm">
                  {item.description}
                </p>

                {!isPublic && !user && (
                  <div className="mt-3 text-[11px] text-white/45">
                    Sign in required to access.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="mb-5 rounded-2xl border border-[#D4AF37]/25 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
                  BWE Recruiting & Consulting Services
                </h3>
                <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#D4AF37] sm:text-xs">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-white/70">
                A full talent-consulting service connecting employers with
                rigorously vetted Black professionals — and helping students,
                job seekers, and overlooked candidates secure meaningful
                opportunities.
              </p>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
              >
                Notify Me
              </button>
            </div>
          </div>
        </section>

        <section className="mb-0 mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur sm:p-6">
          <h2 className="mb-1 flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
            📢 Advertise with Us
          </h2>
          <p className="mx-auto mb-4 max-w-2xl text-sm text-white/65">
            Promote your business to engaged users across the platform with
            clean, tasteful ad placements.
          </p>

          <button
            className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
            onClick={() => {
              if (!user) router.push("/login?redirect=/advertise-with-us");
              else router.push("/advertise-with-us");
            }}
          >
            View Ad Options
          </button>

          {!user && (
            <div className="mt-3 text-xs text-white/45">
              Some options require login for checkout & campaign management.
            </div>
          )}
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
