"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

type User = { id?: string; _id?: string; email: string };
type Seller = { _id: string; stripeAccountId?: string; email: string };
type AccountStatus = {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted?: boolean;
};

export default function BecomeASellerPage() {
  const router = useRouter();

  const refreshFlag = useMemo(() => {
    const q = router.query.refresh;
    return Array.isArray(q) ? q[0] : q;
  }, [router.query.refresh]);

  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [acctStatus, setAcctStatus] = useState<AccountStatus | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    businessPhone: "",
    businessAddress: "",
    description: "",
    website: "",
    agreed: false,
  });

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [error, setError] = useState("");

  const loadSellerAndStatus = async () => {
    try {
      const res = await fetch("/api/marketplace/get-my-seller", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      if (!data?.seller) return;

      setSeller(data.seller);

      if (data.seller.stripeAccountId) {
        const acctRes = await fetch(
          `/api/stripe/account-status?sellerId=${encodeURIComponent(data.seller._id)}`,
          { credentials: "include", cache: "no-store" },
        );
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          setAcctStatus(acctData);
        }
      }

      const statsRes = await fetch("/api/marketplace/stats", {
        credentials: "include",
        cache: "no-store",
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setProductCount(Number(statsData?.products || 0));
      }
    } catch (err) {
      console.error("Error loading seller info", err);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    (async () => {
      setBootLoading(true);
      setError("");

      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meRes.json();
        const u = meData?.user as User;
        if (!u?.email) {
          router.replace("/login");
          return;
        }

        setUser(u);
        setForm((f) => ({ ...f, email: u.email }));

        await loadSellerAndStatus();
      } catch (err) {
        console.error("Error fetching user", err);
        setError("Failed to load your account. Please refresh and try again.");
      } finally {
        setBootLoading(false);
      }
    })();
    // if Stripe redirects back with ?refresh=1, re-check status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, refreshFlag]);

  const startOnboarding = async (sellerOverride?: Seller) => {
    setError("");
    setOnboardingLoading(true);
    try {
      const s = sellerOverride || seller;
      const payload = {
        sellerId: s?._id,
        email: s?.email || form.email,
        returnTo: "/marketplace/become-a-seller?refresh=1&stripe=return",
      };

      const res = await fetch("/api/stripe/create-account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Onboarding error");

      router.replace(data.url);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Stripe onboarding failed.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to register as a seller.");
      return;
    }
    if (!form.agreed) {
      setError("You must agree to the marketplace terms to continue.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const payload = {
        userId: user.id || user._id,
        businessName: form.businessName.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
        businessPhone: form.businessPhone.trim(),
        email: form.email.trim(),
        businessAddress: form.businessAddress.trim(),
        accountType: "seller",
      };

      const res = await fetch("/api/marketplace/create-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setSeller(data.seller);
      await startOnboarding(data.seller);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const profileReady = Boolean(seller);
  const payoutReady = Boolean(
    seller && acctStatus?.charges_enabled && acctStatus?.payouts_enabled,
  );
  const firstProductReady = productCount > 0;

  const steps = [
    { label: "Create seller profile", done: profileReady },
    { label: "Enable Stripe payouts", done: payoutReady },
    { label: "Add first product", done: firstProductReady },
  ];

  const setupProgress = (
    <div className="mb-4 rounded border border-gray-700 bg-gray-900 p-3 text-sm">
      <p className="text-gold font-semibold">Seller Setup Progress</p>
      <div className="mt-2 space-y-1 text-gray-200">
        {steps.map((s, i) => (
          <div key={s.label}>
            {i + 1}. {s.done ? "✅" : "⬜"} {s.label}
          </div>
        ))}
      </div>
    </div>
  );

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-gray-300">Loading…</div>
      </div>
    );
  }

  // Fully onboarded UI
  if (seller && acctStatus?.charges_enabled && acctStatus?.payouts_enabled) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full p-6">
          <CardContent>
            {setupProgress}
            <h1 className="text-2xl font-bold mb-2 text-gold">
              {firstProductReady ? "Seller Setup Complete" : "You’re Almost Done"}
            </h1>
            <p className="mb-4 text-gray-300">
              {firstProductReady
                ? "Your payout account is verified and you already have product listings."
                : "Your payout account is verified. Next step: add your first product."}
            </p>

            <Button
              onClick={() => router.push("/marketplace/add-products")}
              className="w-full"
            >
              Add Your First Product
            </Button>

            <Link
              href="/marketplace/dashboard"
              className="block text-center text-sm text-gray-400 mt-3 hover:text-gray-200"
            >
              Go to Seller Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registered but not onboarded
  if (seller) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full p-6">
          <CardContent>
            {setupProgress}
            <h1 className="text-2xl font-bold mb-2 text-gold">
              Complete Payout Setup
            </h1>
            <p className="mb-4 text-gray-300">
              Finish Stripe onboarding to receive payouts, then return here to continue.
            </p>

            {router.query.stripe === "refresh" ? (
              <p className="text-yellow-300 mb-3 text-sm">
                Stripe setup wasn’t finished yet. Continue onboarding to complete payout readiness.
              </p>
            ) : null}

            {router.query.stripe === "return" ? (
              <p className="text-green-300 mb-3 text-sm">
                Welcome back from Stripe. We rechecked your readiness above.
              </p>
            ) : null}

            {error ? (
              <p className="text-red-500 mb-4 text-sm">{error}</p>
            ) : null}

            <Button
              onClick={() => startOnboarding()}
              className="w-full"
              disabled={onboardingLoading}
            >
              {onboardingLoading ? "Redirecting…" : "Finish Stripe Onboarding"}
            </Button>

            <Link
              href="/marketplace/dashboard"
              className="block text-center text-sm text-gray-400 mt-3 hover:text-gray-200"
            >
              Back to Seller Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New seller registration form
  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <Card className="max-w-2xl w-full p-6">
        <CardContent>
          {setupProgress}
          <h1 className="text-2xl font-bold text-gold mb-2">Become a Seller</h1>

          <p className="text-gray-400 mb-2 text-sm">
            Complete this profile first. Next step after submit is Stripe payout setup.
          </p>

          <p className="text-gray-400 mb-6 text-sm">
            <strong className="text-gold">Important:</strong> We collect a 10%
            platform fee on each completed sale. Sellers receive the remainder
            via Stripe Connect payouts.
          </p>

          {error ? <p className="text-red-500 mb-4 text-sm">{error}</p> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Business name"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              required
            />
            <input
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Business email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Business phone"
              value={form.businessPhone}
              onChange={(e) =>
                setForm({ ...form, businessPhone: e.target.value })
              }
            />
            <input
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Business address"
              value={form.businessAddress}
              onChange={(e) =>
                setForm({ ...form, businessAddress: e.target.value })
              }
            />
            <input
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Website (optional)"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
            <textarea
              className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
              placeholder="Tell buyers about your business"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
            />

            <label className="flex items-start gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
              />
              <span>
                I agree to the marketplace terms and understand platform fees.
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Create Seller Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
