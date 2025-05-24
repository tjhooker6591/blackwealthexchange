"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

interface BuyNowButtonProps {
  /** Optional explicit userId for local/dev testing */
  userId?: string;
  itemId: string;
  amount: number;
  type: "product" | "ad" | "course" | "job" | "upgrade";
  label?: string;
}

const BuyNowButton: React.FC<BuyNowButtonProps> = ({
  userId: explicitUserId,
  itemId,
  amount,
  type,
  label = "Buy Now",
}) => {
  // Grab session (works in prod)
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id;
  // Decide which ID to use: session wins, fallback to explicit prop (useful on localhost)
  const userId = sessionUserId || explicitUserId;

  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!userId) {
      alert("Please log in to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
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
      if (response.ok && data.url) {
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

  const disabled =
    loading ||
    (status === "loading" && !explicitUserId) ||
    (!userId && status === "unauthenticated");

  return (
    <button
      onClick={handleBuy}
      disabled={disabled}
      className={`${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"} bg-yellow-500 text-black font-semibold px-4 py-2 rounded shadow transition`}
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
};

export default BuyNowButton;