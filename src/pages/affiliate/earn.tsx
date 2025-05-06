import React, { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";

interface EarningsData {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
}

export default function Earn() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutMessage, setPayoutMessage] = useState<string>("");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        // TEMP: Hardcoded userId for testing
        const userId = "6807fd633105a101ca1b58fe";

        const res = await fetch(`/api/affiliate/earnings?userId=${userId}`);
        const data = await res.json();

        console.log("Earnings API Response:", data);

        if (res.ok) {
          setEarnings(data);
        } else {
          setPayoutMessage(data.message || "Error fetching earnings");
        }
      } catch (err) {
        console.error("Fetch Earnings Error:", err);
        setPayoutMessage("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const handlePayoutRequest = async () => {
    try {
      // TEMP: Hardcoded userId for testing
      const userId = "6807fd633105a101ca1b58fe";

      const payoutDetails = "your-paypal@example.com"; // Replace later with dynamic input
      const payoutMethod = "PayPal";

      const res = await fetch("/api/affiliate/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, payoutMethod, payoutDetails }),
      });

      const data = await res.json();
      setPayoutMessage(data.message);
    } catch (err) {
      console.error("Payout Request Error:", err);
      setPayoutMessage("Payout request failed");
    }
  };

  return (
    <>
      <Head>
        <title>Affiliate Earnings | Black Wealth Exchange</title>
      </Head>
      <div className="min-h-screen bg-black text-white px-4 py-20 space-y-16">
        <section className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-extrabold text-gold">Earn</h1>
          <p className="text-xl text-gray-300">
            Affiliates earn{" "}
            <span className="text-gold font-bold">5 – 25% CPA</span> on
            qualifying sales with a 30‑day cookie window.
          </p>
        </section>

        <section className="max-w-xl mx-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gold border-b border-gray-700">
                <th className="py-2">Product Type</th>
                <th className="py-2">Commission</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Digital Courses", "25%"],
                ["Marketplace Goods", "5%"],
                ["Job Posting Upgrades", "15%"],
                ["Advertising Packages", "10%"],
              ].map(([type, rate]) => (
                <tr key={type} className="border-b border-gray-800">
                  <td className="py-3">{type}</td>
                  <td className="py-3 text-gold font-semibold">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-gold">
            Your Affiliate Dashboard
          </h2>
          {loading ? (
            <p>Loading earnings...</p>
          ) : earnings ? (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
              <p>
                Clicks:{" "}
                <span className="text-gold font-semibold">
                  {earnings.clicks ?? 0}
                </span>
              </p>
              <p>
                Conversions:{" "}
                <span className="text-gold font-semibold">
                  {earnings.conversions ?? 0}
                </span>
              </p>
              <p>
                Total Earned:{" "}
                <span className="text-gold font-semibold">
                  ${earnings?.totalEarned?.toFixed(2) ?? "0.00"}
                </span>
              </p>
              <p>
                Total Paid:{" "}
                <span className="text-gold font-semibold">
                  ${earnings?.totalPaid?.toFixed(2) ?? "0.00"}
                </span>
              </p>

              <button
                onClick={handlePayoutRequest}
                className="mt-4 px-6 py-3 bg-gold text-black rounded hover:bg-yellow-500 transition"
                disabled={(earnings.totalEarned - earnings.totalPaid) <= 0}
              >
                Request Payout
              </button>
              {payoutMessage && (
                <p className="mt-4 text-green-400">{payoutMessage}</p>
              )}
            </div>
          ) : (
            <p>{payoutMessage}</p>
          )}
        </section>

        <div className="text-center">
          <Link
            href="/affiliate/signup"
            className="px-8 py-4 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
          >
            Become an Affiliate
          </Link>
        </div>
      </div>
    </>
  );
}
