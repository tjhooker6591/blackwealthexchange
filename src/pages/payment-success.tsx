// src/pages/payment-success.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const sessionId =
    typeof router.query.session_id === "string" ? router.query.session_id : "";

  return (
    <>
      <Head>
        <title>Marketplace Order Confirmed | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Your Marketplace order is confirmed. Here is what happens next for seller fulfillment and shipping."
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl">
            <h1 className="text-3xl font-bold text-yellow-400">
              Marketplace Order Confirmed
            </h1>

            <p className="mt-3 text-white/80">
              Thanks, your Marketplace payment was received successfully.
            </p>

            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <p className="font-semibold text-yellow-200">What happens next</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  BWE confirms payment and sends order details to the seller.
                </li>
                <li>
                  The seller handles packaging, shipping, and delivery timing.
                </li>
                <li>
                  You should receive seller shipping updates after fulfillment
                  begins.
                </li>
              </ul>
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
                  Keep this page open until you note your order confirmation. If
                  updates do not appear soon, contact support with your session
                  ID.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketplace"
                className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
              >
                Continue Shopping
              </Link>

              <Link
                href="/marketplace/my-orders"
                className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
              >
                Track My Order
              </Link>

              <a
                href="mailto:support@blackwealthexchange.com?subject=Marketplace%20Order%20Support"
                className="inline-flex items-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Contact Marketplace Support
              </a>

              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Home
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4">
              <p className="text-xs text-white/50">
                If you were charged but do not receive seller fulfillment
                updates, contact support and include the session ID above so we
                can trace your order quickly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
