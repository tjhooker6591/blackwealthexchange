import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { toPublicErrorMessage } from "@/lib/publicError";

type Readiness = {
  sellerExists: boolean;
  onboardingStatus: string;
  payoutConnected: boolean;
  payoutReady: boolean;
  dashboardReady: boolean;
  creatorPlanStatus?: string;
  creatorReady?: boolean;
  musicCreatorReady?: boolean;
  stripeAccountId?: string | null;
  requirements?: string[];
};

export default function CreatorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/login?redirect=${encodeURIComponent("/creator/dashboard")}`,
      );
      return;
    }

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
        setError(
          toPublicErrorMessage(e?.message, {
            fallback:
              "We couldn't load creator readiness right now. Please try again.",
            authFallback: "Please sign in to continue.",
          }),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, router, user]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 p-6 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

      <div className="bwe-section-wrap relative z-10 py-4 sm:py-6">
        <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative max-w-3xl">
            <div className="bwe-eyebrow">Creator dashboard</div>
            <h1 className="bwe-display-title mt-3 max-w-[10ch]">
              Creator readiness and next actions.
            </h1>
            <p className="bwe-lead mt-4 max-w-2xl">
              Keep onboarding, payout readiness, and seller continuity in one
              calmer creator workspace.
            </p>
            <p className="mt-3 text-xs text-white/50">
              Review your current setup and move into the next creator step from
              here.
            </p>
          </div>
        </section>

        {loading ? <p className="mt-4 text-white/70">Loading...</p> : null}
        {error ? <p className="mt-4 text-red-400">{error}</p> : null}

        {!loading && !error && state ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card
              label="Seller profile"
              value={state.sellerExists ? "Ready" : "Missing"}
            />
            <Card
              label="Onboarding"
              value={state.onboardingStatus || "unknown"}
            />
            <Card
              label="Payout connected"
              value={state.payoutConnected ? "Yes" : "No"}
            />
            <Card
              label="Payout ready"
              value={state.payoutReady ? "Yes" : "No"}
            />
            <Card
              label="Creator plan"
              value={state.creatorPlanStatus || "inactive"}
            />
            <Card
              label="Creator ready"
              value={
                state.musicCreatorReady || state.creatorReady ? "Yes" : "No"
              }
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {state?.musicCreatorReady || state?.creatorReady ? (
            <Link
              href="/marketplace/add-products"
              className="bwe-cta-primary bwe-focus-ring px-6"
            >
              Add music product
            </Link>
          ) : (
            <Link
              href="/music/join"
              className="bwe-cta-primary bwe-focus-ring px-6"
            >
              Finish creator activation
            </Link>
          )}
          <Link
            href="/music/join"
            className="bwe-cta-secondary bwe-focus-ring px-6"
          >
            Back to music activation
          </Link>
          <Link
            href="/marketplace/dashboard"
            className="bwe-cta-secondary bwe-focus-ring px-6"
          >
            Seller dashboard
          </Link>
        </div>

        {state && !(state.musicCreatorReady || state.creatorReady) ? (
          <div className="mt-6 rounded-[24px] border border-yellow-400/30 bg-yellow-500/10 p-4">
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
          <div className="mt-6 rounded-[24px] border border-yellow-400/30 bg-yellow-500/10 p-4">
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
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
