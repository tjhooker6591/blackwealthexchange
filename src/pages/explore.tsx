// src/pages/explore.tsx
//
// Post-Phase-4 Experience Consolidation: /explore is the organized BWE
// Platform Access Hub -- "show me everything BWE can do for me." It links
// out to existing, already-working routes only; it does not duplicate any
// backend system (search, marketplace, jobs, dashboards, etc.).
//
// Personalization reuses the existing accountType already returned by
// /api/auth/me (via the shared useAuth hook already used across the app,
// e.g. NavBar.tsx) to surface one relevant fast-path destination for
// business/seller/employer accounts -- the same lightweight pattern
// NavBar.tsx already uses for its own dashboardHref. This is not a new
// personalization engine, and it never hides the full hub from anyone.

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Search,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  TrendingUp,
  BookOpen,
  CreditCard,
  Building2,
  Store,
  Users,
  Megaphone,
  BarChart3,
  Sparkles,
  Music2,
  LifeBuoy,
  ArrowRight,
  Compass,
  Handshake,
  Home as HomeIcon,
  BadgeCheck,
  Landmark,
  Target,
  LineChart,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type ExploreItem = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type ExploreGroup = {
  id: string;
  label: string;
  items: ExploreItem[];
};

const EXPLORE_GROUPS: ExploreGroup[] = [
  {
    id: "discover-shop",
    label: "Discover & Shop",
    items: [
      {
        title: "Business Directory",
        description: "Find and support verified Black-owned businesses.",
        href: "/business-directory",
        icon: Search,
      },
      {
        title: "Marketplace",
        description: "Shop products sold directly by Black-owned sellers.",
        href: "/marketplace",
        icon: ShoppingBag,
      },
    ],
  },
  {
    id: "opportunity",
    label: "Opportunity",
    items: [
      {
        title: "Jobs",
        description: "Browse open roles from employers building with BWE.",
        href: "/job-listings",
        icon: Briefcase,
      },
      {
        title: "Student Opportunities",
        description: "Scholarships, internships, grants, and mentorship.",
        href: "/black-student-opportunities",
        icon: GraduationCap,
      },
    ],
  },
  {
    id: "build-wealth",
    label: "Build Wealth",
    items: [
      {
        title: "Wealth Builder",
        description:
          "Track budgets, debt, savings, and net worth in one place.",
        href: "/wealth-builder",
        icon: TrendingUp,
      },
      {
        title: "Learn",
        description: "Practical financial literacy resources and courses.",
        href: "/financial-literacy",
        icon: BookOpen,
      },
      {
        title: "Black Card",
        description: "Explore membership benefits and premium access.",
        href: "/black-card",
        icon: CreditCard,
      },
      {
        title: "Real Estate",
        description: "Explore ownership and investment pathways.",
        href: "/real-estate-investment",
        icon: HomeIcon,
      },
    ],
  },
  {
    id: "grow-a-business",
    label: "Grow a Business",
    items: [
      {
        title: "Add / Claim Business",
        description: "List a new business or claim your existing listing.",
        href: "/start-here",
        icon: Building2,
      },
      {
        title: "Sell on BWE",
        description: "Set up a seller account and list products.",
        href: "/marketplace/become-a-seller",
        icon: Store,
      },
      {
        title: "Hire Talent",
        description: "Post a job and reach BWE's talent community.",
        href: "/post-job",
        icon: Users,
      },
      {
        title: "Advertising",
        description: "Get premium placement and visibility across BWE.",
        href: "/advertise-with-us",
        icon: Megaphone,
      },
      {
        title: "Growth Command Center",
        description:
          "Real profile views, revenue, and next steps for your business.",
        href: "/dashboard",
        icon: BarChart3,
      },
      {
        title: "Recruiting & Consulting",
        description: "Connect with talent pathways and consulting support.",
        href: "/recruiting-consulting?type=employer",
        icon: Handshake,
      },
      {
        title: "Founding Membership",
        description:
          "Hands-on support strengthening your verified BWE presence, profile, and performance baseline.",
        href: "/founding-membership",
        icon: BadgeCheck,
      },
    ],
  },
  {
    id: "create",
    label: "Create",
    items: [
      {
        title: "Creator Dashboard",
        description: "Manage your listings and track real sales performance.",
        href: "/creator/dashboard",
        icon: Sparkles,
      },
      {
        title: "Music",
        description: "Support and discover music from Black creators.",
        href: "/music",
        icon: Music2,
      },
    ],
  },
  {
    id: "mission-history",
    label: "Our Mission & History",
    items: [
      {
        title: "Black History Library",
        description:
          "Our history does not begin with slavery -- the longer story of what Black people built, what survived, and why ownership work still matters now.",
        href: "/library-of-black-history",
        icon: Landmark,
      },
      {
        title: "0.5% Challenge",
        description:
          "The public habit campaign: search Black first, buy, review, refer, repeat.",
        href: "/challenge",
        icon: Target,
      },
      {
        title: "Economic Impact",
        description:
          "Black buying power in context, and how BWE measures keeping more of it circulating with us.",
        href: "/economic-freedom",
        icon: LineChart,
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    items: [
      {
        title: "Support",
        description: "Get help, report an issue, or contact BWE support.",
        href: "/support",
        icon: LifeBuoy,
      },
    ],
  },
];

type FastPath = { title: string; body: string; href: string; cta: string };

function resolveFastPath(accountType: string | undefined): FastPath | null {
  switch (accountType) {
    case "business":
      return {
        title: "Continue to your Growth Command Center",
        body: "Real profile views, revenue, and next steps for your business.",
        href: "/dashboard",
        cta: "Open Growth Command Center",
      };
    case "seller":
      return {
        title: "Manage your marketplace",
        body: "Review orders, products, and payout status.",
        href: "/marketplace/dashboard",
        cta: "Open seller dashboard",
      };
    case "employer":
      return {
        title: "Review your applicants",
        body: "Real candidates are waiting on your open roles.",
        href: "/employer/applicants",
        cta: "Review applicants",
      };
    default:
      return null;
  }
}

export default function ExplorePage() {
  const { user } = useAuth({ silentOnPublic: false });
  const fastPath = resolveFastPath(user?.accountType);

  const title = "Explore BWE | Platform Access Hub";
  const description =
    "Everything BWE can do for you -- discover businesses, shop, find opportunities, build wealth, grow a business, create, and get help, all in one organized hub.";
  const canonical = canonicalUrl("/explore");

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="relative min-h-screen bg-black text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_55%)]" />

        <div className="bwe-section-wrap relative py-8 sm:py-10">
          {/* Hero -- compact on mobile, still visually premium */}
          <section className="bwe-hero-panel relative overflow-hidden rounded-[28px] px-5 py-7 sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/favicon.png"
                  alt="BWE"
                  width={44}
                  height={44}
                  className="h-10 w-10 shrink-0 rounded-2xl border border-[var(--border-soft)] bg-white/5 p-1 object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:h-11 sm:w-11"
                  priority
                />
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  <Compass className="h-3.5 w-3.5" />
                  Platform Access Hub
                </div>
              </div>
            </div>

            <h1 className="bwe-display-title relative mt-5 max-w-2xl text-3xl sm:text-4xl lg:text-5xl">
              Everything BWE can do for you.
            </h1>
            <p className="bwe-lead relative mt-3 max-w-xl">
              One organized hub across discovery, opportunity, wealth building,
              business growth, creator tools, and support.
            </p>
          </section>

          {/* What you can do here -- moved from the homepage so it lives once, here */}
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-left sm:p-6">
            <div className="bwe-eyebrow">What you can do here</div>
            <h2 className="bwe-section-title mt-2 max-w-3xl text-xl sm:text-2xl">
              Explore freely. Join BWE free when you&apos;re ready for your own
              dashboard.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68 sm:text-[15px]">
              Public visitors can explore right away. Free accounts help you
              return to one dashboard, and business owners can take the existing
              Start Here path without guessing.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-black/28 p-4">
                <div className="bwe-card-title">Public</div>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Search businesses, products, jobs, and student opportunities
                  without creating an account first.
                </p>
                <Link
                  href="/business-directory"
                  className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
                >
                  Open Directory
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/28 p-4">
                <div className="bwe-card-title">Free</div>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Create your free BWE account and get your own dashboard—a
                  single place to manage your account and access member features
                  as you explore BWE.
                </p>
                <Link
                  href="/signup?intent=join-bwe-free"
                  className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
                >
                  Join BWE Free
                </Link>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/28 p-4">
                <div className="bwe-card-title">Business Owners</div>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Claim a listing, add your business, sell, or hire through the
                  existing Start Here path.
                </p>
                <Link
                  href="/start-here"
                  className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
                >
                  Business Owner - Start Here
                </Link>
              </article>
            </div>
          </section>

          {/* Personalized fast path -- one relevant shortcut, never a replacement for the full hub below */}
          {fastPath ? (
            <section className="mt-4">
              <Link
                href={fastPath.href}
                className="bwe-shell-panel bwe-focus-ring flex flex-col gap-3 rounded-2xl border border-[var(--border-soft)] px-5 py-4 transition hover:border-[var(--border-strong)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="bwe-eyebrow">For you</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {fastPath.title}
                  </div>
                  <p className="mt-1 text-sm text-white/62">{fastPath.body}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[var(--accent)]">
                  {fastPath.cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </section>
          ) : null}

          {/* Grouped capability grid -- always shows the full platform to everyone */}
          <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
            {EXPLORE_GROUPS.map((group) => (
              <section key={group.id}>
                <h2 className="bwe-eyebrow">{group.label}</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="bwe-grid-card bwe-focus-ring group flex min-h-[6.5rem] flex-col gap-2.5 p-4 transition hover:border-[var(--border-strong)] hover:bg-white/[0.04] sm:p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--accent)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="bwe-card-title min-w-0 truncate">
                            {item.title}
                          </div>
                        </div>
                        <p className="text-sm leading-5 text-white/62">
                          {item.description}
                        </p>
                        <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] opacity-90 transition group-hover:gap-1.5">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/8 pt-6 text-center sm:mt-12">
            <p className="text-sm text-white/58">
              Looking for one specific thing across all of BWE?
            </p>
            <Link
              href="/search"
              className="bwe-cta-secondary bwe-focus-ring px-6"
            >
              Search all of BWE
            </Link>
            {user ? (
              <Link
                href="/my-bwe"
                className="bwe-open-link bwe-focus-ring mt-1 text-sm text-[var(--accent)]"
              >
                Or see everything you&apos;ve followed, saved, and built — My
                BWE
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
