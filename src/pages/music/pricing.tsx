import { useState } from "react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export default function MusicPricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

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

  if (loading) return <main className="min-h-screen bg-black p-8 text-white">Loading…</main>;

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[#D4AF37]">Music Creator Plans</h1>
        <p className="mt-2 text-white/70">Select a plan to activate creator commerce and listing access.</p>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-extrabold">Starter</h2>
            <p className="mt-1 text-sm text-white/70">For new artists launching first releases.</p>
            <p className="mt-3 text-2xl font-black text-[#D4AF37]">$29 / month</p>
            <button
              onClick={() => start("music-creator-starter")}
              disabled={busy === "music-creator-starter"}
              className="mt-4 rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black"
            >
              {busy === "music-creator-starter" ? "Redirecting…" : "Choose Starter"}
            </button>
          </div>

          <div className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5">
            <h2 className="text-xl font-extrabold">Pro</h2>
            <p className="mt-1 text-sm text-white/70">Higher visibility and advanced creator tooling.</p>
            <p className="mt-3 text-2xl font-black text-[#D4AF37]">$79 / month</p>
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
