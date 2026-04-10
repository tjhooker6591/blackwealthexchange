import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { BLACK_CARD_TIERS, type BlackCardTier } from "@/lib/black-card";

function normalizeTier(value: unknown): BlackCardTier {
  if (value === "signature" || value === "elite") return value;
  return "standard";
}

export default function BlackCardJoinPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const tier = useMemo(
    () =>
      normalizeTier(
        typeof router.query.tier === "string" ? router.query.tier : "standard",
      ),
    [router.query.tier],
  );

  const tierConfig = BLACK_CARD_TIERS[tier];

  async function startCheckout() {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(`/black-card/join?tier=${tier}`)}`,
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "plan",
          itemId: tierConfig.checkoutItemId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error || "Unable to start checkout.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setMessage("Checkout URL missing. Please try again.");
    } catch {
      setMessage("Network error while starting checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Join {tierConfig.label} | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-black text-white px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-yellow-200">
            Join {tierConfig.label}
          </h1>
          <p className="mt-2 text-white/80">{tierConfig.tagline}</p>
          <p className="mt-4 text-4xl font-black">
            {tierConfig.priceLabel}
            <span className="text-base font-medium text-white/70">
              {tierConfig.billingModel === "entry_fee" ? " one-time entry fee" : "/month"}
            </span>
          </p>

          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {tierConfig.benefits.map((benefit) => (
              <li key={benefit}>• {benefit}</li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={startCheckout}
              disabled={loading}
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading ? "Starting checkout..." : "Continue to Secure Checkout"}
            </button>
            <Link
              href="/black-card"
              className="rounded-lg border border-white/20 px-4 py-2"
            >
              Back to Black Card
            </Link>
          </div>

          {message ? (
            <p className="mt-4 text-sm text-red-400">{message}</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
