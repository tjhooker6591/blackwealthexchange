// components/BuyNowButton.tsx

"use client";

import React, { useState } from "react";

interface BuyNowButtonProps {
  userId: string;
  itemId: string;
  amount: number; // should be in cents (e.g., 2500 for $25)
  type: "product" | "ad" | "course" | "job" | "upgrade";
  label?: string;
}

const BuyNowButton: React.FC<BuyNowButtonProps> = ({
  userId,
  itemId,
  amount,
  type,
  label = "Buy Now",
}) => {
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
          amount,
          type,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        }),
      });

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe checkout error:", data);
        alert("Checkout failed. Please try again.");
      }
    } catch (err) {
      console.error("Buy now error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`${
        loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
      } bg-yellow-500 text-black font-semibold px-4 py-2 rounded shadow transition`}
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
};

export default BuyNowButton;
