"use client";

// A small "something's new" dot on the "Pulse" nav link -- the same habit
// mechanic that makes people check social apps out of reflex. Reuses the
// existing notifications system (NotificationBell's own data source)
// rather than building a separate "unseen Pulse content" tracker: a
// member_post/business_update/comment_received notification IS exactly
// "something new happened in your Pulse feed."

import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";

const PULSE_NOTIFICATION_TYPES = new Set([
  "member_post",
  "business_update",
  "comment_received",
  "business_reply",
]);

export default function PulseNavDot() {
  const { user } = useAuth({ silentOnPublic: true });
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = () => {
      fetch("/api/notifications/list", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const items = Array.isArray(data?.notifications)
            ? data.notifications
            : [];
          setHasUnseen(
            items.some(
              (n: any) => !n.read && PULSE_NOTIFICATION_TYPES.has(n.type),
            ),
          );
        })
        .catch(() => null);
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!hasUnseen) return null;

  return (
    <span
      aria-label="New activity on BWE Pulse"
      className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
    />
  );
}
