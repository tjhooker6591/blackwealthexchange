// src/pages/referrals.tsx
//
// Phase 5 -- Referrals. UI for the pre-existing referral code/tracking
// backend (src/pages/api/referrals/code.ts, track.ts) that had no page
// wired to it before now.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

const EVENT_LABELS: Record<string, string> = {
  invite_sent: "Invites sent",
  invite_accepted: "Invites accepted",
  referred_signup: "New members referred",
  referred_first_purchase: "First purchases referred",
  referred_business_listing: "Business listings referred",
  referred_seller_signup: "Sellers referred",
  referred_employer_signup: "Employers referred",
};

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalEvents: number;
    byEvent: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let res = await fetch("/api/referrals/code", {
          credentials: "include",
        });
        if (res.status === 404) {
          res = await fetch("/api/referrals/code", {
            method: "POST",
            credentials: "include",
          });
        }
        if (res.ok) {
          const data = await res.json();
          setCode(data?.code || null);
        }
        const statsRes = await fetch("/api/referrals/stats", {
          credentials: "include",
        });
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const shareLink =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`
      : "";

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable -- link is still shown for manual copy
    }
  }

  const canonical = canonicalUrl("/referrals");

  return (
    <>
      <Head>
        <title>Referrals | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">My BWE</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
            Referrals
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Share BWE with your network. Every real signup through your link is
            tracked here.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/referrals"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to get your referral link.
            </div>
          ) : (
            <>
              <div className="mt-8 rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.06] p-5">
                <div className="text-sm font-semibold text-yellow-200">
                  Your referral link
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    readOnly
                    value={shareLink}
                    className="bwe-input flex-1 min-w-0"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-extrabold text-black"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="text-2xl font-extrabold text-white">
                      {stats?.byEvent?.[key] || 0}
                    </div>
                    <div className="mt-1 text-sm text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
