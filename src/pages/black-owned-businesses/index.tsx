import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { JOB_NICHES, TOP_CATEGORIES, TOP_CITIES, TOP_STATES, toSlug } from "@/lib/seoLanding";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

type Props = {
  totalBusinesses: number;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const totalBusinesses = await db.collection("businesses").countDocuments({
      $or: [{ status: "approved" }, { status: { $exists: false } }, { status: "" }, { status: null }],
    });
    return { props: { totalBusinesses } };
  } catch {
    return { props: { totalBusinesses: 0 } };
  }
};

export default function BlackOwnedBusinessesHub({ totalBusinesses }: Props) {
  const title = "Black-Owned Businesses Near You | Black Wealth Exchange";
  const description = truncateMeta(
    "Find Black-owned businesses by city, category, and state. Discover trusted local services, brands, and opportunities on Black Wealth Exchange.",
  );
  const canonical = canonicalUrl("/black-owned-businesses");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find Black-owned businesses near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the city and state links on this page or search the business directory by category and location.",
        },
      },
      {
        "@type": "Question",
        name: "Can I search by business category?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can explore food, beauty, health, technology, and other categories directly from this page.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">Find Black-Owned Businesses</h1>
          <p className="mt-2 text-white/80">
            Explore Black-owned businesses by city, category, and state. {totalBusinesses.toLocaleString()}+ directory listings are available to discover, support, and connect with.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link href="/business-directory" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Browse full Black-owned business directory</Link>
            <Link href="/shop-black-owned-products" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Shop Black-owned products</Link>
            <Link href="/black-jobs" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Explore Black jobs and careers</Link>
          </div>
        </header>

        <section>
          <h2 className="text-xl font-bold mb-3">Top cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOP_CITIES.map((city) => (
              <Link key={city} href={`/black-owned-businesses/${toSlug(city)}`} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                Black-owned businesses in {city}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Popular categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOP_CATEGORIES.map((cat) => (
              <Link key={cat} href={`/black-owned-businesses/atlanta/${toSlug(cat)}`} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                {cat} businesses
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Black-owned businesses by state</h2>
          <div className="flex flex-wrap gap-2">
            {TOP_STATES.map((st) => (
              <Link key={st} href={`/black-owned-business-directory/${st.toLowerCase()}`} className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10">
                {st}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold">Related discovery paths</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {JOB_NICHES.slice(0, 4).map((n) => (
              <Link key={n} href={`/black-jobs/${n}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">
                {`Black ${n} jobs`}
              </Link>
            ))}
            <Link href="/financial-literacy-for-black-communities" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Financial literacy for Black communities</Link>
            <Link href="/wealth-building-resources" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Wealth-building resources</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
