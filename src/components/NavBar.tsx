"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Destination for dashboard based on user type
  const dashboardHref =
    user?.accountType === "seller"
      ? "/marketplace/dashboard"
      : user?.accountType === "employer"
        ? "/employer/jobs"
        : user?.accountType === "business"
          ? "/dashboard/business/profile"
          : "/dashboard";

  const profileHref =
    user?.accountType === "business"
      ? "/dashboard/business/profile"
      : "/profile";

  // Helper for mobile nav actions
  const handleMobileNav = (href?: string) => {
    setMobileMenuOpen(false);
    if (href) router.push(href);
  };

  return (
    <nav className="relative z-50 border-b border-white/5 bg-black text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/favicon.png"
            alt="BWE Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <span className="truncate text-base font-extrabold text-[#D4AF37] sm:text-lg">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center space-x-5 md:flex">
          <Link
            href="/start-here"
            className="font-semibold text-[#D4AF37] transition-colors hover:text-yellow-300"
          >
            Start Here
          </Link>
          <Link
            href="/business-directory"
            className="font-semibold transition-colors hover:text-[#D4AF37]"
          >
            Directory
          </Link>
          <Link
            href="/marketplace"
            className="font-semibold transition-colors hover:text-[#D4AF37]"
          >
            Marketplace
          </Link>
          <Link
            href="/job-listings"
            className="font-semibold transition-colors hover:text-[#D4AF37]"
          >
            Jobs
          </Link>
          <Link
            href="/resources"
            className="font-semibold transition-colors hover:text-[#D4AF37]"
          >
            Resources
          </Link>
          <Link
            href="/trust"
            className="font-semibold transition-colors hover:text-[#D4AF37]"
          >
            Trust
          </Link>

          {loading ? null : user ? (
            <>
              <Link
                href={dashboardHref}
                className="font-semibold transition-colors hover:text-[#D4AF37]"
              >
                Dashboard
              </Link>

              <Link
                href={profileHref}
                className="font-semibold transition-colors hover:text-[#D4AF37]"
              >
                Profile
              </Link>

              <button
                onClick={logout}
                className="font-semibold transition-colors hover:text-red-500"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-semibold transition-colors hover:text-[#D4AF37]"
              >
                Log In
              </Link>

              <Link
                href="/signup"
                className="font-semibold transition-colors hover:text-[#D4AF37]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white/[0.04] text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-sm transition md:hidden ${
            mobileMenuOpen
              ? "border-[#D4AF37]/55 text-[#D4AF37] ring-1 ring-[#D4AF37]/30"
              : "border-white/15 hover:border-[#D4AF37]/45 hover:text-[#D4AF37]"
          }`}
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M4 12h16M4 17h16"
              />
            )}
          </svg>
          <span className="sr-only">
            {mobileMenuOpen ? "Close menu" : "Open menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-[#D4AF37]/20 bg-black/95 px-3 pb-4 pt-3 md:hidden"
        >
          <div className="mx-auto max-w-md space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/45">
              <span aria-hidden="true">🔎</span>
              <span>Explore</span>
            </div>
            <Link
              href="/start-here"
              className="block rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-2.5 font-semibold text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Start here
            </Link>
            <Link
              href="/business-directory"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Find Black-owned businesses
            </Link>
            <Link
              href="/marketplace"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Shop Black-owned products
            </Link>
            <Link
              href="/job-listings"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Browse jobs
            </Link>
            <Link
              href="/resources"
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Financial resources
            </Link>
            <Link
              href="/trust"
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Trust center
            </Link>
            <div className="my-2 h-px bg-white/10" />
            <div className="flex items-center gap-1.5 px-1 pb-1 pt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/45">
              <span aria-hidden="true">🚀</span>
              <span>Build on BWE</span>
            </div>
            <Link
              href="/business-directory/add-business"
              className="block rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2.5 font-semibold text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Get your business listed
            </Link>
            <Link
              href="/marketplace/become-a-seller"
              className="block rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2.5 font-semibold text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Start selling on BWE
            </Link>

            <div className="my-2 h-px bg-white/10" />
            <div className="flex items-center gap-1.5 px-1 pb-1 pt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/45">
              <span aria-hidden="true">👤</span>
              <span>Account</span>
            </div>

            {loading ? null : user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Dashboard
                </Link>

                <Link
                  href={profileHref}
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Profile
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left font-semibold text-white/85 transition-colors hover:bg-white/[0.04] hover:text-red-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
