import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-center py-6 px-4 text-sm text-white">
      <div className="space-y-2">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights
          reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-white">
          <Link href="/black-wealth" className="hover:text-gold transition">
            Black Wealth Guide
          </Link>
          <Link href="/marketplace" className="hover:text-gold transition">
            Marketplace
          </Link>
          <Link
            href="/business-directory"
            className="hover:text-gold transition"
          >
            Black-owned Business Directory
          </Link>
          <Link href="/wealth-builder" className="hover:text-gold transition">
            Wealth Builder Dashboard
          </Link>
          <Link
            href="/travel-map/explore"
            className="hover:text-gold transition"
          >
            Travel Map for Black-owned businesses
          </Link>
          <Link href="/terms-of-service" className="hover:text-gold transition">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="hover:text-gold transition">
            Privacy Policy
          </Link>
          <Link
            href="/legal/community-conduct"
            className="hover:text-gold transition"
          >
            Code of Conduct
          </Link>
          <Link
            href="/legal/advertising-guidelines"
            className="hover:text-gold transition"
          >
            Advertising Guidelines
          </Link>
        </div>
      </div>
    </footer>
  );
}
