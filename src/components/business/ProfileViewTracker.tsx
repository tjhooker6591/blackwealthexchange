// src/components/business/ProfileViewTracker.tsx
//
// Records one visit to a business page for "Who viewed your business"
// (src/lib/profileViews.ts). Fire-and-forget; never affects the page.

"use client";

import { useEffect } from "react";

const SESSION_KEY = "bwe_view_sid";

function browserSessionId(): string | null {
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export default function ProfileViewTracker({
  businessId,
  page,
}: {
  businessId: string | null | undefined;
  page: "directory" | "business";
}) {
  useEffect(() => {
    if (!businessId) return;
    try {
      fetch("/api/business/profile-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify({
          businessId,
          page,
          sessionId: browserSessionId(),
        }),
      }).catch(() => {});
    } catch {
      // Never let tracking break the page.
    }
  }, [businessId, page]);

  return null;
}
