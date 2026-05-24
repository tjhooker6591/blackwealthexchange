import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import useAuth from "@/hooks/useAuth";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { getJwtSecret } from "@/lib/env";

type Readiness = {
  sellerExists: boolean;
  onboardingStatus?: string;
  payoutConnected?: boolean;
  payoutReady?: boolean;
  dashboardReady?: boolean;
  creatorPlanStatus?: string;
  creatorReady?: boolean;
  musicCreatorReady?: boolean;
};

export default function MusicPricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const trackMusicPricingEvent = useCallback(
    (eventType: string, extras: Record<string, unknown> = {}) => {
      emitFlowEvent({
        eventType,
        pageRoute: "/music/pricing",
        section: "music_pricing",
        isAuthenticated: Boolean(user),
        accountType: user?.accountType || "anonymous",
        ...extras,
      });
    },
    [user],
  );
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [gateLoading, setGateLoading] = useState(true);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [lockedReason, setLockedReason] = useState("");

  useEffect(() => {
    if (!loading) {
      trackMusicPricingEvent("music_pricing_viewed");
    }

    (async () => {
      if (loading) return;
      if (!user) return;

      try {
        const res = await fetch("/api/marketplace/readiness", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load readiness");
        setReadiness(data);

        if (!data?.sellerExists) {
          setLockedReason(
            "No creator profile found for this account. Pricing unlocks only after creator onboarding is started.",
          );
          return;
        }

        if (data?.onboardingStatus !== "onboarded") {
          setLockedReason(
            "Creator onboarding is not complete. Finish onboarding to unlock plan activation.",
          );
          return;
        }

        if (!data?.payoutReady) {
          setLockedReason(
            "Payout setup is incomplete. Plan activation unlocks only after payout readiness is verified.",
          );
          return;
        }

        if (data?.musicCreatorReady || data?.creatorReady) {
          setLockedReason(
            "Creator access is already active. Pricing is only for first-time activation or tier changes.",
          );
          return;
        }
      } catch {
        setLockedReason(
          "Unable to verify creator readiness right now. Re-enter onboarding to refresh access state.",
        );
        return;
      } finally {
        setGateLoading(false);
      }
    })();
  }, [loading, router, trackMusicPricingEvent, user]);

  async function start(planId: "music-creator-starter" | "music-creator-pro") {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/music/pricing")}`);
      return;
    }

    setBusy(planId);
    setError("");

    trackMusicPricingEvent("music_plan_selected", {
      plan_tier: planId,
      billing_cycle: "monthly",
      destination: "/api/stripe/checkout",
      ctaId: `music_plan_${planId}`,
      ctaLabel:
        planId === "music-creator-pro" ? "Choose Pro" : "Choose Starter",
    });

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "plan", itemId: planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || "Checkout failed");
      setBusy("");
    }
  }

  if (loading || gateLoading)
    return (
      <main className="min-h-screen bg-black p-8 text-white">Loading…</main>
    );

  if (lockedReason) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6">
          <h1 className="text-2xl font-black text-[#D4AF37]">
            Plan Activation Locked
          </h1>
          <p className="mt-2 text-white/80">Reason: {lockedReason}</p>
          <p className="mt-2 text-sm text-white/70">
            Next action:{" "}
            {readiness?.musicCreatorReady || readiness?.creatorReady
              ? "Open your creator dashboard."
              : "Go to Music Join, complete onboarding and readiness, then return here."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {readiness?.musicCreatorReady || readiness?.creatorReady ? (
              <button
                onClick={() => router.push("/creator/dashboard")}
                className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
              >
                Open Creator Dashboard
              </button>
            ) : (
              <button
                onClick={() =>
                  router.push(
                    readiness?.sellerExists &&
                      readiness?.onboardingStatus === "onboarded"
                      ? "/marketplace/become-a-seller?refresh=1"
                      : "/music/join",
                  )
                }
                className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
              >
                {readiness?.sellerExists &&
                readiness?.onboardingStatus === "onboarded"
                  ? "Finish Payout Setup"
                  : "Complete Music Join"}
              </button>
            )}
            <button
              onClick={() => router.push("/music")}
              className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white"
            >
              Back to Music Landing
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[#D4AF37]">
          Music Creator Plans
        </h1>
        <p className="mt-2 text-white/70">
          Select a plan to activate creator commerce and unlock creator-ready
          access.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
          <p className="font-bold text-[#D4AF37]">Access behavior</p>
          <p className="mt-1">Locked: finish onboarding and payouts first.</p>
          <p>Unlocked: plan activation takes you to creator-ready access.</p>
          <p className="mt-1">You are now in the activation step.</p>
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        {readiness && !readiness.payoutReady ? (
          <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            Reason: payout setup is incomplete. Next action: complete payout
            setup first, then return for plan activation.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-extrabold">Starter</h2>
            <p className="mt-1 text-sm text-white/70">
              For new artists launching first releases.
            </p>
            <p className="mt-3 text-2xl font-black text-[#D4AF37]">
              $29 / month
            </p>
            <button
              onClick={() => start("music-creator-starter")}
              disabled={busy === "music-creator-starter"}
              className="mt-4 rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
            >
              {busy === "music-creator-starter"
                ? "Redirecting…"
                : "Choose Starter"}
            </button>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5">
            <h2 className="text-xl font-extrabold">Pro</h2>
            <p className="mt-1 text-sm text-white/70">
              Higher visibility and advanced creator tooling.
            </p>
            <p className="mt-3 text-2xl font-black text-[#D4AF37]">
              $79 / month
            </p>
            <button
              onClick={() => start("music-creator-pro")}
              disabled={busy === "music-creator-pro"}
              className="mt-4 rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
            >
              {busy === "music-creator-pro" ? "Redirecting…" : "Choose Pro"}
            </button>
          </div>
        </div>
      </div>
    </main>
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
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/pricing")}`,
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, getJwtSecret());
  } catch {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/pricing")}`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
