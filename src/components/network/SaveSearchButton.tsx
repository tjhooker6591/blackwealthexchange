"use client";

// Phase 5 -- Save Search / Job Alerts / Scholarship Alerts / Product Alerts.
// One reusable button backing all of these: it writes a saved_searches row
// for the given `domain` via /api/user/save-search.ts. Alerts for a domain
// are just a saved search with alertsEnabled -- see
// scripts/network-alerts-scan.mjs for how real new matches turn into real
// notifications.

import React, { useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function SaveSearchButton({
  domain,
  query,
  filters,
  label,
  alertLabel = "Get alerts",
  className,
}: {
  domain: "jobs" | "scholarships" | "products" | "directory" | "universal";
  query: string;
  filters?: Record<string, unknown>;
  label?: string;
  alertLabel?: string;
  className?: string;
}) {
  const { user } = useAuth({ silentOnPublic: false });
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function handleSave() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setBusy(true);
    setState("idle");
    try {
      const res = await fetch("/api/user/save-search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          query,
          filters: filters || {},
          label: label || query,
          alertsEnabled: true,
        }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={busy || state === "saved"}
      className={
        className ||
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
      }
    >
      {state === "saved"
        ? "Saved — you'll get alerts"
        : busy
          ? "Saving…"
          : alertLabel}
    </button>
  );
}
