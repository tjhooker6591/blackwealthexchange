// src/pages/collections/[id].tsx
//
// Phase 5 -- Collections. View one collection's items, and add from the
// caller's already-saved businesses/products
// (/api/user/save-business.ts, /api/user/save-product.ts).

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Item = {
  itemType: "business" | "product";
  itemId: string;
  title: string;
  subtitle: string;
  href: string | null;
};

type SavedBusiness = { businessId: string; displayName: string };
type SavedProduct = { productId: string; name: string };

export default function CollectionDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });

  const [collectionName, setCollectionName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  const load = async () => {
    const res = await fetch(`/api/user/collections/${id}/items`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setCollectionName(data?.collection?.name || "Collection");
      setItems(data?.items || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !id) return;
    load();
    fetch("/api/user/save-business", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => setSavedBusinesses(data?.businesses || []))
      .catch(() => null);
    fetch("/api/user/save-product", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setSavedProducts(data?.products || []))
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function addItem(itemType: "business" | "product", itemId: string) {
    await fetch(`/api/user/collections/${id}/items`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    });
    load();
  }

  async function removeItem(itemType: "business" | "product", itemId: string) {
    await fetch(`/api/user/collections/${id}/items`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    });
    load();
  }

  const itemIds = new Set(items.map((i) => `${i.itemType}:${i.itemId}`));
  const canonical = canonicalUrl(`/collections/${id}`);

  return (
    <>
      <Head>
        <title>{collectionName || "Collection"} | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <Link href="/collections" className="bwe-open-link bwe-focus-ring">
            Back to Collections
          </Link>
          <h1 className="bwe-display-title mt-3 text-3xl sm:text-4xl">
            {collectionName || "Collection"}
          </h1>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href={`/login?next=/collections/${id}`}
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div>
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    Nothing in this collection yet. Add from your saved
                    businesses or products on the right.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={`${item.itemType}:${item.itemId}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="min-w-0">
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="truncate font-semibold text-white/90 hover:text-[var(--accent)]"
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <div className="truncate font-semibold text-white/90">
                              {item.title}
                            </div>
                          )}
                          {item.subtitle ? (
                            <div className="text-xs text-white/55">
                              {item.subtitle}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemType, item.itemId)}
                          className="shrink-0 text-xs font-semibold text-white/50 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-semibold text-white/90">
                  Add from your saved items
                </div>
                <div className="mt-3 space-y-1">
                  {savedBusinesses.map((b) => (
                    <button
                      key={b.businessId}
                      type="button"
                      disabled={itemIds.has(`business:${b.businessId}`)}
                      onClick={() => addItem("business", b.businessId)}
                      className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/5 disabled:opacity-40"
                    >
                      {b.displayName}
                    </button>
                  ))}
                  {savedProducts.map((p) => (
                    <button
                      key={p.productId}
                      type="button"
                      disabled={itemIds.has(`product:${p.productId}`)}
                      onClick={() => addItem("product", p.productId)}
                      className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/5 disabled:opacity-40"
                    >
                      {p.name}
                    </button>
                  ))}
                  {savedBusinesses.length === 0 &&
                  savedProducts.length === 0 ? (
                    <div className="text-xs text-white/50">
                      Save a business or product first, then add it here.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
