import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

type Product = {
  _id: string;
  name?: string;
  category?: string;
  price?: number;
};
type Props = { products: Product[]; total: number };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const q = { status: "active", isPublished: true };
    const total = await db.collection("products").countDocuments(q);
    const products = (
      await db
        .collection("products")
        .find(q)
        .project({ name: 1, category: 1, price: 1 })
        .limit(24)
        .toArray()
    ).map((p: any) => ({
      _id: String(p._id),
      name: p.name,
      category: p.category,
      price: p.price,
    }));
    return { props: { products, total } };
  } catch {
    return { props: { products: [], total: 0 } };
  }
};

export default function ShopBlackOwnedProducts({ products, total }: Props) {
  const title = "Shop Black-Owned Products | Black Wealth Exchange Marketplace";
  const description = truncateMeta(
    "Shop Black-owned brands and products across apparel, beauty, books, and more. Discover trusted products and support Black economic growth.",
  );
  const canonical = canonicalUrl("/shop-black-owned-products");

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
            Shop Black-owned products
          </h1>
          <p className="mt-2 text-white/80">
            {total.toLocaleString()} products available in the Black Wealth
            Exchange marketplace.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              href="/marketplace"
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Open full marketplace
            </Link>
            <Link
              href="/black-owned-businesses"
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Find Black-owned businesses
            </Link>
          </div>
        </header>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <ul className="grid md:grid-cols-2 gap-3">
            {products.map((p) => (
              <li key={p._id} className="border-b border-white/10 pb-2">
                <Link
                  href={`/marketplace/product/${p._id}`}
                  className="font-semibold hover:text-[#D4AF37]"
                >
                  {p.name || "Product"}
                </Link>
                <p className="text-sm text-white/70">
                  {p.category || "Other"}
                  {typeof p.price === "number"
                    ? ` • $${p.price.toFixed(2)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
