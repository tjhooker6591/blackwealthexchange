"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import BuyNowButton from "@/components/BuyNowButton";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  stockQuantity?: number;
  views?: number;
  availability?: string;
  condition?: string;
  status?: string;
  isFeatured?: boolean;
  recentlyAdded?: boolean;
  activeListing?: boolean;
  seller?: {
    id?: string | null;
    name?: string;
    joinedAt?: string | null;
    profileComplete?: boolean;
  };
}

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messageState, setMessageState] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const trackMarketplaceProductEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/marketplace/product/[id]",
      section: "marketplace_product_detail",
      productId: typeof id === "string" ? id : null,
      entityId: typeof id === "string" ? id : null,
      entityType: "product",
      ...extras,
    });
  };

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/get-product?id=${id}`);
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
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const stockQuantity = Number(product?.stockQuantity ?? 0);
  const availability =
    product?.availability ||
    (stockQuantity <= 0
      ? "Out of stock"
      : stockQuantity <= 3
        ? "Low stock"
        : "In stock");

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
      <div className="min-h-screen bg-black text-white text-center py-20">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white text-center py-20">
        This listing is unavailable right now.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/marketplace"
          className="inline-flex items-center rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-black transition"
        >
          Back to Marketplace
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-6 rounded-2xl border border-gold/30 bg-gray-900 p-5 shadow-xl md:grid-cols-2 md:p-8">
          <div className="relative w-full h-72 md:h-[540px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <Image
              src={product.imageUrl || "/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-gray-200">
                {product.category || "Other"}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 ${availabilityClass}`}
              >
                {availability}
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-gray-200">
                {product.condition || "New"}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold text-gold">
              {product.name}
            </h1>
            <p className="mt-2 text-3xl font-bold text-white">
              ${Number(product.price || 0).toFixed(2)}
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm leading-6 text-gray-200">
                {product.description ||
                  "No description provided for this item yet."}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-gray-400">Views</p>
                <p className="font-semibold text-white">
                  {Number(product.views || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-gray-400">Availability</p>
                <p className="font-semibold text-white">
                  {availability}
                  {stockQuantity > 0 ? ` (${stockQuantity} left)` : ""}
                </p>
                {stockQuantity > 0 && stockQuantity <= 3 ? (
                  <p className="mt-1 text-xs text-yellow-200">Only a few units left. Buyers are viewing this listing now.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
              <p>
                <span className="font-semibold text-white">Seller:</span>{" "}
                {product?.seller?.name || "Verified BWE Marketplace Seller"}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-white">
                  Seller profile:
                </span>{" "}
                {product?.seller?.profileComplete
                  ? "Verified profile details on file"
                  : "Basic profile on file"}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-gray-100">
              <p className="font-semibold text-gold">How purchasing works</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-200">
                <li>Black Wealth Exchange is the marketplace intermediary for secure ordering.</li>
                <li>The seller fulfills the order and handles shipment/delivery updates.</li>
                <li>After purchase, use order tracking and contact seller if you need help.</li>
              </ul>
            </div>

            <div className="mt-4 space-y-2">
              <BuyNowButton
                itemId={product._id}
                amount={product.price}
                type="product"
                label="Buy Now"
                className="w-full rounded-xl bg-gold px-4 py-3 text-base font-bold text-black shadow-md transition hover:bg-yellow-400"
              />
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("contact-seller")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="w-full rounded-xl border border-gold px-4 py-3 text-sm font-semibold text-gold hover:bg-gold hover:text-black transition"
              >
                Contact Seller
              </button>
              <Link
                href="/marketplace/my-orders"
                className="block w-full rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-white/10 transition"
              >
                Track My Orders
              </Link>
            </div>
          </div>
        </div>

        <div
          id="contact-seller"
          className="mt-6 rounded-xl border border-white/10 bg-gray-900 p-4"
        >
          <label className="block text-sm font-semibold text-gold mb-2">
            Message seller
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={3}
            placeholder="Ask about shipping, materials, fit, or delivery timing"
            className="w-full rounded-lg border border-white/20 bg-black/40 p-2 text-sm text-white focus:outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={handleContactSeller}
            disabled={sendingMessage}
            className="mt-3 w-full rounded-lg border border-gold px-3 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-black transition disabled:opacity-60"
          >
            {sendingMessage ? "Sending..." : "Send Message"}
          </button>
          {messageState ? (
            <p className="mt-2 text-xs text-gray-300">{messageState}</p>
          ) : null}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto mt-12">
          <h2 className="text-2xl font-bold text-gold mb-5">
            You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((item) => (
              <Link
                key={item._id}
                href={`/marketplace/product/${item._id}`}
                className="rounded-xl border border-white/10 bg-gray-900 overflow-hidden hover:border-gold/50 transition"
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
  );
};

export default ProductDetailPage;
