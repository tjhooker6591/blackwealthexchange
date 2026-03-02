"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  Calculator,
  Map,
  Scale,
  ShieldCheck,
  Search,
  ShoppingBag,
  Newspaper,
  Building2,
  Sparkles,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ToolCard = {
  title: string;
  description: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "available" | "coming-soon";
  accent?: "gold" | "emerald";
};

function ToolCard({
  title,
  description,
  href,
  icon: Icon,
  status,
  accent = "gold",
}: ToolCard) {
  const isAvailable = status === "available";

  return (
    <div
      className={cx(
        "group rounded-2xl border p-5 transition",
        accent === "gold"
          ? "border-[#D4AF37]/25 bg-white/[0.03] hover:border-[#D4AF37]/45"
          : "border-emerald-400/20 bg-white/[0.03] hover:border-emerald-400/40",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={cx(
            "inline-flex h-11 w-11 items-center justify-center rounded-xl border",
            accent === "gold"
              ? "border-[#D4AF37]/30 bg-[#D4AF37]/10"
              : "border-emerald-400/30 bg-emerald-400/10",
          )}
        >
          <Icon
            className={cx(
              "h-5 w-5",
              accent === "gold" ? "text-[#D4AF37]" : "text-emerald-300",
            )}
          />
        </div>

        <span
          className={cx(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-wide",
            isAvailable
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-white/60",
          )}
        >
          {isAvailable ? "Available" : "Coming Soon"}
        </span>
      </div>

      <h2 className="text-lg font-extrabold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>

      <div className="mt-5">
        {isAvailable && href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black transition hover:bg-yellow-500"
          >
            Open Tool <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white/60">
            In Development
          </span>
        )}
      </div>
    </div>
  );
}

export default function Tools() {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q.trim() : "";

  const directoryHref = q
    ? `/business-directory?q=${encodeURIComponent(q)}&search=${encodeURIComponent(q)}`
    : "/business-directory";

  const shopHref = q
    ? `/shop?q=${encodeURIComponent(q)}&search=${encodeURIComponent(q)}`
    : "/shop";

  const newsHref = q ? `/news?q=${encodeURIComponent(q)}` : "/news";

  const availableTools: ToolCard[] = [
    {
      title: "Directory Search",
      description:
        "Search Black-owned businesses and organizations using the main directory flow.",
      href: directoryHref,
      icon: Search,
      status: "available",
      accent: "gold",
    },
    {
      title: "Marketplace Search",
      description:
        "Browse products and continue shopping using the marketplace search experience.",
      href: shopHref,
      icon: ShoppingBag,
      status: "available",
      accent: "gold",
    },
    {
      title: "News Search",
      description: "Search news and content using the site’s news experience.",
      href: newsHref,
      icon: Newspaper,
      status: "available",
      accent: "emerald",
    },
    {
      title: "Sponsored Listings",
      description:
        "Jump directly into featured and sponsored businesses with stronger visibility.",
      href: "/business-directory/sponsored-business",
      icon: Building2,
      status: "available",
      accent: "gold",
    },
  ];

  const upcomingTools: ToolCard[] = [
    {
      title: "Compare Listings",
      description:
        "Compare businesses side by side by trust, category, location, and completeness.",
      icon: Scale,
      status: "coming-soon",
      accent: "gold",
    },
    {
      title: "Trusted Verification Tools",
      description:
        "Review verification markers, trust signals, and listing quality in one place.",
      icon: ShieldCheck,
      status: "coming-soon",
      accent: "emerald",
    },
    {
      title: "Maps & Radius Search",
      description:
        "View listings on a map, search nearby, and explore by geography.",
      icon: Map,
      status: "coming-soon",
      accent: "gold",
    },
    {
      title: "Calculators",
      description:
        "Run simple business or economic calculators as more decision tools are added.",
      icon: Calculator,
      status: "coming-soon",
      accent: "emerald",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-8rem] h-[360px] w-[360px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative z-10 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-extrabold tracking-wide text-white/75">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              TOOLS HUB
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Tools{" "}
                  {q ? (
                    <span className="text-[#D4AF37]">for “{q}”</span>
                  ) : (
                    <span className="text-[#D4AF37]">Hub</span>
                  )}
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/65 sm:text-base">
                  Use the tools below to search the directory, shop the
                  marketplace, explore news, and access the next layer of
                  trusted discovery features as they roll out.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white/80 transition hover:bg-white/10"
                >
                  Back Home
                </Link>
                <Link
                  href={directoryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black transition hover:bg-yellow-500"
                >
                  Open Directory <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {q && (
              <div className="mt-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm text-white/80">
                Active query:{" "}
                <span className="font-extrabold text-[#D4AF37]">{q}</span>
              </div>
            )}
          </div>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
                Available Now
              </h2>
              <span className="text-xs text-white/45">Ready to use</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {availableTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-[#D4AF37] sm:text-xl">
                Next Up
              </h2>
              <span className="text-xs text-white/45">Planned tools</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {upcomingTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
