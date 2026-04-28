import React from "react";
import Image from "next/image";
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
        tones[tone],
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
  disabled = false,
  billingNote,
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
  disabled?: boolean;
  billingNote?: string;
}) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border p-6 shadow-lg",
        highlight
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-white/5 border-white/10",
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
              highlight ? "text-yellow-200" : "text-white",
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
        <div className="text-sm text-gray-400 mt-1">
          {billingNote || "Access term applied at checkout"}
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f, idx) => (
          <li
            key={idx}
            className={cx(
              "flex items-start gap-2",
              f.ok ? "text-gray-200" : "text-gray-500",
            )}
          >
            <span className="mt-[2px]">{f.ok ? "✅" : "⛔️"}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        disabled={disabled}
        className={cx(
          "mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold transition focus:outline-none focus:ring-2 focus:ring-yellow-500/50 active:scale-[0.99]",
          disabled
            ? "cursor-not-allowed bg-white/10 text-gray-300 border border-white/10"
            : highlight
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-white/5 text-yellow-200 border border-yellow-500/25 hover:bg-yellow-500/10",
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

  const authUser = (user ?? null) as Record<string, unknown> | null;

  const isPremiumActive =
    authUser?.isPremium === true ||
    authUser?.currentPlan === "premium" ||
    authUser?.premiumStatus === "active";

  const premiumActivatedAt =
    typeof authUser?.premiumActivatedAt === "string"
      ? authUser.premiumActivatedAt
      : null;

  const premiumActivatedLabel = premiumActivatedAt
    ? new Date(premiumActivatedAt).toLocaleDateString()
    : null;

  const goCheckout = (plan: "premium" | "founder") => {
    if (!authUser) {
      router.push(
        `/login?next=${encodeURIComponent(`/checkout?plan=${plan}`)}`,
      );
      return;
    }

    if (plan === "premium" && isPremiumActive) {
      return;
    }

    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[28rem] w-[28rem] rounded-full bg-yellow-500/8 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-[30rem] w-[30rem] rounded-full bg-white/5 blur-3xl" />
      </div>

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

      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent" />
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-yellow-200 leading-tight drop-shadow">
              Activate your membership and receive your Black Card tier
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mt-4">
              Choose the plan that matches your current stage. This is the
              primary membership checkout path.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Pill tone="muted">
                <ShieldCheck className="h-4 w-4" />
                Billed annually • Auto-renews annually
              </Pill>
              <Pill tone="muted">
                <Users className="h-4 w-4" />
                Built for Black economic power
              </Pill>
              <Pill>
                <Sparkles className="h-4 w-4" />
                Black Card tier included with paid plans
              </Pill>
            </div>

            {isPremiumActive ? (
              <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="text-lg font-extrabold text-yellow-200">
                  Premium Active
                </div>
                <div className="mt-1 text-sm text-gray-200">
                  Your Premium account is already active.
                  {premiumActivatedLabel
                    ? ` Active since ${premiumActivatedLabel}.`
                    : ""}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-yellow-300">
                New Product Line
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-yellow-200">
                BWE Black Card Membership
              </h2>
              <p className="mt-2 text-sm text-gray-200">
                Tiered membership identity and rewards access. Plan mapping:
                Premium includes Black Card Standard, Founding includes Black
                Card Signature (or keeps your higher active tier). Billed
                annually, auto-renews annually, cancel anytime.
              </p>
              <p className="mt-2 text-xs text-gray-300">
                Black Card is included with your plan. Use this page for plan
                activation and checkout.
              </p>
              <div className="mt-4 flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black p-3 sm:p-4">
                <Image
                  src="/images/black-card/bwe-black-card-close-up.png"
                  alt="BWE Black Card"
                  width={1400}
                  height={875}
                  className="h-auto w-full max-w-full object-contain max-h-56 sm:max-h-64"
                />
              </div>
              <div className="mt-4">
                <GoldButton href="/black-card" variant="ghost">
                  Explore BWE Black Card <ArrowRight className="h-4 w-4" />
                </GoldButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative max-w-6xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <PriceCard
            title="Free"
            price="$0"
            sub="Explore core BWE experiences."
            billingNote="No plan charge"
            features={[
              {
                ok: true,
                text: "Search, filters, tabs, and AI Mode available to all users",
              },
              {
                ok: true,
                text: "Marketplace browsing and public content access",
              },
              { ok: true, text: "Core account and dashboard access" },
            ]}
            ctaText={
              !authUser || !isPremiumActive
                ? "Current Plan"
                : "Included in Paid Plans"
            }
            onCta={() => router.push("/")}
            finePrint="Upgrade when you want paid-plan access and Black Card tier inclusion."
          />

          <PriceCard
            title="Premium"
            price="$12.00"
            sub="Paid plan with Black Card Standard included."
            billingNote="Billed annually • Auto-renews annually • Cancel anytime"
            highlight
            badge="Most Popular"
            features={[
              { ok: true, text: "Everything in Free" },
              {
                ok: true,
                text: "Black Card Standard mapping on activation",
              },
              {
                ok: true,
                text: "Black Card rewards earn/redeem access (subject to card status, tier, and points checks)",
              },
              {
                ok: true,
                text: "Gated learning modules tied to paid-plan access",
              },
              {
                ok: true,
                text: "Optional physical Black Card request once membership is active",
              },
            ]}
            ctaText={isPremiumActive ? "Premium Active" : "Upgrade to Premium"}
            onCta={() => goCheckout("premium")}
            disabled={isPremiumActive}
            finePrint={
              isPremiumActive
                ? "Your Premium membership is already active."
                : "Activation maps your account to Black Card Standard."
            }
          />

          <PriceCard
            title="Founding Member"
            price="$49.00"
            sub="Paid plan with Black Card Signature mapping."
            billingNote="Billed annually • Auto-renews annually • Cancel anytime"
            features={[
              { ok: true, text: "Everything in Premium" },
              { ok: true, text: "Black Card Signature mapping on activation" },
              {
                ok: true,
                text: "Keeps higher existing tier if already assigned",
              },
              {
                ok: true,
                text: "Black Card rewards/redemption workflows with admin-tracked status",
              },
              {
                ok: true,
                text: "Early access to features as they are released",
              },
            ]}
            ctaText="Become a Founder"
            onCta={() => goCheckout("founder")}
            finePrint="Activation maps your account to at least Black Card Signature."
          />
        </div>

        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-200">
            Plan clarity: Free vs Premium vs Founding
          </h2>
          <p className="text-gray-300 mt-2 max-w-3xl">
            Free includes search, filters, tabs, and AI Mode. Paid plans map to
            Black Card tiers and unlock Black Card rewards access with current
            system checks.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Future roadmap items such as community features, custom reports, and
            VIP partner lanes are not included unless explicitly marked active.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Free Plan</div>
              <p className="text-gray-300 mt-2">
                Core discovery is already available: search, filters, tabs, and
                AI Mode.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">Premium Plan</div>
              <p className="text-gray-300 mt-2">
                Includes Black Card Standard mapping and rewards access in the
                current Black Card system.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="text-yellow-200 font-extrabold">
                Founding Plan
              </div>
              <p className="text-gray-300 mt-2">
                Includes Black Card Signature mapping (or keeps your higher tier
                if already active).
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              Educational only. Premium tools help decision-making; always
              verify with qualified professionals.
            </div>
            <div className="flex items-center gap-2">
              {isPremiumActive ? (
                <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-white/10 text-gray-300 border border-white/10">
                  Premium Active
                </div>
              ) : (
                <GoldButton href="/checkout?plan=premium" variant="ghost">
                  Go to Checkout <ArrowRight className="h-4 w-4" />
                </GoldButton>
              )}

              <GoldButton
                href="/business-directory?category=Real%20Estate"
                variant="ghost"
              >
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
