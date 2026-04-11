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
  const [printName, setPrintName] = useState("");
  const [printApproved, setPrintApproved] = useState(false);
  const [printPreviewConfirmed, setPrintPreviewConfirmed] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const tier = useMemo(
    () =>
      normalizeTier(
        typeof router.query.tier === "string" ? router.query.tier : "standard",
      ),
    [router.query.tier],
  );

  const tierConfig = BLACK_CARD_TIERS[tier];
  const checkoutSuccess = router.query.checkout === "success";
  const printNameFinal = printName.replace(/\s+/g, " ").trim();

  async function submitPhysicalOrder() {
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(`/black-card/join?tier=${tier}&checkout=success`)}`,
      );
      return;
    }

    setOrderLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/black-card/orders/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "initial",
          reason: "initial_physical_issue",
          printName: printNameFinal,
          printNameApproved: printApproved,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || "Unable to create physical card order.");
        return;
      }

      setMessage(
        "Physical card request submitted. Digital card stays active while fulfillment is processed.",
      );
    } catch {
      setMessage("Network error while submitting card personalization.");
    } finally {
      setOrderLoading(false);
    }
  }

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
              {tierConfig.billingModel === "entry_fee"
                ? " one-time membership entry fee"
                : "/month membership"}
            </span>
          </p>
          <div className="mt-2 rounded-lg border border-yellow-500/25 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
            Membership price charged at checkout: <span className="font-semibold">{tierConfig.priceLabel} {tierConfig.billingModel === "entry_fee" ? "one-time" : "per month"}</span>. Physical card personalization/order step does not charge a second price in this flow.
          </div>

          <ul className="mt-5 space-y-2 text-sm text-white/85">
            {tierConfig.benefits.map((benefit) => (
              <li key={benefit}>• {benefit}</li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
            <div>Step 1: Select membership tier (current page)</div>
            <div className="mt-1">Step 2: Complete secure payment checkout (membership charge only)</div>
            <div className="mt-1">
              Step 3: Confirm physical card personalization (print name, no second membership charge)
            </div>
            <div className="mt-1">
              Step 4: Physical order enters approval/fulfillment workflow
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={startCheckout}
              disabled={loading || checkoutSuccess}
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading
                ? "Starting checkout..."
                : checkoutSuccess
                  ? "Checkout Completed"
                  : "Continue to Secure Checkout"}
            </button>
            <Link
              href="/black-card"
              className="rounded-lg border border-white/20 px-4 py-2"
            >
              Back to Black Card
            </Link>
          </div>

          {checkoutSuccess ? (
            <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <h2 className="text-lg font-bold text-yellow-200">
                Card Personalization (Required for physical card)
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Digital membership is active first. Physical printing starts
                only after you confirm the exact print name below.
              </p>
              <p className="mt-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/75">
                This step is personalization + fulfillment approval. It is not a second membership price.
                If a future physical fulfillment fee is introduced, it must be shown explicitly before payment.
              </p>
              <label className="mt-4 block text-sm text-white/80">
                Name to print on card
                <input
                  value={printName}
                  onChange={(e) => {
                    setPrintName(e.target.value);
                    setPrintPreviewConfirmed(false);
                  }}
                  placeholder="Enter exact print name"
                  className="mt-2 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white"
                />
              </label>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4">
                <div className="text-xs uppercase tracking-[0.15em] text-yellow-300">
                  Final print preview
                </div>
                <div className="mt-2 rounded-lg border border-yellow-500/30 bg-black px-3 py-4 text-center font-semibold tracking-[0.08em] text-yellow-100">
                  {printNameFinal || "ENTER PRINT NAME"}
                </div>
                <p className="mt-2 text-xs text-white/65">
                  Preview uses trimmed spacing exactly as production will
                  receive it.
                </p>
              </div>

              <label className="mt-3 flex items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={printApproved}
                  onChange={(e) => setPrintApproved(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I approve this exact print name for physical card production.
                </span>
              </label>

              <label className="mt-2 flex items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={printPreviewConfirmed}
                  onChange={(e) => setPrintPreviewConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have reviewed the final preview and confirm it is correct.
                </span>
              </label>

              <button
                onClick={submitPhysicalOrder}
                disabled={
                  orderLoading ||
                  !printNameFinal ||
                  !printApproved ||
                  !printPreviewConfirmed
                }
                className="mt-4 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
              >
                {orderLoading
                  ? "Submitting..."
                  : "Finalize Print Approval & Submit Physical Card Request"}
              </button>
            </div>
          ) : null}

          {message ? (
            <p className="mt-4 text-sm text-yellow-200">{message}</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
