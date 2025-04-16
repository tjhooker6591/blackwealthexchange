"use client";

import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, LogOut } from "lucide-react";

export default function DashboardFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  /* sign‑out click */
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* ───── Sidebar / Drawer ───── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:static md:block",
        )}
      >
        <nav className="p-6 space-y-4">
          <Link href="/dashboard" className="block hover:text-yellow-400">
            Dashboard
          </Link>
          <Link href="/profile" className="block hover:text-yellow-400">
            Profile
          </Link>
          <Link href="/settings" className="block hover:text-yellow-400">
            Settings
          </Link>

          {/* sign‑out */}
          <button
            onClick={handleLogout}
            className="mt-8 flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign&nbsp;Out
          </button>
        </nav>
      </aside>

      {/* ───── Main ───── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-10 min-w-0">
        <header className="flex items-center justify-between mb-6">
          {/* burger only on phones */}
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
