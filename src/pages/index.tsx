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

  const [sponsors, setSponsors] = useState<
    Array<{ img: string; name: string; url?: string; tagline?: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sponsored-businesses", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data?.sponsors)) return;
        if (cancelled) return;

        setSponsors(
          data.sponsors.map((s: any) => ({
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
          })),
        );
      } catch {
        // keep fallback rendering
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sponsorRail = sponsors.length
    ? sponsors
    : [
        { img: "/ads/sample-banner1.jpg", name: "Featured Sponsor" },
        { img: "/ads/sample-banner2.jpg", name: "Featured Sponsor" },
        { img: "/ads/sample-banner3.jpg", name: "Featured Sponsor" },
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <header className="relative z-10 pb-5 pt-8 sm:pb-7 sm:pt-11">
        <div className="container mx-auto max-w-6xl px-4">
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
                BWE PLATFORM • OWNERSHIP • ACCESS • CIRCULATION
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight leading-[1.02] sm:text-4xl md:text-5xl lg:text-6xl">
              Build Black
              <span className="block bg-gradient-to-r from-[#D4AF37] via-[#F2D77C] to-[#D4AF37] bg-clip-text text-transparent">
                Economic Power
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/72 sm:text-base md:text-lg">
              The premium hub to discover Black-owned businesses, activate
              opportunities, and move from discovery to real-world action
              faster.
            </p>

            <div className="mx-auto mt-5 flex w-full max-w-xl flex-col gap-2.5 sm:flex-row sm:justify-center">
              {user ? (
                <>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <button className="h-11 w-full rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black shadow-[0_8px_20px_rgba(212,175,55,0.25)] transition hover:-translate-y-0.5 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/35 sm:h-11 sm:w-auto sm:px-6">
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
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      {user?.accountType === "admin"
                        ? "Admin Dashboard"
                        : "Explore Directory"}
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="w-full sm:w-auto">
                    <button className="h-11 w-full rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black shadow-[0_8px_20px_rgba(212,175,55,0.25)] transition hover:-translate-y-0.5 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/35 sm:h-11 sm:w-auto sm:px-6">
                      Login
                    </button>
                  </Link>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <button className="h-11 w-full rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/8 px-5 text-sm font-bold text-[#F1D57A] transition hover:-translate-y-0.5 hover:bg-[#D4AF37]/16 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25 sm:h-11 sm:w-auto sm:px-6">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>

            <details className="mx-auto mt-3 w-full max-w-3xl rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left">
              <summary className="cursor-pointer list-none text-xs font-semibold text-white/70">
                Why trust BWE search
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Trust-first search • Verified + quality signals",
                  "Built for action • Find, vet, connect fast",
                  "Economic focus • Ownership, access, circulation",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/75"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </details>
          </div>

          <section className="mt-5 sm:mt-6">
            <div className="mx-auto max-w-4xl">
              <div className="mb-2.5">
                <div className="text-[10px] font-bold tracking-[0.08em] text-[#D4AF37] uppercase">
                  Discover in seconds
                </div>
                <div className="text-sm font-semibold text-white/78 sm:text-[15px]">
                  Search the directory with premium filters
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

          <section className="mt-5 sm:mt-6">
            <EconomicImpactSimulator />
          </section>
        </div>
      </header>

      <section className="relative z-10 pt-3 pb-8 sm:pt-4 sm:pb-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              Quick paths
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href="/financial-literacy"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:border-[#D4AF37]/30 hover:bg-black/40"
              >
                I’m here to learn
              </Link>
              <Link
                href="/job-listings"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:border-[#D4AF37]/30 hover:bg-black/40"
              >
                I’m here to find opportunities
              </Link>
              <Link
                href="/marketplace/become-a-seller"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:border-[#D4AF37]/30 hover:bg-black/40"
              >
                I run a business
              </Link>
            </div>
          </div>

          <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0.74) 56%, rgba(0,0,0,0.88) 100%), url('/ads/sample-banner3.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                Start here track
              </div>
              <h3 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                Featured Learning Block
              </h3>
              <p className="mt-1 text-sm text-white/75">
                One focused track for financial basics, career setup, and Black
                history/economic context.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
                  Financial basics
                </span>
                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
                  Career setup
                </span>
                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
                  Black history/economic context
                </span>
              </div>
              <Link
                href="/financial-literacy"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black transition hover:bg-yellow-500"
              >
                Start the Track
              </Link>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-white sm:text-lg">
                  Opportunities
                </h3>
                <Link
                  href="/black-student-opportunities"
                  className="text-xs font-bold text-[#D4AF37]"
                >
                  Open Hub →
                </Link>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <Link
                  href="/black-student-opportunities"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Students
                </Link>
                <Link
                  href="/job-listings"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Jobs
                </Link>
                <Link
                  href="/internships"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Internships
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h3 className="text-base font-extrabold text-white sm:text-lg">
                Business Growth
              </h3>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <Link
                  href="/marketplace"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Marketplace
                </Link>
                <Link
                  href="/business-directory"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Sponsored / Directory
                </Link>
                <Link
                  href="/advertise-with-us"
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
                >
                  Advertising
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              More key sections
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/affiliate"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
              >
                Affiliate & Partnership
              </Link>
              <Link
                href="/black-entertainment-news"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
              >
                Black Entertainment Pulse
              </Link>
              <Link
                href="/business-directory/sponsored-business"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
              >
                Sponsored Businesses
              </Link>
              <Link
                href="/investment"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/80 transition hover:bg-black/40"
              >
                Investment & Wealth
              </Link>
            </div>
          </div>

          <div className="mb-4 text-center">
            <Link
              href="/more"
              className="text-sm font-bold text-[#D4AF37] transition hover:underline"
            >
              Explore all resources →
            </Link>
          </div>

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

            <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-black p-4 sm:p-5">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, rgba(0,0,0,0.9) 12%, rgba(0,0,0,0.72) 54%, rgba(0,0,0,0.88) 100%), url('/ads/sample-banner7.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
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
        <section className="relative mb-5 overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black p-4 sm:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
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

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
                Major Platform Area
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                BWE Music / Creator Platform
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Explore artists, launch creator storefronts, and support music
                commerce through canonical checkout and fulfillment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/music"
                className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500"
              >
                Explore Music
              </Link>
              <Link
                href="/music/join"
                className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
              >
                Sell Your Music
              </Link>
              <Link
                href="/music/join"
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/85 hover:bg-white/10"
              >
                Join as a Creator
              </Link>
            </div>
          </div>
        </section>

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

        <section className="mb-5 overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-black via-[#0f0f0f] to-black p-3.5 sm:p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.15)]">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-[#D4AF37] sm:text-base">
                Featured Sponsors
              </h3>
              <p className="text-[11px] text-white/55">
                Premium rotating placements
              </p>
            </div>
            <span className="text-[10px] rounded border border-white/15 px-2 py-1 text-white/55">
              Weekly slots
            </span>
          </div>

          <div className="relative h-20 w-full overflow-hidden rounded-xl border border-white/10 bg-black/25 sm:h-24">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/70 to-transparent" />

            <div className="animate-scroll absolute flex space-x-3 px-3 py-3 sm:space-x-4">
              {[...sponsorRail, ...sponsorRail].map((sponsor, index) => {
                const card = (
                  <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-white/10 shadow sm:h-16 sm:w-32">
                    <Image
                      src={sponsor.img}
                      alt={sponsor.name}
                      width={160}
                      height={80}
                      className="h-full w-full object-cover"
                      priority={index < 4}
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
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-200 sm:text-[11px]">
                  NOW OPEN
                </span>
              </div>

              <h3 className="text-base font-extrabold tracking-tight text-[#F1D57A] sm:text-lg">
                BWE Recruiting & Consulting Services
              </h3>

              <p className="mt-1 max-w-3xl text-sm text-white/68">
                Talent consulting that helps employers hire rigorously vetted
                Black professionals — while opening meaningful pathways for
                students, job seekers, and overlooked candidates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/recruiting-consulting?type=employer"
                className="inline-flex h-10 items-center rounded-xl bg-[#D4AF37] px-4 text-sm font-extrabold text-black transition hover:bg-yellow-500"
              >
                Employer Request
              </Link>
              <Link
                href="/recruiting-consulting?type=candidate"
                className="inline-flex h-10 items-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-4 text-sm font-bold text-[#F1D57A] transition hover:bg-[#D4AF37]/18"
              >
                Join Talent Network
              </Link>
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
