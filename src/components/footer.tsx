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
    <footer className="border-t border-white/10 bg-black/95 px-4 py-3 text-white/80 sm:py-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-y-1">
          {footerSections.map((section) => (
            <div key={section.title} className="min-w-0">
              <h3 className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]/90">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.links.map((item) => (
                  <li key={item.href} className="leading-tight">
                    <Link
                      href={item.href}
                      className="text-[11px] text-white/65 transition hover:text-[#D4AF37] sm:text-xs"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 border-t border-white/10 pt-2 text-center text-[10px] text-white/45 sm:text-[11px]">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
