import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function TrustCenterPage() {
  const title = "Trust Center | Black Wealth Exchange";
  const description = truncateMeta(
    "Understand how Black Wealth Exchange handles platform trust, checkout security, listing quality, privacy, and user safety.",
  );
  const canonical = canonicalUrl("/trust");

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Black Wealth Exchange",
    url: canonicalUrl("/"),
    areaServed: "US",
    knowsAbout: [
      "Black-owned business discovery",
      "Marketplace trust and checkout",
      "Career opportunities",
      "Financial literacy",
    ],
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">
            BWE Trust Center
          </h1>
          <p className="mt-2 text-white/80">
            Black Wealth Exchange is designed to help people discover, evaluate,
            and transact with confidence. This page explains how trust works on
            the platform today.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg">Secure checkout and payments</h2>
            <p className="mt-2 text-sm text-white/75">
              Marketplace checkout runs through secure payment infrastructure
              and includes seller readiness handling to reduce failed
              transactions.
            </p>
            <Link
              href="/marketplace"
              className="mt-3 inline-block text-sm text-[#D4AF37] underline"
            >
              Shop marketplace with confidence
            </Link>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg">Directory quality signals</h2>
            <p className="mt-2 text-sm text-white/75">
              Listings expose trust markers like verified, approved, sponsored,
              and profile completeness so users can vet options quickly.
            </p>
            <Link
              href="/business-directory"
              className="mt-3 inline-block text-sm text-[#D4AF37] underline"
            >
              Explore trusted directory listings
            </Link>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg">Privacy and platform policies</h2>
            <p className="mt-2 text-sm text-white/75">
              Core legal and community standards are public and continuously
              enforced to keep the ecosystem useful and safe.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link
                href="/privacy-policy"
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Privacy policy
              </Link>
              <Link
                href="/terms-of-service"
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Terms of service
              </Link>
              <Link
                href="/terms/marketplace"
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Marketplace terms
              </Link>
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-lg">Business and seller pathways</h2>
            <p className="mt-2 text-sm text-white/75">
              Businesses can get discovered through directory listings. Sellers
              can onboard and publish products with payout readiness controls.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link
                href="/business-directory/add-business"
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Get listed in directory
              </Link>
              <Link
                href="/marketplace/become-a-seller"
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Become a seller
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
