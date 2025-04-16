"use client";

import { useState } from "react";
import clsx from "clsx";           // use clsx/tailwind‑merge/cn – any small helper
import Link from "next/link";
import { Menu } from "lucide-react"; // swap for your icon lib if different

interface Props {
  children: React.ReactNode;
}

export default function DashboardFrame({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* ───── Sidebar / Drawer ───── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:static md:block" // sidebar is always visible on ≥md
        )}
      >
        {/* TODO: drop your existing <nav> items here */}
      </aside>

      {/* ───── Main content ───── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
        <header className="flex items-center justify-between mb-6">
          {/* hamburger only on phones */}
          <button
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
            className="md:hidden rounded p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
          >
            <Menu size={24} />
          </button>

          <h1 className="text-xl font-bold md:text-3xl">
            BWE&nbsp;Global&nbsp;Dashboard
          </h1>

          {/* CTA appears on ≥md so it never overlaps cards */}
          <Link
            href="/pricing"
            className="hidden md:inline-block rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition"
          >
            Upgrade&nbsp;to&nbsp;Premium
          </Link>
        </header>

        {children}
      </main>
    </div>
  );
}
