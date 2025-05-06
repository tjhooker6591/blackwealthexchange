// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = {
  userId: string;
  email: string;
  accountType: string;
};

export default function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);

  // Fetch session once on mount
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      {/* logo / home */}
      <Link href="/" className="text-xl font-bold">
        MyPlatform
      </Link>

      {/* nav */}
      <nav className="space-x-4">
        {user ? (
          <>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">
              Log&nbsp;In
            </Link>
            <Link href="/signup" className="hover:underline">
              Sign&nbsp;Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
