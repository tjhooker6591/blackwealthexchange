import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  FileText,
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
  const content = (
    <span className="inline-flex items-center gap-2">{children}</span>
  );

  if (href) {
    return (
      <Link href={href} className={cx(base, style)}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cx(base, style)} type="button">
      {content}
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

const RealEstateInvestment = () => {
  const router = useRouter();
  const { user } = useAuth();

  const goPremium = () => {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent("/real-estate-investment")}`,
      );
      return;
    }
    router.push("/pricing");
  };

  /** -----------------------------
   *  Calculator 1: Home Loan Estimate
   *  ----------------------------- */
  const [homePrice, setHomePrice] = useState<number>(450000);
  const [downPct, setDownPct] = useState<number>(5);
  const [rate, setRate] = useState<number>(6.5);
  const [termYears, setTermYears] = useState<number>(30);
  const [taxMonthly, setTaxMonthly] = useState<number>(350);
  const [insMonthly, setInsMonthly] = useState<number>(160);
  const [hoaMonthly, setHoaMonthly] = useState<number>(0);

  const loanEst = useMemo(() => {
    const down = (homePrice * downPct) / 100;
    const principal = Math.max(homePrice - down, 0);
    const r = rate / 100 / 12;
    const n = termYears * 12;

    const pmt =
      r > 0
        ? (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
        : principal / n;

    const total = pmt + taxMonthly + insMonthly + hoaMonthly;

    return {
      down,
      principal,
      pmt,
      total,
    };
  }, [homePrice, downPct, rate, termYears, taxMonthly, insMonthly, hoaMonthly]);

  /** -----------------------------
   *  Calculator 2: Rental Deal Snapshot
   *  ----------------------------- */
  const [purchasePrice, setPurchasePrice] = useState<number>(250000);
  const [rentMonthly, setRentMonthly] = useState<number>(2200);
  const [mortgageMonthly, setMortgageMonthly] = useState<number>(1400);
  const [opsMonthly, setOpsMonthly] = useState<number>(450); // taxes/ins/repairs/vacancy/pm baseline
  const [cashInvested, setCashInvested] = useState<number>(25000);

  const rentalEst = useMemo(() => {
    const netMonthly = rentMonthly - mortgageMonthly - opsMonthly;
    const netAnnual = netMonthly * 12;

    const capRate = purchasePrice > 0 ? (netAnnual / purchasePrice) * 100 : NaN;
    const coc = cashInvested > 0 ? (netAnnual / cashInvested) * 100 : NaN;

    return {
      netMonthly,
      netAnnual,
      capRate,
      coc,
    };
  }, [purchasePrice, rentMonthly, mortgageMonthly, opsMonthly, cashInvested]);

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
              Learn • Invest • Build Wealth
            </Pill>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <GoldButton href="/business-directory" variant="ghost">
              <MapPin className="h-4 w-4" />
              Browse Directory
            </GoldButton>
            <GoldButton href="/pricing">
              <Lock className="h-4 w-4" />
              Premium Toolkit
            </GoldButton>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: "url(/images/blackrealstate.jpg)" }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 leading-tight drop-shadow">
              Explore Black-Owned Real Estate Options & Wealth-Building
              Investments
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mt-4">
              Real estate is one of the most powerful tools for building
              generational wealth— when you have the right plan, the right team,
              and the right deal. This page is a step-by-step guide to help you
              move with confidence.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GoldButton href="#start-here">
                Start Here <ArrowRight className="h-4 w-4" />
              </GoldButton>
              <GoldButton
                href="/business-directory?category=Real%20Estate"
                variant="ghost"
              >
                Find Black-Owned Pros <Users className="h-4 w-4" />
              </GoldButton>
              <GoldButton href="#calculators" variant="ghost">
                Deal Calculators <Calculator className="h-4 w-4" />
              </GoldButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="muted">Homebuying</Pill>
              <Pill tone="muted">Rent-to-own</Pill>
              <Pill tone="muted">House hacking</Pill>
              <Pill tone="muted">Long-term rentals</Pill>
              <Pill tone="muted">Commercial</Pill>
              <Pill tone="muted">Crowdfunding / REITs</Pill>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Table of contents */}
        <Card
          id="start-here"
          title="Start Here: Choose Your Path"
          subtitle="Pick the path that matches where you are right now. Each path below includes a clean, practical roadmap."
          icon={<TrendingUp className="h-5 w-5" />}
          right={
            <div className="hidden md:flex items-center gap-2">
              <Pill tone="gold">
                <BadgeCheck className="h-4 w-4" />
                Clear steps • No fluff
              </Pill>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Home className="h-4 w-4" />
                Homebuyer
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Buying your first home (or upgrading)? Learn the steps, the
                financing options, and how to avoid costly mistakes.
              </p>
              <div className="mt-4">
                <GoldButton href="#homebuyer" variant="ghost">
                  Go to Homebuyer Path <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Building2 className="h-4 w-4" />
                Investor
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Want cashflow, appreciation, or both? Learn how to analyze
                deals, estimate returns, and build a steady portfolio.
              </p>
              <div className="mt-4">
                <GoldButton href="#investor" variant="ghost">
                  Go to Investor Path <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-bold">
                <Landmark className="h-4 w-4" />
                Real Estate Pro
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Agents, lenders, inspectors, contractors, and property managers:
                show up where the community is building wealth.
              </p>
              <div className="mt-4">
                <GoldButton href="#professionals" variant="ghost">
                  Go to Pro Section <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Stat
              label="Goal"
              value="Ownership + Cashflow"
              note="Stability + wealth-building."
            />
            <Stat
              label="Rule of Thumb"
              value="Buy the deal, not the dream"
              note="Numbers first, emotions second."
            />
            <Stat
              label="Reminder"
              value="Education matters"
              note="A plan beats hype every time."
            />
          </div>

          <div className="mt-6 text-xs text-gray-400">
            Disclaimer: Educational only. Not financial, tax, or legal advice.
            Always verify terms with qualified professionals.
          </div>
        </Card>

        {/* Homebuyer Path */}
        <Card
          id="homebuyer"
          title="1) Homebuyer Path: From “I’m Not Sure” to Closing Day"
          subtitle="A simple roadmap that helps you prepare, shop smart, and close with confidence."
          icon={<Home className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Step-by-step roadmap
                </h3>
                <ol className="mt-3 space-y-3 text-gray-200">
                  <li className="flex gap-3">
                    <span className="mt-1 h-6 w-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200 font-bold text-sm">
                      1
                    </span>
                    <div>
                      <div className="font-bold">Get financially ready</div>
                      <div className="text-sm text-gray-300 mt-1">
                        Check credit, reduce high-interest debt, build an
                        emergency fund, and estimate a realistic monthly payment
                        target.
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-1 h-6 w-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200 font-bold text-sm">
                      2
                    </span>
                    <div>
                      <div className="font-bold">
                        Get pre-approved (not just pre-qualified)
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Pre-approval strengthens your offer and sets real buying
                        power. Compare multiple lenders when possible.
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-1 h-6 w-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200 font-bold text-sm">
                      3
                    </span>
                    <div>
                      <div className="font-bold">Build your team</div>
                      <div className="text-sm text-gray-300 mt-1">
                        A strong agent + lender + inspector can save you
                        thousands. Prioritize trust, speed, and clear
                        communication.
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-1 h-6 w-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200 font-bold text-sm">
                      4
                    </span>
                    <div>
                      <div className="font-bold">Shop smart + negotiate</div>
                      <div className="text-sm text-gray-300 mt-1">
                        Use comparables, inspection contingencies, and repair
                        requests. Don’t waive protections unless you fully
                        understand the risk.
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="mt-1 h-6 w-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-200 font-bold text-sm">
                      5
                    </span>
                    <div>
                      <div className="font-bold">Close + protect the win</div>
                      <div className="text-sm text-gray-300 mt-1">
                        Review closing disclosure carefully, keep reserves, and
                        plan maintenance from day one.
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Common financing options (quick guide)
                </h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-200">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold">
                      Conventional (3%–5% down sometimes)
                    </div>
                    <div className="text-gray-300 mt-1">
                      Often best long-term rates for strong borrowers. Ask about
                      first-time homebuyer programs.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold">
                      FHA (lower down, flexible credit)
                    </div>
                    <div className="text-gray-300 mt-1">
                      Can be easier to qualify, but mortgage insurance costs
                      matter—run the numbers.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold">VA (eligible veterans)</div>
                    <div className="text-gray-300 mt-1">
                      Powerful benefit—often 0% down. Ask lenders who regularly
                      close VA loans.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold">USDA (eligible rural areas)</div>
                    <div className="text-gray-300 mt-1">
                      0% down possible in qualifying areas. Great for buyers
                      outside major metros.
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-300">
                  Want a structured homebuyer roadmap and tools? Visit{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/owning-a-home/">
                    CFPB: Buying a house
                  </ExternalLink>{" "}
                  and consider a HUD-approved counselor through{" "}
                  <ExternalLink href="https://www.hud.gov/stat/sfh/housing-counseling">
                    HUD Housing Counseling
                  </ExternalLink>
                  .
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  New reality: understand representation & fees
                </h3>
                <p className="text-gray-300 text-sm mt-2">
                  Before touring homes, ask your agent to clearly explain any
                  representation agreement, what services are included, and how
                  compensation works. If anything feels unclear, slow down and
                  ask questions.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="muted">Ask for clarity in writing</Pill>
                  <Pill tone="muted">Know your exit terms</Pill>
                  <Pill tone="muted">Compare services</Pill>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <BadgeCheck className="h-4 w-4" />
                  Quick checklist
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>• Pull credit + dispute errors early</li>
                  <li>• Save for down payment + closing costs</li>
                  <li>• Budget repairs + maintenance</li>
                  <li>• Get pre-approved (paperwork ready)</li>
                  <li>• Inspect everything (roof, HVAC, sewer)</li>
                  <li>• Don’t rush the closing disclosure</li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <Users className="h-4 w-4" />
                  Find Black-owned pros
                </div>
                <p className="text-gray-300 text-sm mt-2">
                  Browse Black-owned agencies, lenders, inspectors, contractors,
                  and property managers through the BWE directory.
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

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <FileText className="h-4 w-4" />
                  Trusted directories
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>
                    •{" "}
                    <ExternalLink href="https://www.nareb.com/find-a-realtist">
                      NAREB: Find a Realtist
                    </ExternalLink>
                  </li>
                  <li>
                    •{" "}
                    <ExternalLink href="https://blackrealestateagents.com/">
                      BlackRealEstateAgents.com
                    </ExternalLink>
                  </li>
                  <li>
                    •{" "}
                    <ExternalLink href="https://www.consumerfinance.gov/find-a-housing-counselor/">
                      CFPB: Find a Housing Counselor
                    </ExternalLink>
                  </li>
                  <li>
                    •{" "}
                    <ExternalLink href="https://www.naca.com/">
                      NACA (Homebuyer advocacy)
                    </ExternalLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Investor Path */}
        <Card
          id="investor"
          title="2) Investor Path: Learn the Numbers (Cashflow, Risk, and Returns)"
          subtitle="If you can analyze a deal, you can avoid most mistakes. This section gives you the framework."
          icon={<Building2 className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Investor strategies (choose one to start)
                </h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">House Hacking</div>
                    <div className="mt-1">
                      Live in one unit/room and rent the rest. Often the easiest
                      first investment.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">
                      Buy & Hold Rentals
                    </div>
                    <div className="mt-1">
                      Focus on stable cashflow, good tenants, and long-term
                      appreciation.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">Value-Add</div>
                    <div className="mt-1">
                      Improve property (repairs/renovations) to raise rent and
                      value—requires tighter execution.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">
                      Commercial / Mixed-use
                    </div>
                    <div className="mt-1">
                      Bigger deals, more complexity. Great later once your
                      underwriting skills are strong.
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Pill tone="gold">
                    <TrendingUp className="h-4 w-4" />
                    Investor rule: never guess—estimate everything.
                  </Pill>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Deal analysis framework (what to estimate every time)
                </h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">Income</div>
                    <div className="mt-1">
                      Rent, parking, laundry, storage, other fees.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">
                      Operating expenses
                    </div>
                    <div className="mt-1">
                      Taxes, insurance, maintenance, vacancy, utilities,
                      property management.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">Financing</div>
                    <div className="mt-1">
                      Rate, term, down payment, closing costs, reserves.
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">Risk</div>
                    <div className="mt-1">
                      Neighborhood trends, tenant demand, repair surprises, exit
                      options.
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-300">
                  If you want low-down-payment homebuyer programs as part of a
                  “house hack” plan, review:{" "}
                  <ExternalLink href="https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/homeready-mortgage">
                    Fannie Mae HomeReady
                  </ExternalLink>{" "}
                  and{" "}
                  <ExternalLink href="https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/home-possible">
                    Freddie Mac Home Possible
                  </ExternalLink>
                  .
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Real estate crowdfunding / pooled investing (know the
                  tradeoffs)
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                  Crowdfunding and pooled real estate investing can lower the
                  entry barrier and diversify exposure, but you must understand
                  liquidity limits, fees, and the specific project risks. Always
                  read offering docs carefully.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="muted">Lower minimums</Pill>
                  <Pill tone="muted">Less control</Pill>
                  <Pill tone="muted">Liquidity may be limited</Pill>
                  <Pill tone="muted">Fees matter</Pill>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <ShieldAlert className="h-4 w-4" />
                  Investor red flags
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>• “Guaranteed returns” language</li>
                  <li>• Missing repair/inspection details</li>
                  <li>• Rent numbers that ignore vacancy</li>
                  <li>• No reserves in the plan</li>
                  <li>• Unclear property management plan</li>
                  <li>• Rushed timelines / pressure tactics</li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <MapPin className="h-4 w-4" />
                  Build locally + responsibly
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  The strongest portfolios often start with one neighborhood you
                  understand deeply. Invest where you can evaluate demand,
                  tenant quality, and long-term stability.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                  <Users className="h-4 w-4" />
                  Find property managers & contractors
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  A good team protects your cashflow.
                </p>
                <div className="mt-4 space-y-2">
                  <GoldButton
                    href="/business-directory?category=Property%20Management"
                    variant="ghost"
                  >
                    Property Management <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                  <GoldButton
                    href="/business-directory?category=Contractors"
                    variant="ghost"
                  >
                    Contractors <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Calculators */}
        <Card
          id="calculators"
          title="3) Quick Calculators: Make Smarter Decisions Faster"
          subtitle="These are simple estimates—use them to sanity-check deals and monthly affordability."
          icon={<Calculator className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Home loan estimate */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Monthly Home Payment Estimate
                </h3>
                <Pill tone="muted">Principal + Taxes + Insurance + HOA</Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Home price
                  <input
                    type="number"
                    value={homePrice}
                    onChange={(e) => setHomePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Down payment (%)
                  <input
                    type="number"
                    value={downPct}
                    onChange={(e) => setDownPct(Number(e.target.value))}
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

                <label className="text-sm text-gray-300">
                  Property tax (monthly)
                  <input
                    type="number"
                    value={taxMonthly}
                    onChange={(e) => setTaxMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Insurance (monthly)
                  <input
                    type="number"
                    value={insMonthly}
                    onChange={(e) => setInsMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  HOA (monthly)
                  <input
                    type="number"
                    value={hoaMonthly}
                    onChange={(e) => setHoaMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Stat label="Down payment" value={money(loanEst.down)} />
                <Stat label="Loan amount" value={money(loanEst.principal)} />
                <Stat label="Principal & Interest" value={money(loanEst.pmt)} />
                <Stat
                  label="Estimated Total / Month"
                  value={money(loanEst.total)}
                />
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Tip: If this total stretches your budget, don’t force it. Adjust
                price, down payment, or shop lenders.
              </p>
            </div>

            {/* Rental deal snapshot */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Rental Deal Snapshot
                </h3>
                <Pill tone="muted">Cashflow • Cap Rate • Cash-on-Cash</Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Purchase price
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Monthly rent
                  <input
                    type="number"
                    value={rentMonthly}
                    onChange={(e) => setRentMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Mortgage (monthly)
                  <input
                    type="number"
                    value={mortgageMonthly}
                    onChange={(e) => setMortgageMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Ops estimate (monthly)
                  <input
                    type="number"
                    value={opsMonthly}
                    onChange={(e) => setOpsMonthly(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  Cash invested
                  <input
                    type="number"
                    value={cashInvested}
                    onChange={(e) => setCashInvested(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white"
                  />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Stat
                  label="Net cashflow / month"
                  value={money(rentalEst.netMonthly)}
                />
                <Stat
                  label="Net cashflow / year"
                  value={money(rentalEst.netAnnual)}
                />
                <Stat
                  label="Cap Rate (simple)"
                  value={
                    isFinite(rentalEst.capRate)
                      ? `${rentalEst.capRate.toFixed(2)}%`
                      : "—"
                  }
                  note="Based on your net annual estimate."
                />
                <Stat
                  label="Cash-on-cash (simple)"
                  value={
                    isFinite(rentalEst.coc)
                      ? `${rentalEst.coc.toFixed(2)}%`
                      : "—"
                  }
                  note="Based on your cash invested."
                />
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Tip: If cashflow is thin, increase reserves, tighten ops
                assumptions, or negotiate price/terms.
              </p>
            </div>
          </div>
        </Card>

        {/* Professionals */}
        <Card
          id="professionals"
          title="4) Black-Owned Real Estate Agencies & Professionals"
          subtitle="Build with the community—agents, lenders, appraisers, inspectors, contractors, and property managers."
          icon={<Users className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Why your team matters
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                  The right team can protect you from bad deals, hidden repair
                  costs, and weak negotiations. Start by selecting 2–3
                  professionals, interview them, and choose the one who
                  communicates clearly and moves with urgency.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">
                      Questions to ask an agent
                    </div>
                    <ul className="mt-2 space-y-1">
                      <li>
                        • How many deals did you close in the last 12 months?
                      </li>
                      <li>• What neighborhoods do you specialize in?</li>
                      <li>• How do you handle inspection issues?</li>
                      <li>• How do you communicate (text/email/calls)?</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-bold text-gray-100">
                      Questions to ask a lender
                    </div>
                    <ul className="mt-2 space-y-1">
                      <li>• What programs fit my profile?</li>
                      <li>• What are estimated fees/closing costs?</li>
                      <li>• What’s the rate-lock policy?</li>
                      <li>• What documents do you need now?</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-extrabold text-yellow-200">
                  Featured directories & associations
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>
                    •{" "}
                    <ExternalLink href="https://www.nareb.com/">
                      NAREB (National Association of Real Estate Brokers)
                    </ExternalLink>{" "}
                    — Find a Realtist & community-focused advocacy.
                  </li>
                  <li>
                    •{" "}
                    <ExternalLink href="https://www.nareb.com/find-a-realtist">
                      NAREB: Find a Realtist
                    </ExternalLink>
                  </li>
                  <li>
                    •{" "}
                    <ExternalLink href="https://blackrealestateagents.com/">
                      BlackRealEstateAgents.com
                    </ExternalLink>{" "}
                    — Match with vetted Black agents.
                  </li>
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  <GoldButton
                    href="/business-directory?category=Real%20Estate"
                    variant="ghost"
                  >
                    Browse BWE Real Estate Category{" "}
                    <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                  <GoldButton href="/business-directory/submit" variant="ghost">
                    Add Your Business <ArrowRight className="h-4 w-4" />
                  </GoldButton>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">
                  Pro categories to build your team
                </div>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  <li>• Real Estate Agents & Brokers</li>
                  <li>• Mortgage Lenders & Credit Specialists</li>
                  <li>• Home Inspectors</li>
                  <li>• Appraisers</li>
                  <li>• Contractors & Trades</li>
                  <li>• Property Managers</li>
                  <li>• Title / Escrow</li>
                  <li>• Insurance</li>
                </ul>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
                <div className="text-yellow-200 font-extrabold">
                  Community impact tip
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  When possible, hire and refer Black-owned professionals. Over
                  time, this creates local opportunity, builds capacity, and
                  keeps value circulating in the community.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Education & Resources */}
        <Card
          id="education"
          title="5) Education & Trusted Resources"
          subtitle="If you’re serious, use trusted references—not guesswork, hype, or social media shortcuts."
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Homebuying (Official)
              </div>
              <ul className="mt-3 space-y-2">
                <li>
                  •{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/owning-a-home/">
                    CFPB: Buying a house tools & roadmap
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/owning-a-home/explore/home-loan-toolkit/">
                    CFPB: Your Home Loan Toolkit
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.hud.gov/stat/sfh/housing-counseling">
                    HUD: Housing Counseling
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.consumerfinance.gov/find-a-housing-counselor/">
                    Find a Housing Counselor (CFPB)
                  </ExternalLink>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Low down payment options (Official)
              </div>
              <ul className="mt-3 space-y-2">
                <li>
                  •{" "}
                  <ExternalLink href="https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/homeready-mortgage">
                    Fannie Mae: HomeReady Mortgage
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://sf.freddiemac.com/working-with-us/origination-underwriting/mortgage-products/home-possible">
                    Freddie Mac: Home Possible
                  </ExternalLink>
                </li>
                <li>
                  •{" "}
                  <ExternalLink href="https://www.naca.com/">
                    NACA: Homebuyer advocacy + programs
                  </ExternalLink>
                </li>
              </ul>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 md:col-span-2">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <ShieldAlert className="h-4 w-4" />
                Safety: avoid scams & predatory deals
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm text-gray-300">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">
                    Pressure tactics
                  </div>
                  <div className="mt-1">
                    If you’re rushed, you’re at risk. Pause and verify.
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">Hidden costs</div>
                  <div className="mt-1">
                    Always estimate repairs, vacancy, and reserves.
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-bold text-gray-100">
                    Unclear paperwork
                  </div>
                  <div className="mt-1">
                    Don’t sign what you don’t understand—ask for clarity.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Toolkit */}
        <Card
          id="premium"
          title="Premium Toolkit (Optional): Templates, Checklists, and Deal Analyzer"
          subtitle="For users who want a faster path with structure: ready-to-use documents, checklists, and underwriting templates."
          icon={<Lock className="h-5 w-5" />}
          right={
            <GoldButton onClick={goPremium}>
              Unlock Premium <ArrowRight className="h-4 w-4" />
            </GoldButton>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <Lock className="h-4 w-4" />
                Investor Deal Analyzer (Spreadsheet-style)
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Plug in price, rent, repairs, financing, and see cashflow +
                return ranges.
              </p>
            </div>

            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <Lock className="h-4 w-4" />
                Inspection + Repair Negotiation Checklist
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Know what to inspect, how to prioritize repairs, and how to
                negotiate without fear.
              </p>
            </div>

            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <Lock className="h-4 w-4" />
                First-Time Homebuyer Document Pack
              </div>
              <p className="text-sm text-gray-300 mt-2">
                A clean document checklist + timeline so you don’t get stuck or
                delayed.
              </p>
            </div>

            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-yellow-200 font-extrabold">
                <Lock className="h-4 w-4" />
                Landlord Setup: Tenant Screening + Reserve Plan
              </div>
              <p className="text-sm text-gray-300 mt-2">
                A simple system for screening, leasing, reserves, and protecting
                your cashflow.
              </p>
            </div>
          </div>

          <div className="mt-5 text-sm text-gray-300">
            Not ready for Premium? No problem—everything above is designed to
            help you make strong moves for free.
          </div>
        </Card>

        {/* FAQ */}
        <Card
          id="faq"
          title="FAQ: Quick Answers"
          subtitle="A few common questions people ask when they’re starting their real estate journey."
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <details className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <summary className="cursor-pointer text-yellow-200 font-bold">
                What’s the safest “first investment” if I’m nervous?
              </summary>
              <p className="text-sm text-gray-300 mt-2">
                House hacking can be a strong start (live in one unit/room, rent
                the rest), because it lowers your living cost while you learn.
                The “safest” move is the one you can sustain with reserves and
                conservative numbers.
              </p>
            </details>

            <details className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <summary className="cursor-pointer text-yellow-200 font-bold">
                How much cash do I need besides the down payment?
              </summary>
              <p className="text-sm text-gray-300 mt-2">
                Plan for closing costs plus a reserve fund. For investors,
                reserves are non-negotiable—repairs and vacancy happen.
              </p>
            </details>

            <details className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <summary className="cursor-pointer text-yellow-200 font-bold">
                What if I don’t know any Black-owned professionals yet?
              </summary>
              <p className="text-sm text-gray-300 mt-2">
                Start with directories like NAREB and BWE’s business directory.
                Interview 2–3 people, choose the one who is clear, responsive,
                and aligned with your goals.
              </p>
            </details>
          </div>
        </Card>

        {/* Bottom CTA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-yellow-200">
            Ready to take the next step?
          </h3>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Explore Black-owned real estate professionals, learn the process,
            and move with confidence—one smart step at a time.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <GoldButton href="/business-directory?category=Real%20Estate">
              Browse Real Estate Directory <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <GoldButton href="/business-directory/submit" variant="ghost">
              Add Your Business <ArrowRight className="h-4 w-4" />
            </GoldButton>
            <GoldButton href="/pricing" variant="ghost">
              View Premium Options <Lock className="h-4 w-4" />
            </GoldButton>
          </div>
        </div>
      </main>

      {/* Footer spacing */}
      <div className="h-10" />
    </div>
  );
};

export default RealEstateInvestment;
