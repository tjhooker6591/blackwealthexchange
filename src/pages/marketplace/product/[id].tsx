"use client";

import React, { useEffect, useState } from "react";
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
  seller?: {
    id?: string | null;
    name?: string;
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

  // Fetch single product
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/get-product?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");

        const data = await res.json();
        const loadedProduct = data?.product || null;
        setProduct(loadedProduct);
        if (loadedProduct?._id) {
          trackMarketplaceProductEvent("product_detail_viewed", {
            ctaId: "product_detail_view",
            ctaLabel: "Product Detail Viewed",
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch related products
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;

      try {
        const res = await fetch(
          "/api/marketplace/get-products?page=1&limit=100&category=All",
        );
        if (!res.ok) throw new Error("Failed to fetch related products");

        const all = await res.json();
        const related = ((all?.products || []) as Product[])
          .filter(
            (p: Product) =>
              p.category === product.category && p._id !== product._id,
          )
          .slice(0, 4);

        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching related products:", error);
        setRelatedProducts([]);
      }
    };

    fetchRelated();
  }, [product]);

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
        setMessageState(data?.error || "Could not send message right now.");
        return;
      }

      setMessageText("");
      setMessageState(
        data?.message ||
          "Message sent. BWE will route this to the seller.",
      );
    } catch {
      setMessageState("Could not send message right now.");
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
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-5xl mx-auto bg-gray-900 border border-gold rounded-xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative w-full h-72 md:h-[500px] overflow-hidden rounded-lg border border-white/10 bg-black/30">
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
            <h1 className="text-3xl font-bold text-gold mb-2">
              {product.name}
            </h1>

            <p className="text-sm text-gray-400 mb-2">
              Category: {product.category || "Other"}
            </p>

            <p className="text-2xl font-semibold text-gold mb-4">
              ${product.price.toFixed(2)}
            </p>

            <p className="text-gray-300 mb-6">
              {product.description || "No description provided."}
            </p>

            <div className="space-y-3">
              <BuyNowButton
                itemId={product._id}
                amount={product.price}
                type="product"
                label="Buy Now"
              />

              <Link
                href="/marketplace/my-orders"
                className="block w-full py-2.5 px-4 border border-gold text-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition text-center"
              >
                View My Orders
              </Link>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300 space-y-3">
              <p>
                <span className="font-semibold text-white">Sold by:</span>{" "}
                {product?.seller?.name || "Verified BWE Marketplace Seller"}
              </p>
              <p>
                <span className="font-semibold text-white">
                  How fulfillment works:
                </span>{" "}
                Black Wealth Exchange processes payment and routes your order to
                the seller for fulfillment.
              </p>
              <p>
                <span className="font-semibold text-white">
                  Shipping responsibility:
                </span>{" "}
                The seller is responsible for packaging, shipping, delivery
                timing, and post-purchase shipping updates.
              </p>
              <p>
                <span className="font-semibold text-white">Need to contact seller?</span>{" "}
                Use the secure marketplace contact form below. BWE mediates the
                channel, no direct personal contact details are exposed.
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
              <label className="block text-sm font-semibold text-gold mb-2">
                Message seller (mediated by BWE)
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                placeholder="Ask about shipping, product details, or availability"
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
        </div>

        <div className="text-center mt-10">
          <Link href="/marketplace">
            <button className="px-6 py-2 bg-transparent text-gold border border-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition">
              🔙 Back to Marketplace
            </button>
          </Link>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gold mb-6 text-center">
            You May Also Like
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((item) => (
              <Link
                key={item._id}
                href={`/marketplace/product/${item._id}`}
                className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:scale-[1.02] transition-transform"
              >
                <div className="relative w-full h-36 sm:h-44 md:h-48">
                  <Image
                    src={item.imageUrl || "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>

                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-lg font-bold text-white mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400 mb-1 truncate">
                    {item.category}
                  </p>
                  <p className="text-sm md:text-md font-semibold text-gold">
                    ${item.price.toFixed(2)}
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
