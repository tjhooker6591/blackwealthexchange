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

  useEffect(() => {
    // Fetch /api/auth/me to see if someone is logged in
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <Link href="/">
        <a className="text-xl font-bold">MyPlatform</a>
      </Link>
      <nav className="space-x-4">
        {user ? (
          <>
            <Link href="/dashboard">
              <a className="hover:underline">Dashboard</a>
            </Link>
            <Link href="/profile">
              <a className="hover:underline">Profile</a>
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">
              <a className="hover:underline">Log In</a>
            </Link>
            <Link href="/signup">
              <a className="hover:underline">Sign Up</a>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
