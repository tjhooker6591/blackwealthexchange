import type { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import {
  buildPublicMarketplaceVisibilityFilter,
  getPublicMarketplaceSellerName,
  isPublicMarketplaceSellerProfileComplete,
} from "@/lib/marketplace/publicCatalog";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

type StorefrontProduct = {
  _id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
};

type SellerStorefrontProps = {
  sellerId: string | null;
  sellerName: string | null;
  storeDescription: string | null;
  website: string | null;
  logoUrl: string | null;
  joinedAt: string | null;
  profileComplete: boolean;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  products: StorefrontProduct[];
};

function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function SellerStorefrontPage({
  sellerId,
  sellerName,
  storeDescription,
  website,
  logoUrl,
  joinedAt,
  profileComplete,
  productCount,
  averageRating,
  reviewCount,
  products,
}: SellerStorefrontProps) {
  if (!sellerId) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-bold text-gold">Seller not found</h1>
          <p className="mt-2 text-sm text-white/80">
            This seller storefront is unavailable.
          </p>
          <Link
            href="/marketplace"
            className="mt-5 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const title = `${sellerName} | Seller Storefront | Black Wealth Exchange`;
  const description = truncateMeta(
    storeDescription ||
      `Shop products from ${sellerName} on the Black Wealth Exchange marketplace.`,
  );
  const canonical = canonicalUrl(`/marketplace/seller/${sellerId}`);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-[var(--surface-0)] py-8 text-white">
        <div className="bwe-section-wrap max-w-6xl">
          <Link
            href="/marketplace"
            className="bwe-open-link bwe-focus-ring inline-flex items-center"
          >
            Back to Marketplace
          </Link>

          <div className="mt-4 flex flex-wrap items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            {logoUrl ? (
              <div className="relative h-20 w-20 flex-none overflow-hidden rounded-full border border-white/10 bg-black/40">
                <Image
                  src={logoUrl}
                  alt={sellerName || "Seller"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 flex-none items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-bold text-white/60">
                {(sellerName || "S").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="bwe-section-title">{sellerName}</h1>
                {profileComplete ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                    Active seller profile
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span>
                  {productCount} product{productCount === 1 ? "" : "s"}
                </span>
                {reviewCount > 0 ? (
                  <span className="text-[#D4AF37]">
                    {"★".repeat(Math.round(averageRating))}
                    {"☆".repeat(5 - Math.round(averageRating))}{" "}
                    {averageRating.toFixed(1)} ({reviewCount} review
                    {reviewCount === 1 ? "" : "s"})
                  </span>
                ) : null}
                {joinedAt ? (
                  <span>
                    Selling on BWE since{" "}
                    {new Date(joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
              </div>

              {storeDescription ? (
                <p className="mt-3 max-w-2xl text-sm text-white/75">
                  {storeDescription}
                </p>
              ) : null}

              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-[var(--accent)] underline"
                >
                  Visit seller website
                </a>
              ) : null}
            </div>
          </div>

          <h2 className="bwe-section-title mb-4 mt-8">
            Products from {sellerName}
          </h2>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              This seller has no active listings right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.map((item) => (
                <Link
                  key={item._id}
                  href={`/marketplace/product/${item._id}`}
                  className="bwe-soft-tile overflow-hidden transition hover:bg-white/[0.05]"
                >
                  <div className="relative h-36 w-full md:h-44">
                    <Image
                      src={item.imageUrl || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-white">
                      {item.name}
                    </h3>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {item.category || "Other"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gold">
                      ${Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  SellerStorefrontProps
> = async (context) => {
  const rawId = context.params?.id;
  const requestedId = typeof rawId === "string" ? rawId.trim() : "";

  const empty: SellerStorefrontProps = {
    sellerId: null,
    sellerName: null,
    storeDescription: null,
    website: null,
    logoUrl: null,
    joinedAt: null,
    profileComplete: false,
    productCount: 0,
    averageRating: 0,
    reviewCount: 0,
    products: [],
  };

  if (!requestedId) {
    return { props: empty };
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());

    const sellerOr: any[] = [{ userId: requestedId }];
    if (ObjectId.isValid(requestedId)) {
      sellerOr.push({ _id: new ObjectId(requestedId) });
    }
    const seller = await db.collection("sellers").findOne({ $or: sellerOr });

    if (!seller) {
      return { props: empty };
    }

    const canonicalSellerId = String(seller._id);
    const now = new Date();

    const products = await db
      .collection("products")
      .find({
        $and: [
          buildPublicMarketplaceVisibilityFilter(now),
          {
            $or: [
              { sellerId: canonicalSellerId },
              { sellerId: String(seller.userId || "") },
            ],
          },
        ],
      } as any)
      .project({ _id: 1, name: 1, price: 1, imageUrl: 1, category: 1 })
      .limit(48)
      .toArray();

    const productIds = products.map((p: any) => String(p._id));
    const reviews = productIds.length
      ? await db
          .collection("product_reviews")
          .find({ productId: { $in: productIds } } as any)
          .project({ rating: 1 })
          .toArray()
      : [];

    const ratings = reviews.map((r: any) => Number(r.rating) || 0);
    const reviewCount = ratings.length;
    const averageRating = reviewCount
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / reviewCount) * 10) / 10
      : 0;

    return {
      props: {
        sellerId: canonicalSellerId,
        sellerName: getPublicMarketplaceSellerName(seller) || "BWE Seller",
        storeDescription: s(seller.storeDescription) || null,
        website: s(seller.website) || null,
        logoUrl: s(seller.logoUrl) || null,
        joinedAt:
          seller.joinedAt instanceof Date
            ? seller.joinedAt.toISOString()
            : typeof seller.joinedAt === "string"
              ? seller.joinedAt
              : seller.createdAt instanceof Date
                ? seller.createdAt.toISOString()
                : typeof seller.createdAt === "string"
                  ? seller.createdAt
                  : null,
        profileComplete: isPublicMarketplaceSellerProfileComplete(seller),
        productCount: products.length,
        averageRating,
        reviewCount,
        products: products.map((p: any) => ({
          _id: String(p._id),
          name: s(p.name) || "Marketplace item",
          price: Number(p.price) || 0,
          imageUrl: s(p.imageUrl) || null,
          category: s(p.category) || "Other",
        })),
      },
    };
  } catch (error) {
    console.error("Failed to load seller storefront:", error);
    return { props: empty };
  }
};
