// src/pages/api/admin/dashboard-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";

function n(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toIso(value: any): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getCreatedAt(doc: any): string | null {
  return toIso(doc?.createdAt || doc?.joinedAt || doc?.dateCreated || null);
}

function isLikelyTestAccount(doc: any, email: string) {
  const lower = String(email || "").toLowerCase();
  return Boolean(
    doc?.isTest ||
    doc?.testAccount ||
    doc?.isInternal ||
    lower.endsWith("@bwe.local") ||
    lower.includes("+test") ||
    lower.includes("test@"),
  );
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
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const days7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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

    const joinSources = [
      { collection: "users", accountType: "user" },
      { collection: "businesses", accountType: "business" },
      { collection: "sellers", accountType: "seller" },
      { collection: "employers", accountType: "employer" },
      { collection: "organizations", accountType: "organization" },
      { collection: "affiliates", accountType: "affiliate" },
    ] as const;

    const joinRowsBySource = await Promise.all(
      joinSources.map(async ({ collection, accountType }) => {
        const docs = await db
          .collection(collection)
          .find({
            $or: [
              { createdAt: { $gte: days30Start } },
              { joinedAt: { $gte: days30Start } },
              { dateCreated: { $gte: days30Start } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(1000)
          .project({
            name: 1,
            fullName: 1,
            firstName: 1,
            lastName: 1,
            businessName: 1,
            companyName: 1,
            storeName: 1,
            email: 1,
            createdAt: 1,
            joinedAt: 1,
            dateCreated: 1,
            status: 1,
            active: 1,
            isActive: 1,
            verified: 1,
            isVerified: 1,
            emailVerified: 1,
            isAdmin: 1,
            accountType: 1,
            role: 1,
            isTest: 1,
            testAccount: 1,
            isInternal: 1,
          })
          .toArray();

        const [todayCount, last7DaysCount, last30DaysCount] = await Promise.all(
          [
            db
              .collection(collection)
              .countDocuments({ createdAt: { $gte: todayStart } }),
            db
              .collection(collection)
              .countDocuments({ createdAt: { $gte: days7Start } }),
            db
              .collection(collection)
              .countDocuments({ createdAt: { $gte: days30Start } }),
          ],
        );

        const rows = docs
          .map((doc: any) => {
            const email = String(doc?.email || "")
              .trim()
              .toLowerCase();
            const createdAt = getCreatedAt(doc);
            const fullName =
              doc?.businessName ||
              doc?.companyName ||
              doc?.storeName ||
              doc?.fullName ||
              doc?.name ||
              [doc?.firstName, doc?.lastName].filter(Boolean).join(" ") ||
              "(no name)";
            const verified =
              doc?.verified ?? doc?.isVerified ?? Boolean(doc?.emailVerified);
            const status =
              typeof doc?.status === "string"
                ? doc.status
                : doc?.isActive === false || doc?.active === false
                  ? "inactive"
                  : "active";

            return {
              _id: String(doc?._id || ""),
              name: String(fullName || "").trim() || "(no name)",
              email,
              accountType,
              sourceCollection: collection,
              createdAt,
              status,
              isVerified: Boolean(verified),
              isAdmin: Boolean(
                doc?.isAdmin ||
                doc?.role === "admin" ||
                doc?.accountType === "admin",
              ),
              isTest: isLikelyTestAccount(doc, email),
              isActive:
                typeof doc?.isActive === "boolean"
                  ? doc.isActive
                  : typeof doc?.active === "boolean"
                    ? doc.active
                    : status !== "inactive" &&
                      status !== "rejected" &&
                      status !== "deleted",
            };
          })
          .filter((row) => {
            if (!row.createdAt) return false;
            return new Date(row.createdAt).getTime() >= days30Start.getTime();
          });

        return {
          sourceCollection: collection,
          accountType,
          counts: {
            today: todayCount,
            last7Days: last7DaysCount,
            last30Days: last30DaysCount,
          },
          rows,
        };
      }),
    );

    const recentJoins = joinRowsBySource
      .flatMap((s) => s.rows)
      .sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 2500);

    const joinsByDayMap = new Map<string, any[]>();
    for (const row of recentJoins) {
      const dayKey = row.createdAt
        ? new Date(row.createdAt).toISOString().slice(0, 10)
        : "unknown";
      const arr = joinsByDayMap.get(dayKey) || [];
      arr.push(row);
      joinsByDayMap.set(dayKey, arr);
    }

    const dailyBuckets = Array.from(joinsByDayMap.entries())
      .sort((a, b) => {
        if (a[0] === "unknown") return 1;
        if (b[0] === "unknown") return -1;
        return b[0].localeCompare(a[0]);
      })
      .map(([day, rows]) => {
        const byAccountType = rows.reduce(
          (acc: Record<string, number>, row: any) => {
            const k = String(row.accountType || "unknown");
            acc[k] = (acc[k] || 0) + 1;
            return acc;
          },
          {},
        );

        return {
          day,
          total: rows.length,
          byAccountType,
          rows,
        };
      });

    const recentJoinSummary = joinRowsBySource.reduce(
      (acc: any, source) => {
        acc.today += n(source.counts.today);
        acc.last7Days += n(source.counts.last7Days);
        acc.last30Days += n(source.counts.last30Days);
        acc.byAccountType[source.accountType] = source.counts;
        return acc;
      },
      {
        today: 0,
        last7Days: 0,
        last30Days: 0,
        byAccountType: {} as Record<
          string,
          { today: number; last7Days: number; last30Days: number }
        >,
      },
    );

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

      recentJoins: {
        windowDays: 30,
        summary: recentJoinSummary,
        bySource: joinRowsBySource.map((s) => ({
          sourceCollection: s.sourceCollection,
          accountType: s.accountType,
          counts: s.counts,
        })),
        dailyBuckets,
        rows: recentJoins,
      },
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
}
