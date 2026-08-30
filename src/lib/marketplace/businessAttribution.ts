import { ObjectId } from "mongodb";

function normalizeId(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === "object" && (value as any)?._bsontype === "ObjectId") {
    return String(value);
  }
  if (typeof value === "object") {
    const v = value as any;
    const maybe = v?.$oid || v?.oid || v?._id;
    if (typeof maybe === "string" && maybe.trim()) return maybe.trim();
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export type MarketplaceBusinessAttribution = {
  businessId: string | null;
  source: "product.businessId" | "seller.businessId" | "conflict" | "missing";
  deterministic: boolean;
};

export function resolveCanonicalMarketplaceBusinessId(input: {
  product?: Record<string, any> | null;
  seller?: Record<string, any> | null;
}): MarketplaceBusinessAttribution {
  const productBusinessId =
    normalizeId(input.product?.businessId) ||
    normalizeId(input.product?.business_id);
  const sellerBusinessId =
    normalizeId(input.seller?.businessId) ||
    normalizeId(input.seller?.business_id);

  if (
    productBusinessId &&
    sellerBusinessId &&
    productBusinessId !== sellerBusinessId
  ) {
    return {
      businessId: null,
      source: "conflict",
      deterministic: false,
    };
  }

  if (productBusinessId) {
    return {
      businessId: productBusinessId,
      source: "product.businessId",
      deterministic: true,
    };
  }

  if (sellerBusinessId) {
    return {
      businessId: sellerBusinessId,
      source: "seller.businessId",
      deterministic: true,
    };
  }

  return {
    businessId: null,
    source: "missing",
    deterministic: false,
  };
}
