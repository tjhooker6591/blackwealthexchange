#!/bin/bash
set -e

echo "Creating Wealth Builder + Travel Map scaffold in $(pwd)..."

mkdir -p src/components/wealth-builder
mkdir -p src/components/travel-map

mkdir -p src/pages/wealth-builder
mkdir -p src/pages/travel-map

mkdir -p src/pages/api/wealth-builder/debts
mkdir -p src/pages/api/wealth-builder/goals
mkdir -p src/pages/api/travel-map

# ---------------------------
# Wealth Builder Nav
# ---------------------------
cat > src/components/wealth-builder/WealthBuilderNav.tsx <<'EOF'
import Link from "next/link";
import { useRouter } from "next/router";

const items = [
  { href: "/wealth-builder", label: "Overview" },
  { href: "/wealth-builder/dashboard", label: "Dashboard" },
  { href: "/wealth-builder/debt", label: "Debt" },
  { href: "/wealth-builder/budget", label: "Budget" },
  { href: "/wealth-builder/savings", label: "Savings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function WealthBuilderNav() {
  const router = useRouter();

  return (
    <nav
      aria-label="Wealth Builder Navigation"
      className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-yellow-700/40 bg-black/40 p-4"
    >
      {items.map((item) => {
        const active = isActive(router.pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
                : "border-white/15 bg-white/5 text-white hover:border-yellow-500/40 hover:text-yellow-300",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
EOF

# ---------------------------
# Travel Map Nav
# ---------------------------
cat > src/components/travel-map/TravelMapNav.tsx <<'EOF'
import Link from "next/link";
import { useRouter } from "next/router";

const items = [
  { href: "/travel-map", label: "Overview" },
  { href: "/travel-map/explore", label: "Explore" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function TravelMapNav() {
  const router = useRouter();

  return (
    <nav
      aria-label="Travel Map Navigation"
      className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-yellow-700/40 bg-black/40 p-4"
    >
      {items.map((item) => {
        const active = isActive(router.pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
                : "border-white/15 bg-white/5 text-white hover:border-yellow-500/40 hover:text-yellow-300",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
EOF

# ---------------------------
# Optional Summary Card Component
# ---------------------------
cat > src/components/wealth-builder/SummaryCard.tsx <<'EOF'
type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
};

export default function SummaryCard({
  title,
  value,
  description,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-lg">
      <p className="text-sm uppercase tracking-wide text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-yellow-300">{value}</p>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  );
}
EOF

# ---------------------------
# Wealth Builder Landing Page
# ---------------------------
cat > src/pages/wealth-builder/index.tsx <<'EOF'
import Head from "next/head";
import Link from "next/link";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

export default function WealthBuilderIndexPage() {
  return (
    <>
      <Head>
        <title>Wealth Builder | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Track debt, build budgets, grow savings, and create a stronger financial future."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Wealth Builder
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Build financial clarity with a focused tool for debt, budgeting, and savings.
            </h1>
            <p className="mt-5 max-w-3xl text-base text-zinc-300 md:text-lg">
              This is the starting foundation for the Wealth Builder experience inside Black Wealth Exchange.
              It is designed to help users organize debt, track money, and move toward stronger savings habits.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/dashboard"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                Open Dashboard
              </Link>
              <Link
                href="/wealth-builder/debt"
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Start with Debt
              </Link>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Debt Clarity",
                text: "Track balances, interest rates, lenders, and minimum payments in one place.",
              },
              {
                title: "Budget Planning",
                text: "Create monthly budget targets and structure spending categories for real visibility.",
              },
              {
                title: "Savings Goals",
                text: "Set target amounts, track progress, and keep the focus on long-term growth.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6"
              >
                <h2 className="text-xl font-semibold text-yellow-300">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-950/60 p-6">
            <h2 className="text-xl font-semibold text-white">Current Build Status</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Placeholder shell is in place so the app can build cleanly while the real data flow,
              dashboard calculations, and CRUD behavior are implemented next.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Wealth Builder Dashboard Page
# ---------------------------
cat > src/pages/wealth-builder/dashboard.tsx <<'EOF'
import Head from "next/head";
import Link from "next/link";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import SummaryCard from "@/components/wealth-builder/SummaryCard";

export default function WealthBuilderDashboardPage() {
  return (
    <>
      <Head>
        <title>Wealth Builder Dashboard | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Wealth Builder dashboard shell for income, debt, savings, goals, and budget status."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold">Your financial snapshot</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This dashboard is a production-safe shell with placeholder values. It gives us a clean structure
              for wiring real financial profile, debt, budget, savings, and goal data next.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Monthly Income"
                value="$0"
                description="Placeholder until profile and income logic is connected."
              />
              <SummaryCard
                title="Total Debt"
                value="$0"
                description="Will aggregate balances from financial_debts."
              />
              <SummaryCard
                title="Total Savings"
                value="$0"
                description="Will aggregate savings goals and later savings-linked data."
              />
              <SummaryCard
                title="Active Goals"
                value="0"
                description="Will show active savings goals."
              />
              <SummaryCard
                title="Budget Status"
                value="Not Set"
                description="Will show current month budget state once budget routes are added."
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/debt"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/25"
              >
                Add Debt
              </Link>
              <Link
                href="/wealth-builder/budget"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Create Budget
              </Link>
              <Link
                href="/wealth-builder/savings"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Add Savings Goal
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Wealth Builder Debt Page
# ---------------------------
cat > src/pages/wealth-builder/debt.tsx <<'EOF'
import Head from "next/head";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

export default function WealthBuilderDebtPage() {
  return (
    <>
      <Head>
        <title>Debt | Wealth Builder</title>
        <meta
          name="description"
          content="Debt tracking page shell for Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Debt
            </p>
            <h1 className="mt-3 text-4xl font-bold">Debt organizer</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This page will manage debt records using the financial_debts collection.
              Debt CRUD API placeholders are created so build and routing stay clean while real Mongo logic is added.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">Total Debt</h2>
                <p className="mt-3 text-2xl font-bold">$0</p>
                <p className="mt-2 text-sm text-zinc-400">Placeholder summary card.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">Highest Interest Debt</h2>
                <p className="mt-3 text-2xl font-bold">—</p>
                <p className="mt-2 text-sm text-zinc-400">Will populate from debt records.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">Monthly Minimums</h2>
                <p className="mt-3 text-2xl font-bold">$0</p>
                <p className="mt-2 text-sm text-zinc-400">Will sum minimum payments.</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Placeholder Debt List</h2>
              <p className="mt-3 text-sm text-zinc-300">
                No debt records are shown yet. This is a build-safe placeholder while the page is wired to the debt API.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Wealth Builder Budget Page
# ---------------------------
cat > src/pages/wealth-builder/budget.tsx <<'EOF'
import Head from "next/head";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

export default function WealthBuilderBudgetPage() {
  return (
    <>
      <Head>
        <title>Budget | Wealth Builder</title>
        <meta
          name="description"
          content="Budget planning page shell for Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Budget
            </p>
            <h1 className="mt-3 text-4xl font-bold">Monthly budget planner</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This page is intentionally a safe shell for now. Budget API routes and category entry forms
              will be added in a later pass without breaking routing or build stability.
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Budget module placeholder</h2>
              <p className="mt-3 text-sm text-zinc-300">
                Planned categories, totals, and budget-vs-actual views will live here.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Wealth Builder Savings Page
# ---------------------------
cat > src/pages/wealth-builder/savings.tsx <<'EOF'
import Head from "next/head";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

export default function WealthBuilderSavingsPage() {
  return (
    <>
      <Head>
        <title>Savings | Wealth Builder</title>
        <meta
          name="description"
          content="Savings goals page shell for Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Savings
            </p>
            <h1 className="mt-3 text-4xl font-bold">Savings goals</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This page is ready for savings goal CRUD wiring. Placeholder API routes are included so
              the project structure is stable while real goal management logic is added.
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-900/60 p-6">
              <h2 className="text-xl font-semibold">Savings goal placeholder list</h2>
              <p className="mt-3 text-sm text-zinc-300">
                Goal name, target amount, current amount, target date, and progress will render here later.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Travel Map Landing Page
# ---------------------------
cat > src/pages/travel-map/index.tsx <<'EOF'
import Head from "next/head";
import Link from "next/link";
import TravelMapNav from "@/components/travel-map/TravelMapNav";

export default function TravelMapIndexPage() {
  return (
    <>
      <Head>
        <title>Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Discover Black-owned businesses while traveling with a dedicated map experience."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <TravelMapNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Travel Map
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Find Black-owned businesses while traveling without leaving the Black Wealth Exchange experience.
            </h1>
            <p className="mt-5 max-w-3xl text-base text-zinc-300 md:text-lg">
              This module is the starting shell for a dedicated discovery and map experience with future support
              for nearby search, category filtering, saved places, and trip planning.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/travel-map/explore"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                Explore Map
              </Link>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Search by Place",
                text: "Search by city, state, ZIP, destination, or current location later in the build.",
              },
              {
                title: "Filter by Category",
                text: "Browse restaurants, shops, wellness, beauty, services, lodging, and more.",
              },
              {
                title: "Support While Traveling",
                text: "Keep discovery and community support tied directly into the BWE platform experience.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6"
              >
                <h2 className="text-xl font-semibold text-yellow-300">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Travel Map Explore Page
# ---------------------------
cat > src/pages/travel-map/explore.tsx <<'EOF'
import Head from "next/head";
import TravelMapNav from "@/components/travel-map/TravelMapNav";

const placeholderBusinesses = [
  { id: "placeholder-1", name: "Business Result Placeholder", category: "Restaurant", city: "Atlanta", state: "GA" },
  { id: "placeholder-2", name: "Business Result Placeholder", category: "Wellness", city: "Houston", state: "TX" },
  { id: "placeholder-3", name: "Business Result Placeholder", category: "Retail", city: "Chicago", state: "IL" },
];

export default function TravelMapExplorePage() {
  return (
    <>
      <Head>
        <title>Explore Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Explore Black-owned businesses with a dedicated travel map shell."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <TravelMapNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Explore
            </p>
            <h1 className="mt-3 text-4xl font-bold">Travel Map explorer</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This is a production-safe placeholder shell with search, category filter, map container,
              and business result list structure already in place.
            </p>

            <div className="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <h2 className="text-lg font-semibold text-yellow-300">Search</h2>
                  <input
                    type="text"
                    placeholder="Search by city, destination, or business..."
                    className="mt-4 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                    readOnly
                  />
                  <p className="mt-3 text-xs text-zinc-400">
                    Placeholder input for future search API wiring.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <h2 className="text-lg font-semibold text-yellow-300">Category Filters</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Restaurants", "Retail", "Wellness", "Beauty", "Services", "Lodging"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    Placeholder filter area for future interactive category selection.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <h2 className="text-lg font-semibold text-yellow-300">Business Results</h2>
                  <div className="mt-4 space-y-3">
                    {placeholderBusinesses.map((biz) => (
                      <div
                        key={biz.id}
                        className="rounded-xl border border-white/10 bg-zinc-900/80 p-4"
                      >
                        <p className="font-semibold text-white">{biz.name}</p>
                        <p className="mt-1 text-sm text-zinc-400">
                          {biz.category} • {biz.city}, {biz.state}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-900/60 p-6">
                <h2 className="text-xl font-semibold text-white">Map Container Placeholder</h2>
                <div className="mt-4 flex min-h-[500px] items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                  <p className="max-w-md text-center text-sm text-zinc-400">
                    Map SDK container goes here. This placeholder keeps the route build-safe until live map rendering,
                    nearby search, and result pin integration are added.
                  </p>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
EOF

# ---------------------------
# Debt API placeholder: index
# ---------------------------
cat > src/pages/api/wealth-builder/debts/index.ts <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";

type DebtPlaceholder = {
  ok: boolean;
  placeholder: boolean;
  message: string;
  items?: Array<Record<string, unknown>>;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebtPlaceholder>
) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Debt list placeholder route is active. Mongo logic not connected yet.",
      items: [],
    });
  }

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Debt create placeholder route is active. Mongo logic not connected yet.",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    ok: false,
    placeholder: true,
    message: `Method ${req.method} not allowed.`,
  });
}
EOF

# ---------------------------
# Debt API placeholder: [id]
# ---------------------------
cat > 'src/pages/api/wealth-builder/debts/[id].ts' <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";

type DebtDetailPlaceholder = {
  ok: boolean;
  placeholder: boolean;
  id?: string | string[];
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebtDetailPlaceholder>
) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Debt update placeholder route is active. Mongo logic not connected yet.",
    });
  }

  if (req.method === "DELETE") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Debt delete placeholder route is active. Mongo logic not connected yet.",
    });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({
    ok: false,
    placeholder: true,
    id,
    message: `Method ${req.method} not allowed.`,
  });
}
EOF

# ---------------------------
# Savings Goals API placeholder: index
# ---------------------------
cat > src/pages/api/wealth-builder/goals/index.ts <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";

type GoalsPlaceholder = {
  ok: boolean;
  placeholder: boolean;
  message: string;
  items?: Array<Record<string, unknown>>;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoalsPlaceholder>
) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Savings goals list placeholder route is active. Mongo logic not connected yet.",
      items: [],
    });
  }

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      message: "Savings goal create placeholder route is active. Mongo logic not connected yet.",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    ok: false,
    placeholder: true,
    message: `Method ${req.method} not allowed.`,
  });
}
EOF

# ---------------------------
# Savings Goals API placeholder: [id]
# ---------------------------
cat > 'src/pages/api/wealth-builder/goals/[id].ts' <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";

type GoalDetailPlaceholder = {
  ok: boolean;
  placeholder: boolean;
  id?: string | string[];
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoalDetailPlaceholder>
) {
  const { id } = req.query;

  if (req.method === "PATCH") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Savings goal update placeholder route is active. Mongo logic not connected yet.",
    });
  }

  if (req.method === "DELETE") {
    return res.status(200).json({
      ok: true,
      placeholder: true,
      id,
      message: "Savings goal delete placeholder route is active. Mongo logic not connected yet.",
    });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({
    ok: false,
    placeholder: true,
    id,
    message: `Method ${req.method} not allowed.`,
  });
}
EOF

# ---------------------------
# Travel Map search API placeholder
# ---------------------------
cat > src/pages/api/travel-map/search.ts <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";

type TravelMapSearchResponse = {
  ok: boolean;
  placeholder: boolean;
  message: string;
  items: Array<{
    id: string;
    business_name: string;
    category: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
  }>;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TravelMapSearchResponse>
) {
  return res.status(200).json({
    ok: true,
    placeholder: true,
    message: "Travel Map search placeholder route is active. Business search logic not connected yet.",
    items: [],
  });
}
EOF

echo "Scaffold created successfully."

echo ""
echo "Created files:"
echo "  src/components/wealth-builder/WealthBuilderNav.tsx"
echo "  src/components/wealth-builder/SummaryCard.tsx"
echo "  src/components/travel-map/TravelMapNav.tsx"
echo "  src/pages/wealth-builder/index.tsx"
echo "  src/pages/wealth-builder/dashboard.tsx"
echo "  src/pages/wealth-builder/debt.tsx"
echo "  src/pages/wealth-builder/budget.tsx"
echo "  src/pages/wealth-builder/savings.tsx"
echo "  src/pages/travel-map/index.tsx"
echo "  src/pages/travel-map/explore.tsx"
echo "  src/pages/api/wealth-builder/debts/index.ts"
echo "  src/pages/api/wealth-builder/debts/[id].ts"
echo "  src/pages/api/wealth-builder/goals/index.ts"
echo "  src/pages/api/wealth-builder/goals/[id].ts"
echo "  src/pages/api/travel-map/search.ts"