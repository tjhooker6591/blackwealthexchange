// src/pages/affiliate/earn.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

interface EarningsData {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
}

type PayoutMethod = "PayPal" | "Cash App" | "Zelle";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MIN_PAYOUT_USD = 25;

export default function Earn() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [userId, setUserId] = useState("");

  const [payoutMessage, setPayoutMessage] = useState("");
  const [payoutError, setPayoutError] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("PayPal");
  const [payoutDetails, setPayoutDetails] = useState("");

  // Prevent duplicate fetches (especially in React StrictMode/dev)
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const run = async () => {
      try {
        // 1) verify session
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          setAuthed(false);
          setLoading(false);
          return;
        }

        const sessionData = await sessionRes.json();
        const uid = sessionData?.user?.userId;

        if (!uid) {
          setAuthed(false);
          setLoading(false);
          return;
        }

        setAuthed(true);
        setUserId(uid);

        // 2) fetch earnings
        const res = await fetch(
          `/api/affiliate/earnings?userId=${encodeURIComponent(uid)}`,
          { cache: "no-store", credentials: "include" },
        );

        const data = await res.json();

        if (res.ok) {
          setEarnings(data);
          setPayoutMessage("");
          setPayoutError(false);
        } else {
          setEarnings(null);
          setPayoutMessage(data?.message || "Error fetching earnings");
          setPayoutError(true);
        }
      } catch (err) {
        console.error("Earn page error:", err);
        setAuthed(false);
        setEarnings(null);
        setPayoutMessage("Server error");
        setPayoutError(true);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router.isReady]);

  const availableToPayout = useMemo(() => {
    if (!earnings) return 0;
    const v = (earnings.totalEarned || 0) - (earnings.totalPaid || 0);
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  }, [earnings]);

  const payoutPlaceholder =
    payoutMethod === "PayPal"
      ? "PayPal email (e.g., name@email.com)"
      : payoutMethod === "Cash App"
        ? "Cash App tag (e.g., $YourTag)"
        : "Zelle email or phone number";

  const canRequestPayout =
    authed &&
    !!earnings &&
    !!userId &&
    !requesting &&
    payoutDetails.trim().length >= 3 &&
    availableToPayout >= MIN_PAYOUT_USD;

  const handlePayoutRequest = async () => {
    if (!earnings || !userId) return;

    setPayoutMessage("");
    setPayoutError(false);

    if (availableToPayout < MIN_PAYOUT_USD) {
      setPayoutMessage(`Minimum payout is $${MIN_PAYOUT_USD}.`);
      setPayoutError(true);
      return;
    }
    if (!payoutDetails.trim()) {
      setPayoutMessage("Please enter payout details.");
      setPayoutError(true);
      return;
    }

    try {
      setRequesting(true);

      const res = await fetch("/api/affiliate/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          payoutMethod,
          payoutDetails: payoutDetails.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPayoutMessage(data?.message || "Payout request failed");
        setPayoutError(true);
        return;
      }

      setPayoutMessage(data?.message || "Payout request submitted.");
      setPayoutError(false);
    } catch (err) {
      console.error("Payout Request Error:", err);
      setPayoutMessage("Payout request failed");
      setPayoutError(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Affiliate Earnings | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Track clicks, conversions, earnings, and request payouts through the Black Wealth Exchange affiliate program."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Soft gold glow */}
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
          <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute left-20 bottom-20 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-white/70">Loading earnings…</div>
          </div>
        ) : (
          <main className="mx-auto w-full max-w-6xl px-4 py-10 space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gold">
                    Affiliate Earnings
                  </h1>
                  <p className="mt-2 text-sm md:text-base text-white/70 max-w-3xl">
                    Affiliates earn{" "}
                    <span className="text-gold font-bold">5–25% CPA</span> on
                    qualifying sales with a{" "}
                    <span className="text-white font-semibold">
                      30-day cookie
                    </span>
                    .
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/affiliate/recommendation"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Get Your Links
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                  >
                    Back to Search
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">
                    Minimum payout
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    ${MIN_PAYOUT_USD} available balance
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">
                    Processing time
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    Typically 3–7 business days
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">
                    Quality checks
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    Invalid activity is not eligible
                  </p>
                </div>
              </div>
            </div>

            {/* Commission table (safe to show even if not logged in) */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Commission Rates
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Rates may vary by campaign and offer. These are the current
                defaults.
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gold border-b border-white/10">
                      <th className="py-2 pr-3">Product Type</th>
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
                      <tr key={type} className="border-b border-white/10">
                        <td className="py-3 pr-3 text-white/80">{type}</td>
                        <td className="py-3 text-gold font-semibold">{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* If not authed: show stable CTA (NO redirects) */}
            {!authed ? (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-gold">
                  Log in to view your earnings
                </h2>
                <p className="mt-2 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                  Your clicks, conversions, and payouts are tied to your
                  account. Log in to access your dashboard and request payouts.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/login?redirect=/affiliate/earn"
                    className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/affiliate/signup"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                  >
                    Become an Affiliate
                  </Link>
                </div>
              </section>
            ) : (
              <>
                {/* Dashboard */}
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-white">
                        Your Dashboard
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        Track performance and request payouts from your
                        available balance.
                      </p>
                    </div>
                    <div className="text-sm text-white/70">
                      Available to payout:{" "}
                      <span className="text-white font-semibold">
                        ${availableToPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    {earnings ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                          ["Clicks", earnings.clicks],
                          ["Conversions", earnings.conversions],
                          [
                            "Total Earned",
                            `$${earnings.totalEarned.toFixed(2)}`,
                          ],
                          ["Total Paid", `$${earnings.totalPaid.toFixed(2)}`],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-white/10 bg-black/30 p-4"
                          >
                            <p className="text-xs text-white/60">{label}</p>
                            <p className="mt-1 text-xl font-bold text-gold">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={cx(
                          "text-sm",
                          payoutError ? "text-red-400" : "text-white/70",
                        )}
                      >
                        {payoutMessage || "No earnings data available yet."}
                      </p>
                    )}
                  </div>

                  {/* Payout request */}
                  {earnings && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                      <h3 className="text-sm font-semibold text-white">
                        Request a payout
                      </h3>
                      <p className="mt-1 text-sm text-white/70">
                        Enter your payout details. Minimum payout is $
                        {MIN_PAYOUT_USD}.
                      </p>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            Payout method
                          </label>
                          <select
                            value={payoutMethod}
                            onChange={(e) =>
                              setPayoutMethod(e.target.value as PayoutMethod)
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
                          >
                            <option value="PayPal">PayPal</option>
                            <option value="Cash App">Cash App</option>
                            <option value="Zelle">Zelle</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-white/60 mb-1">
                            Payout details
                          </label>
                          <input
                            value={payoutDetails}
                            onChange={(e) => setPayoutDetails(e.target.value)}
                            placeholder={payoutPlaceholder}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          onClick={handlePayoutRequest}
                          disabled={!canRequestPayout}
                          className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-gold transition"
                        >
                          {requesting ? "Submitting…" : "Request Payout"}
                        </button>

                        <span className="text-xs text-white/60">
                          Available: ${availableToPayout.toFixed(2)} • Minimum:
                          ${MIN_PAYOUT_USD}
                        </span>
                      </div>

                      {payoutMessage && (
                        <p
                          className={cx(
                            "mt-4 text-sm",
                            payoutError ? "text-red-400" : "text-green-400",
                          )}
                        >
                          {payoutMessage}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        )}
      </div>
    </>
  );
}
