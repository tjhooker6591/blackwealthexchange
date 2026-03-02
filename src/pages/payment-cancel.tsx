// src/pages/payment-cancel.tsx
import Head from "next/head";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <>
      <Head>
        <title>Payment Cancelled | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Your checkout was cancelled. No charge was completed."
        />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl">
            <h1 className="text-3xl font-bold text-yellow-400">
              Payment Cancelled
            </h1>

            <p className="mt-3 text-white/80">
              No worries — your checkout was cancelled and no charge was
              completed. You can try again whenever you’re ready.
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">
                If you were trying to purchase a directory listing or an ad,
                return to the appropriate page and restart checkout.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/business-directory"
                className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
              >
                Try Again
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
                Back to Home
              </Link>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4">
              <p className="text-xs text-white/50">
                If you see a pending authorization on your card, it should drop
                off automatically depending on your bank.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
