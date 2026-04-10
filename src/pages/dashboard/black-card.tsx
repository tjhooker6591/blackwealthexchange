import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type MemberSummaryResponse = {
  ok: boolean;
  member?: {
    fullName: string | null;
    email: string;
    tier: string | null;
    status: string;
    memberSince: string | null;
    planExpiresAt: string | null;
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
  error?: string;
};

export default function BlackCardDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MemberSummaryResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
              View Black Card Tiers
            </Link>
          </header>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              Loading member dashboard...
            </div>
          ) : data?.ok ? (
            <>
              <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-yellow-300">
                  Identity Card
                </p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-2xl font-extrabold text-yellow-100">
                      {(
                        data.member?.fullName ||
                        data.member?.email ||
                        "Member"
                      ).toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm text-white/80">
                      Tier: {data.member?.tier || "Not Active"}
                    </div>
                    <div className="text-sm text-white/70">
                      Status: {data.member?.status || "inactive"}
                    </div>
                  </div>
                  <div className="space-y-3">
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
                    </div>
                    <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/30 p-3 sm:p-4">
                      <Image
                        src="/images/black-card/bwe-black-card-close-up.png"
                        alt="BWE Black Card"
                        width={1400}
                        height={875}
                        className="h-48 w-auto max-w-full object-contain sm:h-56"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-bold text-yellow-200">
                    Rewards Balance
                  </h2>
                  <p className="mt-3 text-4xl font-black">
                    {data.rewards?.balance ?? 0}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Available for ecosystem redemptions: ad credits, marketplace
                    fee credits, course/event access, and partner offers.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-bold text-yellow-200">
                    Redemption Area
                  </h2>
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
                      No redemptions yet. Redemption actions will appear here.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-bold text-yellow-200">Activity</h2>
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
                    No Black Card activity yet.
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
