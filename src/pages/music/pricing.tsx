import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

type Readiness = {
  sellerExists: boolean;
  onboardingStatus?: string;
  payoutConnected?: boolean;
  payoutReady?: boolean;
  dashboardReady?: boolean;
};

export default function MusicPricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [gateLoading, setGateLoading] = useState(true);
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent("/music/pricing")}`);
        return;
      }

      try {
        const res = await fetch("/api/marketplace/readiness", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load readiness");
        setReadiness(data);

        if (!data?.sellerExists || data?.onboardingStatus !== "onboarded") {
          router.replace("/music/join");
          return;
        }
      } catch {
        router.replace("/music/join");
        return;
      } finally {
        setGateLoading(false);
      }
    })();
  }, [loading, router, user]);

  async function start(planId: "music-creator-starter" | "music-creator-pro") {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/music/pricing")}`);
      return;
    }

    setBusy(planId);
    setError("");
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

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[#D4AF37]">
          Music Creator Plans
        </h1>
        <p className="mt-2 text-white/70">
          Select a plan to activate creator commerce and listing access.
        </p>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        {readiness && !readiness.payoutReady ? (
          <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            Payout/connect setup is not fully ready yet. You can choose a plan now,
            then finish any remaining payout requirements in music activation.
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
