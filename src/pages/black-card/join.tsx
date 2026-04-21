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

const TIER_ORDER: BlackCardTier[] = ["standard", "signature", "elite"];

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

      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-[#17120A] via-[#0F0C08] to-[#080808] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Black Card Join
                </p>
                <h1 className="mt-1 text-3xl font-extrabold text-yellow-100">
                  {tierConfig.label}
                </h1>
                <p className="mt-1 text-sm text-white/75">
                  {tierConfig.tagline}
                </p>
              </div>
              <Link
                href="/black-card"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
              >
                Back to Tier Overview
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-yellow-300">
                  Membership Price
                </div>
                <div className="mt-2 text-4xl font-black text-yellow-100">
                  {tierConfig.priceLabel}
                </div>
                <div className="text-sm text-white/70">
                  {tierConfig.billingModel === "entry_fee"
                    ? "One-time membership activation fee"
                    : "Monthly membership plan"}
                </div>
                <p className="mt-3 text-xs text-white/70">
                  Checkout charges only this membership amount. Physical card
                  personalization occurs after successful membership activation.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-yellow-300">
                  Included Value
                </div>
                <ul className="mt-2 space-y-1 text-sm text-white/85">
                  {tierConfig.benefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {TIER_ORDER.map((k) => {
                const cfg = BLACK_CARD_TIERS[k];
                const active = k === tier;
                return (
                  <Link
                    key={k}
                    href={`/black-card/join?tier=${k}`}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      active
                        ? "border-yellow-400 bg-yellow-500/15 text-yellow-100"
                        : "border-white/15 bg-black/30 text-white/75 hover:bg-black/45"
                    }`}
                  >
                    <div className="font-semibold">{cfg.label}</div>
                    <div className="text-xs">{cfg.priceLabel}</div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={startCheckout}
                disabled={loading || checkoutSuccess}
                className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
              >
                {loading
                  ? "Starting checkout..."
                  : checkoutSuccess
                    ? "Checkout Completed"
                    : `Activate ${tierConfig.label}`}
              </button>
              <a
                href="#post-checkout"
                className="rounded-lg border border-yellow-500/30 px-4 py-2 text-sm text-yellow-200"
              >
                View Post-Checkout Steps
              </a>
            </div>
          </section>

          <section
            id="post-checkout"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
          >
            <div className="font-semibold text-yellow-200">
              Post-checkout flow
            </div>
            <div className="mt-2">
              1. Complete secure checkout for selected membership tier.
            </div>
            <div className="mt-1">
              2. Membership status activates on successful payment.
            </div>
            <div className="mt-1">
              3. Confirm exact print details for physical card issuance.
            </div>
            <div className="mt-1">
              4. Use membership benefits while card fulfillment completes.
            </div>
          </section>

          {checkoutSuccess ? (
            <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <h2 className="text-lg font-bold text-yellow-200">
                Physical Card Personalization (Required)
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Digital membership is already active. Submit print approval to
                initiate physical card production.
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
              </div>

              <label className="mt-3 flex items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={printApproved}
                  onChange={(e) => setPrintApproved(e.target.checked)}
                  className="mt-1"
                />
                <span>I approve this exact print name for production.</span>
              </label>

              <label className="mt-2 flex items-start gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={printPreviewConfirmed}
                  onChange={(e) => setPrintPreviewConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span>I reviewed and confirmed the final preview.</span>
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
                  : "Finalize Print Approval & Submit Card Request"}
              </button>
            </section>
          ) : null}

          {message ? (
            <p className="text-sm text-yellow-200">{message}</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
