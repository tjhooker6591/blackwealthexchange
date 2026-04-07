import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium Plan",
  founder: "Founding Member Plan",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const plan = useMemo(() => {
    const p = router.query.plan;
    return typeof p === "string" ? p : "";
  }, [router.query.plan]);

  const authUser = (user ?? null) as Record<string, unknown> | null;

  const isPremiumActive =
    authUser?.isPremium === true ||
    authUser?.currentPlan === "premium" ||
    authUser?.premiumStatus === "active";

  const isPremiumPlan = (plan || "premium") === "premium";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function startCheckout() {
    if (isPremiumPlan && isPremiumActive) {
      setMessage("Your Premium account is already active.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "plan", itemId: plan || "premium" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent(`/checkout?plan=${plan || "premium"}`)}`,
          );
          return;
        }

        if (res.status === 409) {
          setMessage(data?.error || "Your Premium account is already active.");
          return;
        }

        setMessage(data?.error || "Checkout failed.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setMessage("Checkout unavailable: missing Stripe redirect URL.");
    } catch {
      setMessage("Checkout failed due to a network/runtime error.");
    } finally {
      setLoading(false);
    }
  }

  const showPremiumActiveState = isPremiumPlan && isPremiumActive;

  return (
    <>
      <Head>
        <title>Checkout | Black Wealth Exchange</title>
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">Checkout</h1>

          <p className="mt-3 text-white/80">
            {plan
              ? `You're checking out: ${PLAN_LABELS[plan] || plan}.`
              : "Select a plan to continue to secure checkout."}
          </p>

          {showPremiumActiveState ? (
            <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <h2 className="text-lg font-semibold text-yellow-200">
                Premium Active
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Your Premium account is already active. You do not need to check
                out again.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {showPremiumActiveState ? (
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
              >
                View Current Plan
              </Link>
            ) : (
              <button
                onClick={startCheckout}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-60"
              >
                {loading ? "Redirecting..." : "Continue to Secure Checkout"}
              </button>
            )}

            <Link
              href="/pricing"
              className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
            >
              Back to Pricing
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