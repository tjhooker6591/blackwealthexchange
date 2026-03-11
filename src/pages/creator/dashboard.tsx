import { useEffect, useState } from "react";
import Link from "next/link";

type Readiness = {
  sellerExists: boolean;
  onboardingStatus: string;
  payoutConnected: boolean;
  payoutReady: boolean;
  dashboardReady: boolean;
  stripeAccountId?: string | null;
  requirements?: string[];
};

export default function CreatorDashboardPage() {
  const [state, setState] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/marketplace/readiness", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load readiness");
        setState(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load creator readiness");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[#D4AF37]">
          Creator Dashboard
        </h1>
        <p className="mt-2 text-white/70">
          Your music creator readiness and next operational actions.
        </p>
        <p className="mt-1 text-xs text-white/50">
          Launch scope: readiness + product management continuity. Advanced
          creator fan/analytics modules are post-launch.
        </p>

        {loading ? <p className="mt-4 text-white/70">Loading…</p> : null}
        {error ? <p className="mt-4 text-red-400">{error}</p> : null}

        {!loading && !error && state ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Card
              label="Seller Profile"
              value={state.sellerExists ? "Ready" : "Missing"}
            />
            <Card
              label="Onboarding"
              value={state.onboardingStatus || "unknown"}
            />
            <Card
              label="Payout Connected"
              value={state.payoutConnected ? "Yes" : "No"}
            />
            <Card
              label="Payout Ready"
              value={state.payoutReady ? "Yes" : "No"}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {state?.dashboardReady ? (
            <Link
              href="/marketplace/add-products"
              className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
            >
              Add Music Product
            </Link>
          ) : (
            <Link
              href="/music/join"
              className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
            >
              Finish Creator Activation
            </Link>
          )}
          <Link
            href="/music/join"
            className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white"
          >
            Back to Music Activation
          </Link>
          <Link
            href="/marketplace/dashboard"
            className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white"
          >
            Seller Dashboard
          </Link>
        </div>

        {state && !state.dashboardReady ? (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">
              Creator account not fully ready yet
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Complete onboarding, payout readiness, and plan activation in the
              music activation flow before managing live creator inventory.
            </p>
          </div>
        ) : null}

        {state &&
        Array.isArray(state.requirements) &&
        state.requirements.length > 0 ? (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">
              Payout requirements still due
            </h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/80">
              {state.requirements.slice(0, 8).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
