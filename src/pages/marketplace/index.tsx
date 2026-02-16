"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Search, SlidersHorizontal, Sparkles, Store, X } from "lucide-react";
import BuyNowButton from "@/components/BuyNowButton";

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
};

const itemsPerPage = 12;

const CATEGORIES = [
  "All",
  "Apparel",
  "Accessories",
  "Beauty",
  "Art",
  "Books",
  "Home",
  "Food",
  "Other",
] as const;

type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function buildPageList(current: number, total: number) {
  // Compact pagination with ellipses
  const pages: Array<number | "…"> = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  const showLeft = Math.max(2, current - 1);
  const showRight = Math.min(total - 1, current + 1);

  pages.push(1);

  if (showLeft > 2) pages.push("…");
  for (let i = showLeft; i <= showRight; i++) pages.push(i);
  if (showRight < total - 1) pages.push("…");

  pages.push(total);
  return pages;
}

export default function Marketplace() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement | null>(null);

  // ---- hydrate state from URL once ----
  useEffect(() => {
    if (!router.isReady) return;

    const qp = router.query.page ? Number(router.query.page) : 1;
    const qc = (router.query.category as string) || "All";
    const qq = (router.query.q as string) || "";
    const qs = (router.query.sort as string) || "relevance";

    const safePage = Number.isFinite(qp) && qp >= 1 ? qp : 1;
    const safeCategory = (CATEGORIES as readonly string[]).includes(qc) ? (qc as any) : "All";
    const safeSort: SortKey = (["relevance", "newest", "price_asc", "price_desc"] as const).includes(
      qs as any,
    )
      ? (qs as SortKey)
      : "relevance";

    setCurrentPage(safePage);
    setSelectedCategory(safeCategory);
    setQ(qq);
    setSort(safeSort);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- keep URL in sync (shallow) ----
  useEffect(() => {
    if (!router.isReady) return;

    const nextQuery: Record<string, string> = {};
    if (currentPage > 1) nextQuery.page = String(currentPage);
    if (selectedCategory && selectedCategory !== "All") nextQuery.category = selectedCategory;
    if (debouncedQ.trim()) nextQuery.q = debouncedQ.trim();
    if (sort !== "relevance") nextQuery.sort = sort;

    router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, currentPage, selectedCategory, debouncedQ, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- fetch products ----
  useEffect(() => {
    if (!router.isReady) return;

    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(itemsPerPage));
        // keep backward-compatible: always include category like your current API expects
        params.set("category", selectedCategory);

        // optional “leading edge” extras (API can ignore safely)
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (sort) params.set("sort", sort);

        const res = await fetch(`/api/marketplace/get-products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Request failed (${res.status})`);
        }

        const data = await res.json();
        const nextProducts = (data.products || []) as Product[];
        const nextTotal = Number(data.total || 0);

        setProducts(nextProducts);
        setTotal(nextTotal);

        const computedPages = Math.max(1, Math.ceil(nextTotal / itemsPerPage));
        setTotalPages(computedPages);

        // clamp page if backend total changed
        if (currentPage > computedPages) setCurrentPage(computedPages);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("Failed to load products:", e);
        setErrorMsg(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load products. Please try again.",
        );
      } finally {
        setLoading(false);
        // gentle scroll-to-results on new loads (esp. page changes)
        requestAnimationFrame(() => {
          topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [router.isReady, currentPage, selectedCategory, debouncedQ, sort]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleCategoryChange = (cat: (typeof CATEGORIES)[number]) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleBecomeSeller = () => {
    router.push("/marketplace/become-a-seller");
  };

  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Marketplace | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Discover and support Black-owned businesses. Shop with purpose on Black Wealth Exchange."
        />
      </Head>

      {/* Subtle “light gold” hue backdrop */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-[35%] left-[10%] h-[360px] w-[360px] rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div ref={topRef} />

      {/* Header */}
      <section className="relative text-center py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-white/5 px-4 py-2 text-sm text-gray-200">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Trusted checkout • Stripe powered • Shop Black-owned brands
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold text-gold tracking-tight">
            🛍️ Marketplace
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Discover and support Black-owned businesses. Shop with purpose.
          </p>

          {/* Search + Sort Bar */}
          <div className="mt-7 flex flex-col md:flex-row gap-3 items-stretch justify-center">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg">
                <Search className="h-5 w-5 text-gray-300" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search products (name/keywords)…"
                  className="w-full bg-transparent outline-none text-white placeholder:text-gray-400"
                  aria-label="Search marketplace products"
                />
                {q.trim() ? (
                  <button
                    onClick={() => {
                      setQ("");
                      setCurrentPage(1);
                    }}
                    className="rounded-full p-2 hover:bg-white/10 transition"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-200" />
                  </button>
                ) : null}
              </div>

              {/* Micro hint if API doesn't support q/sort yet */}
              <p className="mt-2 text-xs text-gray-400">
                Tip: If search/sort don’t change results yet, update the{" "}
                <span className="text-gray-300">get-products</span> API to honor{" "}
                <span className="text-gray-300">q</span> and{" "}
                <span className="text-gray-300">sort</span>.
              </p>
            </div>

            <div className="w-full md:w-64">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg">
                <SlidersHorizontal className="h-5 w-5 text-gray-300" />
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent outline-none text-white"
                  aria-label="Sort products"
                >
                  <option value="relevance" className="bg-black">Sort: Relevance</option>
                  <option value="newest" className="bg-black">Newest</option>
                  <option value="price_asc" className="bg-black">Price: Low → High</option>
                  <option value="price_desc" className="bg-black">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result summary */}
          <div className="mt-3 text-sm text-gray-400">
            {loading ? (
              <span>Loading…</span>
            ) : (
              <span>
                Showing{" "}
                <span className="text-gray-200 font-medium">{products.length}</span>{" "}
                product{products.length === 1 ? "" : "s"}
                {total ? (
                  <>
                    {" "}
                    • <span className="text-gray-200 font-medium">{total}</span>{" "}
                    total
                  </>
                ) : null}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Become a Seller */}
      <section className="relative max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden border border-yellow-500/20 bg-gradient-to-r from-yellow-500/15 via-white/5 to-white/0 shadow-xl">
          <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-yellow-500/15 border border-yellow-500/20 p-3">
                <Store className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gold">Own a Business?</h3>
                <p className="text-sm text-gray-200/90">
                  Join the movement and sell your products here. Manage listings, orders,
                  and grow your brand.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleBecomeSeller}
                className="w-full md:w-auto px-5 py-2.5 bg-black text-gold font-semibold rounded-xl border border-yellow-500/30 hover:bg-white/5 transition shadow"
              >
                Become a Seller
              </button>
              <Link
                href="/marketplace/dashboard"
                className="w-full md:w-auto text-center px-5 py-2.5 bg-white/5 text-gray-100 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition"
              >
                Seller Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters (scroll-friendly on mobile) */}
      <section className="relative max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-2xl font-bold text-gold">
            {selectedCategory} Products
          </h3>
          <div className="hidden md:block text-sm text-gray-400">
            Page <span className="text-gray-200 font-medium">{currentPage}</span>{" "}
            of <span className="text-gray-200 font-medium">{totalPages}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cx(
                "whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition",
                "focus:outline-none focus:ring-2 focus:ring-yellow-500/40",
                selectedCategory === cat
                  ? "bg-gold text-black border-gold"
                  : "border-white/15 text-gray-300 hover:bg-white/10",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error */}
        {errorMsg ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">{errorMsg}</p>
            <button
              onClick={() => {
                // trigger refetch by resetting same page (effect will run anyway on state change),
                // so we nudge it safely
                setCurrentPage((p) => p);
              }}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-40 rounded-xl bg-white/10 mb-4" />
                <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                <div className="h-4 w-1/3 bg-white/10 rounded mb-4" />
                <div className="h-9 bg-white/10 rounded-xl mb-2" />
                <div className="h-9 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-gray-200 font-semibold">No products found.</p>
            <p className="mt-1 text-sm text-gray-400">
              Try a different category, or adjust your search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg hover:shadow-2xl transition"
                >
                  <Link
                    href={`/marketplace/product/${product._id}`}
                    className="block"
                    aria-label={`View details for ${product.name}`}
                  >
                    <div className="w-full h-44 relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  </Link>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/marketplace/product/${product._id}`}>
                        <h4 className="text-lg text-gold font-semibold truncate hover:underline">
                          {product.name}
                        </h4>
                      </Link>
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        {product.category || "Other"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-gray-200 font-semibold">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {product.description ? (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                      {product.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      No description provided.
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {/* ✅ userId removed per your note */}
                    <BuyNowButton
                      itemId={product._id}
                      amount={product.price}
                      type="product"
                    />

                    <button
                      onClick={() => router.push(`/marketplace/product/${product._id}`)}
                      className="w-full text-sm px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex flex-col items-center gap-3 mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {pageList.map((p, idx) =>
                      p === "…" ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={cx(
                            "min-w-[42px] px-3 py-2 rounded-xl border text-sm transition",
                            p === currentPage
                              ? "bg-gold text-black border-gold"
                              : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10",
                          )}
                          aria-current={p === currentPage ? "page" : undefined}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition"
                  >
                    Next
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Tip: use search + sort for faster discovery.
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Marketplace Disclaimer */}
      <section className="relative max-w-4xl mx-auto text-center py-12 px-4 text-sm text-gray-300">
        <h4 className="text-lg text-gold font-semibold mb-2">Legal Disclaimer</h4>
        <p>
          Black Wealth Exchange is a marketplace platform. We do not own, ship, or guarantee
          any products sold. All sales are made directly between independent sellers and buyers.
        </p>
        <p className="mt-2">
          Sellers are fully responsible for listings, pricing, shipping, and customer service.
          Buyers must review all details before purchasing. Black Wealth Exchange does not mediate
          disputes and assumes no liability for transactions.
        </p>
        <p className="mt-2">
          Payments are securely processed through Stripe. A small platform fee is deducted from each
          sale, and remaining funds are routed directly to the seller.
        </p>

        <Link href="/terms/marketplace" className="text-gold underline mt-4 inline-block">
          View Full Marketplace Terms of Use
        </Link>
      </section>

      {/* Story / Message */}
      <section className="relative max-w-4xl mx-auto text-center py-12 px-4">
        <Image
          src="/marketplace/story3.jpg"
          alt="Empowering the Community"
          width={520}
          height={360}
          className="object-cover rounded-2xl mx-auto mb-5 border border-white/10 shadow-xl"
        />
        <p className="text-gray-300">
          Every purchase supports Black entrepreneurs and helps circulate wealth within our communities.
          Together, we’re building a legacy of empowerment and economic strength.
        </p>
      </section>

      {/* Footer */}
      <footer className="relative text-center py-10">
        <Link href="/" className="inline-block">
          <span className="px-6 py-3 inline-flex items-center justify-center bg-black text-gold border border-yellow-500/30 font-semibold rounded-2xl hover:bg-white/5 transition shadow">
            Back to Home
          </span>
        </Link>
      </footer>
    </div>
  );
}
