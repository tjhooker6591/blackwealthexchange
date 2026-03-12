import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { fromSlug, toSlug } from "@/lib/seoLanding";

type Biz = { alias?: string; business_name?: string; categories?: string | string[]; city?: string; state?: string; description?: string };
type Props = { city: string; category: string; items: Biz[]; total: number };

function esc(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const city = fromSlug(String(Array.isArray(ctx.params?.city) ? ctx.params?.city[0] : ctx.params?.city || ""));
  const category = fromSlug(String(Array.isArray(ctx.params?.category) ? ctx.params?.category[0] : ctx.params?.category || ""));

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const q = {
      city: { $regex: new RegExp(`^${esc(city)}$`, "i") },
      $or: [
        { categories: { $regex: new RegExp(esc(category), "i") } },
        { category: { $regex: new RegExp(esc(category), "i") } },
        { display_categories: { $regex: new RegExp(esc(category), "i") } },
      ],
      $and: [{ $or: [{ status: "approved" }, { status: { $exists: false } }, { status: "" }, { status: null }] }],
    } as any;

    const total = await db.collection("businesses").countDocuments(q);
    const items = (await db.collection("businesses").find(q).project({ alias: 1, business_name: 1, categories: 1, city: 1, state: 1, description: 1 }).limit(24).toArray()) as any;
    return { props: { city, category, items, total } };
  } catch {
    return { props: { city, category, items: [], total: 0 } };
  }
};

export default function CityCategoryPage({ city, category, items, total }: Props) {
  const title = `${category} Black-Owned Businesses in ${city} | Black Wealth Exchange`;
  const description = truncateMeta(`Browse ${category.toLowerCase()} Black-owned businesses in ${city}. Compare local providers and discover trusted listings.`);
  const canonical = canonicalUrl(`/black-owned-businesses/${toSlug(city)}/${toSlug(category)}`);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Black-owned businesses", item: canonicalUrl("/black-owned-businesses") },
      { "@type": "ListItem", position: 2, name: city, item: canonicalUrl(`/black-owned-businesses/${toSlug(city)}`) },
      { "@type": "ListItem", position: 3, name: category, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">{category} Black-owned businesses in {city}</h1>
          <p className="mt-2 text-white/80">{total.toLocaleString()} listings found. Use this page to compare local options and connect directly.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href={`/black-owned-businesses/${toSlug(city)}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Back to {city} hub</Link>
            <Link href={`/business-directory?search=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Open filtered directory</Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          {items.length ? (
            <ul className="space-y-3">
              {items.map((b, idx) => (
                <li key={`${b.alias || b.business_name}-${idx}`} className="border-b border-white/10 pb-2">
                  <Link href={b.alias ? `/business-directory/${b.alias}` : "/business-directory"} className="font-semibold text-white hover:text-[#D4AF37]">
                    {b.business_name || "Business listing"}
                  </Link>
                  <p className="text-sm text-white/70">{(b.description || "").slice(0, 140) || `${category} business in ${city}`}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">No listings found yet for this exact category in {city}. Try broader directory search for nearby alternatives.</p>
          )}
        </section>
      </div>
    </div>
  );
}
