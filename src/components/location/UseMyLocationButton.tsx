"use client";

// Phase 7 -- Location-Aware Discovery. Explicit opt-in only: nothing runs
// until the user clicks this button, which triggers the browser's own
// native Geolocation permission prompt. Denial, unavailability, and
// timeout are all handled gracefully -- normal (non-location) search
// keeps working exactly as before either way. No location is ever stored;
// the resolved city/state is handed to the caller and forgotten.

import React, { useState } from "react";

export type ResolvedLocation = { city: string | null; state: string | null };

export default function UseMyLocationButton({
  onResolved,
  className,
  label = "Use my location",
}: {
  onResolved: (location: ResolvedLocation) => void;
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "locating" | "denied" | "error"
  >("idle");

  function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/v1/location/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setStatus("error");
            return;
          }
          setStatus("idle");
          onResolved({ city: data.data.city, state: data.data.state });
        } catch {
          setStatus("error");
        }
      },
      (err) => {
        // PERMISSION_DENIED, POSITION_UNAVAILABLE, or TIMEOUT -- all
        // treated as a graceful no-location state, never a hard failure.
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "locating"}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
        }
      >
        {status === "locating" ? "Locating…" : label}
      </button>
      {status === "denied" ? (
        <span className="text-[11px] text-white/45">
          Location permission denied -- search still works without it.
        </span>
      ) : null}
      {status === "error" ? (
        <span className="text-[11px] text-white/45">
          Couldn&apos;t determine your location -- search still works without
          it.
        </span>
      ) : null}
    </div>
  );
}
