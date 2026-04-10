import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  BLACK_CARD_POSITIONING,
  BLACK_CARD_TIERS,
  type BlackCardTier,
} from "@/lib/black-card";

const ORDER: BlackCardTier[] = ["standard", "signature", "elite"];

export default function BlackCardLandingPage() {
  return (
    <>
      <Head>
        <title>BWE Black Card | Black Wealth Exchange</title>
        <meta
          name="description"
          content="BWE Black Card is a membership identity, access, and rewards product designed to power participation in the Black business ecosystem."
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
            BWE Black Card
          </p>
          <h1 className="mt-2 text-4xl font-black text-yellow-200">
            Built for Black Economic Power
          </h1>
          <p className="mt-3 max-w-3xl text-white/80">
            {BLACK_CARD_POSITIONING}. Launching first as a real
            membership/access/rewards product: digital identity, tiered
            benefits, and ecosystem incentives that reward action.
          </p>

          <div className="mt-4">
            <div className="mx-auto flex w-full max-w-xl items-center justify-center rounded-xl border border-white/10 bg-black p-3 shadow-[0_8px_24px_rgba(0,0,0,0.3)] sm:p-4">
              <Image
                src="/images/black-card/bwe-black-card-close-up.png"
                alt="BWE Black Card close-up"
                width={1400}
                height={875}
                className="h-48 w-auto max-w-full object-contain sm:h-56"
                priority
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ORDER.map((tierKey) => {
              const tier = BLACK_CARD_TIERS[tierKey];
              return (
                <section
                  key={tier.tier}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <h2 className="text-xl font-bold text-yellow-200">
                    {tier.label}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">{tier.tagline}</p>
                  <p className="mt-4 text-3xl font-extrabold">
                    {tier.priceLabel}
                    <span className="text-sm text-white/60">
                      {tier.billingModel === "entry_fee" ? " entry fee" : "/mo"}
                    </span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-white/85">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit}>• {benefit}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/black-card/join?tier=${tier.tier}`}
                    className="mt-5 inline-flex rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
                  >
                    Join {tier.label.replace("BWE Black Card ", "")}
                  </Link>
                </section>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <h3 className="text-lg font-bold text-yellow-200">
              Rewards utility
            </h3>
            <p className="mt-2 text-white/80">
              Rewards can be redeemed for ad credits, marketplace fee credits,
              course unlocks, event access, partner offers, and future ecosystem
              perks.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="rounded-lg border border-yellow-400/40 px-4 py-2 text-yellow-200"
              >
                View Pricing
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-yellow-400/40 px-4 py-2 text-yellow-200"
              >
                Member Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
