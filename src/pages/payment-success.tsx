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
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">
            Payment Successful
          </h1>
          <p className="mt-3 text-white/80">
            Thank you! Your payment was received.
          </p>

          {sessionId ? (
            <p className="mt-4 text-xs text-white/60 break-all">
              Session: {sessionId}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-yellow-500/40 px-4 py-2 font-semibold text-yellow-300 hover:border-yellow-400/70 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
