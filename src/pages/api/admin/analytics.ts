// src/pages/api/admin/analytics.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";
import { getMongoDbName } from "@/lib/env";

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function monthlyGrowth(
  db: any,
  collectionName: string,
  countFieldName: string,
) {
  const agg = await db
    .collection(collectionName)
    .aggregate([
      // avoid aggregation errors if some docs are missing/invalid createdAt
      { $match: { createdAt: { $type: "date" } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
    .toArray();

  return agg.map((row: any) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
    [countFieldName]: row.count,
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const admin = getAdminDecodedFromRequest(req);
  if (!admin) {
    return adminFail(res, 401, ADMIN_ERROR_CODES.UNAUTHORIZED, "Unauthorized");
  }
  if (!isAdminDecoded(admin)) {
    return adminFail(res, 403, ADMIN_ERROR_CODES.FORBIDDEN, "Forbidden");
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    // Users & Core Entities (✅ businesses and organizations kept separate)
    const users = await db.collection("users").countDocuments();
    const businesses = await db.collection("businesses").countDocuments();
    const organizations = await db.collection("organizations").countDocuments();
    const products = await db.collection("products").countDocuments();
    const jobs = await db.collection("jobs").countDocuments();
    const sellers = await db.collection("sellers").countDocuments();

    // Optional combined metric for admin display (clearly labeled)
    const directoryEntitiesTotal = businesses + organizations;

    // Orders & Sales
    const orders = await db
      .collection("orders")
      .find({ status: "completed" })
      .toArray();

    const grossSales = orders.reduce(
      (acc: number, order: any) => acc + toNum(order.amount),
      0,
    );
    const platformRevenue = orders.reduce(
      (acc: number, order: any) => acc + toNum(order.platformFee),
      0,
    );
    const totalPayouts = orders.reduce(
      (acc: number, order: any) => acc + toNum(order.sellerPayout),
      0,
    );
    const totalOrders = orders.length;

    // Growth (kept separate)
    const userGrowth = await monthlyGrowth(db, "users", "users");
    const businessGrowth = await monthlyGrowth(db, "businesses", "businesses");
    const organizationGrowth = await monthlyGrowth(
      db,
      "organizations",
      "organizations",
    );

    // Revenue By Month (orders)
    const revenueByMonthAgg = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $type: "date" } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalSales: { $sum: { $ifNull: ["$amount", 0] } },
            platformRevenue: { $sum: { $ifNull: ["$platformFee", 0] } },
            payouts: { $sum: { $ifNull: ["$sellerPayout", 0] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const revenueByMonth = revenueByMonthAgg.map((row: any) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      totalSales: toNum(row.totalSales),
      platformRevenue: toNum(row.platformRevenue),
      payouts: toNum(row.payouts),
      orders: toNum(row.orders),
    }));

    const paymentsByType = await db
      .collection("payments")
      .aggregate([
        { $match: { amountCents: { $type: "number" } } },
        {
          $group: {
            _id: { $ifNull: ["$type", "unknown"] },
            gross: { $sum: { $ifNull: ["$amountCents", 0] } },
            bweRevenue: { $sum: { $ifNull: ["$bweFee", 0] } },
            payouts: { $sum: { $ifNull: ["$payout", 0] } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Seller Leaderboard
    const sellerLeaderboardAgg = await db
      .collection("orders")
      .aggregate([
        {
          $group: {
            _id: "$sellerId",
            totalSales: { $sum: { $ifNull: ["$amount", 0] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Buyer Activity
    const buyersAgg = await db
      .collection("orders")
      .aggregate([{ $group: { _id: "$buyerId", orders: { $sum: 1 } } }])
      .toArray();

    const uniqueBuyers = buyersAgg.length;
    const repeatBuyers = buyersAgg.filter(
      (b: any) => toNum(b.orders) > 1,
    ).length;
    const mostActiveBuyer =
      buyersAgg.sort(
        (a: any, b: any) => toNum(b.orders) - toNum(a.orders),
      )[0] || null;

    // Directory Listings (supports older + newer field names/statuses)
    const pendingListings = await db
      .collection("directory_listings")
      .countDocuments({
        status: { $in: ["pending", "pending_review"] },
      });

    // "approvedListings" key preserved for dashboard compatibility,
    // but includes active/approved statuses and supports endDate/expiresAt.
    const approvedListings = await db
      .collection("directory_listings")
      .countDocuments({
        status: { $in: ["approved", "active"] },
        $or: [{ endDate: { $gt: now } }, { expiresAt: { $gt: now } }],
      });

    const expiredListings = await db
      .collection("directory_listings")
      .countDocuments({
        status: { $in: ["approved", "active"] },
        $or: [{ endDate: { $lt: now } }, { expiresAt: { $lt: now } }],
      });

    const directoryRevenueAgg = await db
      .collection("directory_listings")
      .aggregate([
        { $match: { paid: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ])
      .toArray();

    const directoryRevenue = toNum(directoryRevenueAgg[0]?.total);

    // Directory listing purchases by month (legacy schema fields)
    const dirRevenueByMonthAgg = await db
      .collection("directory_listings")
      .aggregate([
        { $match: { paid: true, startDate: { $type: "date" } } },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
            },
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const dirRevenueByMonth = dirRevenueByMonthAgg.map((row: any) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      total: toNum(row.total),
    }));

    // Ad Revenue (legacy ads collection)
    const adRevenueAgg = await db
      .collection("ads")
      .aggregate([
        { $match: { paid: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
      ])
      .toArray();

    const adRevenue = toNum(adRevenueAgg[0]?.total);

    // Ad purchases by month (legacy ads collection)
    const adRevenueByMonthAgg = await db
      .collection("ads")
      .aggregate([
        { $match: { paid: true, startDate: { $type: "date" } } },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
            },
            total: { $sum: { $ifNull: ["$amountPaid", 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const adRevenueByMonth = adRevenueByMonthAgg.map((row: any) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      total: toNum(row.total),
    }));

    // Final Response
    return res.status(200).json({
      ok: true,

      // Core counts
      users,
      businesses,
      organizations, // ✅ separate org count
      directoryEntitiesTotal, // ✅ optional combined metric (clearly labeled)
      products,
      jobs,
      sellers,

      // Marketplace / commerce
      grossSales,
      platformRevenue,
      totalPayouts,
      totalOrders,

      // Growth
      userGrowth,
      businessGrowth, // ✅ added
      organizationGrowth, // ✅ added
      revenueByMonth,
      paymentRevenueByType: paymentsByType.map((row: any) => ({
        type: row._id,
        gross: toNum(row.gross),
        bweRevenue: toNum(row.bweRevenue),
        payouts: toNum(row.payouts),
        count: toNum(row.count),
      })),

      // Engagement / sellers
      sellerLeaderboard: sellerLeaderboardAgg,
      buyerActivity: {
        uniqueBuyers,
        repeatBuyers,
        mostActiveBuyer,
      },

      // Directory / Ads analytics
      pendingListings,
      approvedListings,
      expiredListings,
      directoryRevenue,
      dirRevenueByMonth,
      adRevenue,
      adRevenueByMonth,
    });
  } catch (err) {
    console.error("[/api/admin/analytics] Error:", err);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Internal Server Error",
    );
  }
}
