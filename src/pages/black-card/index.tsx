import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  BLACK_CARD_POSITIONING,
  BLACK_CARD_TIERS,
  type BlackCardTier,
} from "@/lib/black-card";

const ORDER: BlackCardTier[] = ["standard", "signature", "elite"];

const TIER_CONTEXT: Record<
  BlackCardTier,
  {
    segment: string;
    valueSummary: string;
    cta: string;
    badge: string;
  }
> = {
  standard: {
    segment: "Entry Membership",
    valueSummary:
      "Pay once to activate your digital card, unlock verified member identity, and start claiming member-priced opportunities immediately.",
    cta: "Activate Standard",
    badge: "ENTRY",
  },
  signature: {
    segment: "Growth Membership",
    valueSummary:
      "Build on Standard with expanding benefits, broader redemption access, and priority access rolling out across BWE experiences.",
    cta: "Activate Signature",
    badge: "MEMBERSHIP",
  },
  elite: {
    segment: "Executive Membership",
    valueSummary:
      "Run at the highest Black Card tier with verified identity, rewards access, and advanced features coming as rollout expands.",
    cta: "Activate Elite",
    badge: "ELITE",
  },
};

export default function BlackCardLandingPage() {
  return (
    <>
      <Head>
        <title>BWE Black Card | Black Wealth Exchange</title>
        <meta
          name="description"
          content="BWE Black Card is BWE's flagship membership product with clear tier value, premium benefits, and secure activation flow."
        />
      </Head>

      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-[#9E7B2B]/35 bg-gradient-to-br from-[#17120A] via-[#0C0A07] to-[#070707] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="inline-flex rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-[#F1D57A]">
                  FLAGSHIP MEMBERSHIP
                </div>
                <h1 className="mt-3 text-4xl font-black leading-tight text-[#F1D57A] md:text-6xl">
                  BWE Black Card
                </h1>
                <p className="mt-2 text-xl font-bold text-white md:text-2xl">
                  Built for faster opportunities, stronger savings, and verified
                  member advantage.
                </p>
                <p className="mt-4 max-w-3xl text-[#D9D9D9]">
                  {BLACK_CARD_POSITIONING}. Black Card is a digital-first
                  membership identity and rewards access system with instant
                  account activation, persistent member identity in your
                  dashboard, and expanding tier experiences after checkout.
                </p>

                <div className="mt-6 grid gap-3 text-sm text-[#DDD] sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#CDA94C]">
                      Entry Tier
                    </div>
                    <div className="mt-1 font-semibold">Standard</div>
                    <div className="text-xs text-white/70">One-time join</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#CDA94C]">
                      Membership Tier
                    </div>
                    <div className="mt-1 font-semibold">Signature</div>
                    <div className="text-xs text-white/70">One-time activation</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#CDA94C]">
                      Executive Tier
                    </div>
                    <div className="mt-1 font-semibold">Elite</div>
                    <div className="text-xs text-white/70">Expanded access</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/black-card/join?tier=standard"
                    className="rounded-xl bg-[#D4AF37] px-5 py-2.5 font-bold text-black hover:bg-[#E2C35A]"
                  >
                    Activate Membership
                  </Link>
                  <a
                    href="#digital-experience"
                    className="rounded-xl border border-[#B08A32]/50 bg-[#1A140A] px-5 py-2.5 font-semibold text-[#F0D37A] hover:bg-[#221A0D]"
                  >
                    See Member Advantage
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-[#9E7B2B]/35 bg-[#0B0B0B] p-3 shadow-[0_14px_50px_rgba(0,0,0,0.5)]">
                <Image
                  src="/images/black-card/bwe-black-card-close-up.png"
                  alt="BWE Black Card premium visual"
                  width={1400}
                  height={875}
                  className="h-auto w-full rounded-xl object-contain"
                  priority
                />
              </div>
            </div>
          </section>

          <section
            id="tiers"
            className="rounded-2xl border border-[#9E7B2B]/35 bg-[#0A0A0A] p-5"
          >
            <h2 className="text-2xl font-extrabold text-[#F1D57A]">
              Choose your tier
            </h2>
            <p className="mt-2 text-sm text-[#B0B0B0]">
              Each tier changes what you can do, what you can claim, and how
              quickly opportunities move toward you.
            </p>
            <p className="mt-2 text-xs text-[#AFAFAF]">
              Plan mapping clarity: Premium maps to Black Card Standard, and
              Founding maps to Black Card Signature.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {ORDER.map((tierKey) => {
                const tier = BLACK_CARD_TIERS[tierKey];
                const context = TIER_CONTEXT[tierKey];
                const featured = tierKey === "signature";

                return (
                  <article
                    key={tierKey}
                    className={`rounded-2xl border p-4 ${
                      featured
                        ? "border-[#D4AF37]/60 bg-[#17120A]"
                        : "border-white/10 bg-[#0E0E0E]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-[#F1D57A]">
                        {context.badge}
                      </span>
                      <span className="text-xs text-white/60">
                        {context.segment}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold text-white">
                      {tier.label}
                    </h3>
                    <p className="mt-1 text-sm text-white/75">{tier.tagline}</p>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="text-2xl font-black text-[#F2D77C]">
                        {tier.priceLabel}
                      </div>
                      <div className="text-xs text-white/65">
                        One-time membership activation
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#D9D9D9]">
                      {context.valueSummary}
                    </p>

                    <ul className="mt-3 space-y-1 text-sm text-[#D9D9D9]">
                      {tier.benefits.slice(0, 5).map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <Link
                        href={`/black-card/join?tier=${tier.tier}`}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#B08A32]/50 bg-[#1A140A] px-3 py-2 font-semibold text-[#F0D37A] hover:bg-[#221A0D]"
                      >
                        {context.cta}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            id="digital-experience"
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-5">
              <h3 className="text-lg font-bold text-[#F1D57A]">
                Access behavior
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D8D8D8]">
                <li>1. Select your tier and continue to secure checkout.</li>
                <li>2. Locked state: member-only rewards stay unavailable.</li>
                <li>
                  3. Unlocked state: your dashboard card, rewards, and
                  redemption actions become available immediately.
                </li>
                <li>
                  4. Optional physical personalization is separate and never
                  blocks digital membership use.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-5">
              <h3 className="text-lg font-bold text-[#F1D57A]">
                Why members upgrade
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D8D8D8]">
                <li>
                  • Standard gives immediate identity and member-priced entry
                  points.
                </li>
                <li>
                  • Signature adds expanding access and broader redemption
                  opportunities as rollout continues.
                </li>
                <li>
                  • Elite extends this with advanced features coming and the
                  highest-tier membership experience.
                </li>
                <li>
                  • Upgrading is about measurable advantage, not cosmetic
                  status.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
