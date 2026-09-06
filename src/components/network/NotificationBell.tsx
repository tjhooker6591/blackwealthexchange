"use client";

// Phase 5 -- Notifications bell, mounted in NavBar's account area. Polls
// the caller's own real notifications (/api/notifications/list.ts) -- no
// fabricated counts or items.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string | null;
};

export default function NotificationBell() {
  const { user } = useAuth({ silentOnPublic: true });
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/notifications/list", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // leave state as-is on fetch failure
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }).catch(() => null);
      setUnreadCount(0);
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative rounded-lg px-2.5 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-extrabold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
          <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white/50">
            Notifications
          </div>
          {items.length === 0 ? (
            <div className="px-2 py-4 text-sm text-white/60">
              Nothing yet — activity on things you follow and save shows up
              here.
            </div>
          ) : (
            <div className="max-h-96 space-y-0.5 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || "/notifications"}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-white/5"
                >
                  <div className="font-semibold text-white/90">
                    {item.title}
                  </div>
                  {item.body ? (
                    <div className="mt-0.5 truncate text-xs text-white/60">
                      {item.body}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-2 py-2 text-center text-xs font-bold text-[#D4AF37] hover:bg-white/5"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
