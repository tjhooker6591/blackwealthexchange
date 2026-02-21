// src/pages/api/admin/dashboard-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

function n(v: any) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // ---- Core collections ----
    const businesses = db.collection("businesses");
    const organizations = db.collection("organizations");
    const affiliatePayouts = db.collection("affiliatePayouts");
    const affiliates = db.collection("affiliates");
    const jobs = db.collection("jobs");
    const products = db.collection("products");
    const users = db.collection("users");
    const internApps = db.collection("intern_applications");

    // ---- Directory / Payments ----
    // Collection your webhook should write for directory approvals
    const directoryListings = db.collection("directory_listings");
    // Central payment ledger (recommended)
    const payments = db.collection("payments");

    // If you track consulting interest leads
    const consultingInterests = db.collection("consulting_interests");

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

      // Directory listing approval pipeline (what Admin should manage)
      pendingDirectoryListings,
      activeDirectoryListings,
      expiredDirectoryListings,

      // Paid directory purchases (what Stripe/webhook confirms)
      paidDirectoryPurchases,
      paidDirectoryPurchasesUnlinked,

      // Consulting leads
      consultingLeads,
    ] = await Promise.all([
      // Businesses
      businesses.countDocuments({ status: "pending" }),
      businesses.countDocuments({ status: "approved" }),
      businesses.countDocuments({ status: "rejected" }),
      businesses.countDocuments({}),

      // Organizations (mirrors business approval flow)
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

      // Directory listings (admin approval objects)
      // Use the status values you want; these are common defaults.
      directoryListings.countDocuments({
        status: { $in: ["pending", "pending_approval"] },
      }),
      directoryListings.countDocuments({ status: "active" }),
      directoryListings.countDocuments({
        status: { $in: ["expired", "inactive"] },
      }),

      // Payments fallback (paid directory purchases)
      payments.countDocuments({
        status: "paid",
        "metadata.type": "ad",
        "metadata.itemId": {
          $in: ["directory-standard", "directory-featured"],
        },
      }),

      // Paid but missing business link (the “paid but didn’t show” detector)
      payments.countDocuments({
        status: "paid",
        "metadata.type": "ad",
        "metadata.itemId": {
          $in: ["directory-standard", "directory-featured"],
        },
        $or: [
          { "metadata.businessId": { $exists: false } },
          { "metadata.businessId": null },
          { "metadata.businessId": "" },
        ],
      }),

      // Consulting leads (optional)
      consultingInterests.countDocuments({}),
    ]);

    const pendingApprovalsTotal =
      n(pendingBusinesses) +
      n(pendingOrganizations) +
      n(pendingJobs) +
      n(pendingProducts) +
      n(pendingDirectoryListings) +
      n(pendingPayouts);

    res.status(200).json({
      // Rollups
      pendingApprovalsTotal,

      // Businesses
      businesses: {
        pending: pendingBusinesses,
        approved: approvedBusinesses,
        rejected: rejectedBusinesses,
        total: totalBusinesses,
      },

      // Organizations
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

      // Directory
      directory: {
        pendingApprovals: pendingDirectoryListings,
        active: activeDirectoryListings,
        expired: expiredDirectoryListings,
        paidPurchases: paidDirectoryPurchases,
        paidUnlinked: paidDirectoryPurchasesUnlinked, // 🔥 key signal for missing admin records
      },

      // Users / interns
      totalUsers,
      internApplications,

      // Consulting
      consultingLeads,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
}
