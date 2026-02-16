// src/components/BuyNowButton.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

interface BuyNowButtonProps {
  userId?: string; // optional explicit id for dev/testing
  itemId: string;
  amount: number; // not used for product checkout (server uses DB)
  type: "product" | "ad" | "course" | "job" | "upgrade";
  label?: string;
  className?: string;
}

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function BuyNowButton({
  userId: explicitUserId,
  itemId,
  amount,
  type,
  label = "Buy Now",
  className,
}: BuyNowButtonProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Custom auth check (cookie-based)
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!mounted) return;

        if (!res.ok) {
          setSessionUserId(null);
          setAuthState("unauthenticated");
          return;
        }

        const data = await res.json();
        const id = data?.user?._id || data?.user?.id || data?._id || data?.id || null;
        setSessionUserId(id ? String(id) : null);
        setAuthState(id ? "authenticated" : "unauthenticated");
      } catch {
        if (!mounted) return;
        setSessionUserId(null);
        setAuthState("unauthenticated");
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  const userId = useMemo(
    () => sessionUserId || explicitUserId || null,
    [sessionUserId, explicitUserId],
  );

  async function handleBuy() {
    setMsg(null);
    setLoading(true);

    try {
      // ✅ Product checkout: do NOT require login (per your marketplace rule)
      if (type === "product") {
        const res = await fetch("/api/checkout/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId: itemId }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // ✅ Graceful messages (no throw)
          if (data?.code === "SELLER_NOT_READY") {
            setMsg(data.message);
            return;
          }
          setMsg(data?.message || data?.error || "Checkout is unavailable right now.");
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        }

        setMsg("Checkout is unavailable right now (missing redirect URL).");
        return;
      }

      // ✅ Other purchase types: require login
      if (!userId) {
        setMsg("Please log in to continue.");
        return;
      }

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

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.url) {
        window.location.href = data.url;
        return;
      }

      setMsg(data?.message || data?.error || "Checkout failed. Please try again.");
    } catch (err: any) {
      console.error("BuyNowButton error:", err);
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Disable rules:
  // - product: only disable during click
  // - other types: disable until auth is known and user is logged in
  const disabled =
    loading ||
    (type !== "product" && (authState === "loading" && !explicitUserId)) ||
    (type !== "product" && !userId);

  const defaultClass =
    "w-full bg-yellow-500 text-black font-semibold px-4 py-2 rounded shadow transition";
  const stateClass = disabled
    ? "opacity-60 cursor-not-allowed"
    : "hover:bg-yellow-600";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleBuy}
        disabled={disabled}
        className={className ? className : `${defaultClass} ${stateClass}`}
      >
        {loading ? "Redirecting…" : label}
      </button>

      {msg ? (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
