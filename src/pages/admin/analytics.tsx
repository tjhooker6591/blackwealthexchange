import { useEffect, useState } from "react";

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
  // Directory/Ad Analytics (optional)
  pendingListings?: number;
  approvedListings?: number;
  expiredListings?: number;
  directoryRevenue?: number;
  dirRevenueByMonth?: { month: string; total: number }[];
  adRevenue?: number;
  adRevenueByMonth?: { month: string; total: number }[];
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err); // You can remove this later if you want clean prod logs
        setError("Failed to load analytics.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-white p-8">Loading analytics...</p>;
  if (error) return <p className="text-red-500 p-8">{error}</p>;
  if (!stats)
    return <p className="text-gray-400 p-8">No analytics data found.</p>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl text-gold font-bold mb-8">Platform Analytics</h1>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Businesses" value={stats.businesses} />
        <StatCard label="Products" value={stats.products} />
        <StatCard label="Jobs" value={stats.jobs} />
        <StatCard label="Sellers" value={stats.sellers} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard
          label="Gross Sales"
          value={`$${(stats.grossSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Platform Revenue"
          value={`$${(stats.platformRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          label="Seller Payouts"
          value={`$${(stats.totalPayouts || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      {/* Seller Leaderboard */}
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
            {stats.sellerLeaderboard?.length > 0 ? (
              stats.sellerLeaderboard.map((seller, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="px-4 py-2">{seller._id}</td>
                  <td className="px-4 py-2">${seller.totalSales.toFixed(2)}</td>
                  <td className="px-4 py-2">{seller.orders}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 p-4">
                  No sellers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Buyer Activity */}
      <div className="bg-gray-900 p-6 rounded-lg mb-10">
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

      {/* You can add charts (like for userGrowth or revenueByMonth) below */}
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
