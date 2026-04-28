import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type MeResponse = {
  user?: {
    currentPlan?: string;
    premiumStatus?: string;
  } | null;
};

type MemberSummaryResponse = {
  ok: boolean;
  member?: {
    fullName: string | null;
    email: string;
    tier: string | null;
    status: string;
    memberSince: string | null;
    planExpiresAt: string | null;
    renewalState?: "active" | "renewal_due" | "expired" | "unknown";
  };
  rewards?: {
    balance: number;
  };
  activity?: Array<{
    id: string;
    type: string;
    at: string | null;
  }>;
  redemptions?: Array<{
    id: string;
    rewardType: string;
    value: number;
    status: string;
    at: string | null;
  }>;
  ledger?: Array<{
    id: string;
    type: string;
    points: number;
    actionType: string;
    rewardType: string | null;
    balanceAfter: number;
    at: string | null;
  }>;
  card?: {
    cardIdDisplay: string;
    digitalStatus: string;
    issueVersion: number;
    verificationCode?: string;
    verificationUrl?: string | null;
    walletPassState?: string;
  } | null;
  error?: string;
};

export default function BlackCardDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MemberSummaryResponse | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState("");
  const [entitlements, setEntitlements] = useState<{
    ad_credit?: boolean;
    marketplace_fee_credit?: boolean;
    event_access?: boolean;
  }>({});
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  async function fetchSummary() {
    const res = await fetch("/api/black-card/member-summary", {
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 401) {
      router.replace("/login?redirect=/dashboard/black-card");
      return;
    }

    const json = (await res.json()) as MemberSummaryResponse;
    setData(json);

    const meRes = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (meRes.ok) {
      const meJson = (await meRes.json()) as MeResponse;
      const plan = String(meJson?.user?.currentPlan || "free").toLowerCase();
      setCurrentPlan(plan || "free");
    }

    const entitlementChecks = await Promise.all([
      fetch("/api/black-card/entitlements/check?benefit=priority_events", {
        credentials: "include",
      }),
      fetch(
        "/api/black-card/entitlements/check?benefit=premium_partner_offers",
        {
          credentials: "include",
        },
      ),
      fetch("/api/black-card/entitlements/check?benefit=vip_events", {
        credentials: "include",
      }),
    ]);

    const entitlementJson = await Promise.all(
      entitlementChecks.map(async (r) =>
        r.ok ? await r.json() : { allowed: false },
      ),
    );

    setEntitlements({
      ad_credit: Boolean(entitlementJson[0]?.allowed),
      marketplace_fee_credit: Boolean(entitlementJson[1]?.allowed),
      event_access: Boolean(entitlementJson[2]?.allowed),
    });
  }

  useEffect(() => {
    (async () => {
      try {
        await fetchSummary();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function redeemReward(rewardType: string) {
    setRedeemLoading(true);
    setRedeemMessage("");
    try {
      const res = await fetch("/api/black-card/rewards/redeem", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardType,
          referenceId: `${rewardType}-${Date.now()}`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRedeemMessage(json?.error || "Unable to redeem right now");
        return;
      }
      setRedeemMessage("Redemption request submitted.");
      await fetchSummary();
    } catch {
      setRedeemMessage("Network error while redeeming reward");
    } finally {
      setRedeemLoading(false);
    }
  }

  const membershipActive =
    String(data?.member?.status || "inactive").toLowerCase() === "active";

  const includedTierByPlan =
    currentPlan === "founding"
      ? "Signature"
      : currentPlan === "premium"
        ? "Standard"
        : "No included Black Card tier";


  return (
    <>
      <Head>
        <title>BWE Black Card Dashboard | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Identity, rewards, and redemption center for BWE Black Card members."
        />
      </Head>

      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-yellow-300">
                Member Area
              </p>
              <h1 className="mt-1 text-3xl font-black text-yellow-200">
                BWE Black Card Dashboard
              </h1>
            </div>
            <Link
              href="/black-card"
              className="rounded-lg border border-yellow-500/30 px-4 py-2 text-yellow-200"
            >
              Upgrade Membership Advantage
            </Link>
          </header>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Loading member dashboard...
            </div>
          ) : data?.ok ? (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                <h2 className="text-lg font-bold text-yellow-200">
                  What Black Card is
                </h2>
                <p className="mt-2">
                  Black Card is your verified BWE membership identity, rewards
                  access card, and QR-verifiable membership card.
                </p>
                <p className="mt-2 text-white/65">
                  It is not a debit card, credit card, bank card, or payment
                  card.
                </p>
                <p className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-yellow-100">
                  Your plan includes this tier:{" "}
                  <strong>{includedTierByPlan}</strong>
                </p>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                  <h2 className="text-lg font-bold text-yellow-200">
                    What points are for
                  </h2>
                  <p className="mt-2">
                    Points are BWE rewards earned through eligible platform
                    activity. You can redeem points for approved BWE benefits.
                  </p>
                  <div className="mt-3 text-white/70">
                    Points balance:{" "}
                    <strong>{data.rewards?.balance ?? 0}</strong>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
                  <h2 className="text-lg font-bold text-yellow-200">
                    How points are earned and redeemed
                  </h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      Earn via eligible BWE activity (for example marketplace,
                      events, learning, referrals).
                    </li>
                    <li>Choose a reward in Redemption Actions.</li>
                    <li>
                      System checks membership status, tier eligibility, and
                      available points.
                    </li>
                    <li>
                      Some rewards go to review, then status updates in your
                      dashboard.
                    </li>
                  </ul>
                </div>
              </section>
              {!membershipActive ? (
                <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                  <h2 className="text-xl font-bold text-yellow-200">
                    Membership inactive
                  </h2>
                  <p className="mt-2 text-sm text-white/80">
                    Black Card member-only rewards and redemptions are locked
                    until membership is active.
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Next step: choose a tier, activate membership, then return
                    here for immediate digital access.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/black-card"
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black"
                    >
                      Activate or Upgrade Membership
                    </Link>
                  </div>
                </section>
              ) : null}
              <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-yellow-300">
                  Digital Member Card
                </p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-yellow-400/20 bg-black/60 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
                        BWE Black Card
                      </div>
                      <div className="mt-1 text-lg font-extrabold text-yellow-100">
                        {(
                          data.member?.fullName ||
                          data.member?.email ||
                          "Member"
                        ).toUpperCase()}
                      </div>
                      <div className="mt-1 text-xs text-white/75">
                        {data.card?.cardIdDisplay || "Pending Issuance"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-yellow-500/30 bg-black/30 px-2 py-1 text-yellow-200">
                          {data.member?.tier || "not-active"}
                        </span>
                        <span className="rounded-full border border-white/20 bg-black/30 px-2 py-1 text-white/80">
                          {data.member?.status || "inactive"}
                        </span>
                        <span className="rounded-full border border-white/20 bg-black/30 px-2 py-1 text-white/80">
                          v{data.card?.issueVersion || 1}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-white/75">
                      <div>
                        Member since:{" "}
                        {data.member?.memberSince
                          ? new Date(
                              data.member.memberSince,
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                      <div>
                        Plan renews/expires:{" "}
                        {data.member?.planExpiresAt
                          ? new Date(
                              data.member.planExpiresAt,
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                      <div className="mt-1">
                        Wallet pass status:{" "}
                        {data.card?.walletPassState || "in dashboard"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black p-3 sm:p-4">
                      <Image
                        src="/images/black-card/bwe-black-card-close-up.png"
                        alt="BWE Black Card"
                        width={1400}
                        height={875}
                        className="h-auto w-full max-w-full object-contain max-h-56 sm:max-h-64"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <div className="text-xs text-white/70">
                        Member verification code
                      </div>
                      <div className="mt-1 font-mono text-sm text-yellow-200">
                        {data.card?.verificationCode || "N/A"}
                      </div>
                      <div className="mt-2 text-[11px] text-white/60 break-all">
                        Verify endpoint:{" "}
                        {data.card?.cardIdDisplay && data.card?.verificationCode
                          ? `/api/black-card/verify?cardId=${encodeURIComponent(data.card.cardIdDisplay)}&code=${encodeURIComponent(data.card.verificationCode)}`
                          : "Available after issuance"}
                      </div>
                      <div className="mt-2 text-xs">
                        Verification link:{" "}
                        {data.card?.verificationUrl ? (
                          <a
                            href={data.card.verificationUrl}
                            className="text-yellow-200 underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open live verification page
                          </a>
                        ) : (
                          <span className="text-white/60">
                            Available after issuance
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75">
                  <div className="font-semibold text-yellow-200">
                    Physical card availability
                  </div>
                  <div className="mt-1">
                    Physical card option planned for a future vendor-fulfilled
                    phase.
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/pricing"
                    className="rounded-lg border border-yellow-500/30 px-4 py-2 text-sm text-yellow-200"
                  >
                    Compare Premium & Founding Plans
                  </Link>
                  <span className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70">
                    Elite: Invite Only
                  </span>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-bold text-yellow-200">
                    Live Rewards Balance
                  </h2>
                  <p className="mt-3 text-4xl font-black">
                    {data.rewards?.balance ?? 0}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Updates as your membership activity is processed. Redeem
                    this balance for ad credits, fee credits, event access, and
                    partner offers.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-bold text-yellow-200">
                    Redemption Actions
                  </h2>
                  <p className="mt-2 text-xs text-white/70">
                    Redemption flow: choose reward, system checks card status,
                    tier, and points, then request may require admin approval.
                    Final status appears in your redemptions list.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => redeemReward("ad_credit")}
                      disabled={
                        !membershipActive ||
                        redeemLoading ||
                        !entitlements.ad_credit
                      }
                      className="rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs text-yellow-200 disabled:opacity-60"
                      title={
                        entitlements.ad_credit ? "" : "Requires Signature tier"
                      }
                    >
                      Redeem Ad Credit
                    </button>
                    <button
                      onClick={() => redeemReward("marketplace_fee_credit")}
                      disabled={
                        !membershipActive ||
                        redeemLoading ||
                        !entitlements.marketplace_fee_credit
                      }
                      className="rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs text-yellow-200 disabled:opacity-60"
                    >
                      Redeem Fee Credit
                    </button>
                    <button
                      onClick={() => redeemReward("event_access")}
                      disabled={
                        !membershipActive ||
                        redeemLoading ||
                        !entitlements.event_access
                      }
                      className="rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs text-yellow-200 disabled:opacity-60"
                    >
                      Redeem Event Access
                    </button>
                  </div>
                  {redeemMessage ? (
                    <p className="mt-2 text-xs text-yellow-200">
                      {redeemMessage}
                    </p>
                  ) : null}
                  {!membershipActive ? (
                    <p className="mt-2 text-xs text-white/65">
                      Locked reason: membership is inactive. Next action:
                      activate membership to unlock redemptions.
                    </p>
                  ) : null}
                  {membershipActive && !entitlements.ad_credit ? (
                    <p className="mt-1 text-xs text-white/65">
                      Ad Credit locked. Next action: Signature tier or higher.
                    </p>
                  ) : null}
                  {membershipActive && !entitlements.marketplace_fee_credit ? (
                    <p className="mt-1 text-xs text-white/65">
                      Fee Credit locked. Next action: Signature tier or higher.
                    </p>
                  ) : null}
                  {membershipActive && !entitlements.event_access ? (
                    <p className="mt-1 text-xs text-white/65">
                      Event Access locked. Next action: Elite tier required.
                    </p>
                  ) : null}
                  {data.redemptions && data.redemptions.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {data.redemptions.slice(0, 5).map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border border-white/10 bg-black/30 p-3"
                        >
                          <div className="font-semibold">{item.rewardType}</div>
                          <div className="text-white/70">
                            Value: {item.value} • {item.status}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/70">
                      No redemptions yet. Use actions above to convert your
                      current tier advantage into real credits and access.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-bold text-yellow-200">
                  Live Rewards Ledger
                </h2>
                {data.ledger && data.ledger.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.ledger.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-white/10 bg-black/30 p-3"
                      >
                        <div className="font-semibold">
                          {item.type === "credit" ? "+" : ""}
                          {item.points} • {item.actionType}
                        </div>
                        <div className="text-white/70">
                          Balance: {item.balanceAfter} •{" "}
                          {item.at ? new Date(item.at).toLocaleString() : "—"}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-white/70">
                    No rewards ledger entries yet. New entries appear
                    automatically as points are earned or redeemed.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-bold text-yellow-200">
                  Live Membership Activity
                </h2>
                {data.activity && data.activity.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.activity.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-white/10 bg-black/30 p-3"
                      >
                        <div className="font-semibold">{item.type}</div>
                        <div className="text-white/70">
                          {item.at ? new Date(item.at).toLocaleString() : "—"}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-white/70">
                    No Black Card activity yet. Your joins, redemptions, and
                    member events will stream here as they happen.
                  </p>
                )}
              </section>
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
  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/dashboard/black-card",
        permanent: false,
      },
    };
  }

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
