// components/NavBar.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle site-wide search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <Image
            src="/bwe-logo.png" // Adjust path if needed
            alt="BWE Logo"
            width={40}
            height={40}
          />
          <span className="text-gold font-bold text-xl">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Nav (hidden on mobile) */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Example: Student Resources Dropdown */}
          <div className="relative group">
            <button className="hover:text-gold font-semibold">
              Student Resources
            </button>
            <div className="absolute left-0 mt-2 bg-white text-black py-2 px-4 rounded shadow-md hidden group-hover:block min-w-[180px] z-50">
              <Link
                href="/black-student-opportunities/grants"
                className="block py-1 hover:text-gold"
              >
                Grants
              </Link>
              <Link
                href="/black-student-opportunities/scholarships"
                className="block py-1 hover:text-gold"
              >
                Scholarships
              </Link>
              <Link
                href="/black-student-opportunities/internships"
                className="block py-1 hover:text-gold"
              >
                Internships
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="block py-1 hover:text-gold"
              >
                Mentorship
              </Link>
            </div>
          </div>

          {/* Other top-level links */}
          <Link
            href="/business-directory"
            className="hover:text-gold font-semibold"
          >
            Business Directory
          </Link>
          <Link
            href="/financial-literacy"
            className="hover:text-gold font-semibold"
          >
            Financial 101
          </Link>
          <Link
            href="/housing-lending"
            className="hover:text-gold font-semibold"
          >
            Housing & Lending
          </Link>
          <Link
            href="/black-entertainment-news"
            className="hover:text-gold font-semibold"
          >
            Entertainment
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-l-md focus:outline-none text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gold text-black px-4 py-1 rounded-r-md font-semibold hover:bg-yellow-500 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Hamburger Button (visible on mobile) */}
        <button
          className="md:hidden flex items-center px-2 py-1 border border-gold rounded text-gold hover:bg-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M4 5h16M4 12h16M4 19h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu (collapsible) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold px-4 pb-4 relative z-50">
          {/* Student Resources (click-based for mobile) */}
          <details className="py-2">
            <summary className="font-semibold cursor-pointer hover:text-gold">
              Student Resources
            </summary>
            <div className="pl-4 mt-1">
              <Link
                href="/black-student-opportunities/grants"
                className="block py-1 hover:text-gold"
              >
                Grants
              </Link>
              <Link
                href="/black-student-opportunities/scholarships"
                className="block py-1 hover:text-gold"
              >
                Scholarships
              </Link>
              <Link
                href="/black-student-opportunities/internships"
                className="block py-1 hover:text-gold"
              >
                Internships
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="block py-1 hover:text-gold"
              >
                Mentorship
              </Link>
            </div>
          </details>

          <Link
            href="/business-directory"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Business Directory
          </Link>
          <Link
            href="/financial-literacy"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Financial 101
          </Link>
          <Link
            href="/housing-lending"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Housing & Lending
          </Link>
          <Link
            href="/black-entertainment-news"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Entertainment
          </Link>

          {/* Mobile Search */}
          <form
            onSubmit={handleSearch}
            className="flex items-center mt-2 space-x-2"
          >
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-l-md focus:outline-none text-black w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gold text-black px-4 py-1 rounded-r-md font-semibold hover:bg-yellow-500 transition"
            >
              Search
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
