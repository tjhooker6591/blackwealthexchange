import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ArrowRight, BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { getJwtSecret } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { toPublicErrorMessage } from "@/lib/publicError";

type Seller = {
  _id: string;
  stripeAccountId?: string;
  creatorOnboardingStatus?: string;
  creatorPlanStatus?: string;
  creatorReady?: boolean;
};

type AccountStatus = { charges_enabled: boolean; payouts_enabled: boolean };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StepTile({
  step,
  title,
  copy,
  done,
  tone = "default",
}: {
  step: string;
  title: string;
  copy: string;
  done: boolean;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-4 py-4",
        tone === "accent"
          ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
          : "border-white/8 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
          {step}
        </div>
        <span className="bwe-badge" data-tone={done ? "accent" : undefined}>
          {done ? "Complete" : "Required"}
        </span>
      </div>
      <div className="mt-2 text-base font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/66">{copy}</p>
    </div>
  );
}

function DetailBox({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="bwe-soft-tile p-4">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {title}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/64">{copy}</p>
    </div>
  );
}

export default function MusicCreatorJoinPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [acctStatus, setAcctStatus] = useState<AccountStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activated = useMemo(
    () => router.query.activated === "1",
    [router.query],
  );

  const [form, setForm] = useState({
    artistName: "",
    creatorName: "",
    genre: "",
    bio: "",
    website: "",
    creatorGoal: "sell-music",
    agreed: false,
  });

  const trackMusicJoinEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/music/join",
      section: "music_join",
      isAuthenticated: Boolean(user),
      accountType: user?.accountType || "anonymous",
      ...extras,
    });
  };

  async function refreshState() {
    const res = await fetch("/api/marketplace/get-my-seller", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    const currentSeller = data?.seller || null;
    setSeller(currentSeller);

    if (currentSeller?._id) {
      const acctRes = await fetch(
        `/api/stripe/account-status?sellerId=${encodeURIComponent(currentSeller._id)}`,
      );
      const acct = await acctRes.json().catch(() => null);
      if (acctRes.ok && acct) setAcctStatus(acct);
    }
  }

  useEffect(() => {
    if (!loading && user) {
      trackMusicJoinEvent("music_onboarding_started", {
        ctaId: "music_join_page_view",
        ctaLabel: "Music Join Page Viewed",
      });
    }

    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent("/music/join")}`);
      return;
    }
    refreshState().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function submitOnboarding(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/music/creator-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Onboarding failed");
      await refreshState();
    } catch (err: any) {
      setError(
        toPublicErrorMessage(err?.message, {
          fallback:
            "We couldn't continue creator onboarding right now. Please try again.",
          authFallback: "Please sign in to continue creator onboarding.",
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  const connectReady = Boolean(
    acctStatus?.charges_enabled && acctStatus?.payouts_enabled,
  );
  const planActive = seller?.creatorPlanStatus === "active";
  const creatorReady = Boolean(
    seller?.creatorReady && connectReady && planActive,
  );
  const profileReady = seller?.creatorOnboardingStatus === "onboarded";

  const title = "Music Creator Join | Black Wealth Exchange";
  const description = truncateMeta(
    "Complete the BWE Music creator onboarding flow, connect payouts, and move into plan activation through the existing staged creator-readiness path.",
  );

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="bwe-section-wrap">
          <div className="bwe-soft-tile p-6 text-sm text-white/70">
            Loading creator join…
          </div>
        </div>
      </main>
    );
  }

  if (creatorReady) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonicalUrl("/music/join")} />
        </Head>
        <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
          <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
            <section className="bwe-hero-panel rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
              <div className="bwe-eyebrow">Creator ready</div>
              <h1 className="bwe-display-title mt-3 max-w-[10ch]">
                Your creator access is active.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Onboarding, payout readiness, and creator plan activation are
                already complete for this account.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/marketplace/add-products"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Add music product
                </Link>
                <Link
                  href="/creator/dashboard"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  Open creator dashboard
                </Link>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/58">
                Advanced creator analytics and fan tooling remain part of later
                expansion work. Current launch-stage creator access is ready.
              </p>
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/music/join")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Music creator join</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Move through creator onboarding one stage at a time.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Complete profile details first, then finish payout readiness,
                  then activate a creator plan. The flow stays sequential so
                  creator access remains trusted.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="bwe-badge"
                    data-tone={profileReady ? "accent" : undefined}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Profile {profileReady ? "complete" : "required"}
                  </span>
                  <span
                    className="bwe-badge"
                    data-tone={connectReady ? "accent" : undefined}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Payouts {connectReady ? "ready" : "required"}
                  </span>
                  <span
                    className="bwe-badge"
                    data-tone={planActive ? "accent" : undefined}
                  >
                    <Lock className="h-4 w-4" />
                    Plan {planActive ? "active" : "required"}
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Activation progress
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3 text-sm text-white/72">
                    <span>1. Creator profile</span>
                    <span>{profileReady ? "Complete" : "Open"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-white/72">
                    <span>2. Payout setup</span>
                    <span>{connectReady ? "Complete" : "Open"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm text-white/72">
                    <span>3. Creator plan</span>
                    <span>{planActive ? "Complete" : "Open"}</span>
                  </div>
                </div>
                {activated ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    Payment return detected. Progress has been refreshed.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <StepTile
              step="Step 1"
              title="Creator profile"
              copy="Submit artist identity and creator details so your launch path begins with complete profile context."
              done={profileReady}
              tone="accent"
            />
            <StepTile
              step="Step 2"
              title="Payout readiness"
              copy="Finish the existing payout setup flow before pricing unlocks. Publishing stays gated until this is verified."
              done={connectReady}
            />
            <StepTile
              step="Step 3"
              title="Plan activation"
              copy="Open music pricing only after the first two stages are complete. No creator plan should activate out of sequence."
              done={planActive}
            />
          </section>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {!profileReady ? (
            <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
              <div className="border-t border-white/8 pt-5 text-left">
                <div className="bwe-eyebrow">Creator profile</div>
                <h2 className="bwe-section-title mt-2 max-w-xl">
                  Start with the information needed to launch cleanly.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/62 sm:text-[15px]">
                  This is the existing onboarding step. The experience is
                  cleaner now, but the underlying creator data contract and
                  submission behavior remain the same.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    icon={<BadgeCheck className="h-4 w-4" />}
                    title="What to provide"
                    copy="Artist name, creator name, genre, a short bio, and optional website."
                  />
                  <DetailBox
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Why it matters"
                    copy="Creator onboarding establishes trusted identity before payouts and plan activation."
                  />
                </div>
              </div>

              <form
                onSubmit={submitOnboarding}
                className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-white/72">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                      Artist name
                    </span>
                    <input
                      className="bwe-input"
                      placeholder="Artist Name"
                      value={form.artistName}
                      onChange={(e) =>
                        setForm({ ...form, artistName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="text-sm text-white/72">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                      Creator name
                    </span>
                    <input
                      className="bwe-input"
                      placeholder="Creator Name"
                      value={form.creatorName}
                      onChange={(e) =>
                        setForm({ ...form, creatorName: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-white/72">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                      Genre
                    </span>
                    <input
                      className="bwe-input"
                      placeholder="Genre"
                      value={form.genre}
                      onChange={(e) =>
                        setForm({ ...form, genre: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="text-sm text-white/72">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                      Website
                    </span>
                    <input
                      className="bwe-input"
                      placeholder="Website (optional)"
                      value={form.website}
                      onChange={(e) =>
                        setForm({ ...form, website: e.target.value })
                      }
                    />
                  </label>
                </div>

                <label className="mt-3 block text-sm text-white/72">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                    Artist bio
                  </span>
                  <textarea
                    className="bwe-textarea"
                    placeholder="Artist Bio"
                    rows={5}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    required
                  />
                </label>

                <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-white/72">
                  <input
                    type="checkbox"
                    checked={form.agreed}
                    onChange={(e) =>
                      setForm({ ...form, agreed: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
                    required
                  />
                  <span>I agree to creator and marketplace terms.</span>
                </label>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={busy}
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    {busy ? "Saving…" : "Continue creator onboarding"}
                  </button>
                  <Link
                    href="/music"
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    Back to music
                  </Link>
                </div>
              </form>
            </section>
          ) : null}

          {profileReady && !connectReady ? (
            <section className="mt-8 rounded-[28px] border border-yellow-400/25 bg-yellow-500/10 px-4 py-5 sm:px-5">
              <div className="bwe-eyebrow">Next required step</div>
              <h2 className="bwe-section-title mt-2 max-w-xl">
                Finish payout setup before plan activation unlocks.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
                Creator profile is complete. The current gated sequence now
                requires payout readiness before pricing becomes actionable.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/marketplace/become-a-seller?refresh=1"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Finish payout setup
                </Link>
                <Link
                  href="/music"
                  className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                >
                  Back to music
                </Link>
              </div>
            </section>
          ) : null}

          {profileReady && connectReady && !planActive ? (
            <section className="mt-8 rounded-[28px] border border-sky-400/25 bg-sky-500/10 px-4 py-5 sm:px-5">
              <div className="bwe-eyebrow">Pricing unlocked</div>
              <h2 className="bwe-section-title mt-2 max-w-xl">
                Creator plan selection is now available.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
                Onboarding and payouts are complete. The next stage is plan
                activation through the existing music pricing flow.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/music/pricing"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Select creator plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/creator/dashboard"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  Open creator dashboard
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  resolvedUrl,
}) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/join")}`,
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, getJwtSecret());
  } catch {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/join")}`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
