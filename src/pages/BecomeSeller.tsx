import React, { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const BecomeSeller: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save the seller record in your database
      const sellerRes = await fetch("/api/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!sellerRes.ok) {
        throw new Error("Seller registration failed");
      }

      // 2. Create Stripe Express account link and redirect
      const linkRes = await fetch("/api/stripe/create-account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!linkRes.ok) {
        throw new Error("Failed to create Stripe onboarding link");
      }
      const { url } = await linkRes.json();
      // Redirect user to Stripe onboarding
      router.replace(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
              onChange={handleChange}
              required
            />
            <Input
              name="ownerName"
              placeholder="Owner's Name"
              value={formData.ownerName}
              onChange={handleChange}
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              name="website"
              placeholder="Website (optional)"
              value={formData.website}
              onChange={handleChange}
            />
            <textarea
              name="description"
              placeholder="Business Description"
              value={formData.description}
              onChange={handleChange}
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
};

export default BecomeSeller;

