import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium Plan",
  founder: "Founding Member Plan",
};

function asMoney(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : null;
}

type CheckoutPageProps = {
  initialPlan: string;
  initialType: string;
  initialSource: string;
  initialProductName: string;
  initialAmount: string;
};

export default function CheckoutPage({
  initialPlan,
  initialType,
  initialSource,
  initialProductName,
  initialAmount,
}: CheckoutPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const plan = useMemo(() => {
    const p = router.query.plan;
    return typeof p === "string" ? p : initialPlan;
  }, [initialPlan, router.query.plan]);

  const checkoutType = useMemo(() => {
    const t = router.query.type;
    return typeof t === "string" ? t : initialType || "plan";
  }, [initialType, router.query.type]);

  const source = useMemo(() => {
    const s = router.query.source;
    return typeof s === "string" ? s : initialSource;
  }, [initialSource, router.query.source]);

  const productName = useMemo(() => {
    const n = router.query.productName;
    return typeof n === "string" ? n : initialProductName;
  }, [initialProductName, router.query.productName]);

  const amountLabel = useMemo(() => {
    const amount =
      typeof router.query.amount === "string"
        ? router.query.amount
        : initialAmount;
    return asMoney(amount);
  }, [initialAmount, router.query.amount]);

  const isMarketplaceOrder =
    checkoutType === "product" || source === "marketplace";

  const authUser = (user ?? null) as Record<string, unknown> | null;

  const isPaidMembershipActive =
    authUser?.isPremium === true ||
    authUser?.currentPlan === "premium" ||
    authUser?.currentPlan === "founding" ||
    authUser?.premiumStatus === "active";

  const isPremiumPlan = (plan || "premium") === "premium";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function startCheckout() {
    if (isPremiumPlan && isPaidMembershipActive) {
      setMessage("Your paid membership is already active.");
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

  const showPremiumActiveState = isPremiumPlan && isPaidMembershipActive;

  return (
    <>
      <Head>
        <title>Checkout | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">
            {isMarketplaceOrder ? "Secure Marketplace Checkout" : "Checkout"}
          </h1>

          <p className="mt-3 text-white/80">
            {isMarketplaceOrder
              ? "Review your order details, confirm secure payment, and place your order with confidence."
              : plan
                ? `You're checking out: ${PLAN_LABELS[plan] || plan}. ${plan === "founder" ? "Billed monthly with auto-renew." : "Billed annually with auto-renew."}`
                : "Select a plan to continue to secure checkout."}
          </p>

          {isMarketplaceOrder ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
              <p className="font-semibold text-white">Order summary</p>
              <p className="mt-1">Item: {productName || "Marketplace item"}</p>
              <p className="mt-1">
                Subtotal: {amountLabel || "Shown on payment page"}
              </p>
              <p className="mt-1">
                Shipping and taxes: Calculated by seller/payment flow.
              </p>
              <p className="mt-3 text-xs text-white/70">
                Payment is processed securely. You receive confirmation
                immediately after successful payment. Fulfillment and shipping
                updates follow from the seller and are visible in My Orders.
              </p>
            </div>
          ) : null}

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
              href={isMarketplaceOrder ? "/marketplace" : "/pricing"}
              className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
            >
              {isMarketplaceOrder ? "Back to Marketplace" : "Back to Pricing"}
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

export const getServerSideProps: GetServerSideProps<
  CheckoutPageProps
> = async ({ query }) => ({
  props: {
    initialPlan: typeof query.plan === "string" ? query.plan : "",
    initialType: typeof query.type === "string" ? query.type : "",
    initialSource: typeof query.source === "string" ? query.source : "",
    initialProductName:
      typeof query.productName === "string" ? query.productName : "",
    initialAmount: typeof query.amount === "string" ? query.amount : "",
  },
});
