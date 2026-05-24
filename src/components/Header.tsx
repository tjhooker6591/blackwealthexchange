// src/components/Header.tsx
"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        MyPlatform
      </Link>

      <nav className="space-x-4">
        <Link href="/login" className="hover:underline">
          Log&nbsp;In
        </Link>
        <Link href="/signup" className="hover:underline">
          Sign&nbsp;Up
        </Link>
      </nav>
    </header>
  );
}
