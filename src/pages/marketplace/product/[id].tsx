"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";
import BuyNowButton from "@/components/BuyNowButton";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import {
  buildPublicMarketplaceVisibilityFilter,
  getPublicMarketplaceSellerName,
  hasPublicMarketplaceVisibility,
  isPublicMarketplaceSellerProfileComplete,
} from "@/lib/marketplace/publicCatalog";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import useAuth from "@/hooks/useAuth";

interface Product {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
  stockQuantity?: number;
  views?: number;
  availability?: string | null;
  condition?: string | null;
  status?: string | null;
  isFeatured?: boolean;
  recentlyAdded?: boolean;
  activeListing?: boolean;
  seller?: {
    id?: string | null;
    name?: string | null;
    joinedAt?: string | null;
    profileComplete?: boolean | null;
    businessId?: string | null;
    businessName?: string | null;
  } | null;
}

type ProductReview = {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  createdAt: string | null;
};

type ProductDetailPageProps = {
  initialProduct: Product | null;
  initialProductId: string | null;
};
const ProductDetailPage = ({
  initialProduct,
  initialProductId,
}: ProductDetailPageProps) => {
  const router = useRouter();
  const { id } = router.query;
  const routeId = typeof id === "string" ? id : initialProductId;
  const { user } = useAuth({ silentOnPublic: false });

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [loading, setLoading] = useState(
    initialProductId ? false : !initialProduct,
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messageState, setMessageState] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    count: number;
    averageRating: number;
  }>({ count: 0, averageRating: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewState, setReviewState] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const trackMarketplaceProductEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/marketplace/product/[id]",
      section: "marketplace_product_detail",
      productId: routeId || null,
      entityId: routeId || null,
      entityType: "product",
      ...extras,
    });
  };

  useEffect(() => {
    if (initialProduct?._id) {
      trackMarketplaceProductEvent("product_detail_viewed", {
        ctaId: "product_detail_view",
        ctaLabel: "Product Detail Viewed",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct?._id]);

  useEffect(() => {
    if (!routeId) return;
    if (routeId === initialProductId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/marketplace/get-product?id=${encodeURIComponent(routeId)}`,
        );
        if (!res.ok) throw new Error("This listing is unavailable right now.");

        const data = await res.json();
        const loadedProduct = data?.product || null;
        setProduct(loadedProduct);
        if (loadedProduct?._id) {
          trackMarketplaceProductEvent("product_detail_viewed", {
            ctaId: "product_detail_view",
            ctaLabel: "Product Detail Viewed",
          });
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [routeId, initialProduct, initialProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;

      try {
        const res = await fetch(
          `/api/marketplace/get-products?page=1&limit=12&category=${encodeURIComponent(product.category || "All")}`,
        );
        if (!res.ok) throw new Error("Failed to fetch related products");

        const all = await res.json();
        const related = ((all?.products || []) as Product[])
          .filter((p: Product) => p._id !== product._id)
          .slice(0, 4);

        setRelatedProducts(related);
      } catch {
        setRelatedProducts([]);
      }
    };

    fetchRelated();
  }, [product]);

  const loadReviews = async (productId: string) => {
    try {
      const res = await fetch(
        `/api/marketplace/reviews?productId=${encodeURIComponent(productId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      setReviewSummary({
        count: Number(data?.count || 0),
        averageRating: Number(data?.averageRating || 0),
      });
    } catch {
      // leave reviews empty on fetch failure
    }
  };

  useEffect(() => {
    if (!product?._id) return;
    loadReviews(product._id);
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id || !user) {
      setSaved(false);
      return;
    }
    fetch("/api/user/save-product", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => {
        const list: Array<{ productId: string }> = data?.products || [];
        setSaved(list.some((item) => item.productId === product._id));
      })
      .catch(() => null);
  }, [product?._id, user]);

  async function toggleSaveProduct() {
    if (!product?._id) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setSaveBusy(true);
    try {
      const res = await fetch("/api/user/save-product", {
        method: saved ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      if (res.ok) {
        setSaved(!saved);
        trackMarketplaceProductEvent(
          saved ? "product_unsaved" : "product_saved",
          {},
        );
      }
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleSubmitReview() {
    if (!product?._id) return;
    setSubmittingReview(true);
    setReviewState(null);
    try {
      const res = await fetch("/api/marketplace/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReviewState(
          res.status === 401
            ? "Please sign in to leave a review."
            : data?.error || "We could not save your review. Please try again.",
        );
        return;
      }
      setReviewComment("");
      setReviewState("Thanks! Your review has been saved.");
      trackMarketplaceProductEvent("product_review_submitted", {
        rating: reviewRating,
      });
      loadReviews(product._id);
    } catch {
      setReviewState("We could not save your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const productName = String(product?.name || "").trim() || "Marketplace item";
  const stockQuantity = Number(product?.stockQuantity ?? 0);
  const availability =
    product?.availability ||
    (stockQuantity <= 0
      ? "Out of stock"
      : stockQuantity <= 3
        ? "Low stock"
        : "In stock");
  const sellerName = product?.seller?.name || "Independent BWE seller";
  const businessName =
    product?.seller?.businessName || "Business attribution preserved";
  const sellerTrust = product?.seller?.profileComplete
    ? "Active seller profile on file"
    : "Seller storefront details are limited on this listing";
  const listingStatusLabel = product?.activeListing
    ? "Available now"
    : "Status not fully confirmed";
  const canContactSeller = Boolean(product?.seller?.id);

  const availabilityClass = useMemo(() => {
    if (availability.toLowerCase().includes("out"))
      return "text-red-300 border-red-500/40 bg-red-500/10";
    if (availability.toLowerCase().includes("low"))
      return "text-yellow-200 border-yellow-500/40 bg-yellow-500/10";
    return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  }, [availability]);

  async function handleContactSeller() {
    if (!product?._id || !product?.seller?.id) {
      setMessageState("Seller contact is unavailable for this product.");
      return;
    }

    const text = messageText.trim();
    if (text.length < 8) {
      setMessageState("Please enter at least 8 characters.");
      return;
    }

    try {
      setSendingMessage(true);
      setMessageState(null);

      const res = await fetch("/api/marketplace/contact-seller", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          sellerId: product.seller.id,
          message: text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessageState(
          data?.error || "Message was not sent. Please try again.",
        );
        return;
      }

      setMessageText("");
      setMessageState(data?.message || "Message sent to seller.");
    } catch {
      setMessageState("Message was not sent. Please try again in a moment.");
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] px-4 py-20 text-white">
        <div className="bwe-section-wrap">
          <div className="bwe-state-panel">
            <p className="bwe-state-title">Loading listing</p>
            <p className="bwe-state-copy">
              Pulling the current product, seller, and purchase details now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] px-4 py-20 text-white">
        <div className="bwe-section-wrap">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <h1 className="text-2xl font-bold text-gold">
              Listing unavailable
            </h1>
            <p className="mt-2 text-sm text-white/80">
              This item is currently unavailable or was removed. You can
              continue shopping or contact support for help finding a
              replacement.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/marketplace"
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black"
              >
                Continue shopping
              </Link>
              <Link
                href="/support/marketplace"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                Marketplace support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canonical = canonicalUrl(
    `/marketplace/product/${encodeURIComponent(product._id)}`,
  );
  const title = `${productName} | Black Marketplace | Black Wealth Exchange`;
  const description = truncateMeta(
    product.description ||
      `Shop ${productName} from ${sellerName} on the Black Wealth Exchange marketplace.`,
  );
  const image = product.imageUrl || "/placeholder.png";
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description,
    image,
    sku: product._id,
    brand: { "@type": "Brand", name: sellerName },
    offers: {
      "@type": "Offer",
      price: Number(product.price || 0),
      priceCurrency: "USD",
      availability:
        stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonical,
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
      <div className="min-h-screen bg-[var(--surface-0)] py-8 text-white">
        <div className="bwe-section-wrap max-w-6xl">
          <Link
            href="/marketplace"
            className="bwe-open-link bwe-focus-ring inline-flex items-center"
          >
            Back to Marketplace
          </Link>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-start">
            <div className="relative h-72 w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/40 md:h-[540px]">
              <Image
                src={product.imageUrl || "/placeholder.png"}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bwe-badge">{product.category || "Other"}</span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${availabilityClass}`}
                >
                  {availability}
                </span>
                <span className="bwe-badge">{product.condition || "New"}</span>
                <span className="bwe-badge">Secure BWE checkout path</span>
              </div>

              <div className="mt-4">
                <div className="bwe-eyebrow">Marketplace listing</div>
                <h1 className="bwe-section-title mt-2 max-w-xl">
                  {productName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-2xl font-semibold text-white sm:text-3xl">
                    ${Number(product.price || 0).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={toggleSaveProduct}
                    disabled={saveBusy}
                    className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      saved
                        ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
                        : "border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                </div>
                {reviewSummary.count > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("reviews")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="bwe-focus-ring mt-2 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
                  >
                    <span className="text-[#D4AF37]">
                      {"★".repeat(Math.round(reviewSummary.averageRating))}
                      {"☆".repeat(5 - Math.round(reviewSummary.averageRating))}
                    </span>
                    <span>
                      {reviewSummary.averageRating.toFixed(1)} (
                      {reviewSummary.count} review
                      {reviewSummary.count === 1 ? "" : "s"})
                    </span>
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-white/50">
                    No reviews yet — be the first to review this listing.
                  </p>
                )}
              </div>

              <div className="mt-4 border-l border-white/10 pl-4">
                <p className="text-sm leading-6 text-gray-200">
                  {product.description ||
                    "Review the listing image, price, and checkout options for the current purchase details."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bwe-soft-tile p-3">
                  <p className="text-gray-400">Views</p>
                  <p className="font-semibold text-white">
                    {Number(product.views || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bwe-soft-tile p-3">
                  <p className="text-gray-400">Availability</p>
                  <p className="font-semibold text-white">
                    {availability}
                    {stockQuantity > 0 ? ` (${stockQuantity} left)` : ""}
                  </p>
                  {stockQuantity > 0 && stockQuantity <= 3 ? (
                    <p className="mt-1 text-xs text-yellow-200">
                      Only a few units left. Buyers are viewing this listing
                      now.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="bwe-soft-tile p-4 text-sm text-gray-200">
                  <p className="bwe-eyebrow">Seller</p>
                  {product?.seller?.id ? (
                    <Link
                      href={`/marketplace/seller/${encodeURIComponent(product.seller.id)}`}
                      className="mt-2 inline-block text-base font-bold text-white underline decoration-white/30 hover:text-[var(--accent)]"
                    >
                      {sellerName}
                    </Link>
                  ) : (
                    <p className="mt-2 text-base font-bold text-white">
                      {sellerName}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-white/68">{sellerTrust}</p>
                </div>
                <div className="bwe-soft-tile p-4 text-sm text-gray-200">
                  <p className="bwe-eyebrow">Business attribution</p>
                  <p className="mt-2 text-base font-bold text-white">
                    {businessName}
                  </p>
                  <p className="mt-1 text-sm text-white/68">
                    Canonical product and seller attribution are preserved for
                    this listing.
                  </p>
                </div>
              </div>

              <div className="mt-4 border-y border-white/8 py-4 text-sm text-gray-200">
                <p>
                  <span className="font-semibold text-white">Listing:</span>{" "}
                  {listingStatusLabel}
                  {product?.recentlyAdded ? " • Recently added" : ""}
                </p>
              </div>

              <p className="mt-3 text-xs text-gray-300">
                Next step: use{" "}
                <span className="font-semibold text-white">Buy Now</span> to
                place an order, or{" "}
                <span className="font-semibold text-white">
                  Ask Seller a Question
                </span>{" "}
                for fit, shipping, or product questions.
              </p>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-100">
                <p className="bwe-eyebrow text-[var(--accent)]">
                  How ordering works
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-200">
                  <li>
                    Black Wealth Exchange is the marketplace intermediary for
                    secure ordering.
                  </li>
                  <li>
                    Sold and shipped by{" "}
                    <span className="font-semibold text-white">
                      {sellerName}
                    </span>
                    .
                  </li>
                  <li>
                    Shipping is handled by the seller. Shipping cost and
                    delivery timing are provided by the seller at checkout or
                    via seller message.
                  </li>
                  <li>
                    After purchase, use order tracking and contact seller if you
                    need help.
                  </li>
                </ul>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-gray-200 sm:grid-cols-2">
                <div className="bwe-soft-tile p-3">
                  <p>
                    <span className="font-semibold text-white">
                      What this is:
                    </span>{" "}
                    {productName}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-white">
                      Who is selling:
                    </span>{" "}
                    {sellerName}
                  </p>
                </div>
                <div className="bwe-soft-tile p-3">
                  <p>
                    <span className="font-semibold text-white">Business:</span>{" "}
                    {businessName}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-white">
                      What to do next:
                    </span>{" "}
                    Buy now to checkout, or ask seller a question first.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <BuyNowButton
                    itemId={product._id}
                    amount={product.price}
                    type="product"
                    label="Buy now"
                    className="w-full rounded-full px-4 py-3 text-base font-black uppercase tracking-[0.12em]"
                  />
                  <Link
                    href={`/checkout?type=product&source=marketplace&itemId=${encodeURIComponent(product._id)}&productName=${encodeURIComponent(productName)}&amount=${encodeURIComponent(String(product.price || 0))}`}
                    className="bwe-cta-secondary bwe-focus-ring inline-flex w-full items-center justify-center px-4 py-3 text-center text-sm text-white/92"
                  >
                    Review order
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("contact-seller")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    disabled={!canContactSeller}
                    className="bwe-focus-ring w-full rounded-full border border-white/30 px-4 py-3 text-sm font-semibold text-white/90 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Contact seller
                  </button>
                  <Link
                    href="/marketplace/my-orders"
                    className="bwe-focus-ring inline-flex w-full items-center justify-center rounded-full border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 transition hover:bg-white/10"
                  >
                    Track My Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div id="contact-seller" className="bwe-soft-tile mt-6 p-4">
            <label className="mb-2 block text-sm font-semibold text-white">
              Message seller
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              placeholder="Ask about shipping, materials, fit, or delivery timing"
              className="bwe-textarea"
            />
            <button
              type="button"
              onClick={handleContactSeller}
              disabled={sendingMessage || !canContactSeller}
              className="bwe-focus-ring mt-3 w-full rounded-full border border-gold px-3 py-3 text-sm font-semibold text-gold transition enabled:hover:bg-gold enabled:hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingMessage ? "Sending..." : "Send Message"}
            </button>
            {!canContactSeller ? (
              <p className="mt-2 text-xs text-gray-400">
                Seller contact is not available for this listing yet.
              </p>
            ) : null}
            {messageState ? (
              <p className="mt-2 text-xs text-gray-300">{messageState}</p>
            ) : null}
          </div>

          <div id="reviews" className="bwe-soft-tile mt-6 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Customer reviews</h2>
              {reviewSummary.count > 0 ? (
                <span className="text-sm text-white/70">
                  {reviewSummary.averageRating.toFixed(1)} / 5 ·{" "}
                  {reviewSummary.count} review
                  {reviewSummary.count === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <label className="mb-2 block text-sm font-semibold text-white">
                Leave a review
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                    className="bwe-focus-ring text-2xl leading-none"
                  >
                    <span
                      className={
                        value <= reviewRating
                          ? "text-[#D4AF37]"
                          : "text-white/25"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Share how the product, seller, or delivery experience went (optional)"
                className="bwe-textarea mt-2"
              />
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="bwe-focus-ring mt-3 w-full rounded-full border border-gold px-3 py-3 text-sm font-semibold text-gold transition enabled:hover:bg-gold enabled:hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingReview ? "Saving..." : "Submit Review"}
              </button>
              {reviewState ? (
                <p className="mt-2 text-xs text-gray-300">{reviewState}</p>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-white/60">
                  No reviews yet for this listing.
                </p>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#D4AF37]">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {review.userName}
                      </span>
                      {review.verifiedPurchase ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Verified purchase
                        </span>
                      ) : null}
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm text-white/75">
                        {review.comment}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mx-auto mt-12 max-w-6xl">
            <h2 className="bwe-section-title mb-5">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item._id}
                  href={`/marketplace/product/${item._id}`}
                  className="bwe-soft-tile overflow-hidden transition hover:bg-white/[0.05]"
                >
                  <div className="relative w-full h-36 md:h-44">
                    <Image
                      src={item.imageUrl || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {item.category || "Other"}
                    </p>
                    <p className="text-sm font-semibold text-gold mt-1">
                      ${Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailPage;

function normalizeProductDocument(doc: any): Product | null {
  if (!doc) return null;
  const rawId = doc?._id;
  const _id =
    typeof rawId?.toString === "function"
      ? rawId.toString()
      : String(rawId || "");
  if (!_id) return null;

  const priceNumber = Number(doc?.price ?? 0);
  const stockQuantity = Number(doc?.stockQuantity ?? 0);
  const sellerDoc =
    doc?.seller && typeof doc.seller === "object" ? doc.seller : null;

  return {
    _id,
    name: String(doc?.name || "").trim() || "Marketplace item",
    description: typeof doc?.description === "string" ? doc.description : null,
    price: Number.isFinite(priceNumber) ? priceNumber : 0,
    category: String(doc?.category || "").trim() || "Other",
    imageUrl: typeof doc?.imageUrl === "string" ? doc.imageUrl : null,
    stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : 0,
    views: Number.isFinite(Number(doc?.views ?? 0))
      ? Number(doc?.views ?? 0)
      : 0,
    availability:
      typeof doc?.availability === "string" ? doc.availability : null,
    condition: typeof doc?.condition === "string" ? doc.condition : null,
    status: typeof doc?.status === "string" ? doc.status : null,
    isFeatured: Boolean(doc?.isFeatured),
    recentlyAdded: Boolean(doc?.recentlyAdded),
    activeListing:
      doc?.activeListing === true || hasPublicMarketplaceVisibility(doc),
    seller: sellerDoc
      ? {
          id:
            typeof sellerDoc?.id === "string"
              ? sellerDoc.id
              : typeof sellerDoc?._id?.toString === "function"
                ? sellerDoc._id.toString()
                : typeof doc?.sellerId === "string"
                  ? doc.sellerId
                  : null,
          name: getPublicMarketplaceSellerName(sellerDoc),
          joinedAt:
            typeof sellerDoc?.joinedAt === "string"
              ? sellerDoc.joinedAt
              : sellerDoc?.createdAt instanceof Date
                ? sellerDoc.createdAt.toISOString()
                : null,
          profileComplete:
            isPublicMarketplaceSellerProfileComplete(sellerDoc) ?? null,
          businessId:
            typeof sellerDoc?.businessId === "string"
              ? sellerDoc.businessId
              : null,
          businessName:
            typeof sellerDoc?.businessName === "string"
              ? sellerDoc.businessName
              : null,
        }
      : typeof doc?.sellerId === "string" || typeof doc?.sellerName === "string"
        ? {
            id: typeof doc?.sellerId === "string" ? doc.sellerId : null,
            name: typeof doc?.sellerName === "string" ? doc.sellerName : null,
            joinedAt: null,
            profileComplete: null,
            businessId:
              typeof doc?.businessId === "string" ? doc.businessId : null,
            businessName:
              typeof doc?.businessName === "string" ? doc.businessName : null,
          }
        : null,
  };
}

export const getServerSideProps: GetServerSideProps<
  ProductDetailPageProps
> = async (context) => {
  const rawId = context.params?.id;
  const requestedId = typeof rawId === "string" ? rawId.trim() : "";

  if (!requestedId) {
    return {
      props: {
        initialProduct: null,
        initialProductId: null,
      },
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());
    const products = db.collection("products");
    const sellers = db.collection("sellers");
    const businesses = db.collection("businesses");
    const now = new Date();

    const orFilters: any[] = [{ _id: requestedId }, { slug: requestedId }];
    if (ObjectId.isValid(requestedId)) {
      orFilters.unshift({ _id: new ObjectId(requestedId) });
    }

    const doc = await products.findOne({
      $and: [buildPublicMarketplaceVisibilityFilter(now), { $or: orFilters }],
    });

    if (!doc) {
      return {
        props: {
          initialProduct: null,
          initialProductId: requestedId,
        },
      };
    }

    let sellerDoc = null;
    let businessDoc = null;
    const sellerId = String(doc?.sellerId || "").trim();
    const businessId = String(doc?.businessId || "").trim();
    if (sellerId) {
      const sellerObjectIds = ObjectId.isValid(sellerId)
        ? [new ObjectId(sellerId)]
        : [];
      sellerDoc = await sellers.findOne({
        $or: [
          { userId: sellerId },
          ...(sellerObjectIds.length
            ? [{ _id: { $in: sellerObjectIds } }]
            : []),
        ],
      });
    }
    if (businessId) {
      const businessObjectIds = ObjectId.isValid(businessId)
        ? [new ObjectId(businessId)]
        : [];
      if (businessObjectIds.length) {
        businessDoc = await businesses.findOne({
          _id: { $in: businessObjectIds },
        });
      }
    }

    const initialProduct = normalizeProductDocument({
      ...doc,
      seller: sellerDoc
        ? {
            ...sellerDoc,
            _id:
              typeof sellerDoc?._id?.toString === "function"
                ? sellerDoc._id.toString()
                : sellerDoc?._id,
            businessId,
            businessName:
              String(
                businessDoc?.businessName ||
                  businessDoc?.business_name ||
                  businessDoc?.name ||
                  "",
              ).trim() || null,
          }
        : {
            id: sellerId || null,
            name: typeof doc?.sellerName === "string" ? doc.sellerName : null,
            businessId: businessId || null,
            businessName:
              String(
                businessDoc?.businessName ||
                  businessDoc?.business_name ||
                  businessDoc?.name ||
                  "",
              ).trim() || null,
          },
    });

    return {
      props: {
        initialProduct,
        initialProductId: requestedId,
      },
    };
  } catch (error) {
    console.error("Failed to SSR marketplace product:", error);
    return {
      props: {
        initialProduct: null,
        initialProductId: requestedId,
      },
    };
  }
};
