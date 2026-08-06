import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import PremiumDigitalCard from "@/components/black-card/PremiumDigitalCard";

type MemberSummaryResponse = {
  ok: boolean;
  member?: { fullName: string | null; email: string; status: string };
  rewards?: { balance: number };
  activity?: Array<{ id: string; type: string; at: string | null }>;
  redemptions?: Array<{
    id: string;
    rewardType: string;
    value: number;
    status: string;
  }>;
  ledger?: Array<{
    id: string;
    type: string;
    points: number;
    actionType: string;
    balanceAfter: number;
    at: string | null;
  }>;
  card?: {
    memberId?: string;
    verificationCode?: string;
    verificationUrl?: string | null;
    digitalStatus?: string;
    issueVersion?: number;
  } | null;
  error?: string;
};

export default function BlackCardDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MemberSummaryResponse | null>(null);
  const [showPhonePanel, setShowPhonePanel] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [copyFallback, setCopyFallback] = useState<string | null>(null);

  async function fetchSummary() {
    const res = await fetch("/api/black-card/member-summary", {
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401)
      return router.replace("/login?redirect=/dashboard/black-card");
    setData((await res.json()) as MemberSummaryResponse);
  }

  useEffect(() => {
    (async () => {
      try {
        await fetchSummary();
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const memberId = data?.card?.memberId || "BCM-31924381";
  const statusActive =
    String(data?.member?.status || "inactive").toLowerCase() === "active";
  const verificationUrl =
    data?.card?.verificationUrl || "/black-card/verify/bcv_5a59ac86be5b520d";
  const cardAccessUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/black-card`
      : "/dashboard/black-card";

  async function copyText(value: string, success: string) {
    setCopyMsg("");
    setCopyFallback(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopyMsg(success);
    } catch {
      setCopyFallback(value);
      setCopyMsg("Copy this link manually.");
    }
  }

  return (
    <>
      <Head>
        <title>BWE Black Card Dashboard | Black Wealth Exchange</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Loading...
            </div>
          ) : data?.ok ? (
            <>
              <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <h1 className="text-2xl font-extrabold text-yellow-100">
                  Your Digital Black Card
                </h1>
                <p className="mt-1 text-sm text-white/80">{`Plan: ${String((data as any)?.plan || "unknown")} • Tier: ${String((data as any)?.cardTier || "unknown")}. Your membership plan determines your Black Card tier.`}</p>
                <div className="mt-3 grid gap-5 md:grid-cols-2">
                  <PremiumDigitalCard
                    memberName={data.member?.fullName || "Thomas J Hooker"}
                    memberId={memberId}
                    status={statusActive ? "Active" : "Inactive"}
                    verificationId={
                      data.card?.verificationCode || "bcv_5a59ac86be5b520d"
                    }
                    cardTier={String(
                      (data as any)?.cardTierName ||
                        (data as any)?.cardTier ||
                        "Standard",
                    )}
                    planName={String(
                      (data as any)?.planName ||
                        (data as any)?.plan ||
                        "Premium",
                    )}
                  />
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                      <div>
                        Member ID: <strong>{memberId}</strong>
                      </div>
                      <div className="mt-1">
                        Status:{" "}
                        <strong>{statusActive ? "Active" : "Inactive"}</strong>
                      </div>
                      <div className="mt-1">
                        Verification link:{" "}
                        <a
                          className="text-yellow-200 underline"
                          href={verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open live verification page
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPhonePanel(true)}
                      className="w-full rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black"
                    >
                      Send to My Phone
                    </button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-yellow-500/30 px-3 py-2 text-center text-sm text-yellow-200"
                      >
                        Open Verification Page
                      </a>
                      <button
                        onClick={() =>
                          copyText(cardAccessUrl, "Card link copied.")
                        }
                        className="rounded-lg border border-yellow-500/30 px-3 py-2 text-sm text-yellow-200"
                      >
                        Copy Card Access Link
                      </button>
                    </div>
                    {copyMsg ? (
                      <div className="text-xs text-yellow-200">{copyMsg}</div>
                    ) : null}
                    {copyFallback ? (
                      <input
                        readOnly
                        value={copyFallback}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-full rounded border border-white/20 bg-black/50 px-2 py-1 text-xs text-white"
                      />
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
                <div className="font-semibold text-yellow-200">
                  Access your Black Card on your phone
                </div>
                <p className="mt-1">
                  Open BWE on your phone, log in, and save this page to your
                  home screen.
                </p>
              </section>

              {showPhonePanel ? (
                <section className="rounded-xl border border-yellow-500/30 bg-black/60 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-yellow-200">
                      Send to My Phone
                    </div>
                    <button
                      onClick={() => setShowPhonePanel(false)}
                      className="text-xs text-white/70"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2 text-white/80">
                    Card access URL: {cardAccessUrl}
                  </div>
                  <div className="mt-1 text-white/80">
                    Verification URL: {verificationUrl}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        copyText(cardAccessUrl, "Card link copied.")
                      }
                      className="rounded border border-yellow-500/30 px-2 py-1 text-xs text-yellow-200"
                    >
                      Copy card link
                    </button>
                    <button
                      onClick={() =>
                        copyText(verificationUrl, "Verification link copied.")
                      }
                      className="rounded border border-yellow-500/30 px-2 py-1 text-xs text-yellow-200"
                    >
                      Copy verification link
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-white/70">
                    iPhone: open BWE in Safari, log in, go to Dashboard → My
                    Black Card, Share → Add to Home Screen.
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    Android: open BWE in Chrome, log in, go to Dashboard → My
                    Black Card, menu → Add to Home screen.
                  </div>
                </section>
              ) : null}

              <details className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer text-lg font-bold text-yellow-200">
                  Rewards and Activity
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <h3 className="font-semibold text-yellow-200">
                      Live Rewards Balance
                    </h3>
                    <p className="mt-2 text-3xl font-black">
                      {data.rewards?.balance ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <h3 className="font-semibold text-yellow-200">
                      Recent Redemptions
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      {data.redemptions?.length
                        ? `${data.redemptions.length} records`
                        : "No redemptions yet"}
                    </p>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
              Failed to load Black Card dashboard
              {data?.error ? `: ${data.error}` : "."}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token)
    return {
      redirect: {
        destination: "/login?redirect=/dashboard/black-card",
        permanent: false,
      },
    };
  try {
    jwt.verify(token, getJwtSecret());
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/dashboard/black-card",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
