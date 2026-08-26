// src/pages/payment-success.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type MembershipStatus = {
  membershipId: string;
  membershipName: string;
  membershipStatus: string;
  ownershipReviewStatus: string | null;
  business: {
    name: string | null;
    slug: string | null;
    city: string | null;
    state: string | null;
  } | null;
  claimStatus: string | null;
  reviewStatus: string | null;
  evidenceStatus: string | null;
  onboardingStatus: string | null;
  fulfillmentStatus: string | null;
  profileReviewStatus: string | null;
  baselineStatus: string | null;
  monthlyReportingStatus: string | null;
  supportStatus: string | null;
  checklist: Array<{ key?: string; label?: string; status?: string }>;
  billing: {
    hasManageableSubscription: boolean;
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
    subscriptionStatus: string | null;
    renewalStatus: string | null;
  };
};

type MarketplaceOrderConfirmation = {
  orderId: string;
  sessionId: string;
  productId: string;
  productName: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  sellerName: string;
  businessId: string | null;
};

function labelize(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const sessionId =
    typeof router.query.session_id === "string" ? router.query.session_id : "";
  const context =
    typeof router.query.context === "string" ? router.query.context : "";
  const businessId =
    typeof router.query.businessId === "string" ? router.query.businessId : "";

  const foundingMembership = context === "founding-membership";
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus | null>(null);
  const [marketplaceOrder, setMarketplaceOrder] =
    useState<MarketplaceOrderConfirmation | null>(null);
  const [statusState, setStatusState] = useState<
    "idle" | "processing" | "confirmed" | "unconfirmed" | "error"
  >(foundingMembership ? "processing" : "idle");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (!foundingMembership) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    const load = async () => {
      try {
        const res = await fetch("/api/founding-membership/status", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error || "Unable to confirm payment status");
        }

        if (cancelled) return;

        const membership = json?.membership || null;
        if (membership) {
          setMembershipStatus(membership);
          setStatusState("confirmed");
          setStatusError("");
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          setStatusState("processing");
          window.setTimeout(load, 2500);
          return;
        }

        setStatusState("unconfirmed");
      } catch (error: any) {
        if (cancelled) return;
        attempts += 1;
        if (attempts < maxAttempts) {
          setStatusState("processing");
          window.setTimeout(load, 2500);
          return;
        }
        setStatusState("error");
        setStatusError(error?.message || "Unable to confirm payment status");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [foundingMembership]);

  useEffect(() => {
    if (foundingMembership || !sessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/marketplace/order-confirmation?session_id=${encodeURIComponent(sessionId)}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        setMarketplaceOrder(json?.order || null);
      } catch {
        if (cancelled) return;
        setMarketplaceOrder(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [foundingMembership, sessionId]);

  const stateCopy = useMemo(() => {
    if (!foundingMembership) {
      return {
        title: "Marketplace Order Confirmed",
        body: "Your Marketplace order payment is complete.",
      };
    }

    if (statusState === "confirmed") {
      return {
        title: "Payment Confirmed",
        body: "Membership active, claim initiated, and ownership review pending.",
      };
    }

    if (statusState === "processing") {
      return {
        title: "Payment Being Confirmed",
        body: "We are confirming your payment and setting up your membership.",
      };
    }

    if (statusState === "unconfirmed") {
      return {
        title: "Payment Not Yet Confirmed",
        body: "We could not confirm the payment yet. No membership has been shown as activated.",
      };
    }

    return {
      title: "Processing Error",
      body: "Payment may have completed, but setup requires support review.",
    };
  }, [foundingMembership, statusState]);

  return (
    <>
      <Head>
        <title>
          {foundingMembership
            ? "Founding Membership Payment Status | Black Wealth Exchange"
            : "Marketplace Order Confirmed | Black Wealth Exchange"}
        </title>
        <meta
          name="description"
          content={
            foundingMembership
              ? "Check the confirmed state of your Founding Verified Business Growth Membership payment and setup."
              : "Your Marketplace order is confirmed."
          }
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 md:p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-yellow-400">
              {stateCopy.title}
            </h1>

            <p className="mt-3 text-white/80">{stateCopy.body}</p>

            {foundingMembership ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Membership status
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {membershipStatus?.membershipStatus
                      ? labelize(membershipStatus.membershipStatus)
                      : labelize(
                          statusState === "processing" ? "processing" : null,
                        )}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Selected business
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {membershipStatus?.business?.name ||
                      (businessId
                        ? `Business ID ${businessId}`
                        : "Awaiting confirmed business linkage")}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Claim status
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {membershipStatus?.claimStatus
                      ? labelize(membershipStatus.claimStatus)
                      : "Not yet confirmed"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Ownership review
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {membershipStatus?.ownershipReviewStatus
                      ? labelize(membershipStatus.ownershipReviewStatus)
                      : "Not yet confirmed"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Fulfillment
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {membershipStatus?.fulfillmentStatus
                      ? labelize(membershipStatus.fulfillmentStatus)
                      : "Not yet confirmed"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Important note
                  </div>
                  <div className="mt-1 text-sm text-white/75">
                    Payment and ownership verification are separate states.
                  </div>
                </div>
              </div>
            ) : null}

            {statusState === "error" && statusError ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {statusError}
              </div>
            ) : null}

            {sessionId ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Stripe Checkout Session
                </p>
                <p className="mt-1 text-xs text-white/70 break-all">
                  {sessionId}
                </p>
              </div>
            ) : null}

            {!foundingMembership && marketplaceOrder ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Order reference
                  </div>
                  <div className="mt-1 font-semibold text-white break-all">
                    {marketplaceOrder.orderId}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Product
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {marketplaceOrder.productName}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Payment status
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {labelize(marketplaceOrder.paymentStatus)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Fulfillment
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {labelize(marketplaceOrder.fulfillmentStatus)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Seller
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {marketplaceOrder.sellerName}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Next step
                  </div>
                  <div className="mt-1 text-sm text-white/75">
                    Track this order in My Marketplace Orders or contact support
                    if anything looks wrong.
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              {foundingMembership ? (
                <>
                  <Link
                    href="/founding-membership/status"
                    className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
                  >
                    View Member Status
                  </Link>
                  <Link
                    href={
                      businessId
                        ? `/founding-membership?businessId=${encodeURIComponent(businessId)}`
                        : "/founding-membership"
                    }
                    className="inline-flex items-center justify-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
                  >
                    Review Membership Details
                  </Link>
                  <Link
                    href="/business-directory?mode=claim"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Return to Claim Mode
                  </Link>
                </>
              ) : (
                <Link
                  href="/marketplace/my-orders"
                  className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
                >
                  Track My Orders
                </Link>
              )}

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
