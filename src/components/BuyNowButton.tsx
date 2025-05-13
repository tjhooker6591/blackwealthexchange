// components/BuyNowButton.tsx

"use client";

import React, { useState } from "react";

interface BuyNowButtonProps {
  userId: string;        // Buyer ID passed from parent
  itemId: string;
  amount: number;        // amount in dollars (e.g. 49.99)
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
    if (!userId) {
      console.error("No user ID provided to BuyNowButton");
      alert("Please log in to continue.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        console.error("Stripe checkout error:", data.error || data);
        alert(data.error || "Checkout failed. Please try again.");
      }
    } catch (err) {
      console.error("Buy now error:", err);
      alert("Something went wrong. Please try again.");
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

