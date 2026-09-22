// src/lib/acquisition/clientTrack.ts
//
// Browser-side helper for the acquisition event envelope -- deliberately
// separate from src/lib/analytics/flowEvents.ts (see events.ts header
// comment). Fire-and-forget, non-blocking, never throws into the caller.

export function trackAcquisitionEvent(
  businessId: string | null | undefined,
  eventType:
    | "profile_view"
    | "website_click"
    | "phone_click"
    | "directions_click"
    | "storefront_view",
) {
  if (typeof window === "undefined" || !businessId) return;
  try {
    const body = JSON.stringify({ businessId, eventType });
    const url = "/api/acquisition/events";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let tracking break the page.
  }
}
