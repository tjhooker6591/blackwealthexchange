import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type StatData = {
  users: number;
  businesses: number;
  products: number;
  jobs: number;
  sellers: number;
  grossSales: number;
  platformRevenue: number;
  totalPayouts: number;
  totalOrders: number;
  userGrowth: { month: string; users: number }[];
  revenueByMonth: {
    month: string;
    totalSales: number;
    platformRevenue: number;
    payouts: number;
    orders: number;
  }[];
  sellerLeaderboard: { _id: string; totalSales: number; orders: number }[];
  buyerActivity: {
    uniqueBuyers: number;
    repeatBuyers: number;
    mostActiveBuyer?: { _id: string; orders: number };
  };
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok || res.status === 304) return;
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl text-gold font-bold mb-8">Platform Analytics</h1>

      {loading || !stats ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard label="Total Users" value={stats.users} />
            <StatCard label="Businesses" value={stats.businesses} />
            <StatCard label="Products" value={stats.products} />
            <StatCard label="Job Posts" value={stats.jobs} />
            <StatCard label="Sellers" value={stats.sellers} />
            <StatCard
              label="Gross Sales"
              value={`$${stats.grossSales.toFixed(2)}`}
            />
            <StatCard
              label="Platform Revenue"
              value={`$${stats.platformRevenue.toFixed(2)}`}
            />
            <StatCard
              label="Seller Payouts"
              value={`$${stats.totalPayouts.toFixed(2)}`}
            />
            <StatCard label="Total Orders" value={stats.totalOrders} />
          </div>

          <div className="bg-gray-900 p-6 rounded-lg mb-10">
            <h2 className="text-xl font-bold text-gold mb-4">
              Monthly Revenue
            </h2>
            {stats.revenueByMonth.length === 0 ? (
              <p>No revenue data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueByMonth}>
                  <CartesianGrid stroke="#444" />
                  <XAxis dataKey="month" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#00c9a7"
                    name="Total Sales"
                  />
                  <Line
                    type="monotone"
                    dataKey="platformRevenue"
                    stroke="#FFD700"
                    name="Platform Fee"
                  />
                  <Line
                    type="monotone"
                    dataKey="payouts"
                    stroke="#8884d8"
                    name="Seller Payouts"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-gray-900 p-6 rounded-lg mb-10">
            <h2 className="text-xl font-bold text-gold mb-4">Top Sellers</h2>
            <table className="w-full text-sm text-left text-white">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Seller ID</th>
                  <th className="px-4 py-3">Total Sales</th>
                  <th className="px-4 py-3">Orders</th>
                </tr>
              </thead>
              <tbody>
                {stats.sellerLeaderboard.map((seller, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="px-4 py-2">{seller._id}</td>
                    <td className="px-4 py-2">
                      ${seller.totalSales.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{seller.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gold mb-4">Buyer Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Unique Buyers"
                value={stats.buyerActivity.uniqueBuyers}
              />
              <StatCard
                label="Repeat Buyers"
                value={stats.buyerActivity.repeatBuyers}
              />
              <StatCard
                label="Most Active Buyer"
                value={
                  stats.buyerActivity.mostActiveBuyer
                    ? `${stats.buyerActivity.mostActiveBuyer._id} (${stats.buyerActivity.mostActiveBuyer.orders} orders)`
                    : "N/A"
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-gray-800 p-6 rounded text-center">
    <p className="text-gray-400 text-sm">{label}</p>
    <p className="text-2xl text-gold font-bold mt-2">{value}</p>
  </div>
);

export default AnalyticsDashboard;
