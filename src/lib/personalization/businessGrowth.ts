// src/lib/personalization/businessGrowth.ts
//
// P4-03 Business Growth Command Center.
//
// A real-data growth read model for a business owner/representative,
// composed from Business360 (identity/directory/ownership/seller/commerce)
// and the verified economic activity ledger (bmev_records via
// resolveBusinessEconomicActivity360). No estimates or placeholder metrics
// -- every number here traces back to an authoritative collection.

import type { Db } from "mongodb";
import { resolveBusiness360 } from "@/lib/business360";
import { resolveBusinessEconomicActivity360 } from "@/lib/economicActivity360";

export type GrowthAction = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type BusinessGrowthResult =
  | {
      ok: true;
      businessId: string;
      name: string;
      claimed: boolean;
      listingTier: string | null;
      profileViews: number;
      searchAppearances: number;
      recentEventTypes: string[];
      verifiedRevenueCents: number;
      transactionCount: number;
      latestTransactionAt: string | null;
      productCount: number;
      publishedProductCount: number;
      payoutReadySellerCount: number;
      linkedOrderCount: number;
      advertisingRequestCount: number;
      nextActions: GrowthAction[];
    }
  | { ok: false; code: string; message: string };

export async function resolveBusinessGrowthCommandCenter(
  db: Db,
  input: { businessId: string },
): Promise<BusinessGrowthResult> {
  const business360 = await resolveBusiness360(db, {
    businessId: input.businessId,
    sections: [
      "identity",
      "directory",
      "ownership",
      "seller",
      "commerce",
      "advertising",
      "activity",
    ],
  });

  if (!business360.ok) {
    return {
      ok: false,
      code: business360.code,
      message: business360.message,
    };
  }

  const economic = await resolveBusinessEconomicActivity360(
    db,
    { queryCount: 0 },
    { businessId: input.businessId },
  );

  const actions: GrowthAction[] = [];

  const claimed =
    business360.ownership.data.claimState === "ownership_verified" ||
    business360.ownership.data.verifiedRepresentativeUserIds.length > 0;
  if (!claimed) {
    actions.push({
      id: "claim_business",
      title: "Claim your business listing",
      body: "Verified businesses get priority visibility in search and directory results.",
      href: `/business/${encodeURIComponent(
        business360.identity.data.publicRoute ||
          business360.identity.data.alias ||
          business360.identity.data.businessId,
      )}`,
      cta: "Start verification",
    });
  }

  if (business360.seller.state !== "LINKED") {
    actions.push({
      id: "become_seller",
      title: "Start selling on BWE Marketplace",
      body: "List products to reach BWE members directly.",
      href: "/marketplace/become-a-seller",
      cta: "Become a seller",
    });
  } else if (business360.seller.data.publishedProductCount === 0) {
    actions.push({
      id: "add_products",
      title: "Publish your first product",
      body: "Your seller account is set up but has no live listings yet.",
      href: "/marketplace/add-products",
      cta: "Add products",
    });
  }

  if (business360.advertising.data.advertisingRequestCount === 0) {
    actions.push({
      id: "advertise",
      title: "Get discovered faster",
      body: "Sponsored placement increases directory and search visibility.",
      href: "/advertise-with-us",
      cta: "Explore advertising",
    });
  }

  if (economic.transactionCount === 0) {
    actions.push({
      id: "no_revenue_yet",
      title: "No verified sales yet",
      body: "Once a customer completes a purchase, revenue will appear here automatically.",
      href: "/marketplace/dashboard",
      cta: "View seller dashboard",
    });
  }

  return {
    ok: true,
    businessId: business360.identity.data.businessId,
    name: business360.identity.data.name,
    claimed,
    listingTier: business360.directory.data.listingTier,
    profileViews: business360.activity.data.flowEventCount,
    searchAppearances: business360.activity.data.searchEventCount,
    recentEventTypes: business360.activity.data.recentEventTypes,
    verifiedRevenueCents: economic.verifiedRevenueCents,
    transactionCount: economic.transactionCount,
    latestTransactionAt: economic.latestTransactionAt,
    productCount: business360.seller.data.totalProductCount,
    publishedProductCount: business360.seller.data.publishedProductCount,
    payoutReadySellerCount: business360.seller.data.payoutReadySellerCount,
    linkedOrderCount: business360.commerce.data.linkedOrderCount,
    advertisingRequestCount:
      business360.advertising.data.advertisingRequestCount,
    nextActions: actions.slice(0, 4),
  };
}
