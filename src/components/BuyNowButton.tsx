// components/BuyNowButton.tsx

import { useState } from "react";

interface BuyNowButtonProps {
  userId: string;
  itemId: string;
  amount: number;
  type: "product" | "ad" | "course" | "job" | "upgrade"; // ✅ extended types
  label?: string; // Optional button label if needed
}

export default function BuyNowButton({
  userId,
  itemId,
  amount,
  type,
  label = "Buy Now",
}: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          itemId,
          type,
          amount,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe error:", data);
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("There was a problem starting checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded shadow transition"
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
}
