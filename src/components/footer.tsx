import React from "react";
import Link from "next/link";

const footerSections: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Platform",
    links: [
      { href: "/start-here", label: "Quick Path" },
      { href: "/events", label: "Events" },
      { href: "/travel-map/explore", label: "Travel Map" },
      { href: "/wealth-builder", label: "Wealth Builder" },
    ],
  },
  {
    title: "Opportunities",
    links: [
      { href: "/business-directory", label: "Directory" },
      { href: "/jobs", label: "Jobs" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/advertise-with-us", label: "Advertise with BWE" },
    ],
  },
  {
    title: "Programs",
    links: [
      { href: "/black-card", label: "Black Card" },
      { href: "/affiliate/index", label: "Affiliate" },
      { href: "/financial-literacy", label: "Learn" },
      { href: "/music", label: "Music" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/join-the-mission", label: "Join the Mission" },
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
    <footer className="bg-black px-4 py-5 text-white/90 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-xs text-white/75 transition hover:text-[#D4AF37] sm:text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 text-center text-[11px] text-white/55 sm:text-xs">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
