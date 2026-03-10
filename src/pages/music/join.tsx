import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";

type Seller = {
  _id: string;
  stripeAccountId?: string;
  creatorOnboardingStatus?: string;
  creatorPlanStatus?: string;
  creatorReady?: boolean;
};

type AccountStatus = { charges_enabled: boolean; payouts_enabled: boolean };

export default function MusicCreatorJoinPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [acctStatus, setAcctStatus] = useState<AccountStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activated = useMemo(() => router.query.activated === "1", [router.query]);

  const [form, setForm] = useState({
    artistName: "",
    creatorName: "",
    genre: "",
    bio: "",
    website: "",
    creatorGoal: "sell-music",
    agreed: false,
  });

  async function refreshState() {
    const res = await fetch("/api/marketplace/get-my-seller", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    const s = data?.seller || null;
    setSeller(s);

    if (s?._id) {
      const acctRes = await fetch(
        `/api/stripe/account-status?sellerId=${encodeURIComponent(s._id)}`,
      );
      const acct = await acctRes.json().catch(() => null);
      if (acctRes.ok && acct) setAcctStatus(acct);
    }
  }

  useEffect(() => {
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
    } catch (e: any) {
      setError(e?.message || "Onboarding failed");
    } finally {
      setBusy(false);
    }
  }

  const connectReady = Boolean(
    acctStatus?.charges_enabled && acctStatus?.payouts_enabled,
  );
  const planActive = seller?.creatorPlanStatus === "active";
  const creatorReady = Boolean(seller?.creatorReady && connectReady && planActive);

  if (loading || !user) {
    return <main className="min-h-screen bg-black text-white p-8">Loading…</main>;
  }

  if (creatorReady) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6">
          <h1 className="text-3xl font-black text-[#D4AF37]">Creator Ready</h1>
          <p className="mt-2 text-white/75">
            Your music creator account is active. You can now add music products.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/marketplace/add-products" className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black">Add Music Product</Link>
            <Link href="/marketplace/dashboard" className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white">Creator Dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-black text-[#D4AF37]">Join as a Music Creator</h1>
        <p className="mt-2 text-white/70">
          Complete onboarding, payout/connect setup, and creator plan activation.
        </p>

        {activated ? (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            Payment return detected. We are refreshing your creator entitlement state.
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        {!seller || seller.creatorOnboardingStatus !== "onboarded" ? (
          <form onSubmit={submitOnboarding} className="mt-5 space-y-3">
            <input className="w-full rounded border border-white/20 bg-black px-3 py-2" placeholder="Artist Name" value={form.artistName} onChange={(e)=>setForm({...form,artistName:e.target.value})} required />
            <input className="w-full rounded border border-white/20 bg-black px-3 py-2" placeholder="Creator Name" value={form.creatorName} onChange={(e)=>setForm({...form,creatorName:e.target.value})} required />
            <input className="w-full rounded border border-white/20 bg-black px-3 py-2" placeholder="Genre" value={form.genre} onChange={(e)=>setForm({...form,genre:e.target.value})} required />
            <textarea className="w-full rounded border border-white/20 bg-black px-3 py-2" placeholder="Artist Bio" rows={4} value={form.bio} onChange={(e)=>setForm({...form,bio:e.target.value})} required />
            <input className="w-full rounded border border-white/20 bg-black px-3 py-2" placeholder="Website (optional)" value={form.website} onChange={(e)=>setForm({...form,website:e.target.value})} />
            <label className="flex gap-2 text-sm text-white/80"><input type="checkbox" checked={form.agreed} onChange={(e)=>setForm({...form,agreed:e.target.checked})} /> I agree to creator and marketplace terms.</label>
            <button disabled={busy} className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black">{busy ? "Saving…" : "Continue Creator Onboarding"}</button>
          </form>
        ) : null}

        {seller && !connectReady ? (
          <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4">
            <h2 className="font-extrabold text-[#D4AF37]">Step 2: Connect Payouts</h2>
            <p className="mt-1 text-sm text-white/75">Finish Stripe Connect onboarding to become payout-ready.</p>
            <Link href="/marketplace/become-a-seller?refresh=1" className="mt-3 inline-block rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black">Finish Payout Setup</Link>
          </div>
        ) : null}

        {seller && connectReady && !planActive ? (
          <div className="mt-5 rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
            <h2 className="font-extrabold text-sky-300">Step 3: Activate Music Creator Plan</h2>
            <p className="mt-1 text-sm text-white/75">Choose your creator plan to unlock music commerce features.</p>
            <Link href="/music/pricing" className="mt-3 inline-block rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black">Select Creator Plan</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
