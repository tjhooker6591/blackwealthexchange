// src/pages/api/admin/dashboard-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";

function n(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const DIRECTORY_ITEM_IDS = [
  "directory-standard",
  "directory-featured",
] as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const adminSession = await requireAdminFromRequest(req, res);
  if (!adminSession) return;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    // ---- Core collections ----
    const businesses = db.collection("businesses");
    const organizations = db.collection("organizations");
    const affiliatePayouts = db.collection("affiliatePayouts");
    const affiliates = db.collection("affiliates");
    const jobs = db.collection("jobs");
    const products = db.collection("products");
    const users = db.collection("users");
    const internApps = db.collection("intern_applications");
    const consultingInterests = db.collection("consulting_interests");

    // ---- Directory / Payments ----
    const directoryListings = db.collection("directory_listings");
    const payments = db.collection("payments");
    const adPurchases = db.collection("ad_purchases");

    const [
      // Businesses
      pendingBusinesses,
      approvedBusinesses,
      rejectedBusinesses,
      totalBusinesses,

      // Organizations
      pendingOrganizations,
      approvedOrganizations,
      rejectedOrganizations,
      totalOrganizations,

      // Affiliate payouts + affiliates
      pendingPayouts,
      activeAffiliates,

      // Jobs + products
      pendingJobs,
      pendingProducts,

      // Users + interns
      totalUsers,
      internApplications,

      // Directory listing approval / activation pipeline
      pendingDirectoryListings,
      activeDirectoryListings,
      expiredDirectoryListings,
      totalDirectoryListings,

      // ad_purchases (new webhook tracking)
      adPurchasesDirPaidCount,
      adPurchasesDirPaidUnlinkedCount,

      // payments (fallback / reconciliation)
      paymentsDirPaidCount,
      paymentsDirPaidUnlinkedCount,

      // Consulting leads
      consultingLeads,

      // Revenue aggregations (new + fallback)
      adPurchasesDirRevenueAgg,
      paymentsDirRevenueAgg,
    ] = await Promise.all([
      // Businesses
      businesses.countDocuments({ status: "pending" }),
      businesses.countDocuments({ status: "approved" }),
      businesses.countDocuments({ status: "rejected" }),
      businesses.countDocuments({}),

      // Organizations (separate from businesses)
      organizations.countDocuments({ status: "pending" }),
      organizations.countDocuments({ status: "approved" }),
      organizations.countDocuments({ status: "rejected" }),
      organizations.countDocuments({}),

      // Affiliate payouts
      affiliatePayouts.countDocuments({ status: "pending" }),

      // Active affiliates
      affiliates.countDocuments({ status: "active" }),

      // Jobs & products
      jobs.countDocuments({ status: "pending" }),
      products.countDocuments({ status: "pending" }),

      // Users
      users.countDocuments({}),

      // Intern applications
      internApps.countDocuments({}),

      // Directory listings (admin-managed listing records)
      directoryListings.countDocuments({
        status: { $in: ["pending", "pending_approval"] },
      }),

      // Active directory listings:
      // - status active
      // - expiresAt in future OR missing (older records)
      directoryListings.countDocuments({
        status: "active",
        $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }],
      }),

      // Expired directory listings:
      // - explicit expired/inactive
      // - OR active but expiresAt already passed
      directoryListings.countDocuments({
        $or: [
          { status: { $in: ["expired", "inactive"] } },
          { status: "active", expiresAt: { $lte: now } },
        ],
      }),

      directoryListings.countDocuments({}),

      // ad_purchases: paid directory purchases (new webhook writes here)
      adPurchases.countDocuments({
        type: "ad",
        status: "paid",
        itemId: { $in: [...DIRECTORY_ITEM_IDS] },
      }),

      // ad_purchases: paid but not linked / needs attention
      adPurchases.countDocuments({
        type: "ad",
        status: "paid",
        itemId: { $in: [...DIRECTORY_ITEM_IDS] },
        $or: [
          { needsAttention: true },
          {
            fulfillmentStatus: {
              $in: ["needs_business_link", "pending_admin_fulfillment"],
            },
          },
          { businessId: { $exists: false } },
          { businessId: null },
          { businessId: "" },
        ],
      }),

      // payments fallback: paid directory purchases
      payments.countDocuments({
        status: "paid",
        "metadata.type": "ad",
        "metadata.itemId": { $in: [...DIRECTORY_ITEM_IDS] },
      }),

      // payments fallback: paid but missing business link
      payments.countDocuments({
        status: "paid",
        "metadata.type": "ad",
        "metadata.itemId": { $in: [...DIRECTORY_ITEM_IDS] },
        $or: [
          { "metadata.businessId": { $exists: false } },
          { "metadata.businessId": null },
          { "metadata.businessId": "" },
        ],
      }),

      // Consulting leads (optional)
      consultingInterests.countDocuments({}),

      // Revenue from ad_purchases (preferred; amountCents)
      adPurchases
        .aggregate([
          {
            $match: {
              type: "ad",
              status: "paid",
              itemId: { $in: [...DIRECTORY_ITEM_IDS] },
            },
          },
          {
            $group: {
              _id: null,
              totalCents: { $sum: { $ifNull: ["$amountCents", 0] } },
            },
          },
        ])
        .toArray(),

      // Revenue fallback from payments (amountCents or amount)
      payments
        .aggregate([
          {
            $match: {
              status: "paid",
              "metadata.type": "ad",
              "metadata.itemId": { $in: [...DIRECTORY_ITEM_IDS] },
            },
          },
          {
            $group: {
              _id: null,
              totalCents: {
                $sum: {
                  $ifNull: ["$amountCents", { $ifNull: ["$amount", 0] }],
                },
              },
            },
          },
        ])
        .toArray(),
    ]);

    // Prefer ad_purchases (new webhook flow). Fallback to payments if ad_purchases not populated yet.
    const paidDirectoryPurchases =
      n(adPurchasesDirPaidCount) > 0
        ? n(adPurchasesDirPaidCount)
        : n(paymentsDirPaidCount);

    const paidDirectoryPurchasesUnlinked =
      n(adPurchasesDirPaidUnlinkedCount) > 0
        ? n(adPurchasesDirPaidUnlinkedCount)
        : n(paymentsDirPaidUnlinkedCount);

    const dirRevenueCentsFromAdPurchases = n(
      adPurchasesDirRevenueAgg?.[0]?.totalCents,
    );
    const dirRevenueCentsFromPayments = n(
      paymentsDirRevenueAgg?.[0]?.totalCents,
    );

    const directoryRevenueCents =
      dirRevenueCentsFromAdPurchases > 0
        ? dirRevenueCentsFromAdPurchases
        : dirRevenueCentsFromPayments;

    // UI currently formats directoryRevenue as dollars, so return dollars too.
    const directoryRevenue = directoryRevenueCents / 100;

    const pendingApprovalsTotal =
      n(pendingBusinesses) +
      n(pendingOrganizations) +
      n(pendingJobs) +
      n(pendingProducts) +
      n(pendingDirectoryListings) +
      n(pendingPayouts);

    return res.status(200).json({
      // Rollups
      pendingApprovalsTotal,

      // Businesses (SEPARATE)
      businesses: {
        pending: pendingBusinesses,
        approved: approvedBusinesses,
        rejected: rejectedBusinesses,
        total: totalBusinesses,
      },

      // Organizations (SEPARATE)
      organizations: {
        pending: pendingOrganizations,
        approved: approvedOrganizations,
        rejected: rejectedOrganizations,
        total: totalOrganizations,
      },

      // Affiliates
      affiliates: {
        active: activeAffiliates,
        pendingPayouts,
      },

      // Jobs & products
      jobs: { pending: pendingJobs },
      products: { pending: pendingProducts },

      // Directory / Listing health
      directory: {
        pendingApprovals: pendingDirectoryListings,
        active: activeDirectoryListings,
        expired: expiredDirectoryListings,
        paidPurchases: paidDirectoryPurchases,
        paidUnlinked: paidDirectoryPurchasesUnlinked, // key signal
      },

      // Optional legacy fields (helps older dashboard components if any still use them)
      pendingBusinesses,
      pendingOrganizations,
      pendingPayouts,
      activeAffiliates,
      pendingJobs,
      pendingProducts,
      pendingListings: pendingDirectoryListings,
      totalDirectoryListings,
      directoryRevenue,

      // Users / interns
      totalUsers,
      internApplications,

      // Consulting
      consultingLeads,

      // Extra debug-friendly values (safe to keep)
      directoryRevenueCents,
      sources: {
        directoryPurchasesSource:
          n(adPurchasesDirPaidCount) > 0 ? "ad_purchases" : "payments",
      },
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
}
