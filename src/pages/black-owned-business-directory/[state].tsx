import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { TOP_CITIES, toSlug } from "@/lib/seoLanding";

type Biz = { alias: string; business_name: string; city: string; state: string };
type Props = { stateCode: string; items: Biz[]; total: number };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const stateCode = String(
    Array.isArray(ctx.params?.state) ? ctx.params?.state[0] : ctx.params?.state || "",
  )
    .trim()
    .toUpperCase();

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const q = {
      state: { $regex: new RegExp(`^${stateCode}$`, "i") },
      $or: [
        { status: "approved" },
        { status: { $exists: false } },
        { status: "" },
        { status: null },
      ],
    };

    const total = await db.collection("businesses").countDocuments(q);
    const raw = await db
      .collection("businesses")
      .find(q)
      .project({ _id: 0, alias: 1, business_name: 1, city: 1, state: 1 })
      .limit(30)
      .toArray();

    const items: Biz[] = raw.map((r: any) => ({
      alias: typeof r.alias === "string" ? r.alias : "",
      business_name: typeof r.business_name === "string" ? r.business_name : "Business listing",
      city: typeof r.city === "string" ? r.city : "",
      state: typeof r.state === "string" ? r.state : stateCode,
    }));

    return { props: { stateCode, items, total } };
  } catch {
    return { props: { stateCode, items: [], total: 0 } };
  }
};

export default function StateDirectoryLanding({ stateCode, items, total }: Props) {
  const title = `Black-Owned Business Directory in ${stateCode} | Black Wealth Exchange`;
  const description = truncateMeta(
    `Find Black-owned businesses across ${stateCode}. Explore local listings by city and category with trusted discovery tools.`,
  );
  const canonical = canonicalUrl(`/black-owned-business-directory/${stateCode.toLowerCase()}`);

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
            Black-owned business directory: {stateCode}
          </h1>
          <p className="mt-2 text-white/80">
            {total.toLocaleString()} listings found in {stateCode}. Browse by city or go
            directly to the full directory search.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              href={`/business-directory?state=${encodeURIComponent(stateCode)}`}
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Search directory in {stateCode}
            </Link>
            <Link
              href="/black-owned-businesses"
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              All city hubs
            </Link>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-bold mb-3">Popular city hubs</h2>
          <div className="flex flex-wrap gap-2">
            {TOP_CITIES.map((city) => (
              <Link
                key={city}
                href={`/black-owned-businesses/${toSlug(city)}`}
                className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold mb-3">Listings in {stateCode}</h2>
          {items.length ? (
            <ul className="grid md:grid-cols-2 gap-2">
              {items.map((b, idx) => (
                <li key={`${b.alias || b.business_name}-${idx}`}>
                  <Link
                    href={b.alias ? `/business-directory/${b.alias}` : "/business-directory"}
                    className="text-white hover:text-[#D4AF37] underline underline-offset-2"
                  >
                    {b.business_name}
                  </Link>
                  <span className="text-white/60 text-sm"> • {b.city || stateCode}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">
              No listings surfaced for this state yet. Try nearby city hubs or the full
              directory search.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
