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
        <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-white">
          <Link href="/business-directory" className="hover:text-gold transition">Business Directory</Link>
          <Link href="/marketplace" className="hover:text-gold transition">Marketplace</Link>
          <Link href="/job-listings" className="hover:text-gold transition">Jobs</Link>
          <Link href="/resources" className="hover:text-gold transition">Resources</Link>
          <Link href="/trust" className="hover:text-gold transition">Trust Center</Link>
          <Link href="/terms-of-service" className="hover:text-gold transition">Terms of Service</Link>
          <Link href="/privacy-policy" className="hover:text-gold transition">Privacy Policy</Link>
          <Link href="/terms/marketplace" className="hover:text-gold transition">Marketplace Terms</Link>
        </div>
      </div>
    </footer>
  );
}
