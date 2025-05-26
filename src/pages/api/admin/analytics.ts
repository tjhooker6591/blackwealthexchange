import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Users & Core Entities
    const users = await db.collection("users").countDocuments();
    const businesses = await db.collection("businesses").countDocuments();
    const products = await db.collection("products").countDocuments();
    const jobs = await db.collection("jobs").countDocuments();
    const sellers = await db.collection("sellers").countDocuments();

    // Orders & Sales
    const orders = await db
      .collection("orders")
      .find({ status: "completed" })
      .toArray();
    const grossSales = orders.reduce(
      (acc, order) => acc + (order.amount || 0),
      0,
    );
    const platformRevenue = orders.reduce(
      (acc, order) => acc + (order.platformFee || 0),
      0,
    );
    const totalPayouts = orders.reduce(
      (acc, order) => acc + (order.sellerPayout || 0),
      0,
    );
    const totalOrders = orders.length;

    // User Growth
    const userGrowthAgg = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();
    const userGrowth = userGrowthAgg.map((row) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      users: row.users,
    }));

    // Revenue By Month
    const revenueByMonthAgg = await db
      .collection("orders")
      .aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalSales: { $sum: "$amount" },
            platformRevenue: { $sum: "$platformFee" },
            payouts: { $sum: "$sellerPayout" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();
    const revenueByMonth = revenueByMonthAgg.map((row) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      totalSales: row.totalSales,
      platformRevenue: row.platformRevenue,
      payouts: row.payouts,
      orders: row.orders,
    }));

    // Seller Leaderboard
    const sellerLeaderboardAgg = await db
      .collection("orders")
      .aggregate([
        {
          $group: {
            _id: "$sellerId",
            totalSales: { $sum: "$amount" },
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
    const repeatBuyers = buyersAgg.filter((b) => b.orders > 1).length;
    const mostActiveBuyer = buyersAgg.sort((a, b) => b.orders - a.orders)[0];

    // Directory Listings
    const pendingListings = await db
      .collection("directory_listings")
      .countDocuments({ status: "pending" });
    const approvedListings = await db
      .collection("directory_listings")
      .countDocuments({ status: "approved", endDate: { $gt: new Date() } });
    const expiredListings = await db
      .collection("directory_listings")
      .countDocuments({ status: "approved", endDate: { $lt: new Date() } });
    const directoryRevenueAgg = await db
      .collection("directory_listings")
      .aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ])
      .toArray();
    const directoryRevenue = directoryRevenueAgg[0]?.total || 0;

    // Directory listing purchases by month
    const dirRevenueByMonthAgg = await db
      .collection("directory_listings")
      .aggregate([
        { $match: { paid: true } },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
            },
            total: { $sum: "$amountPaid" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();
    const dirRevenueByMonth = dirRevenueByMonthAgg.map((row) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      total: row.total,
    }));

    // Ad Revenue
    const adRevenueAgg = await db
      .collection("ads")
      .aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ])
      .toArray();
    const adRevenue = adRevenueAgg[0]?.total || 0;

    // Ads purchases by month
    const adRevenueByMonthAgg = await db
      .collection("ads")
      .aggregate([
        { $match: { paid: true } },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
            },
            total: { $sum: "$amountPaid" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();
    const adRevenueByMonth = adRevenueByMonthAgg.map((row) => ({
      month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
      total: row.total,
    }));

    // Final Response
    return res.status(200).json({
      users,
      businesses,
      products,
      jobs,
      sellers,
      grossSales,
      platformRevenue,
      totalPayouts,
      totalOrders,
      userGrowth,
      revenueByMonth,
      sellerLeaderboard: sellerLeaderboardAgg,
      buyerActivity: {
        uniqueBuyers,
        repeatBuyers,
        mostActiveBuyer,
      },
      // Directory/Ad Analytics
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
