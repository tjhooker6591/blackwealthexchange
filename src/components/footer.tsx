import React from "react";
import Link from "next/link";

const footerSections: Array<{
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}> = [
  {
    title: "Platform",
    links: [
      { href: "/business-directory", label: "Search & Directory" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/jobs", label: "Jobs" },
      { href: "/advertising", label: "Advertising" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Growth & Learning",
    links: [
      { href: "/start-here", label: "Start Here" },
      { href: "/financial-literacy", label: "Learn" },
      { href: "/wealth-builder", label: "Wealth Builder" },
      { href: "/black-student-opportunities", label: "Student Opportunities" },
      { href: "/black-card", label: "Black Card" },
    ],
  },
  {
    title: "Culture & Community",
    links: [
      { href: "/black-entertainment-news", label: "Culture & Entertainment" },
      { href: "/music", label: "Music" },
      {
        href: "https://www.youtube.com/@blackwealthexchangesociety8390",
        label: "BWE Live",
        external: true,
      },
      { href: "/affiliate", label: "Earn with BWE" },
    ],
  },
  {
    title: "Company / Legal",
    links: [
      { href: "/about", label: "About BWE" },
      { href: "/terms-of-service", label: "Terms" },
      { href: "/privacy-policy", label: "Privacy" },
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
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <p className="text-[11px] leading-tight text-white/70 sm:text-xs">
            Building Black ownership and long-term economic power.
          </p>
          <Link
            href="/signup"
            className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#D4AF37] px-3 text-[11px] font-semibold text-black transition hover:brightness-105"
          >
            Join BWE
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 sm:gap-x-5">
          {footerSections.map((section) => (
            <div key={section.title} className="min-w-0">
              <h3 className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#D4AF37]/90">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.links.map((item) => (
                  <li key={item.href} className="leading-tight">
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-white/65 transition hover:text-[#D4AF37] sm:text-xs"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-[11px] text-white/65 transition hover:text-[#D4AF37] sm:text-xs"
                      >
                        {item.label}
                      </Link>
                    )}
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
