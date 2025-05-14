"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

// Types for user, seller, and Stripe account status
type User = { id: string; email: string };
type Seller = { _id: string; stripeAccountId?: string; email: string };
type AccountStatus = { charges_enabled: boolean; payouts_enabled: boolean };

export default function BecomeASellerPage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // On mount: fetch current user, then seller record and Stripe status
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }
        const { user } = await meRes.json();
        setUser(user);
        setForm(f => ({ ...f, email: user.email }));
      } catch (err) {
        console.error("Error fetching user", err);
        return;
      }
      try {
        const res = await fetch("/api/marketplace/get-my-seller");
        if (res.ok) {
          const { seller } = await res.json();
          setSeller(seller);
          if (seller.stripeAccountId) {
            const acctRes = await fetch(
              `/api/stripe/account-status?sellerId=${seller._id}`
            );
            if (acctRes.ok) {
              const acctData = await acctRes.json();
              setAcctStatus(acctData);
            }
          }
        }
      } catch (err) {
        console.error("Error loading seller info", err);
      }
    })();
  }, [router]);

  // Begin Stripe onboarding or update
  const startOnboarding = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = { email: seller?.email || form.email };
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
      setError(e.message);
      setLoading(false);
    }
  };

  // Handle new seller registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to register as a seller.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        userId: user.id,
        businessName: form.businessName,
        description: form.description,
        website: form.website,
        businessPhone: form.businessPhone,
        email: form.email,
        businessAddress: form.businessAddress,
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
      await startOnboarding();
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setLoading(false);
    }
  };

  // Fully onboarded UI
  if (seller && acctStatus?.charges_enabled && acctStatus?.payouts_enabled) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <Card className="max-w-lg w-full p-6">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4 text-gold">You’re All Set!</h1>
            <p className="mb-4">Your payout account is verified.</p>
            <Button
              onClick={() => router.push("/marketplace/add-product")}
              className="w-full"
            >
              Add Your First Product
            </Button>
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
            <h1 className="text-2xl font-bold mb-4 text-gold">Complete Payout Setup</h1>
            <p className="mb-4">
              To get paid to your bank or instant-payout card, finish Stripe onboarding.
            </p>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <Button
              onClick={startOnboarding}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Redirecting…" : "Finish Stripe Onboarding"}
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
          <h1 className="text-2xl font-bold text-gold mb-4">Become a Seller</h1>
          <p className="text-gray-400 mb-6 text-sm">
            <strong className="text-gold">Important:</strong> We collect a 10% platform fee
            on each completed sale. Sellers receive the remainder via Stripe Connect payouts.
          </p>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm mb-1">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm mb-1">
                Business Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="businessPhone" className="block text-sm mb-1">
                Business Phone
              </label>
              <input
                id="businessPhone"
                type="tel"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.businessPhone}
                onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="businessAddress" className="block text-sm mb-1">
                Business Address
              </label>
              <input
                id="businessAddress"
                type="text"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.businessAddress}
                onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm mb-1">
                Business Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm mb-1">
                Website or Social Media (optional)
              </label>
              <input
                id="website"
                type="url"
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div className="flex items-center">
              <input
                id="agree"
                type="checkbox"
                className="mr-2"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                required
              />
              <label htmlFor="agree" className="text-sm">
                I agree to the marketplace terms and conditions.
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Create Seller Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
