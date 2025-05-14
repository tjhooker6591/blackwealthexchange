// pages/BecomeSeller.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

type User = { id: string; email: string };
type Seller = { _id: string; stripeAccountId?: string };
type AccountStatus = { charges_enabled: boolean; payouts_enabled: boolean };

export default function BecomeSeller() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [acctStatus, setAcctStatus] = useState<AccountStatus | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);

  // 1) Fetch current user, then seller & Stripe status
  useEffect(() => {
    (async () => {
      // a) get the logged-in user
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.replace("/login");
        return;
      }
      const { user } = (await meRes.json()) as { user: User };
      setUser(user);

      // b) see if they already have a seller record
      const sellerRes = await fetch("/api/sellers/me");
      if (sellerRes.ok) {
        const { seller } = (await sellerRes.json()) as { seller: Seller };
        setSeller(seller);

        // c) if they have a stripeAccountId, fetch its status
        if (seller.stripeAccountId) {
          const acctRes = await fetch(
            `/api/stripe/account-status?sellerId=${seller._id}`,
          );
          if (acctRes.ok) {
            const data = (await acctRes.json()) as AccountStatus;
            setAcctStatus(data);
          }
        }
      }

      setLoading(false);
    })();
  }, [router]);

  // helper to start or update onboarding
  const startOnboarding = async () => {
    setLoading(true);
    const linkRes = await fetch("/api/stripe/create-account-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user!.email }),
    });
    const { url } = await linkRes.json();
    router.replace(url);
  };

  // handle initial seller registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, userId: user!.id }),
    });
    if (!res.ok) {
      alert("Registration failed");
      setLoading(false);
      return;
    }
    // then start Stripe onboarding
    await startOnboarding();
  };

  if (loading) {
    return <p className="text-center p-4">Loading…</p>;
  }

  // 2a) fully onboarded
  if (seller && acctStatus?.charges_enabled && acctStatus?.payouts_enabled) {
    return (
      <Card className="max-w-lg mx-auto mt-10 p-6">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">You’re All Set!</h1>
          <p>Your payout account is verified.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/marketplace/add-product")}
          >
            Add Your First Product
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2b) registered as seller but Stripe not enabled
  if (seller) {
    return (
      <Card className="max-w-lg mx-auto mt-10 p-6">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Complete Payout Setup</h1>
          <p>
            To get paid directly to your bank (or via instant‐payout card),
            complete Stripe’s secure onboarding.
          </p>
          <Button
            className="mt-4 w-full"
            onClick={startOnboarding}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Finish Stripe Onboarding"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2c) brand new seller: show registration form
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg w-full p-6 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Become a Seller</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) =>
                setFormData((f) => ({ ...f, businessName: e.target.value }))
              }
              required
            />
            <Input
              name="ownerName"
              placeholder="Owner's Name"
              value={formData.ownerName}
              onChange={(e) =>
                setFormData((f) => ({ ...f, ownerName: e.target.value }))
              }
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            <Input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData((f) => ({ ...f, phone: e.target.value }))
              }
              required
            />
            <Input
              name="website"
              placeholder="Website (optional)"
              value={formData.website}
              onChange={(e) =>
                setFormData((f) => ({ ...f, website: e.target.value }))
              }
            />
            <textarea
              name="description"
              placeholder="Business Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full p-2 border rounded-md"
              rows={4}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Redirecting…" : "Submit & Onboard with Stripe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
