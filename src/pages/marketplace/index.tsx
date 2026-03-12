"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);

  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const qp = router.query.page ? Number(router.query.page) : 1;
    const qc = (router.query.category as string) || "All";
    const qq = (router.query.q as string) || "";
    const qs = (router.query.sort as string) || "relevance";

    const safePage = Number.isFinite(qp) && qp >= 1 ? qp : 1;
    const safeCategory = (CATEGORIES as readonly string[]).includes(qc)
      ? (qc as any)
      : "All";
    const safeSort: SortKey = (
      ["relevance", "newest", "price_asc", "price_desc"] as const
    ).includes(qs as any)
      ? (qs as SortKey)
      : "relevance";

    setCurrentPage(safePage);
    setSelectedCategory(safeCategory);
    setQ(qq);
    setSort(safeSort);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return;

    const nextQuery: Record<string, string> = {};
    if (currentPage > 1) nextQuery.page = String(currentPage);
    if (selectedCategory && selectedCategory !== "All") {
      nextQuery.category = selectedCategory;
    }
    if (debouncedQ.trim()) nextQuery.q = debouncedQ.trim();
    if (sort !== "relevance") nextQuery.sort = sort;

    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
  }, [router.isReady, currentPage, selectedCategory, debouncedQ, sort]); // eslint-disable-line react-hooks/exhaustive-deps

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
        params.set("category", selectedCategory);

        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (sort) params.set("sort", sort);

        const res = await fetch(
          `/api/marketplace/get-products?${params.toString()}`,
          { signal: controller.signal },
        );

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
        requestAnimationFrame(() => {
          topRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
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

  const pageList = useMemo(
    () => buildPageList(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const resultLabel = loading
    ? "Loading…"
    : `Showing ${products.length} product${products.length === 1 ? "" : "s"}${
        total ? ` • ${total} total` : ""
      }`;

  const canonical = canonicalUrl("/marketplace");
  const title = "Black-Owned Product Marketplace | Black Wealth Exchange";
  const description = truncateMeta(
    "Shop Black-owned brands and products in a trusted marketplace. Discover apparel, beauty, books, home goods, and more.",
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
      </Head>

      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute left-[10%] top-[35%] h-[360px] w-[360px] rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div ref={topRef} />

      {/* Header */}
      <section className="relative px-4 py-8 text-center sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-white/5 px-3 py-2 text-xs text-gray-200 sm:px-4 sm:text-sm">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Trusted checkout • Stripe powered • Shop Black-owned brands
          </div>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gold md:text-5xl">
            Marketplace
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-300 sm:text-lg">
            Discover and support Black-owned businesses with a cleaner, faster
            shopping experience.
          </p>
          <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2 text-xs">
            <Link href="/shop-black-owned-products" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Shop Black-owned products</Link>
            <Link href="/black-owned-businesses" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Find Black-owned businesses near me</Link>
            <Link href="/wealth-building-resources" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Wealth-building resources</Link>
          </div>

          {/* Search + Sort */}
          <div className="mt-6 flex flex-col items-stretch gap-3 md:mt-7 md:flex-row md:justify-center">
            <div className="max-w-2xl flex-1">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg">
                <Search className="h-5 w-5 text-gray-300" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search products…"
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-400"
                  aria-label="Search marketplace products"
                />
                {q.trim() ? (
                  <button
                    onClick={() => {
                      setQ("");
                      setCurrentPage(1);
                    }}
                    className="rounded-full p-2 transition hover:bg-white/10"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-gray-200" />
                  </button>
                ) : null}
              </div>
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
                  className="w-full bg-transparent text-white outline-none"
                  aria-label="Sort products"
                >
                  <option value="relevance" className="bg-black">
                    Sort: Relevance
                  </option>
                  <option value="newest" className="bg-black">
                    Newest
                  </option>
                  <option value="price_asc" className="bg-black">
                    Price: Low → High
                  </option>
                  <option value="price_desc" className="bg-black">
                    Price: High → Low
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-400">{resultLabel}</div>
        </div>
      </section>

      {/* Compact seller CTA */}
      <section className="relative mx-auto mb-6 max-w-6xl px-4 sm:mb-8">
        <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/15 via-white/5 to-white/0 shadow-xl">
          <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl border border-yellow-500/20 bg-yellow-500/15 p-2.5 sm:p-3">
                <Store className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gold sm:text-2xl">
                  Own a Business?
                </h3>
                <p className="max-w-xl text-sm text-gray-200/90 sm:text-base">
                  Join the marketplace and manage your products from one place.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 md:w-auto">
              <button
                onClick={handleBecomeSeller}
                className="rounded-2xl border border-yellow-500/30 bg-black px-4 py-3 text-center text-sm font-semibold text-gold shadow transition hover:bg-white/5"
              >
                Become a Seller
              </button>
              <Link
                href="/marketplace/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-gray-100 transition hover:bg-white/10"
              >
                Seller Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories + page summary */}
      <section className="relative mx-auto max-w-7xl px-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-gold sm:text-3xl">
            {selectedCategory} Products
          </h3>
          <div className="hidden text-sm text-gray-400 md:block">
            Page{" "}
            <span className="font-medium text-gray-200">{currentPage}</span> of{" "}
            <span className="font-medium text-gray-200">{totalPages}</span>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2 sm:mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cx(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500/40",
                selectedCategory === cat
                  ? "border-gold bg-gold text-black"
                  : "border-white/15 text-gray-300 hover:bg-white/10",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {errorMsg ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">{errorMsg}</p>
            <button
              onClick={() => setCurrentPage((p) => p)}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 lg:gap-6">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 animate-pulse sm:p-4"
              >
                <div className="mb-3 h-28 rounded-xl bg-white/10 sm:mb-4 sm:h-40" />
                <div className="mb-2 h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="font-semibold text-gray-200">No products found.</p>
            <p className="mt-1 text-sm text-gray-400">
              Try a different category or adjust your search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 lg:gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-lg transition hover:shadow-2xl sm:p-4"
                >
                  <Link
                    href={`/marketplace/product/${product._id}`}
                    className="block"
                    aria-label={`View details for ${product.name}`}
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-44">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1536px) 25vw, 20vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03] object-center w-full h-56 sm:h-64"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs text-gray-400 sm:text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 min-w-0 text-sm font-semibold leading-tight text-gold sm:text-base">
                        {product.name}
                      </h4>
                      <p className="shrink-0 text-sm font-semibold text-gray-200 sm:text-base">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>

                    <p className="mt-1 truncate text-[11px] text-gray-400 sm:text-xs">
                      {product.category || "Other"}
                    </p>

                    <p className="mt-1 text-[11px] text-white/45 sm:hidden">
                      Tap for details
                    </p>

                    <div className="hidden sm:block">
                      {product.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                          {product.description}
                        </p>
                      ) : (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                          No description provided.
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Desktop actions only */}
                  <div className="mt-4 hidden sm:grid sm:grid-cols-2 sm:gap-2">
                    <div className="min-w-0">
                      <BuyNowButton
                        itemId={product._id}
                        amount={product.price}
                        type="product"
                      />
                    </div>

                    <button
                      onClick={() =>
                        router.push(`/marketplace/product/${product._id}`)
                      }
                      className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200 transition hover:bg-white/10"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {pageList.map((p, idx) =>
                      p === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={cx(
                            "min-w-[42px] rounded-xl border px-3 py-2 text-sm transition",
                            p === currentPage
                              ? "border-gold bg-gold text-black"
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
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
                  >
                    Next
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Browse by category, then open details for the full product
                  view.
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Legal */}
      <section className="relative mx-auto max-w-4xl px-4 py-10 text-center text-sm text-gray-300 sm:py-12">
        <button
          type="button"
          onClick={() => setLegalOpen((v) => !v)}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-white/5 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-white/10"
          aria-expanded={legalOpen}
        >
          Legal Disclaimer
          {legalOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {legalOpen ? (
          <div className="mt-4">
            <p className="mx-auto max-w-3xl">
              Black Wealth Exchange is a marketplace platform. We do not own,
              ship, or guarantee any products sold. All sales are made directly
              between independent sellers and buyers.
            </p>
            <p className="mx-auto mt-3 max-w-3xl">
              Sellers are fully responsible for listings, pricing, shipping, and
              customer service. Buyers must review all details before
              purchasing. Black Wealth Exchange does not mediate disputes and
              assumes no liability for transactions.
            </p>
            <p className="mx-auto mt-3 max-w-3xl">
              Payments are securely processed through Stripe. A small platform
              fee is deducted from each sale, and remaining funds are routed
              directly to the seller.
            </p>

            <Link
              href="/terms/marketplace"
              className="mt-4 inline-block text-gold underline"
            >
              View Full Marketplace Terms of Use
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <p className="mx-auto max-w-2xl text-gray-300">
              Black Wealth Exchange is a marketplace platform. All sales are
              made directly between independent sellers and buyers.
            </p>

            <Link
              href="/terms/marketplace"
              className="mt-4 inline-block text-gold underline"
            >
              View Full Marketplace Terms of Use
            </Link>
          </div>
        )}
      </section>

      {/* Story */}
      <section className="relative mx-auto max-w-4xl px-4 py-8 text-center sm:py-12">
        <div className="hidden md:block">
          <Image
            src="/marketplace/story3.jpg"
            alt="Empowering the Community"
            width={520}
            height={360}
            className="mx-auto mb-5 rounded-2xl border border-white/10 object-cover shadow-xl object-center w-full h-56 sm:h-64"
          />
        </div>
        <p className="text-sm text-gray-300 sm:text-base">
          Every purchase supports Black entrepreneurs and helps circulate wealth
          within our communities.
        </p>
      </section>

      {/* Footer */}
      <footer className="relative py-10 text-center">
        <Link href="/" className="inline-block">
          <span className="inline-flex items-center justify-center rounded-2xl border border-yellow-500/30 bg-black px-6 py-3 font-semibold text-gold shadow transition hover:bg-white/5">
            Back to Home
          </span>
        </Link>
      </footer>
    </div>
  );
}
