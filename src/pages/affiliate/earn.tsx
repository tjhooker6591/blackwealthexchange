// src/pages/affiliate/earn.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/navigation";

interface EarningsData {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
}

export default function Earn() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [payoutMessage, setPayoutMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        // verify session
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!sessionRes.ok) {
          router.replace("/login?redirect=/affiliate/earn");
          return;
        }
        const sessionData = await sessionRes.json();
        const uid = sessionData.user.userId;
        setUserId(uid);

        // fetch earnings for this user
        const res = await fetch(
          `/api/affiliate/earnings?userId=${encodeURIComponent(uid)}`,
          { cache: "no-store", credentials: "include" }
        );
        const data = await res.json();

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
  }, [router]);

  const handlePayoutRequest = async () => {
    if (!earnings || !userId) return;
    try {
      const payoutMethod = "PayPal";
      const payoutDetails = "your-paypal@example.com"; // TODO: replace with real input

      const res = await fetch("/api/affiliate/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, payoutMethod, payoutDetails }),
      });

      const data = await res.json();
      setPayoutMessage(data.message);
    } catch (err) {
      console.error("Payout Request Error:", err);
      setPayoutMessage("Payout request failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading earnings...
      </div>
    );
  }

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
          {earnings ? (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
              <p>
                Clicks:{" "}
                <span className="text-gold font-semibold">{earnings.clicks}</span>
              </p>
              <p>
                Conversions:{" "}
                <span className="text-gold font-semibold">
                  {earnings.conversions}
                </span>
              </p>
              <p>
                Total Earned:{" "}
                <span className="text-gold font-semibold">
                  ${earnings.totalEarned.toFixed(2)}
                </span>
              </p>
              <p>
                Total Paid:{" "}
                <span className="text-gold font-semibold">
                  ${earnings.totalPaid.toFixed(2)}
                </span>
              </p>

              <button
                onClick={handlePayoutRequest}
                className="mt-4 px-6 py-3 bg-gold text-black rounded hover:bg-yellow-500 transition"
                disabled={earnings.totalEarned - earnings.totalPaid <= 0}
              >
                Request Payout
              </button>
              {payoutMessage && (
                <p className="mt-4 text-green-400">{payoutMessage}</p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-300">{payoutMessage}</p>
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
