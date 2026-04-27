import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const [membershipActive, setMembershipActive] = useState(false);
  const [membershipStatusChecked, setMembershipStatusChecked] = useState(false);
  const printNameFinal = printName.replace(/\s+/g, " ").trim();

  useEffect(() => {
    (async () => {
      if (!user) {
        setMembershipActive(false);
        setMembershipStatusChecked(true);
        return;
      }

      try {
        const res = await fetch("/api/black-card/member-summary", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        const active =
          res.ok &&
          String(json?.member?.status || "inactive").toLowerCase() === "active";
        setMembershipActive(Boolean(active));
      } catch {
        setMembershipActive(false);
      } finally {
        setMembershipStatusChecked(true);
      }
    })();
  }, [user]);

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
                  Black Card Plan Mapping
                </p>
                <h1 className="mt-1 text-3xl font-extrabold text-yellow-100">
                  {tierConfig.label}
                </h1>
                <p className="mt-1 text-sm text-white/75">
                  {tierConfig.tagline}
                </p>
                <p className="mt-2 max-w-2xl text-xs text-white/65">
                  Pricing is the primary checkout path. Black Card is included
                  with eligible plans and becomes active in your dashboard after
                  successful plan activation.
                </p>
              </div>
              <Link
                href="/black-card"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
              >
                Compare Membership Advantage
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
                  {tier === "standard"
                    ? "Included with Premium"
                    : tier === "signature"
                      ? "Included with Founding"
                      : "Invite Only"}
                </div>
                <p className="mt-3 text-xs text-white/70">
                  To activate membership, use /pricing and choose the matching
                  plan. This page exists for post-checkout continuity and member
                  guidance.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-yellow-300">
                  What you get in this tier
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
              <Link
                href="/pricing"
                className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
              >
                Go to Pricing
              </Link>
              <a
                href="#post-checkout"
                className="rounded-lg border border-yellow-500/30 px-4 py-2 text-sm text-yellow-200"
              >
                See Membership Activation Flow
              </a>
            </div>
          </section>

          <section
            id="post-checkout"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
          >
            <div className="font-semibold text-yellow-200">
              Membership activation flow
            </div>
            <div className="mt-2">1. Open /pricing and choose your plan.</div>
            <div className="mt-1">
              2. Membership status activates on successful plan payment.
            </div>
            <div className="mt-1">
              3. Open /dashboard/black-card to access your digital member card
              state, verification details, rewards, and redemptions.
            </div>
            <div className="mt-1">
              4. Optional physical personalization runs separately without
              blocking digital access.
            </div>
          </section>

          {checkoutSuccess && membershipStatusChecked && membershipActive ? (
            <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <h2 className="text-lg font-bold text-yellow-200">
                Physical Card Personalization (Optional Add-on)
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Reason: digital membership is active. Optional physical card
                personalization is available now.
              </p>
              <p className="mt-1 text-xs text-white/65">
                Next action: open your Black Card dashboard for live rewards,
                tier state, and redemption actions.
              </p>
              <div className="mt-3">
                <Link
                  href="/dashboard/black-card"
                  className="rounded-lg border border-yellow-500/40 px-3 py-2 text-xs text-yellow-200"
                >
                  Open Black Card Dashboard
                </Link>
              </div>

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
          ) : checkoutSuccess &&
            membershipStatusChecked &&
            !membershipActive ? (
            <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-white/80">
              <p>
                Reason: checkout return was detected, but active membership has
                not been verified yet.
              </p>
              <p className="mt-1">
                Next action: open your Black Card dashboard to confirm
                activation status, or retry from membership activation.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/dashboard/black-card"
                  className="rounded-lg border border-yellow-500/40 px-3 py-2 text-xs text-yellow-200"
                >
                  Open Black Card Dashboard
                </Link>
                <button
                  onClick={startCheckout}
                  disabled={loading}
                  className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-black"
                >
                  Retry Membership Activation
                </button>
              </div>
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
