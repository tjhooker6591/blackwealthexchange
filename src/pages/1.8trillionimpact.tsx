// src/pages/1.8trillionimpact.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  BarChart,
  Home,
  Sparkles,
  Target,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(n: number) {
  // simple formatter for big numbers
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

const BUYING_POWER_2026 = 2.1e12; // $2.1T (est.)
const BUYING_POWER_2025 = 1.98e12; // $1.98T (est.)

export default function TrillionImpactPage() {
  const shift05 = BUYING_POWER_2026 * 0.005; // 0.5%
  const shift1 = BUYING_POWER_2026 * 0.01; // 1%
  const shift5 = BUYING_POWER_2026 * 0.05; // 5%

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>Where Black Dollars Go | Black Wealth Exchange</title>
        <meta
          name="description"
          content="A powerful breakdown of Black buying power, wealth leakage, and how redirecting spending into Black-owned businesses can compound into jobs, ownership, and long-term community resilience."
        />
      </Head>

      {/* subtle index-style glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[520px] w-[520px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-8 md:py-12">
        {/* Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[12px] font-extrabold text-[#D4AF37]">
                <Sparkles className="h-4 w-4" />
                Economic Power • Ownership • Compounding Impact
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Where Black Dollars Go:
                <span className="text-[#D4AF37]"> The Financial Impact</span> & the Opportunity
              </h1>

              <p className="mt-3 max-w-3xl text-white/70 leading-relaxed">
                Black buying power is massive — but the real power comes when spending turns into{" "}
                <span className="text-white font-bold">ownership</span>, when dollars circulate locally,
                and when reinvestment compounds into jobs, businesses, and long-term resilience.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/business-directory"
                className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-2.5 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
              >
                Explore Black-Owned Businesses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard
              icon={<DollarSign className="h-5 w-5 text-[#D4AF37]" />}
              label="Buying Power (2026 est.)"
              value={formatMoney(BUYING_POWER_2026)}
              note="Projected scale"
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5 text-[#D4AF37]" />}
              label="Buying Power (2025 est.)"
              value={formatMoney(BUYING_POWER_2025)}
              note="Recent estimate"
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-emerald-300" />}
              label="Shift just 0.5%"
              value={formatMoney(shift05)}
              note="into Black-owned"
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-emerald-300" />}
              label="Shift just 1%"
              value={formatMoney(shift1)}
              note="into Black-owned"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <MiniCallout
              icon={<ShieldCheck className="h-5 w-5 text-[#D4AF37]" />}
              title="This is the real opportunity"
              desc="Spending is power — but ownership is leverage. Redirecting even a small percentage can compound into stable businesses, stronger neighborhoods, and generational wealth."
            />
            <MiniCallout
              icon={<BarChart className="h-5 w-5 text-[#D4AF37]" />}
              title="Compounding effect (example)"
              desc={`If 5% is redirected, that’s about ${formatMoney(shift5)} flowing back into Black-owned businesses — fueling growth, hiring, supply chains, and reinvestment.`}
            />
          </div>
        </div>

        {/* CONTENT — keep your original sections, upgraded styling + expanded power */}
        <div className="mt-8 grid gap-6">
          {/* The $2.1T Impact */}
          <SectionCard
            icon={<DollarSign className="w-6 h-6 text-[#D4AF37]" />}
            title="The $2.1 Trillion Impact of African American Spending (2026 estimate)"
            subtitle="The scale is real — and the strategy is simple: redirect + reinvest + repeat."
          >
            <ul className="list-disc pl-5 space-y-2 text-white/75">
              <li>
                <strong className="text-white">Annual Economic Contribution:</strong>{" "}
                African Americans contribute an estimated{" "}
                <strong className="text-white">$2.1T</strong> annually to the U.S. economy (2026 estimate).
              </li>
              <li>
                <strong className="text-white">2025 baseline:</strong> Estimated at{" "}
                <strong className="text-white">$1.98T</strong> in 2025 (recent estimate).
              </li>
              <li>
                <strong className="text-white">Global Comparison:</strong> At this scale, Black buying power
                is comparable to the GDP of major economies (high-level comparison, not a perfect 1:1 GDP metric).
              </li>
              <li>
                <strong className="text-white">Retail & Consumer Influence:</strong> Black consumers strongly influence fashion, beauty, tech, and food markets.
              </li>
              <li>
                <strong className="text-white">Investment Potential:</strong> Redirecting even a small percentage into Black-owned businesses can compound into jobs, ownership, and community resilience.
              </li>
            </ul>

            {/* Expanded investment potential */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <ValueCard
                title="1) Spending → Revenue"
                desc="Revenue stabilizes businesses, improves creditworthiness, and increases hiring capacity."
              />
              <ValueCard
                title="2) Revenue → Reinvestment"
                desc="Reinvestment expands locations, inventory, marketing, and staff — creating a flywheel."
              />
              <ValueCard
                title="3) Reinvestment → Ownership"
                desc="Ownership builds assets (equipment, real estate, IP) that can be passed down."
              />
            </div>
          </SectionCard>

          {/* Where Black Dollars Go */}
          <SectionCard
            icon={<ShoppingBag className="w-6 h-6 text-[#D4AF37]" />}
            title="Where Black Dollars Go"
            subtitle="These categories capture a major share of spending — but ownership and reinvestment often happen elsewhere."
          >
            <ul className="list-disc pl-5 space-y-2 text-white/75">
              <li>
                <strong className="text-white">Retail & Fashion:</strong> Brands like Nike, Louis Vuitton, H&amp;M, Gucci, and Adidas benefit heavily from Black consumer loyalty.
              </li>
              <li>
                <strong className="text-white">Beauty & Personal Care:</strong> Companies such as L&apos;Oréal, Procter &amp; Gamble, Unilever, Estée Lauder, and Johnson &amp; Johnson profit from Black spending.
              </li>
              <li>
                <strong className="text-white">Technology & Entertainment:</strong> Giants like Apple, Netflix, Spotify, Samsung, Sony, and Amazon capture significant share of consumer dollars.
              </li>
              <li>
                <strong className="text-white">Fast Food & Dining:</strong> McDonald&apos;s, Starbucks, Chick-fil-A, KFC, and Taco Bell benefit greatly from Black consumer dollars.
              </li>
            </ul>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70">
              <strong className="text-white">Power move:</strong> keep your favorites — but{" "}
              <span className="text-white font-bold">rebalance</span>. Make Black-owned your default where you can:
              dining, grooming, services, gifts, events, and recurring monthly purchases.
            </div>
          </SectionCard>

          {/* Wealth Leakage */}
          <SectionCard
            icon={<Clock className="w-6 h-6 text-[#D4AF37]" />}
            title="Wealth Leakage & Circulation"
            subtitle="The point isn’t a single number — it’s the pattern: money exits too fast when supply chains and ownership are outside the community."
          >
            {/* Keep your original statements, but strengthen + add clarity */}
            <ul className="list-disc pl-5 space-y-2 text-white/75">
              <li>
                <strong className="text-white">Circulation Time (often-cited):</strong> You may hear comparisons like “hours vs days” across communities. These figures vary by source and methodology — but the core idea holds: faster exit = weaker compounding.
              </li>
              <li>
                <strong className="text-white">Wealth Leakage:</strong> When businesses, suppliers, and financial institutions are external, profit is extracted rather than recirculated.
              </li>
              <li>
                <strong className="text-white">Redistribution Potential:</strong> By reallocating just 5–10% of spending back into the community, billions can be reinvested into education, infrastructure, and entrepreneurship.
              </li>
              <li>
                <strong className="text-white">Actionable Fact:</strong> Shifting just 5% creates meaningful capital flow that supports hiring, expansion, and new business formation.
              </li>
            </ul>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <ImpactStat title="0.5% shift" value={formatMoney(shift05)} note="small habit change" />
              <ImpactStat title="1% shift" value={formatMoney(shift1)} note="strong monthly intention" />
              <ImpactStat title="5% shift" value={formatMoney(shift5)} note="community-wide movement" />
            </div>
          </SectionCard>

          {/* Reclaiming Power */}
          <SectionCard
            icon={<TrendingUp className="w-6 h-6 text-[#D4AF37]" />}
            title="Reclaiming Black Economic Power"
            subtitle="Four levers that turn spending into ownership and resilience."
          >
            <ul className="list-disc pl-5 space-y-2 text-white/75">
              <li>
                <strong className="text-white">Buy Black:</strong> Prioritize Black-owned businesses to increase local circulation and job creation.
              </li>
              <li>
                <strong className="text-white">Bank Black:</strong> Direct deposits and savings to Black-owned institutions where possible.
              </li>
              <li>
                <strong className="text-white">Invest Black:</strong> Support entrepreneurs, startups, and Black-owned funds and projects.
              </li>
              <li>
                <strong className="text-white">Educate Black:</strong> Build financial literacy so families can convert income into assets.
              </li>
              <li>
                <strong className="text-white">Ownership mindset:</strong> Every purchase is a vote. The mission is to vote for ownership more often.
              </li>
            </ul>

            <div className="mt-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 text-[13px] text-white/80">
              <strong className="text-white">Why this matters:</strong> Wealth compounds when assets grow. The Federal Reserve’s SCF data shows Black non-Hispanic families’ median net worth was about <strong className="text-white">$44,900</strong> in 2022 — reinforcing why ownership and asset-building must be the goal, not just consumption.
            </div>
          </SectionCard>

          {/* How to Shift Economic Power */}
          <SectionCard
            icon={<BarChart className="w-6 h-6 text-[#D4AF37]" />}
            title="How to Shift Economic Power"
            subtitle="A practical plan that doesn’t require perfection — just consistency."
          >
            <p className="text-white/75 leading-relaxed">
              Shifting spending habits toward Black-owned enterprises will create jobs, foster generational wealth, and empower the Black community.
              Black buying power is transformative — when used strategically, it can drive self-sufficiency, prosperity, and long-lasting economic control.
              <strong className="text-white"> The time to act is now.</strong>
            </p>

            <ul className="mt-4 list-disc pl-5 space-y-2 text-white/75">
              <li>Choose 3 recurring categories to “Buy Black first” (food, grooming, gifts, services).</li>
              <li>Move one recurring bill/deposit into a community-aligned institution where possible.</li>
              <li>Set a monthly “ownership transfer” goal (0.5% is powerful when repeated).</li>
              <li>Teach one wealth principle monthly (budgeting, investing, credit, insurance, estate basics).</li>
              <li>
                <strong className="text-white">Important:</strong> Consistency beats intensity. A small shift, sustained, creates compounding impact.
              </li>
            </ul>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <MiniCallout
                icon={<Target className="h-5 w-5 text-[#D4AF37]" />}
                title="Your 30-day challenge"
                desc="Redirect 0.5% of monthly spending to Black-owned businesses. Track it. Share it. Repeat it."
              />
              <MiniCallout
                icon={<ShieldCheck className="h-5 w-5 text-[#D4AF37]" />}
                title="Build the flywheel"
                desc="Buy → review → refer → repeat. Reviews and referrals are free “marketing capital” that boosts winners."
              />
            </div>
          </SectionCard>

          {/* The Path Forward */}
          <SectionCard
            icon={<Sparkles className="w-6 h-6 text-[#D4AF37]" />}
            title="The Path Forward"
            subtitle="This is how we turn buying power into economic control."
          >
            <p className="text-white/75 leading-relaxed">
              We don’t need everyone to change everything overnight. We need a movement that shifts enough spending — consistently —
              to grow Black-owned supply chains, expand hiring, and increase ownership across neighborhoods.
              <strong className="text-white"> The time to act is now.</strong>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/business-directory"
                className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-2.5 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
              >
                Browse the Directory <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                Explore the Marketplace <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/financial-literacy"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                Learn Financial Literacy <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-[12px] text-white/60">
              <div className="font-extrabold text-white/70 mb-2">Sources / Notes</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Buying power estimates are commonly cited from NielsenIQ / Selig Center projections; figures vary by methodology and year.
                </li>
                <li>
                  Wealth context: Federal Reserve SCF reporting highlights persistent wealth gaps even amid improvements.
                </li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  className="underline text-white/70 hover:text-[#D4AF37]"
                  href="https://www.nielsen.com/insights/2023/connecting-to-black-america/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NielsenIQ: Connecting to Black America
                </a>
                <a
                  className="underline text-white/70 hover:text-[#D4AF37]"
                  href="https://www.federalreserve.gov/publications/files/scf23.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fed: SCF 2019–2022 report (PDF)
                </a>
              </div>
            </div>
          </SectionCard>

          {/* Back to Home (keep your original intent) */}
          <div className="flex justify-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-[#D4AF37] text-black text-[14px] font-extrabold shadow transition hover:bg-yellow-500"
            >
              <Home className="w-5 h-5 mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-white/60 text-sm">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2 text-white/70 text-[12px] font-bold">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      {note ? <div className="mt-1 text-[12px] text-white/55">{note}</div> : null}
    </div>
  );
}

function MiniCallout({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-extrabold text-white">{title}</div>
      </div>
      <div className="mt-2 text-[13px] text-white/70 leading-relaxed">{desc}</div>
    </div>
  );
}

function ValueCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[13px] font-extrabold text-[#D4AF37]">{title}</div>
      <div className="mt-2 text-[13px] text-white/70 leading-relaxed">{desc}</div>
    </div>
  );
}

function ImpactStat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[12px] text-white/60 font-bold">{title}</div>
      <div className="mt-2 text-xl font-extrabold text-white">{value}</div>
      {note ? <div className="mt-1 text-[12px] text-white/55">{note}</div> : null}
    </div>
  );
}
