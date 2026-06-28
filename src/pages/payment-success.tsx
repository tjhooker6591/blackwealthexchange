// src/pages/payment-success.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const sessionId =
    typeof router.query.session_id === "string" ? router.query.session_id : "";
  const context =
    typeof router.query.context === "string" ? router.query.context : "";
  const businessId =
    typeof router.query.businessId === "string" ? router.query.businessId : "";

  const foundingMembership = context === "founding-membership";
  const [membershipStatus, setMembershipStatus] = useState<any>(null);

  useEffect(() => {
    if (!foundingMembership) return;
    (async () => {
      try {
        const res = await fetch("/api/founding-membership/status", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok) setMembershipStatus(json.membership || null);
      } catch {}
    })();
  }, [foundingMembership]);

  return (
    <>
      <Head>
        <title>
          {foundingMembership
            ? "Membership Payment Confirmed | Black Wealth Exchange"
            : "Marketplace Order Confirmed | Black Wealth Exchange"}
        </title>
        <meta
          name="description"
          content={
            foundingMembership
              ? "Your Founding Verified Business Growth Membership payment is confirmed."
              : "Your Marketplace order is confirmed. Here is what happens next for seller fulfillment and shipping."
          }
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 md:p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-yellow-400">
              {foundingMembership
                ? "Membership Payment Confirmed"
                : "Marketplace Order Confirmed"}
            </h1>

            <p className="mt-3 text-white/80">
              {foundingMembership
                ? "Your Founding Verified Business Growth Membership payment is complete."
                : "Your Marketplace order payment is complete."}
            </p>

            {foundingMembership ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Membership status</div>
                  <div className="mt-1 font-semibold text-white">{membershipStatus?.membershipStatus ? String(membershipStatus.membershipStatus).replace(/_/g, " ") : "Active pending webhook confirmation"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Selected business</div>
                  <div className="mt-1 font-semibold text-white">{membershipStatus?.business?.name || (businessId ? `Business ID ${businessId}` : "Selected business recorded")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Payment</div>
                  <div className="mt-1 font-semibold text-white">Received</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Claim</div>
                  <div className="mt-1 font-semibold text-white">{membershipStatus?.claimStatus ? String(membershipStatus.claimStatus).replace(/_/g, " ") : "Initiated"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Ownership review</div>
                  <div className="mt-1 font-semibold text-white">{membershipStatus?.ownershipReviewStatus ? String(membershipStatus.ownershipReviewStatus).replace(/_/g, " ") : "Pending review"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">Important note</div>
                  <div className="mt-1 text-sm text-white/75">Paid membership and verified ownership are separate states.</div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <p className="font-semibold text-yellow-200">What happens next</p>
              {foundingMembership ? (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Your membership is recorded as active once webhook confirmation completes.</li>
                  <li>Your payment has been received and your claim is initiated.</li>
                  <li>Your ownership review remains pending until evidence is reviewed.</li>
                  <li>BWE creates the onboarding record, fulfillment checklist, and initial profile baseline.</li>
                  <li>You can follow next steps and monthly reporting status from the member status view.</li>
                </ul>
              ) : (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>
                    BWE confirms your payment and sends the order to the seller.
                  </li>
                  <li>
                    The seller handles fulfillment, shipping, and delivery timing.
                  </li>
                  <li>
                    You can track order and shipping status in My Marketplace
                    Orders.
                  </li>
                </ul>
              )}
            </div>

            {sessionId ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Stripe Checkout Session
                </p>
                <p className="mt-1 text-xs text-white/70 break-all">
                  {sessionId}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-sm text-white/70">
                  If your order does not appear in My Marketplace Orders,
                  contact support and include your checkout session ID.
                </p>
              </div>
            )}

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
                    href="/founding-membership"
                    className="inline-flex items-center justify-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
                  >
                    Review Membership Details
                  </Link>
                  <Link
                    href="/business-directory"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Return to Directory
                  </Link>
                  <a
                    href="mailto:support@blackwealthexchange.com?subject=Founding%20Membership%20Support"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Contact Member Support
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href="/marketplace/my-orders"
                    className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
                  >
                    Track My Orders
                  </Link>

                  <Link
                    href="/marketplace"
                    className="inline-flex items-center justify-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
                  >
                    Continue Shopping
                  </Link>

                  <a
                    href="mailto:support@blackwealthexchange.com?subject=Marketplace%20Order%20Support"
                    className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Contact Marketplace Support
                  </a>
                </>
              )}

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Home
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4">
              <p className="text-xs text-white/50">
                {foundingMembership
                  ? "Ownership verification is still pending after payment. If the membership record does not appear or next steps are unclear, contact support and include the checkout session ID above."
                  : "If you were charged but your order status does not update, contact support and include the checkout session ID above so we can trace the order quickly."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
