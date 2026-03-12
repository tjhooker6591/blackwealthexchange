import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import BuyNowButton from "@/components/BuyNowButton";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";
import { canonicalUrl, getBaseUrl, truncateMeta } from "@/lib/seo";

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

type Props = {
  initialProduct: Product | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const rawId = Array.isArray(ctx.params?.id) ? ctx.params?.id[0] : ctx.params?.id;
  const id = typeof rawId === "string" ? rawId : "";

  if (!id) return { props: { initialProduct: null } };

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const products = db.collection("products");

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const doc: any = await products.findOne(query);

    if (!doc) return { props: { initialProduct: null } };

    const initialProduct: Product = {
      _id: String(doc._id),
      name: String(doc.name || "Product"),
      description: typeof doc.description === "string" ? doc.description : "",
      price: Number(doc.price || 0),
      category: String(doc.category || "Other"),
      imageUrl: typeof doc.imageUrl === "string" ? doc.imageUrl : "",
    };

    return { props: { initialProduct } };
  } catch {
    return { props: { initialProduct: null } };
  }
};

export default function ProductDetailPage({ initialProduct }: Props) {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [showModal, setShowModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (initialProduct) return;
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/get-product?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");

        const data = await res.json();
        setProduct(data?.product || null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, initialProduct]);

  useEffect(() => {
    if (!product) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("bwe:recent-products");
      const prev = raw ? JSON.parse(raw) : [];
      const next = [
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || "",
          category: product.category || "Other",
          ts: Date.now(),
        },
        ...(Array.isArray(prev) ? prev : []).filter((x: any) => x?._id !== product._id),
      ].slice(0, 8);
      window.localStorage.setItem("bwe:recent-products", JSON.stringify(next));
    } catch {}
  }, [product]);

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
            (p: Product) => p.category === product.category && p._id !== product._id,
          )
          .slice(0, 4);

        setRelatedProducts(related);
      } catch {
        setRelatedProducts([]);
      }
    };

    fetchRelated();
  }, [product]);

  const canonical = canonicalUrl(`/marketplace/product/${encodeURIComponent(String(id || initialProduct?._id || ""))}`);
  const title = product
    ? `${product.name} | Black-Owned Product Marketplace | Black Wealth Exchange`
    : "Product | Black Wealth Exchange Marketplace";
  const description = truncateMeta(
    product?.description ||
      `Shop ${product?.name || "Black-owned products"} on Black Wealth Exchange Marketplace.`,
  );
  const image = product?.imageUrl || "/placeholder.png";
  const base = getBaseUrl().replace(/\/$/, "");
  const absoluteImage = image.startsWith("http")
    ? image
    : `${base}${image.startsWith("/") ? image : `/${image}`}`;

  const productSchema = useMemo(
    () =>
      product
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description || "",
            image: [absoluteImage],
            category: product.category || "Other",
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: Number(product.price || 0).toFixed(2),
              availability: "https://schema.org/InStock",
              url: canonical,
            },
          }
        : null,
    [product, absoluteImage, canonical],
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Marketplace",
        item: canonicalUrl("/marketplace"),
      },
      { "@type": "ListItem", position: 3, name: product?.name || "Product", item: canonical },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white text-center py-20">
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
        </Head>
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white text-center py-20">
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
        </Head>
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={absoluteImage} />
      </Head>
      {productSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
            <h1 className="text-3xl font-bold text-gold mb-2">{product.name}</h1>

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
              <BuyNowButton itemId={product._id} amount={product.price} type="product" />

              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2.5 px-4 border border-gold text-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition"
              >
                Contact Seller
              </button>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <p>
                You do not need an account to purchase. If checkout is temporarily unavailable for this
                product, please try again shortly or use Contact Seller for more information.
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-white/75">
              <div className="font-semibold text-white">Trust & fulfillment</div>
              <ul className="mt-2 space-y-1 list-disc ml-4">
                <li>Payments are processed through secure checkout infrastructure.</li>
                <li>Shipping and returns are managed by the independent seller.</li>
                <li>Need policy details? Visit the <Link href="/trust" className="text-[#D4AF37] underline">BWE Trust Center</Link>.</li>
              </ul>
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
          <h2 className="text-2xl font-bold text-gold mb-6 text-center">You May Also Like</h2>

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
                  <p className="text-xs md:text-sm text-gray-400 mb-1 truncate">{item.category}</p>
                  <p className="text-sm md:text-md font-semibold text-gold">${item.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 px-4">
          <div className="bg-gray-900 border border-gold text-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold text-gold mb-4 text-center">Contact the Seller</h2>

            <p className="text-gray-300 mb-4 text-sm text-center">
              This is a placeholder message. In the future, this can show the seller’s contact email,
              messaging link, or seller profile.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-2 bg-gold text-black py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
