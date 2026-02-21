import Head from "next/head";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <>
      <Head>
        <title>Payment Cancelled | Black Wealth Exchange</title>
      </Head>

      <div className="min-h-screen bg-black text-white px-6 py-14">
        <div className="max-w-2xl mx-auto rounded-2xl border border-yellow-500/20 bg-zinc-950/60 p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-yellow-400">
            Payment cancelled
          </h1>
          <p className="mt-3 text-white/80">
            No worries—your checkout was cancelled and no charge was completed.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/business-directory"
              className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:opacity-90"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
