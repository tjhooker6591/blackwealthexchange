"use client";

// Phase 5 -- Save Opportunity. Backs a single Student Hub opportunity
// (scholarship, grant, internship) via /api/user/save-opportunity.ts.

import React, { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function SaveOpportunityButton({
  opportunityId,
  className,
}: {
  opportunityId: string;
  className?: string;
}) {
  const { user } = useAuth({ silentOnPublic: false });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!opportunityId || !user) return;
    fetch("/api/user/save-opportunity", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { opportunities: [] }))
      .then((data) => {
        const list: Array<{ opportunityId: string }> =
          data?.opportunities || [];
        setSaved(list.some((item) => item.opportunityId === opportunityId));
      })
      .catch(() => null);
  }, [opportunityId, user]);

  async function toggle() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/save-opportunity", {
        method: saved ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });
      if (res.ok) setSaved(!saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        className ||
        `inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
          saved
            ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
            : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
        }`
      }
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
