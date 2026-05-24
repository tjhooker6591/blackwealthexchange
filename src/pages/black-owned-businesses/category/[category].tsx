import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

function labelFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

export default function CategoryDirectoryLanding() {
  const router = useRouter();
  const raw =
    typeof router.query.category === "string"
      ? router.query.category.toLowerCase()
      : "";
  const category = raw.slice(0, 60);
  const isValidCategory = /^[a-z0-9-]{2,60}$/.test(category);
  const categoryLabel = labelFromSlug(category) || "Black-owned businesses";

  const canonical = canonicalUrl(
    `/black-owned-businesses/category/${category}`,
  );
  const title = `${categoryLabel} | Black-owned Business Directory`;
  const description = truncateMeta(
    `Discover ${categoryLabel} and related Black-owned businesses in the Black Wealth Exchange directory.`,
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {!isValidCategory && <meta name="robots" content="noindex,follow" />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: title,
              description,
              url: canonical,
            }),
          }}
        />
      </Head>
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
            Category landing
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">
            {categoryLabel} in the Black business directory
          </h1>
          <p className="mt-4 text-zinc-300">
            Start with this category landing and jump into filtered directory
            and Travel Map search.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/business-directory?category=${encodeURIComponent(categoryLabel)}`}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black"
            >
              Open directory category
            </Link>
            <Link
              href={`/travel-map/explore?category=${encodeURIComponent(categoryLabel)}`}
              className="rounded-xl border border-white/15 px-4 py-2 font-semibold text-white"
            >
              Explore on Travel Map
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
