// src/components/acquisition/AcquisitionProfileViewTracker.tsx
//
// A tiny client-only component whose only job is firing one profile_view
// acquisition event on mount. Composed into server-rendered pages the same
// way BusinessEngagement.tsx already is, so it never forces the page
// itself to become a client component.

"use client";

import { useEffect } from "react";
import { trackAcquisitionEvent } from "@/lib/acquisition/clientTrack";

export default function AcquisitionProfileViewTracker({
  businessId,
}: {
  businessId: string | null;
}) {
  useEffect(() => {
    trackAcquisitionEvent(businessId, "profile_view");
  }, [businessId]);

  return null;
}
