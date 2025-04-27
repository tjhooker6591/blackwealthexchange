import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    businesses: 0,
    products: 0,
    jobs: 0,
    sellers: 0,
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics-summary");
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
      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard label="Total Users" value={stats.users} />
            <StatCard label="Businesses" value={stats.businesses} />
            <StatCard label="Products" value={stats.products} />
            <StatCard label="Job Posts" value={stats.jobs} />
            <StatCard label="Sellers" value={stats.sellers} />
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gold mb-4">User Growth Over Time</h2>
            {stats.userGrowth.length === 0 ? (
              <p>No user growth data available yet.</p>
            ) : (
              <LineChart width={600} height={300} data={stats.userGrowth}>
                <CartesianGrid stroke="#444" />
                <XAxis dataKey="month" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#FFD700" />
              </LineChart>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-gray-800 p-6 rounded text-center">
    <p className="text-gray-400">{label}</p>
    <p className="text-3xl text-gold font-bold">{value}</p>
  </div>
);

export default AnalyticsDashboard;
