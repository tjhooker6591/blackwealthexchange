import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const [users, businesses, products, jobs, sellers] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("businesses").countDocuments(),
      db.collection("products").countDocuments(),
      db.collection("jobs").countDocuments(),
      db.collection("sellers").countDocuments(),
    ]);

    // 📈 User growth by month
    const userGrowthRaw = await db.collection("users").aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]).toArray();

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const userGrowth = userGrowthRaw.map((entry) => ({
      month: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
      users: entry.count,
    }));

    // 💰 Total sales and revenue stats
    const ordersCollection = db.collection("orders");
    const orderStats = await ordersCollection.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalGrossSales: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]).toArray();

    const grossSales = orderStats[0]?.totalGrossSales || 0;
    const totalOrders = orderStats[0]?.totalOrders || 0;
    const platformRevenue = parseFloat((grossSales * 0.10).toFixed(2));
    const totalPayouts = parseFloat((grossSales * 0.90).toFixed(2));

    // 📊 Revenue by month
    const monthlyRevenue = await ordersCollection.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalSales: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]).toArray();

    const revenueByMonth = monthlyRevenue.map((entry) => ({
      month: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
      totalSales: entry.totalSales,
      platformRevenue: parseFloat((entry.totalSales * 0.10).toFixed(2)),
      payouts: parseFloat((entry.totalSales * 0.90).toFixed(2)),
      orders: entry.count,
    }));

    // 🏆 Seller leaderboard
    const sellerLeaderboard = await ordersCollection.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$userId",
          totalSales: { $sum: "$amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
    ]).toArray();

    // 👤 Buyer activity tracking
    const buyerActivityAgg = await ordersCollection.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$userId",
          orders: { $sum: 1 },
        },
      },
    ]).toArray();

    const uniqueBuyers = buyerActivityAgg.length;
    const repeatBuyers = buyerActivityAgg.filter(b => b.orders > 1).length;
    const mostActiveBuyer = buyerActivityAgg.sort((a, b) => b.orders - a.orders)[0];

    return res.status(200).json({
      users,
      businesses,
      products,
      jobs,
      sellers,
      userGrowth,
      grossSales,
      platformRevenue,
      totalPayouts,
      totalOrders,
      revenueByMonth,
      sellerLeaderboard,
      buyerActivity: {
        uniqueBuyers,
        repeatBuyers,
        mostActiveBuyer,
      },
    });
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    return res.status(500).json({ error: "Failed to load analytics data." });
  }
}
