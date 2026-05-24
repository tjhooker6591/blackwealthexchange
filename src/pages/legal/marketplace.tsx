import Head from "next/head";
import Link from "next/link";
import { canonicalUrl } from "@/lib/seo";

export default function MarketplaceLegalPage() {
  return (
    <>
      <Head>
        <title>Marketplace Terms | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Marketplace purchase, seller, shipping, and platform role terms for Black Wealth Exchange."
        />
        <link rel="canonical" href={canonicalUrl("/legal/marketplace")} />
      </Head>

      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gold">Marketplace Terms</h1>
          <p className="mt-4 text-sm text-gray-300">
            BWE operates the checkout and order platform. Sellers are
            responsible for product accuracy, shipping, and fulfillment.
          </p>

          <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-gray-200">
            <li>All payments are processed securely through Stripe.</li>
            <li>
              Product availability and shipping timelines are set by each
              seller.
            </li>
            <li>
              BWE may review disputes and issue platform decisions when
              required.
            </li>
            <li>
              Fraud, abuse, and prohibited items may result in listing or
              account removal.
            </li>
          </ul>

          <div className="mt-8">
            <Link
              href="/marketplace"
              className="text-yellow-300 hover:text-yellow-200"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
