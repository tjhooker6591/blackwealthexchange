// src/pages/affiliate/recommendation.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AuthedState = "loading" | "authed" | "guest";

type BannerSpec = {
  label: string;
  size: string;
  img: string; // optional static preview path
};

const BANNERS: BannerSpec[] = [
  {
    label: "Medium Rectangle",
    size: "300x250",
    img: "/ads/default-banner.jpg",
  },
  { label: "Leaderboard", size: "728x90", img: "/ads/default-banner.jpg" },
  {
    label: "Social (Open Graph)",
    size: "1200x628",
    img: "/ads/default-banner.jpg",
  },
  { label: "Story", size: "1080x1920", img: "/ads/default-banner.jpg" },
];

export default function RecommendationPage() {
  const router = useRouter();

  const [authedState, setAuthedState] = useState<AuthedState>("loading");
  const [referralLink, setReferralLink] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageIsError, setMessageIsError] = useState<boolean>(false);

  const [copySuccess, setCopySuccess] = useState<string>("");

  // UTM builder (simple but high-value)
  const [utmSource, setUtmSource] = useState("affiliate");
  const [utmMedium, setUtmMedium] = useState("link");
  const [utmCampaign, setUtmCampaign] = useState("bwe_affiliate");

  // Prevent duplicate fetches (StrictMode/dev)
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchReferralLink = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          setAuthedState("guest");
          return;
        }

        const sessionData = await sessionRes.json();
        const userId = sessionData?.user?.userId;

        if (!userId) {
          setAuthedState("guest");
          return;
        }

        const res = await fetch(
          `/api/affiliate/get-links?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store", credentials: "include" },
        );

        const data = await res.json();

        if (!res.ok) {
          setAuthedState("authed");
          setReferralLink("");
          setMessage(data?.message || "Error fetching link");
          setMessageIsError(true);
          return;
        }

        const link = data?.referralLink || "";
        setAuthedState("authed");
        setReferralLink(link);
        setMessage("");
        setMessageIsError(false);
      } catch (err) {
        console.error("Fetch Referral Link Error:", err);
        setAuthedState("guest");
        setMessage("Server error");
        setMessageIsError(true);
      }
    };

    fetchReferralLink();
  }, [router.isReady]);

  const withUtm = useMemo(() => {
    if (!referralLink) return "";
    try {
      const u = new URL(referralLink);
      if (utmSource) u.searchParams.set("utm_source", utmSource);
      if (utmMedium) u.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) u.searchParams.set("utm_campaign", utmCampaign);
      return u.toString();
    } catch {
      return referralLink; // fallback
    }
  }, [referralLink, utmSource, utmMedium, utmCampaign]);

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 1500);
    } catch {
      setCopySuccess("Failed to copy");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  };

  const shareTwitter = useMemo(() => {
    const text = encodeURIComponent(
      "Support Black-owned businesses with Black Wealth Exchange:",
    );
    const url = encodeURIComponent(
      withUtm || referralLink || "https://blackwealthexchange.com",
    );
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [withUtm, referralLink]);

  const shareFacebook = useMemo(() => {
    const url = encodeURIComponent(
      withUtm || referralLink || "https://blackwealthexchange.com",
    );
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }, [withUtm, referralLink]);

  const shareLinkedIn = useMemo(() => {
    const url = encodeURIComponent(
      withUtm || referralLink || "https://blackwealthexchange.com",
    );
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  }, [withUtm, referralLink]);

  const buildEmbedCode = (banner: BannerSpec) => {
    // Simple embed: image + link
    const link = withUtm || referralLink;
    const imgSrc = banner.img || "/ads/default-banner.jpg";

    // Use absolute image URL if you prefer, but keep it relative for now
    return `<a href="${link}" target="_blank" rel="noopener noreferrer"><img src="${imgSrc}" alt="Black Wealth Exchange" width="${banner.size.split("x")[0]}" height="${banner.size.split("x")[1]}" style="max-width:100%;height:auto;border-radius:12px;" /></a>`;
  };

  return (
    <>
      <Head>
        <title>Your Referral Link | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Get your affiliate referral link, share banners, and track performance."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Soft gold glow */}
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
          <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute left-20 bottom-20 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-10 space-y-8">
          {/* Header */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gold">
                  Affiliate Links & Assets
                </h1>
                <p className="mt-2 text-sm md:text-base text-white/70 max-w-3xl">
                  Share your referral link, use banners, and track performance.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/affiliate/earn"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Earnings
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                >
                  Back to Search
                </Link>
              </div>
            </div>

            {copySuccess && (
              <p className="mt-4 text-sm text-green-400">{copySuccess}</p>
            )}
          </div>

          {/* Guest (no auto-redirect) */}
          {authedState === "loading" ? (
            <div className="min-h-[240px] flex items-center justify-center text-white/70">
              Loading…
            </div>
          ) : authedState === "guest" ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-gold">
                Log in to access your referral link
              </h2>
              <p className="mt-2 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                Your affiliate links and tracking are tied to your account. Log
                in to generate and manage your referral links.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/login?redirect=/affiliate/recommendation"
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

              {message && (
                <p
                  className={cx(
                    "mt-4 text-sm",
                    messageIsError ? "text-red-400" : "text-white/70",
                  )}
                >
                  {message}
                </p>
              )}
            </section>
          ) : (
            <>
              {/* Referral link */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-white">
                      Your Referral Link
                    </h2>
                    <p className="mt-1 text-sm text-white/70">
                      Copy and share your link. Add UTM tags for tracking on
                      social and email.
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopy(withUtm || referralLink)}
                    className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                    disabled={!referralLink}
                  >
                    Copy Link
                  </button>
                </div>

                {message && (
                  <p
                    className={cx(
                      "mt-3 text-sm",
                      messageIsError ? "text-red-400" : "text-white/70",
                    )}
                  >
                    {message}
                  </p>
                )}

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 break-all text-sm text-white/80">
                  {withUtm || referralLink || "No referral link available yet."}
                </div>

                {/* UTM Builder */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      utm_source
                    </label>
                    <input
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
                      placeholder="affiliate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      utm_medium
                    </label>
                    <input
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
                      placeholder="link"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      utm_campaign
                    </label>
                    <input
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-white/25"
                      placeholder="bwe_affiliate"
                    />
                  </div>
                </div>

                {/* Share buttons */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href={shareTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Share on X
                  </a>
                  <a
                    href={shareFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Share on Facebook
                  </a>
                  <a
                    href={shareLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Share on LinkedIn
                  </a>
                </div>
              </section>

              {/* Banners */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <div className="mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-white">
                    Ready-to-Use Banners
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    Copy embed code and paste into your website or blog.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {BANNERS.map((b) => {
                    const embed = referralLink ? buildEmbedCode(b) : "";
                    return (
                      <div
                        key={b.size}
                        className="rounded-2xl border border-white/10 bg-black/30 p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {b.label}
                            </p>
                            <p className="text-xs text-white/60">{b.size}</p>
                          </div>

                          <button
                            onClick={() => handleCopy(embed)}
                            disabled={!referralLink}
                            className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-50 transition"
                          >
                            Copy Embed Code
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
                          <div className="relative w-full h-32 overflow-hidden rounded-xl">
                            {/* preview */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.img}
                              alt="Banner preview"
                              className="w-full h-full object-cover opacity-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </div>

                          <div className="mt-3 text-xs text-white/60 break-all">
                            {referralLink
                              ? embed
                              : "Log in to generate your embed code."}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="text-center">
                <Link
                  href="/affiliate/earn"
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-8 py-3 font-bold text-black hover:bg-yellow-400 transition"
                >
                  How Payouts Work
                </Link>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
