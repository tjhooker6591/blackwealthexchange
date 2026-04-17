import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  BLACK_CARD_POSITIONING,
  BLACK_CARD_TIERS,
  type BlackCardTier,
} from "@/lib/black-card";

const ORDER: BlackCardTier[] = ["standard", "signature", "elite"];

const TIER_FOR = {
  standard: "For members starting with identity + access at entry cost.",
  signature:
    "For growing professionals/businesses who want stronger monthly rewards and priority access.",
  elite:
    "For founders/leaders who want highest access, introductions, and premium support.",
} as const;

const VALUE_EXPLAINER = {
  standard:
    "Lower one-time entry to activate membership identity and core access.",
  signature:
    "Monthly tier adds higher rewards velocity and stronger priority benefits.",
  elite:
    "Highest monthly tier adds VIP-level access, premium placements, and concierge-style support.",
} as const;

export default function BlackCardLandingPage() {
  return (
    <>
      <Head>
        <title>BWE Black Card | Black Wealth Exchange</title>
        <meta
          name="description"
          content="BWE Black Card is the BWE membership identity, access, and rewards product with clear tiers, pricing, lifecycle, and member benefits."
        />
      </Head>

      <main className="min-h-screen bg-[#060606] text-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-3xl border border-[#9E7B2B]/35 bg-gradient-to-b from-[#17120A] via-[#0E0C08] to-[#080808] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
                  BLACK CARD
                </p>
                <h1 className="mt-2 text-4xl font-black text-[#F1D57A] md:text-5xl">
                  Built for Ownership.
                </h1>
                <p className="mt-1 text-lg font-semibold text-white">Move Different.</p>
                <p className="mt-3 max-w-3xl text-[#D9D9D9]">
                  {BLACK_CARD_POSITIONING}. Black Card is a real membership
                  product, not just a visual badge. Join a tier, activate your
                  member state, unlock benefits, and maintain active membership
                  for continued access.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/black-card/join?tier=standard"
                    className="rounded-xl bg-[#D4AF37] px-5 py-2.5 font-bold text-black hover:bg-[#E2C35A]"
                  >
                    Join Black Card
                  </Link>
                  <a
                    href="#tier-comparison"
                    className="rounded-xl border border-[#B08A32]/50 bg-[#1A140A] px-5 py-2.5 font-semibold text-[#F0D37A] hover:bg-[#221A0D]"
                  >
                    Compare Tiers
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-[#9E7B2B]/35 bg-[#0B0B0B] p-3 shadow-[0_14px_50px_rgba(0,0,0,0.5)]">
                <Image
                  src="/images/black-card/bwe-black-card-close-up.png"
                  alt="BWE Black Card"
                  width={1400}
                  height={875}
                  className="h-auto w-full rounded-xl object-contain"
                  priority
                />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0B0B0B] p-5">
            <h2 className="text-xl font-bold text-[#F1D57A]">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-[#D8D8D8]">
              <li>1. Choose the tier that matches your current goals.</li>
              <li>2. Complete join checkout and membership activation.</li>
              <li>3. Use Black Card benefits across eligible BWE surfaces.</li>
              <li>
                4. Maintain active status through your billing model to keep
                access and rewards.
              </li>
            </ol>
          </section>

          <section
            id="tier-comparison"
            className="mt-6 rounded-2xl border border-[#9E7B2B]/35 bg-[#0A0A0A] p-5"
          >
            <h2 className="text-2xl font-extrabold text-[#F1D57A]">
              Tier comparison (clear, side-by-side)
            </h2>
            <p className="mt-2 text-sm text-[#B0B0B0]">
              Standard is the lower-cost entry for membership identity and core access, Signature adds stronger monthly rewards and priority access, and Elite is for highest-value VIP access and support.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[#CFCFCF]">
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Who it is for</th>
                    <th className="py-2 pr-3">Why this price differs</th>
                    <th className="py-2 pr-3">Included</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER.map((tierKey) => {
                    const tier = BLACK_CARD_TIERS[tierKey];
                    return (
                      <tr
                        key={tierKey}
                        className="border-b border-white/5 align-top"
                      >
                        <td className="py-3 pr-3 font-semibold text-white">
                          {tier.label}
                        </td>
                        <td className="py-3 pr-3 text-[#F2D77C] font-semibold">
                          {tier.priceLabel}
                          <div className="text-xs text-[#BDBDBD]">
                            {tier.billingModel === "entry_fee"
                              ? "One-time entry"
                              : "Monthly membership"}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-[#D9D9D9]">
                          {TIER_FOR[tierKey]}
                        </td>
                        <td className="py-3 pr-3 text-[#D9D9D9]">
                          {VALUE_EXPLAINER[tierKey]}
                        </td>
                        <td className="py-3 pr-3 text-[#D9D9D9]">
                          <ul className="space-y-1">
                            {tier.benefits.slice(0, 4).map((b) => (
                              <li key={b}>• {b}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/black-card/join?tier=${tier.tier}`}
                            className="inline-flex rounded-lg border border-[#B08A32]/50 bg-[#1A140A] px-3 py-1.5 font-semibold text-[#F0D37A] hover:bg-[#221A0D]"
                          >
                            Choose tier
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-5">
              <h3 className="text-lg font-bold text-[#F1D57A]">
                Membership lifecycle
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D8D8D8]">
                <li>
                  • Activation: membership becomes active after successful
                  checkout.
                </li>
                <li>
                  • Renewal: monthly tiers renew on cadence, standard is
                  one-time entry.
                </li>
                <li>
                  • Expiration: when status expires/lapses, gated benefits pause
                  until reactivated.
                </li>
                <li>
                  • Post-join: member can proceed to card personalization and
                  ongoing rewards use.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-5">
              <h3 className="text-lg font-bold text-[#F1D57A]">Member value</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#D8D8D8]">
                <li>
                  • Immediate: membership identity, tier-based access, platform
                  trust marker.
                </li>
                <li>
                  • Ongoing: rewards accrual, redemptions, event and partner
                  pathways.
                </li>
                <li>
                  • Tiered upside: stronger rewards and access as you move from
                  Standard to Elite.
                </li>
                <li>
                  • Clear flow: join, activate, use benefits, maintain status.
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[#9E7B2B]/35 bg-[#120F09] p-5">
            <h3 className="text-lg font-bold text-[#F1D57A]">Ready to join?</h3>
            <p className="mt-2 text-sm text-[#D9D9D9]">
              Pick a tier and continue to secure checkout. After checkout, you
              land in join flow to confirm card personalization and continue as
              an active member.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/black-card/join?tier=standard"
                className="rounded-lg bg-[#D4AF37] px-4 py-2 font-semibold text-black hover:bg-[#E2C35A]"
              >
                Start with Standard
              </Link>
              <Link
                href="/black-card/join?tier=signature"
                className="rounded-lg border border-[#B08A32]/50 px-4 py-2 font-semibold text-[#F0D37A] hover:bg-[#21180C]"
              >
                Choose Signature
              </Link>
              <Link
                href="/black-card/join?tier=elite"
                className="rounded-lg border border-[#B08A32]/50 px-4 py-2 font-semibold text-[#F0D37A] hover:bg-[#21180C]"
              >
                Choose Elite
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
