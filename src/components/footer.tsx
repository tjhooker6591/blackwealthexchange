import React from "react";
import Link from "next/link";

const footerSections: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Platform",
    links: [
      { href: "/start-here", label: "Quick Path" },
      { href: "/business-directory", label: "Business Directory" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/financial-literacy", label: "Learn" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    title: "Programs",
    links: [
      { href: "/affiliate/index", label: "Earn with BWE" },
      { href: "/black-card", label: "Black Card" },
      { href: "/wealth-builder", label: "Wealth Builder" },
      { href: "/travel-map/explore", label: "Travel Map" },
      { href: "/music", label: "Music" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/join-the-mission", label: "Join the Mission" },
      { href: "/advertise-with-us", label: "Advertise with BWE" },
      { href: "/terms-of-service", label: "Terms of Service" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/legal/community-conduct", label: "Code of Conduct" },
      {
        href: "/legal/advertising-guidelines",
        label: "Advertising Guidelines",
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#D4AF37]">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/85 transition hover:text-[#D4AF37]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-gray-400 sm:text-sm">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
