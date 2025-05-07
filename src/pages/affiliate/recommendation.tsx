// src/pages/affiliate/recommendation.tsx
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RecommendationPage = () => {
  const router = useRouter();
  const [referralLink, setReferralLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<string>("");

  useEffect(() => {
    const fetchReferralLink = async () => {
      try {
        // include cache and credentials inside fetch call
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!sessionRes.ok) {
          // redirect unauthorized
          router.replace("/login?redirect=/affiliate/recommendation");
          return;
        }
        const sessionData = await sessionRes.json();
        // ...

        if (!sessionData.user) {
          router.replace("/login?redirect=/affiliate/recommendation");
          return;
        }

        const userId = sessionData.user.userId;
        const res = await fetch(
          `/api/affiliate/get-links?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store", credentials: "include" },
        );

        const data = await res.json();
        if (res.ok) {
          setReferralLink(data.referralLink);
        } else {
          setReferralLink(data.message || "Error fetching link");
        }
      } catch (err) {
        console.error("Fetch Referral Link Error:", err);
        setReferralLink("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralLink();
  }, [router]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess("Referral link copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (_err) {
      setCopySuccess("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Referral Link | Black Wealth Exchange</title>
      </Head>
      <div className="min-h-screen bg-black text-white px-4 py-20 space-y-12">
        {/* Referral Link Section */}
        <section className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-extrabold text-gold">
            Your Referral Link
          </h1>
          <p className="text-xl text-gray-300">
            Share this link and start earning commissions:
          </p>
          <div className="bg-gray-800 p-4 rounded break-all">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="mt-4 px-6 py-3 bg-gold text-black rounded hover:bg-yellow-500 transition"
          >
            Copy Link
          </button>
          {copySuccess && <p className="text-green-400 mt-2">{copySuccess}</p>}
        </section>

        {/* Placeholder for Banners */}
        <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {["300 × 250", "728 × 90", "1200 × 628", "Story 1080 × 1920"].map(
            (size) => (
              <div
                key={size}
                className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center"
              >
                <span className="text-gold font-bold mb-4">{size}</span>
                <div className="bg-gray-700 h-40 w-full rounded mb-3 flex items-center justify-center text-gray-500">
                  Banner Preview
                </div>
                <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                  Copy Embed Code
                </button>
              </div>
            ),
          )}
        </section>

        {/* Link to Earnings Page */}
        <div className="text-center">
          <Link
            href="/affiliate/earn"
            className="px-8 py-4 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition-colors duration-200"
          >
            How Payouts Work
          </Link>
        </div>
      </div>
    </>
  );
};

export default RecommendationPage;
