import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
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
  tone?: "gold" | "muted";
}) {
  const tones: Record<string, string> = {
    gold: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20",
    muted: "bg-white/5 text-gray-200 border-white/10",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function PriceCard({
  title,
  price,
  sub,
  highlight,
  badge,
  features,
  ctaText,
  onCta,
  finePrint,
}: {
  title: string;
  price: string;
  sub?: string;
  highlight?: boolean;
  badge?: string;
  features: Array<{ ok: boolean; text: string }>;
  ctaText: string;
  onCta: () => void;
  finePrint?: string;
}) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border p-6 shadow-lg",
        highlight
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-white/5 border-white/10"
      )}
    >
      {badge ? (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-extrabold shadow">
            <Star className="h-4 w-4" />
            {badge}
          </span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className={cx(
              "text-xl sm:text-2xl font-extrabold",
              highlight ? "text-yellow-200" : "text-white"
            )}
          >
            {title}
          </h2>
          {sub ? <p className="text-sm text-gray-300 mt-1">{sub}</p> : null}
        </div>

        <Pill tone={highlight ? "gold" : "muted"}>
          <BadgeCheck className="h-4 w-4" />
          Trusted Access
        </Pill>
      </div>

      <div className="mt-5">
        <div className="text-3xl sm:text-4xl font-extrabold text-white">
          {price}
        </div>
        <div className="text-sm text-gray-400 mt-1">Billed monthly • Cancel anytime</div>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f, idx) => (
          <li
            key={idx}
            className={cx(
              "flex items-start gap-2",
              f.ok ? "text-gray-200" : "text-gray-500"
            )}
          >
            <span className="mt-[2px]">
              {f.ok ? "✅" : "⛔️"}
            </span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        className={cx(
          "mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold transition focus:outline-none focus:ring-2 focus:ring-yellow-500/50 active:scale-[0.99]",
          highlight
            ? "bg-yellow-500 text-black hover:bg-yellow-400"
            : "bg-white/5 text-yellow-200 border border-yellow-500/25 hover:bg-yellow-500/10"
        )}
      >
        {ctaText} <ArrowRight className="h-4 w-4" />
      </button>

      {finePrint ? (
        <p className="mt-3 text-xs text-gray-400">{finePrint}</p>
      ) : null}
    </div>
  );
}

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();

  const goCheckout = (plan: "premium" | "founder") => {
    // Optional gating: require login before checkout
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/checkout?plan=${plan}`)}`);
      return;
    }
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background glow like index */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[28rem] w-[28rem] rounded-full bg-yellow-500/8 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-[30rem] w-[30rem] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <ArrowRight className="h-4 w-4 rotate-180 text-yellow-200" />
            <span className="text-sm font-semibold">Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <Pill>
              <Lock className="h-4 w-4" />
              Premium Access
            </Pill>
            <Link
              href="/business-directory"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold"
            >
              Browse Directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent" />
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 leading-tight drop-shadow">
              Upgrade to Premium
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mt-4">
              Unlock the **Investment Hub**, premium learning tools, trusted search flow,
              and deeper community features—built to help you move from browsing to building.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Pill tone="muted">
                <ShieldCheck className="h-4 w-4" />
                Cancel anytime
              </Pill>
              <Pill tone="muted">
                <Users className="h-4 w-4" />
                Built for Black economic power
              </Pill>
              <Pill>
                <Sparkles className="h-4 w-4" />
                Premium tools + reports
              </Pill>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <main className="relative max-w-6xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Free */}
          <PriceCard
            title="Free"
            price="$0"
            sub="Perfect for exploring the platform."
            features={[
              { ok: true, text: "Search + browse public content" },
              { ok: true, text: "Marketplace browsing (view products)" },
              { ok: true, text: "Limited directory results" },
              { ok: false, text: "Investment Hub access" },
              { ok: false, text: "Premium reports & insights" },
              { ok: false, text: "Advanced trusted search tools" },
            ]}
            ctaText="Current Plan"
            onCta={() => router.push("/")}
            finePrint="You can upgrade anytime."
          />

          {/* Premium (Most Popular) */}
          <PriceCard
            title="Premium"
            price="$9.99"
            sub="Best value for most members."
            highlight
            badge="Most Popular"
            features={[
              { ok: true, text: "Full Business Directory access" },
              { ok: true, text: "Investment Hub: funding, investing, wealth tools" },
              { ok: true, text: "Premium learning modules & checklists" },
              { ok: true, text: "Monthly reports & insights" },
              { ok: true, text: "Unlimited community access" },
              { ok: true, text: "Trusted search tools + filters (AI Mode & tabs ready)" },
            ]}
            ctaText="Upgrade to Premium"
            onCta={() => goCheckout("premium")}
            finePrint="Cancel anytime. Your access stays active through the billing period."
          />

          {/* Founding Member */}
          <PriceCard
            title="Founding Member"
            price="$19.99"
            sub="Support the mission + unlock founder perks."
            features={[
              { ok: true, text: "Everything in Premium" },
              { ok: true, text: "Priority support & feedback channel" },
              { ok: true, text: "Early access to new features (beta)" },
              { ok: true, text: "Founder badge on profile (optional)" },
              { ok: true, text: "Exclusive quarterly strategy briefings" },
              { ok: true, text: "Tools pack: deal templates, trackers, and planning sheets" },
            ]}
            ctaText="Become a Founder"
            onCta={() => goCheckout("founder")}
            finePrint="Best for power users who want to help shape BWE."
          />
        </div>

        {/* Comparison / “Why upgrade” */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-200">
            Why Go Premium?
          </h2>
          <p className="text-gray-300 mt-2 max-w-3xl">
            Premium isn’t just “more pages.” It’s **tools** and **trusted workflows** that help you take action:
            better directory discovery, wealth-building education, investment resources, and reports that keep you informed.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Trusted Search</div>
              <p className="text-gray-300 mt-2">
                Cleaner discovery (AI Mode + tabs + filters) so users find the right businesses faster.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Investment Hub</div>
              <p className="text-gray-300 mt-2">
                Structured resources for funding, investing, and long-term wealth—built for clarity, not hype.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Reports & Insights</div>
              <p className="text-gray-300 mt-2">
                Monthly insights that keep members focused on what matters and what’s trending in the ecosystem.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              Educational only. Premium tools help decision-making; always verify with qualified professionals.
            </div>
            <div className="flex items-center gap-2">
              <GoldButton href="/checkout?plan=premium" variant="ghost">
                Go to Checkout <ArrowRight className="h-4 w-4" />
              </GoldButton>
              <GoldButton href="/business-directory?category=Real%20Estate" variant="ghost">
                Explore Directory <ArrowRight className="h-4 w-4" />
              </GoldButton>
            </div>
          </div>
        </div>
      </main>

      <div className="h-10" />
    </div>
  );
}

/** Small helper so we can reuse the same button style above without rewriting */
function GoldButton({
  children,
  href,
  variant = "solid",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "solid" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-yellow-500/50";
  const style =
    variant === "solid"
      ? "bg-yellow-500 text-black hover:bg-yellow-400"
      : "bg-white/5 text-yellow-200 border border-yellow-500/25 hover:bg-yellow-500/10";

  return (
    <Link href={href} className={cx(base, style)}>
      {children}
    </Link>
  );
}
