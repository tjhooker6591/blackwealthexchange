"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

type User = { id?: string; _id?: string; email: string };
type Seller = { _id: string; stripeAccountId?: string; email: string };
type AccountStatus = { charges_enabled: boolean; payouts_enabled: boolean };

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
  const [error, setError] = useState("");

  const loadSellerAndStatus = async () => {
    try {
      const res = await fetch("/api/marketplace/get-my-seller");
      if (!res.ok) return;

      const data = await res.json();
      if (!data?.seller) return;

      setSeller(data.seller);

      if (data.seller.stripeAccountId) {
        const acctRes = await fetch(
          `/api/stripe/account-status?sellerId=${encodeURIComponent(data.seller._id)}`,
        );
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          setAcctStatus(acctData);
        }
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
        // optional: returnTo: "/marketplace/become-a-seller?refresh=1"
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
            <h1 className="text-2xl font-bold mb-2 text-gold">You’re All Set!</h1>
            <p className="mb-4 text-gray-300">Your payout account is verified.</p>

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
            <h1 className="text-2xl font-bold mb-2 text-gold">Complete Payout Setup</h1>
            <p className="mb-4 text-gray-300">
              Finish Stripe onboarding to receive payouts.
            </p>

            {error ? <p className="text-red-500 mb-4 text-sm">{error}</p> : null}

            <Button
              onClick={() => startOnboarding()}
              className="w-full"
              disabled={onboardingLoading}
            >
              {onboardingLoading ? "Redirecting…" : "Finish Stripe Onboarding"}
            </Button>
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
          <h1 className="text-2xl font-bold text-gold mb-2">Become a Seller</h1>

          <p className="text-gray-400 mb-6 text-sm">
            <strong className="text-gold">Important:</strong> We collect a 10% platform fee on each
            completed sale. Sellers receive the remainder via Stripe Connect payouts.
          </p>

          {error ? <p className="text-red-500 mb-4 text-sm">{error}</p> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* same inputs you already have… */}
            {/* button */}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Create Seller Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
