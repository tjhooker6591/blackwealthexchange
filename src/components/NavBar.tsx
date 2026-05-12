"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

type DesktopMenu = "explore" | "account" | null;

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<DesktopMenu>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const { user, loading, logout } = useAuth({ silentOnPublic: true });

  const dashboardHref =
    user?.accountType === "seller"
      ? "/marketplace/dashboard"
      : user?.accountType === "employer"
        ? "/employer/jobs"
        : user?.accountType === "business"
          ? "/dashboard/edit-business"
          : "/dashboard";

  const profileHref =
    user?.accountType === "business" ? "/dashboard/edit-business" : "/profile";

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(null);
  };

  const handleItemClick = () => {
    closeAllMenus();
  };

  useEffect(() => {
    const onRouteStart = () => closeAllMenus();
    router.events.on("routeChangeStart", onRouteStart);
    return () => router.events.off("routeChangeStart", onRouteStart);
  }, [router.events]);

  useEffect(() => {
    const hotRoutes = [
      "/",
      "/business-directory",
      "/marketplace",
      "/job-listings",
      "/advertising",
      "/support",
      "/login",
      "/signup",
      "/admin/command-center",
    ];
    hotRoutes.forEach((r) => router.prefetch(r).catch(() => {}));
  }, [router]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative z-50 border-b border-white/5 bg-black text-white"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          onClick={handleItemClick}
          className="flex min-w-0 items-center gap-2 lg:max-w-[220px] xl:max-w-none"
        >
          <Image
            src="/favicon.png"
            alt="BWE Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <span className="hidden truncate text-base font-extrabold text-[#D4AF37] xl:inline">
            Black Wealth Exchange
          </span>
          <span className="truncate text-base font-extrabold text-[#D4AF37] xl:hidden">
            BWE
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/start-here"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Start Here
          </Link>
          <Link
            href="/business-directory"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Search &amp; Directory
          </Link>
          <Link
            href="/marketplace"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Marketplace
          </Link>
          <Link
            href="/jobs"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Jobs
          </Link>
          <Link
            href="/advertising"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Advertising
          </Link>
          <Link
            href="/financial-literacy"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Learn
          </Link>
          <Link
            href="/support"
            onClick={handleItemClick}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
          >
            Support
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setDesktopMenuOpen((prev) =>
                  prev === "explore" ? null : "explore",
                )
              }
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
              aria-expanded={desktopMenuOpen === "explore"}
            >
              Explore
            </button>
            {desktopMenuOpen === "explore" && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
                <Link
                  href="/black-card"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Black Card
                </Link>
                <Link
                  href="/affiliate"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Earn with BWE
                </Link>
                <Link
                  href="/black-entertainment-news"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Culture &amp; Entertainment
                </Link>
                <Link
                  href="/music"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Music
                </Link>
                <Link
                  href="/black-student-opportunities"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Student Opportunities
                </Link>
                <Link
                  href="/wealth-builder"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Wealth Builder
                </Link>
                <Link
                  href="/travel-map/explore"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  Travel Map
                </Link>
                <a
                  href="https://www.youtube.com/@blackwealthexchangesociety8390"
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                >
                  BWE Live
                </a>
              </div>
            )}
          </div>

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() =>
                setDesktopMenuOpen((prev) =>
                  prev === "account" ? null : "account",
                )
              }
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
              aria-expanded={desktopMenuOpen === "account"}
            >
              Account
            </button>
            {desktopMenuOpen === "account" && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
                {loading ? null : user ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={profileHref}
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        closeAllMenus();
                        logout();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5 md:hover:text-red-500"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 md:hover:bg-white/5 md:hover:text-[#D4AF37]"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/50 bg-black px-4 text-sm font-extrabold text-[#D4AF37] hover:bg-[#D4AF37]/10 lg:hidden"
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
          <span>Menu</span>
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-[#D4AF37]/20 bg-black/95 px-4 pb-3 pt-2 lg:hidden"
        >
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]/90">
                Primary
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/start-here"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Start Here
                </Link>
                <Link
                  href="/business-directory"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Search &amp; Directory
                </Link>
                <Link
                  href="/marketplace"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Marketplace
                </Link>
                <Link
                  href="/jobs"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Jobs
                </Link>
                <Link
                  href="/advertising"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Advertising
                </Link>
                <Link
                  href="/financial-literacy"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Learn
                </Link>
                <Link
                  href="/support"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Support
                </Link>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]/90">
                Explore
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/black-card"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Black Card
                </Link>
                <Link
                  href="/affiliate"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Earn with BWE
                </Link>
                <Link
                  href="/black-entertainment-news"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Culture &amp; Entertainment
                </Link>
                <Link
                  href="/music"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Music
                </Link>
                <Link
                  href="/black-student-opportunities"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Student Opportunities
                </Link>
                <Link
                  href="/wealth-builder"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Wealth Builder
                </Link>
                <Link
                  href="/travel-map/explore"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  Travel Map
                </Link>
                <a
                  href="https://www.youtube.com/@blackwealthexchangesociety8390"
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleItemClick}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                >
                  BWE Live
                </a>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]/90">
                Account
              </p>
              <div className="space-y-0.5">
                {loading ? null : user ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={profileHref}
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        closeAllMenus();
                        logout();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.04] md:hover:text-red-500"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={handleItemClick}
                      className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
