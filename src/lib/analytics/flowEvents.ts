export type FlowEventPayload = {
  eventType: string;
  pageRoute?: string;
  section?: string;
  ctaId?: string;
  ctaLabel?: string;
  destination?: string;
  query?: string;
  accountType?: string;
  isAuthenticated?: boolean;
  environment?: string;
  source?: string;
  category?: string;
  path?: string;
  [key: string]: unknown;
};

export function emitFlowEvent(payload: FlowEventPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    ...payload,
    environment: payload.environment || process.env.NODE_ENV || "unknown",
  });

  const url = "/api/flow-events";
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
}
