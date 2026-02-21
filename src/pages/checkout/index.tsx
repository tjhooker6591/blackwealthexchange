import Head from "next/head";
import Link from "next/link";

export default function CheckoutPage() {
  return (
    <>
      <Head>
        <title>Checkout | Black Wealth Exchange</title>
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">Checkout</h1>
          <p className="mt-3 text-white/80">
            Checkout is started from your cart. If you reached this page
            directly, go back to the shop and proceed from there.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 transition"
            >
              Back to Shop
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
