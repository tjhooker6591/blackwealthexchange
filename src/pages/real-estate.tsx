import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  Home,
  Landmark,
  Lock,
  MapPin,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";

import useAuth from "@/hooks/useAuth";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Pill({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "muted" | "danger";
}) {
  const tones: Record<string, string> = {
    gold: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20",
    muted: "bg-white/5 text-gray-200 border-white/10",
    danger: "bg-red-500/10 text-red-200 border-red-500/20",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function Card({
  id,
  title,
  subtitle,
  icon,
  children,
  right,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="relative bg-white/5 border border-white/10 rounded-2xl shadow-lg p-5 sm:p-6 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="h-11 w-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-200">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-sm sm:text-base text-gray-300 mt-1">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function GoldButton({
  children,
  onClick,
  href,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "solid" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-yellow-500/50";
  const style =
    variant === "solid"
      ? "bg-yellow-500 text-black hover:bg-yellow-400"
      : "bg-white/5 text-yellow-200 border border-yellow-500/25 hover:bg-yellow-500/10";

  if (href) {
    return (
      <Link href={href} className={cx(base, style)}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cx(base, style)} type="button">
      {children}
    </button>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-yellow-200 hover:text-yellow-100 underline underline-offset-4 decoration-yellow-500/30"
    >
      {children}
    </a>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="text-lg sm:text-xl font-extrabold text-white mt-1">
        {value}
      </div>
      {note ? <div className="text-xs text-gray-400 mt-1">{note}</div> : null}
    </div>
  );
}

function money(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

const RealEstatePage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const goPremium = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/real-estate")}`);
      return;
    }
    router.push("/pricing");
  };

  /** -----------------------------
   *  Simple “Affordability” helper
   *  ----------------------------- */
  const [monthlyBudget, setMonthlyBudget] = useState<number>(2400);
  const [estTaxesInsHOA, setEstTaxesInsHOA] = useState<number>(650);
  const [rate, setRate] = useState<number>(6.5);
  const [termYears, setTermYears] = useState<number>(30);

  const affordability = useMemo(() => {
    // Reverse mortgage payment (rough) to estimate principal supported by P&I budget
    const piBudget = Math.max(monthlyBudget - estTaxesInsHOA, 0);
    const r = rate / 100 / 12;
    const n = termYears * 12;
    const principal =
      r > 0
        ? (piBudget * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
        : piBudget * n;

    return { piBudget, principal };
  }, [monthlyBudget, estTaxesInsHOA, rate, termYears]);

  return (
    <div className="min-h-screen text-white bg-black">
      {/* Subtle “index-style” background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[28rem] w-[28rem] rounded-full bg-yellow-500/8 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-[30rem] w-[30rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <ArrowRight className="h-4 w-4 rotate-180 text-yellow-200" />
              <span className="text-sm font-semibold">Back to Home</span>
            </Link>

            <Pill>
              <BadgeCheck className="h-4 w-4" />
              Real Estate • Generational Wealth
            </Pill>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <GoldButton href="/business-directory" variant="ghost">
              <MapPin className="h-4 w-4" />
              Browse Directory
            </GoldButton>
            <GoldButton onClick={goPremium}>
              <Lock className="h-4 w-4" />
              Premium Toolkit
            </GoldButton>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 leading-tight drop-shadow">
              Real Estate Investment for Building Generational Wealth
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mt-4">
              Real estate can create stability, equity, and cashflow—if you
              follow a clear plan. This page breaks down the basics, the
              strategy, and the “how-to” steps in a way that’s practical and
              actionable.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GoldButton href="#start-here">
                Start Here <ArrowRight className="h-4 w-4" />
              </GoldButton>
              <GoldButton href="#calculator" variant="ghost">
                Affordability Tool <Calculator className="h-4 w-4" />
              </GoldButton>
              <GoldButton
                href="/business-directory?category=Real%20Estate"
                variant="ghost"
              >
                Find Black-Owned Pros <Users className="h-4 w-4" />
              </GoldButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="muted">Homeownership</Pill>
              <Pill tone="muted">Rentals</Pill>
              <Pill tone="muted">House hacking</Pill>
              <Pill tone="muted">REITs</Pill>
              <Pill tone="muted">Commercial</Pill>
            </div>
          </div>
        </div>
      </section>

      <main className="relative max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Start Here */}
        <Card
          id="start-here"
          title="Start Here: What Type of Real Estate Wealth Are You Building?"
          subtitle="Choose your focus. The strategy changes depending on whether you want stability, cashflow, or long-term growth."
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Home className="h-4 w-4" />
                Stability + Equity
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Buy your primary home and build equity over time while locking
                in housing stability.
              </p>
              <ul className="mt-3 text-sm text-gray-300 space-y-1">
                <li>• Best for: first-time buyers</li>
                <li>• Focus: affordability + long-term plan</li>
                <li>• Win: equity + stability</li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Building2 className="h-4 w-4" />
                Cashflow + Portfolio
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Build rental income that can support your household and expand
                into more properties.
              </p>
              <ul className="mt-3 text-sm text-gray-300 space-y-1">
                <li>• Best for: disciplined planners</li>
                <li>• Focus: deal analysis + reserves</li>
                <li>• Win: cashflow + leverage</li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Landmark className="h-4 w-4" />
                Passive Exposure (REITs)
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Gain real estate exposure without owning physical
                property—useful while building capital and knowledge.
              </p>
              <ul className="mt-3 text-sm text-gray-300 space-y-1">
                <li>• Best for: busy schedules</li>
                <li>• Focus: diversification + fees</li>
                <li>• Win: passive exposure</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Stat
              label="Core principle"
              value="Buy with a plan"
              note="A property is a strategy, not a vibe."
            />
            <Stat
              label="Risk control"
              value="Reserves matter"
              note="Repairs + vacancy happen. Prepare."
            />
            <Stat
              label="Wealth path"
              value="Equity → leverage → scale"
              note="Slow, steady, strong."
            />
          </div>
        </Card>

        {/* Section 1: Understanding */}
        <Card
          title="1) Understanding Real Estate Investment"
          subtitle="Real estate builds wealth through income, appreciation, and equity growth—when you control costs and risk."
          icon={<Building2 className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-gray-300">
                Real estate investment means buying property (or exposure to
                property) with the goal of generating income, long-term
                appreciation, or both. The best investors treat every purchase
                like a business decision: estimate the costs, plan for risk, and
                set a clear goal.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">Residential</div>
                  <div className="mt-1">
                    Single-family homes, duplexes, small multifamily, vacation
                    rentals. Often the easiest entry point.
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">Commercial</div>
                  <div className="mt-1">
                    Offices, retail, warehouses, mixed-use. Bigger returns
                    possible, more complexity and risk.
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">REITs (Passive)</div>
                  <div className="mt-1">
                    Invest in real estate portfolios without owning physical
                    properties. Great for diversification.
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">
                    Crowdfunding (Varies)
                  </div>
                  <div className="mt-1">
                    Pool money into deals with others. Understand fees,
                    liquidity, and risk before participating.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">
                  Beginner-friendly starting moves
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>• Buy a primary home you can truly afford</li>
                  <li>• House hack (room/unit rental) if possible</li>
                  <li>• Learn deal analysis before chasing “fast flips”</li>
                  <li>• Build a trusted team early</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Why Real Estate */}
        <Card
          title="2) Why Real Estate?"
          subtitle="Because it builds wealth in multiple ways at once—equity, appreciation, and cashflow."
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Three wealth engines
                </h3>
                <ul className="mt-3 space-y-3 text-sm text-gray-300">
                  <li>
                    <span className="text-gray-100 font-bold">
                      Equity growth:
                    </span>{" "}
                    Every payment can increase ownership. Over time, equity
                    becomes leverage for the next move.
                  </li>
                  <li>
                    <span className="text-gray-100 font-bold">
                      Appreciation:
                    </span>{" "}
                    Many markets increase in value over years. Strong markets +
                    patience can be powerful.
                  </li>
                  <li>
                    <span className="text-gray-100 font-bold">Cashflow:</span>{" "}
                    Rentals can produce monthly income that you can save,
                    reinvest, or use to reduce job dependency.
                  </li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  The real key: control risk
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                  Real estate gets dangerous when people underestimate expenses
                  or skip reserves. A strong plan assumes vacancy, repairs, and
                  surprises—and still works.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="muted">Vacancy</Pill>
                  <Pill tone="muted">Maintenance</Pill>
                  <Pill tone="muted">CapEx reserves</Pill>
                  <Pill tone="muted">Insurance + taxes</Pill>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <ShieldAlert className="h-4 w-4" />
                  Common mistakes
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>• Buying based on emotion, not numbers</li>
                  <li>• No reserves for repairs/vacancy</li>
                  <li>• Underestimating taxes/insurance</li>
                  <li>• Weak tenant screening</li>
                  <li>• Rushing into flips without experience</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Calculator / Affordability */}
        <Card
          id="calculator"
          title="3) Quick Affordability Helper"
          subtitle="Set your monthly comfort zone, then estimate how much principal that could support (rough estimate)."
          icon={<Calculator className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Monthly budget (total)
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Taxes+Ins+HOA estimate
                  <input
                    type="number"
                    value={estTaxesInsHOA}
                    onChange={(e) => setEstTaxesInsHOA(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Interest rate (%)
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Term (years)
                  <input
                    type="number"
                    value={termYears}
                    onChange={(e) => setTermYears(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Stat
                  label="P&I budget (rough)"
                  value={money(affordability.piBudget)}
                />
                <Stat
                  label="Est. loan principal supported"
                  value={money(affordability.principal)}
                  note="Rough estimate; does not include down payment."
                />
              </div>

              <p className="text-xs text-gray-400 mt-4">
                This is not a pre-approval. Use it as a starting point, then
                confirm with a lender.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Trusted homebuying tools
              </div>
              <p className="text-sm text-gray-300 mt-2">
                If you want a structured step-by-step guide with official
                checklists and documents, these resources are solid:
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  •{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/owning-a-home/">
                    CFPB: Buying a house
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/owning-a-home/explore/home-loan-toolkit/">
                    CFPB: Home Loan Toolkit
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.hud.gov/stat/sfh/housing-counseling">
                    HUD: Housing Counseling
                  </ExternalLink>
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <GoldButton
                  href="/business-directory?category=Real%20Estate"
                  variant="ghost"
                >
                  Find Black-Owned Pros <ArrowRight className="h-4 w-4" />
                </GoldButton>
                <GoldButton onClick={goPremium} variant="ghost">
                  Unlock Toolkit <Lock className="h-4 w-4" />
                </GoldButton>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: How to Get Started */}
        <Card
          title="4) How to Get Started with Real Estate Investments"
          subtitle="This is the part that changes lives—follow these steps and you’ll avoid most beginner mistakes."
          icon={<BadgeCheck className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-yellow-200">
                Step 1: Financial preparation
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="text-gray-100 font-bold">Credit:</span>{" "}
                  improve score, reduce utilization, clean errors early.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">Savings:</span> down
                  payment + closing costs + reserves.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">Budget:</span>{" "}
                  confirm the payment is sustainable—not just “approved.”
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-yellow-200">
                Step 2: Choose your strategy
              </h3>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">
                    Single-family rentals
                  </div>
                  <div className="mt-1">
                    Simpler management, easier entry, strong demand in many
                    markets.
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">Multifamily</div>
                  <div className="mt-1">
                    Higher income potential; requires stronger systems and
                    management.
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">Fix & flip</div>
                  <div className="mt-1">
                    Fast wins are possible, but execution risk is high for
                    beginners.
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">REITs</div>
                  <div className="mt-1">
                    Passive option while learning and building capital.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-yellow-200">
                Step 3: Financing options
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="text-gray-100 font-bold">
                    Traditional mortgages:
                  </span>{" "}
                  best for long-term holds.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">Hard money:</span>{" "}
                  short-term, higher cost—common for flips/value-add.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">
                    Private lenders/partners:
                  </span>{" "}
                  flexible, but terms vary—document everything.
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-yellow-200">
                Step 4: Find the right property
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="text-gray-100 font-bold">Demand first:</span>{" "}
                  job centers, schools, transportation, amenities.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">
                    Numbers first:
                  </span>{" "}
                  estimate repairs, vacancy, taxes, insurance.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">Team first:</span>{" "}
                  inspector + contractor estimates reduce surprises.
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <h3 className="text-lg font-extrabold text-yellow-200">
                Step 5: Start small and scale up
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>
                  <span className="text-gray-100 font-bold">
                    Stabilize one property:
                  </span>{" "}
                  strong tenant, reserves funded, ops clean.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">Reinvest:</span>{" "}
                  cashflow into repairs, reserves, and the next down payment.
                </li>
                <li>
                  <span className="text-gray-100 font-bold">
                    Leverage equity carefully:
                  </span>{" "}
                  only if the numbers still work.
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Section 4: Generational Wealth */}
        <Card
          title="5) Building Generational Wealth with Real Estate"
          subtitle="The goal is bigger than a property—it’s a family asset strategy that lasts decades."
          icon={<Landmark className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  What “generational wealth” looks like
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>
                    <span className="text-gray-100 font-bold">
                      A legacy asset:
                    </span>{" "}
                    property equity that can be passed down or refinanced to
                    fund education/business.
                  </li>
                  <li>
                    <span className="text-gray-100 font-bold">
                      A cashflow engine:
                    </span>{" "}
                    rental income that supports family stability.
                  </li>
                  <li>
                    <span className="text-gray-100 font-bold">
                      A family business:
                    </span>{" "}
                    management, renovations, contracting skills passed down.
                  </li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  A simple family plan
                </h3>
                <ol className="mt-3 space-y-2 text-sm text-gray-300 list-decimal pl-5">
                  <li>
                    Document ownership, responsibilities, and who manages what.
                  </li>
                  <li>
                    Keep maintenance reserves as a standard, not optional.
                  </li>
                  <li>
                    Create “rules” for refinancing, selling, and tenant
                    standards.
                  </li>
                  <li>
                    Teach the next generation budgeting, credit, and basic
                    property math.
                  </li>
                </ol>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">
                  Find Black-owned services
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  Build with Black-owned professionals where possible.
                </p>
                <div className="mt-4 space-y-2">
                  <GoldButton
                    href="/business-directory?category=Real%20Estate"
                    variant="ghost"
                  >
                    Real Estate Pros <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                  <GoldButton
                    href="/business-directory?category=Home%20Services"
                    variant="ghost"
                  >
                    Home Services <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 5: Challenges */}
        <Card
          title="6) Overcoming Challenges and Making It Work"
          subtitle="Most barriers can be solved with planning, partnerships, and better information."
          icon={<ShieldAlert className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Challenge: Lack of capital
              </div>
              <ul className="mt-3 space-y-2">
                <li>• Start with a primary home or house hack.</li>
                <li>• Consider partners (document everything).</li>
                <li>
                  • Explore programs and counseling resources to qualify
                  strategically.
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Challenge: Property management
              </div>
              <ul className="mt-3 space-y-2">
                <li>• Use screening standards and written policies.</li>
                <li>• Hire property management when it’s worth it.</li>
                <li>• Keep repair reserves to avoid crisis decisions.</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Conclusion / CTA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-200">
            Start Today for a Better Future
          </h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Real estate is a powerful wealth-building tool. Whether you start by
            buying your first home, investing in rentals, or gaining passive
            exposure through REITs, the key is to move with a plan— and build
            the systems that protect your progress.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GoldButton href="/business-directory?category=Real%20Estate">
              Browse Real Estate Directory <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <GoldButton href="/business-directory/submit" variant="ghost">
              Add Your Business <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <GoldButton onClick={goPremium} variant="ghost">
              View Premium Toolkit <Lock className="h-4 w-4" />
            </GoldButton>
          </div>
        </div>
      </main>

      <div className="h-10" />
    </div>
  );
};

export default RealEstatePage;
