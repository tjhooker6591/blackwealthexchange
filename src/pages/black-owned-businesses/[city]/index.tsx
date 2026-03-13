import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { fromSlug, TOP_CATEGORIES, toSlug } from "@/lib/seoLanding";

type Biz = {
  alias?: string;
  business_name?: string;
  categories?: string | string[];
  city?: string;
  state?: string;
};
type Props = { city: string; items: Biz[]; total: number };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const citySlug = Array.isArray(ctx.params?.city)
    ? ctx.params?.city[0]
    : ctx.params?.city || "";
  const city = fromSlug(String(citySlug));
  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const q = {
      city: {
        $regex: new RegExp(
          `^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
      $or: [
        { status: "approved" },
        { status: { $exists: false } },
        { status: "" },
        { status: null },
      ],
    };
    const total = await db.collection("businesses").countDocuments(q);
    const docs = (await db
      .collection("businesses")
      .find(q)
      .project({
        _id: 0,
        alias: 1,
        business_name: 1,
        categories: 1,
        city: 1,
        state: 1,
      })
      .limit(20)
      .toArray()) as any[];

    const items: Biz[] = docs.map((d) => ({
      alias: d?.alias ? String(d.alias) : undefined,
      business_name: d?.business_name ? String(d.business_name) : undefined,
      categories: Array.isArray(d?.categories)
        ? d.categories.map((c: any) => String(c))
        : d?.categories
          ? String(d.categories)
          : undefined,
      city: d?.city ? String(d.city) : undefined,
      state: d?.state ? String(d.state) : undefined,
    }));

    return { props: { city: String(city), items, total: Number(total) } };
  } catch {
    return { props: { city, items: [], total: 0 } };
  }
};

export default function CityBusinessesPage({ city, items, total }: Props) {
  const title = `Black-Owned Businesses in ${city} | Black Wealth Exchange`;
  const description = truncateMeta(
    `Discover Black-owned businesses in ${city}. Browse local categories, verified listings, and trusted providers on Black Wealth Exchange.`,
  );
  const canonical = canonicalUrl(`/black-owned-businesses/${toSlug(city)}`);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">
            Black-owned businesses in {city}
          </h1>
          <p className="mt-2 text-white/80">
            {total.toLocaleString()} listings found for {city}. Explore local
            business categories and connect directly with owners.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              href="/black-owned-businesses"
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Browse all cities
            </Link>
            <Link
              href={`/business-directory?search=${encodeURIComponent(city)}`}
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Search full directory for {city}
            </Link>
          </div>
        </header>

        <section>
          <h2 className="text-xl font-bold mb-3">
            Popular categories in {city}
          </h2>
          <div className="flex flex-wrap gap-2">
            {TOP_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/black-owned-businesses/${toSlug(city)}/${toSlug(cat)}`}
                className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold mb-3">Featured listings</h2>
          {items.length ? (
            <ul className="space-y-2">
              {items.map((b, idx) => (
                <li key={`${b.alias || b.business_name}-${idx}`}>
                  <Link
                    href={
                      b.alias
                        ? `/business-directory/${b.alias}`
                        : "/business-directory"
                    }
                    className="text-white/90 hover:text-[#D4AF37] underline underline-offset-2"
                  >
                    {b.business_name || "Business listing"}
                  </Link>
                  <span className="text-white/60 text-sm">
                    {" "}
                    • {b.city || city}
                    {b.state ? `, ${b.state}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">
              No listings surfaced yet. Use the full directory search to
              discover nearby Black-owned businesses.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
