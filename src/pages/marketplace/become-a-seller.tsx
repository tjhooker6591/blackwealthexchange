import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Seller = {
  _id: string;
  email?: string;
  stripeAccountId?: string;
};

type SessionUser = {
  id?: string;
  _id?: string;
  email?: string;
};

type AccountStatus = {
  connected?: boolean;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

export default function BecomeASellerPage() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [acct, setAcct] = useState<AccountStatus | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const payoutReady = Boolean(
    acct?.connected && acct?.detailsSubmitted && acct?.chargesEnabled && acct?.payoutsEnabled,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError("");

        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const meJson = await meRes.json().catch(() => ({}));
        const meUser = meRes.ok ? (meJson?.user as SessionUser) : null;
        if (!cancelled) setUser(meUser || null);

        if (!meUser) {
          if (!cancelled) setBooting(false);
          return;
        }

        const sellerRes = await fetch("/api/marketplace/get-my-seller", {
          credentials: "include",
          cache: "no-store",
        });
        const sellerJson = await sellerRes.json().catch(() => ({}));
        const sellerData = sellerRes.ok ? (sellerJson?.seller as Seller) : null;
        if (!cancelled) setSeller(sellerData || null);

        if (sellerData?._id) {
          const statusRes = await fetch(
            `/api/stripe/account-status?sellerId=${encodeURIComponent(sellerData._id)}`,
            { credentials: "include", cache: "no-store" },
          );
          const statusJson = await statusRes.json().catch(() => ({}));
          if (!cancelled && statusRes.ok) setAcct(statusJson || null);

          const statsRes = await fetch("/api/marketplace/stats", {
            credentials: "include",
            cache: "no-store",
          });
          const statsJson = await statsRes.json().catch(() => ({}));
          if (!cancelled && statsRes.ok) setProductCount(Number(statsJson?.products || 0));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load seller setup state");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.query.refresh]);

  const stage = useMemo(() => {
    if (!user) return "guest" as const;
    if (!seller) return "create_seller" as const;
    if (!payoutReady) return "finish_payout" as const;
    if (productCount <= 0) return "first_product" as const;
    return "ready" as const;
  }, [user, seller, payoutReady, productCount]);

  async function startStripeOnboarding() {
    if (!seller?._id) return;
    setWorking(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId: seller._id,
          email: seller.email || user?.email,
          returnTo: "/marketplace/become-a-seller?refresh=1&stripe=return",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) throw new Error(json?.error || "Failed to start onboarding");
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || "Unable to start Stripe onboarding");
      setWorking(false);
    }
  }

  if (booting) {
    return <div className="min-h-screen bg-black text-white p-8">Loading seller setup…</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-2xl font-extrabold text-[#D4AF37]">Become a Seller</h1>

        <div className="mt-4 rounded border border-white/10 bg-black/30 p-3 text-sm">
          <div>1. {user ? "✅" : "⬜"} Login</div>
          <div>2. {seller ? "✅" : "⬜"} Seller profile</div>
          <div>3. {payoutReady ? "✅" : "⬜"} Stripe payouts</div>
          <div>4. {productCount > 0 ? "✅" : "⬜"} First product</div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        {stage === "guest" ? (
          <div className="mt-5 space-y-3">
            <p className="text-white/75">You need an account before starting seller onboarding.</p>
            <div className="flex gap-2">
              <Link href="/signup" className="rounded bg-[#D4AF37] px-4 py-2 font-bold text-black">Create account</Link>
              <Link href="/login?redirect=/marketplace/become-a-seller" className="rounded border border-white/20 px-4 py-2">Login</Link>
            </div>
          </div>
        ) : null}

        {stage === "create_seller" ? (
          <div className="mt-5 space-y-3">
            <p className="text-white/75">Create your seller profile first.</p>
            <Link href="/signup?accountType=seller" className="inline-block rounded bg-[#D4AF37] px-4 py-2 font-bold text-black">
              Create seller profile
            </Link>
          </div>
        ) : null}

        {stage === "finish_payout" ? (
          <div className="mt-5 space-y-3">
            <p className="text-white/75">Your seller profile exists. Complete Stripe payouts to go live.</p>
            <button onClick={startStripeOnboarding} disabled={working} className="rounded bg-[#D4AF37] px-4 py-2 font-bold text-black disabled:opacity-60">
              {working ? "Redirecting…" : "Complete payout setup"}
            </button>
            {router.query.stripe === "refresh" ? <p className="text-xs text-yellow-300">Stripe setup not finished yet — continue onboarding.</p> : null}
            {router.query.stripe === "return" ? <p className="text-xs text-emerald-300">Welcome back — readiness has been refreshed.</p> : null}
          </div>
        ) : null}

        {stage === "first_product" ? (
          <div className="mt-5 space-y-3">
            <p className="text-white/75">Payouts are ready. Add your first product to start selling.</p>
            <Link href="/marketplace/add-products" className="inline-block rounded bg-[#D4AF37] px-4 py-2 font-bold text-black">Add first product</Link>
          </div>
        ) : null}

        {stage === "ready" ? (
          <div className="mt-5 space-y-3">
            <p className="text-emerald-300">Seller setup is complete. You’re ready to manage inventory and orders.</p>
            <Link href="/marketplace/dashboard" className="inline-block rounded bg-[#D4AF37] px-4 py-2 font-bold text-black">Open seller dashboard</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
