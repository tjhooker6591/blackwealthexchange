// src/pages/my-bwe/saved-products.tsx
//
// Phase 5 -- Save Product. List of marketplace products the caller saved.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Saved = {
  productId: string;
  name: string;
  price: number | null;
  href: string;
};

export default function SavedProductsPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [items, setItems] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/user/save-product", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setItems(data?.products || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  const canonical = canonicalUrl("/my-bwe/saved-products");

  return (
    <>
      <Head>
        <title>Saved Products | My BWE</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <Link href="/my-bwe" className="bwe-open-link bwe-focus-ring">
            Back to My BWE
          </Link>
          <h1 className="bwe-display-title mt-3 text-3xl sm:text-4xl">
            Saved Products
          </h1>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/my-bwe/saved-products"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              Nothing saved yet.{" "}
              <Link
                href="/marketplace"
                className="text-[var(--accent)] underline"
              >
                Browse the marketplace
              </Link>
              .
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.productId}
                  href={item.href}
                  className="bwe-grid-card bwe-focus-ring block p-4"
                >
                  <div className="bwe-card-title">{item.name}</div>
                  {typeof item.price === "number" ? (
                    <div className="mt-1 text-sm text-white/70">
                      ${item.price.toFixed(2)}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
