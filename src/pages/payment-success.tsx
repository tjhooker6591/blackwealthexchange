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
        <title>Payment Successful | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Your payment was received successfully on Black Wealth Exchange."
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl">
            <h1 className="text-3xl font-bold text-yellow-400">
              Payment Successful
            </h1>

            <p className="mt-3 text-white/80">
              Thank you! Your payment was received. If you purchased an ad or a
              directory listing, it may take a moment for your dashboard and
              admin views to reflect the updated status.
            </p>

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
                  If you don’t see your purchase reflected yet, refresh your
                  dashboard in a minute.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
              >
                Continue Shopping
              </Link>

              <Link
                href="/advertising"
                className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
              >
                Advertising Hub
              </Link>

              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-white/15 px-4 py-2 font-semibold text-white/80 hover:bg-white/10 transition"
              >
                Home
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4">
              <p className="text-xs text-white/50">
                If you were charged but don’t see your purchase reflected within
                a few minutes, please contact support and include your session
                ID above.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
