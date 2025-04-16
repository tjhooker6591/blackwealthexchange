// src/components/NavBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

type SessionUser = {
  accountType: "user" | "seller" | "business" | "employer";
};

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();

  /* ───────────────── fetch session helper ───────────────── */
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser({ accountType: data.user.accountType });
    } catch {
      setUser(null);
    }
  };

  /* run on mount AND whenever route changes inside the SPA */
  useEffect(() => {
    fetchSession();
  }, [router.pathname]);

  /* ───────────────── LOGOUT (key edit) ───────────────── */
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    /* reload so NavBar re‑renders with cleared cookies */
    router.reload();
  };

  /* pick correct dashboard link */
  const dashboardHref = user
    ? user.accountType === "seller"
      ? "/marketplace/dashboard"
      : user.accountType === "business"
        ? "/add-business"
        : user.accountType === "employer"
          ? "/employer/jobs"
          : "/dashboard"
    : "/dashboard";

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/bwe-logo.png" alt="BWE Logo" width={40} height={40} />
          <span className="text-gold font-bold truncate">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/about" className="hover:text-gold font-semibold">
            About
          </Link>
          <Link href="/global-timeline" className="hover:text-gold font-semibold">
            Journey
          </Link>

          {/* Single Menu Dropdown */}
          <div className="relative group">
            <button className="hover:text-gold font-semibold">Menu</button>
            <div className="absolute left-0 mt-2 w-48 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <div className="py-2">
                <span className="block px-4 py-1 font-bold">
                  Student Resources
                </span>
                <Link
                  href="/black-student-opportunities/grants"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Grants
                </Link>
                <Link
                  href="/black-student-opportunities/scholarships"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Scholarships
                </Link>
                <Link
                  href="/black-student-opportunities/internships"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Internships
                </Link>
                <Link
                  href="/black-student-opportunities/mentorship"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Mentorship
                </Link>
                <hr className="my-1" />
                <Link
                  href="/business-directory"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Business Directory
                </Link>
                <Link
                  href="/financial-literacy"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Financial 101
                </Link>
                <Link
                  href="/real-estate-investment"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Housing & Lending
                </Link>
                <Link
                  href="/black-entertainment-news"
                  className="block px-4 py-1 hover:bg-gray-100"
                >
                  Entertainment
                </Link>
              </div>
            </div>
          </div>

          {/* Auth Links */}
          {user ? (
            <>
              <Link href={dashboardHref} className="hover:text-gold font-semibold">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-red-500 font-semibold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold font-semibold">
                Log In
              </Link>
              <Link href="/signup" className="hover:text-gold font-semibold">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden flex items-center justify-center h-10 px-4 bg-gold text-black rounded-full shadow hover:bg-yellow-500 transition"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="ml-2 font-semibold">Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold px-4 pb-4 space-y-2">
          {/* Primary Links */}
          <Link
            href="/about"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/global-timeline"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Journey
          </Link>

          {/* Student Resources */}
          <details className="py-2">
            <summary className="font-semibold cursor-pointer hover:text-gold">
              Student Resources
            </summary>
            <div className="pl-4 mt-1 space-y-1">
              <Link
                href="/black-student-opportunities/grants"
                className="block hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Grants
              </Link>
              <Link
                href="/black-student-opportunities/scholarships"
                className="block hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Scholarships
              </Link>
              <Link
                href="/black-student-opportunities/internships"
                className="block hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Internships
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="block hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mentorship
              </Link>
            </div>
          </details>

          {/* Other Resources */}
          <Link
            href="/business-directory"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Business Directory
          </Link>
          <Link
            href="/financial-literacy"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Financial 101
          </Link>
          <Link
            href="/real-estate-investment"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Housing & Lending
          </Link>
          <Link
            href="/black-entertainment-news"
            className="block py-2 hover:text-gold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Entertainment
          </Link>

          <hr className="border-gray-700 my-2" />

          {/* Auth Links */}
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="block py-2 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 hover:text-red-500 font-semibold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block py-2 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block py-2 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

