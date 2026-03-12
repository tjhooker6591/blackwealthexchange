import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium Plan",
  founder: "Founding Member Plan",
};

export default function CheckoutPage() {
  const router = useRouter();
  const plan = useMemo(() => {
    const p = router.query.plan;
    return typeof p === "string" ? p : "";
  }, [router.query.plan]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function startCheckout() {
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

          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80">Secure payments powered by Stripe</div>
            <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80">No account required to complete purchase</div>
            <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80">Support available through Trust Center</div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={startCheckout}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-60"
            >
              {loading ? "Redirecting..." : "Continue to Secure Checkout"}
            </button>

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

          <p className="mt-4 text-xs text-white/60">
            Need policy or security details? Visit the{" "}
            <Link href="/trust" className="text-[#D4AF37] underline">
              BWE Trust Center
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
