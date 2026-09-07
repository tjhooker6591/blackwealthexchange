"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { canonicalUrl, getBaseUrl, truncateMeta } from "@/lib/seo";
import { Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { FEATURED_SPONSOR_RAIL_CAP } from "@/lib/advertising/placementDefinitions";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type HomeSearchScope = "directory" | "marketplace";

const HOME_SCOPE_CONFIG: Record<
  HomeSearchScope,
  {
    label: string;
    placeholder: string;
    href: string;
    queryBuilder: (q: string) => Record<string, string>;
    icon: typeof Search;
    destinationLabel: string;
  }
> = {
  directory: {
    label: "Directory",
    placeholder: "Search Black-owned businesses...",
    href: "/business-directory",
    queryBuilder: (q) => ({
      q,
      search: q,
      scope: "businesses",
      type: "businesses",
      tab: "businesses",
    }),
    icon: Search,
    destinationLabel: "Open directory",
  },
  marketplace: {
    label: "Marketplace",
    placeholder: "Search products...",
    href: "/marketplace",
    queryBuilder: (q) => ({ q }),
    icon: ShoppingBag,
    destinationLabel: "Open marketplace",
  },
};

function HeroScopeTab({
  id,
  active,
  onClick,
  icon: Icon,
  label,
  onKeyDown,
  buttonRef,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  label: string;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold transition sm:px-4 sm:text-[12px]",
        active
          ? "border-[#D4AF37]/60 bg-[#D4AF37]/18 text-[#F2CD57]"
          : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
      )}
    >
      <Icon
        className={cx(
          "h-3.5 w-3.5 sm:h-4 sm:w-4",
          active ? "text-[#D4AF37]" : "text-white/70",
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScope, setActiveScope] = useState<HomeSearchScope>("directory");
  const scopeTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const router = useRouter();
  const { user } = useAuth();

  const trackHomepageEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/",
      section: "homepage",
      isAuthenticated: Boolean(user),
      accountType: user?.accountType || "anonymous",
      environment: process.env.NODE_ENV || "unknown",
      ...extras,
    });
  };

  const activeScopeConfig = HOME_SCOPE_CONFIG[activeScope];

  const runSearch = (
    scopeOverride?: HomeSearchScope,
    queryOverride?: string,
  ) => {
    const scope = scopeOverride ?? activeScope;
    const scopeConfig = HOME_SCOPE_CONFIG[scope];
    const q = (queryOverride ?? searchQuery).trim();
    return router.push({
      pathname: scopeConfig.href,
      query: q ? scopeConfig.queryBuilder(q) : {},
    });
  };

  const submitHomepageSearch = (
    trigger: string,
    queryOverride?: string,
    scopeOverride?: HomeSearchScope,
  ) => {
    const q = (queryOverride ?? searchQuery).trim();
    const scope = scopeOverride ?? activeScope;
    const scopeConfig = HOME_SCOPE_CONFIG[scope];

    trackHomepageEvent("homepage_search_submitted", {
      section: "hero_search",
      source: "homepage_search_box",
      query: q,
      ctaId: "homepage_search_submit",
      ctaLabel: trigger,
      destination: scopeConfig.href,
      scope,
    });

    runSearch(scope, queryOverride);
  };

  const handleScopeKeyDown = (
    currentIndex: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    const scopes = Object.keys(HOME_SCOPE_CONFIG) as HomeSearchScope[];
    if (
      ![
        "ArrowRight",
        "ArrowLeft",
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
      ].includes(event.key)
    )
      return;

    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % scopes.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + scopes.length) % scopes.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = scopes.length - 1;
    }

    const nextScope = scopes[nextIndex];
    setActiveScope(nextScope);
    scopeTabRefs.current[nextIndex]?.focus();
  };

  const stableSponsorFallback = useMemo(() => [], []);

  const [sponsors, setSponsors] = useState<
    Array<{ img: string; name: string; url?: string; tagline?: string }>
  >([]);
  const [homepageBanner, setHomepageBanner] = useState<{
    id: string;
    image: string;
    name: string;
    tagline: string;
    targetUrl: string;
  } | null>(null);
  const [sponsorFeedLoaded, setSponsorFeedLoaded] = useState(false);
  const [trustStats, setTrustStats] = useState<{
    businesses: number | null;
    organizations: number | null;
    opportunities: number | null;
    products: number | null;
  }>({
    businesses: null,
    organizations: null,
    opportunities: null,
    products: null,
  });
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const [sponsorsRes, placementsRes] = await Promise.all([
          fetch("/api/sponsored-businesses", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/advertising/public-placements", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const data = await sponsorsRes.json().catch(() => ({}));
        if (!sponsorsRes.ok || !Array.isArray(data?.sponsors) || cancelled) {
          if (!cancelled) setSponsors([]);
        } else {
          const normalized = data.sponsors.map((s: any) => ({
            img:
              typeof s?.img === "string" && s.img
                ? s.img
                : "/default-image.jpg",
            name:
              typeof s?.name === "string" && s.name
                ? s.name
                : "Featured Sponsor",
            url: typeof s?.url === "string" ? s.url : undefined,
            tagline: typeof s?.tagline === "string" ? s.tagline : undefined,
          }));

          setSponsors(normalized);
        }

        const placementData = await placementsRes.json().catch(() => ({}));
        if (!cancelled && placementsRes.ok) {
          const topBanner = Array.isArray(
            placementData?.placements?.bannerHomepageTop,
          )
            ? placementData.placements.bannerHomepageTop[0]
            : null;

          if (topBanner) {
            setHomepageBanner({
              id: String(topBanner.id || "banner-homepage-top"),
              image:
                typeof topBanner.image === "string" && topBanner.image
                  ? topBanner.image
                  : "/default-image.jpg",
              name:
                typeof topBanner.name === "string" && topBanner.name
                  ? topBanner.name
                  : "Homepage Banner",
              tagline:
                typeof topBanner.tagline === "string"
                  ? topBanner.tagline
                  : "Sponsored campaign",
              targetUrl:
                typeof topBanner.targetUrl === "string" && topBanner.targetUrl
                  ? topBanner.targetUrl
                  : "#",
            });
          } else {
            setHomepageBanner(null);
          }
        }
      } catch {
        if (!cancelled) {
          setSponsors([]);
          setHomepageBanner(null);
        }
      } finally {
        if (!cancelled) setSponsorFeedLoaded(true);
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stableSponsorFallback]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const inventoryRes = await fetch("/api/stats/inventory", {
          cache: "no-store",
          signal: controller.signal,
        });
        const inventoryData = await inventoryRes.json().catch(() => null);

        if (cancelled) return;

        setTrustStats({
          businesses: Number.isFinite(Number(inventoryData?.businesses))
            ? Number(inventoryData.businesses)
            : null,
          organizations: Number.isFinite(Number(inventoryData?.organizations))
            ? Number(inventoryData.organizations)
            : null,
          opportunities: Number.isFinite(Number(inventoryData?.opportunities))
            ? Number(inventoryData.opportunities)
            : null,
          products: Number.isFinite(Number(inventoryData?.products))
            ? Number(inventoryData.products)
            : null,
        });
      } catch {
        if (!cancelled) {
          setTrustStats({
            businesses: null,
            organizations: null,
            opportunities: null,
            products: null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const sponsorRail = sponsors.slice(0, FEATURED_SPONSOR_RAIL_CAP);
  const showHomepageBanner =
    Boolean(homepageBanner) && sponsorRail.length === 0;

  const base = getBaseUrl();
  const canonical = canonicalUrl("/");
  const title =
    "Black-Owned Business Directory, Jobs & Marketplace | Black Wealth Exchange";
  const description = truncateMeta(
    "Black Wealth Exchange is a discovery and growth platform centered on Black-owned businesses. Search the directory, find jobs, shop the marketplace, and build wealth with practical financial literacy resources.",
  );

  const formatStat = (value: number | null) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("en-US")
      : "Live";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Black Wealth Exchange",
    url: canonical,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base.replace(/\/$/, "")}/business-directory?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Black Wealth Exchange",
    url: canonical,
    description:
      "Black Wealth Exchange — Black-Owned Business Discovery and Growth Platform",
    logo: `${base.replace(/\/$/, "")}/favicon.png`,
    founder: {
      "@type": "Person",
      name: "Thomas James Hooker Sr.",
      jobTitle: "Founder, Black Wealth Exchange",
    },
    sameAs: [
      "https://www.instagram.com/blackwealthexchange/",
      "https://www.linkedin.com/company/black-wealth-exchange/",
    ],
  };

  const founderSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Thomas James Hooker Sr.",
    jobTitle: "Founder, Black Wealth Exchange",
    worksFor: {
      "@type": "Organization",
      name: "Black Wealth Exchange",
      url: canonical,
    },
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={`${base.replace(/\/$/, "")}/images/hero1.jpg`}
        />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(founderSchema)}
      </script>
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <header className="relative z-10 pb-5 pt-8 sm:pb-7 sm:pt-11">
        <div className="bwe-section-wrap relative z-10 max-w-6xl">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/68 sm:px-3.5 sm:text-xs">
              <Image
                src="/black-wealth-future.png"
                alt="Black Wealth"
                width={30}
                height={30}
                className="inline-block sm:h-[34px] sm:w-[34px]"
                priority
              />
              <span className="font-semibold tracking-[0.14em] text-[var(--accent)]">
                SEARCH. SHOP. GROW.
              </span>
            </div>

            <div className="bwe-hero-panel relative isolate mx-auto mt-4 max-w-5xl overflow-hidden rounded-[32px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
              <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
                style={{
                  backgroundImage: "url('/images/story3.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="pointer-events-none absolute inset-0 -z-10 bg-black/76" />
              <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />

              <div className="mx-auto max-w-3xl">
                <div className="bwe-eyebrow text-white/56">
                  Black-owned business, commerce, jobs, and opportunity
                </div>

                <h1 className="bwe-display-title mx-auto mt-3 max-w-[15ch]">
                  Black Business. Black Opportunity. One Exchange.
                </h1>

                <p className="bwe-lead mx-auto mt-4 max-w-xl">
                  Discover Black-owned businesses, shop products, find jobs and
                  opportunities, and grow your business all in one place.
                </p>
              </div>

              <div className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-4 sm:items-center">
                <div className="w-full rounded-[24px] border border-white/10 bg-black/28 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div
                    role="tablist"
                    aria-label="Homepage search scopes"
                    className="mb-2 grid grid-cols-2 gap-2 text-left"
                  >
                    {(
                      Object.entries(HOME_SCOPE_CONFIG) as Array<
                        [
                          HomeSearchScope,
                          (typeof HOME_SCOPE_CONFIG)[HomeSearchScope],
                        ]
                      >
                    ).map(([scopeKey, scopeConfig], index) => (
                      <HeroScopeTab
                        key={scopeKey}
                        id={`homepage-scope-${scopeKey}`}
                        active={activeScope === scopeKey}
                        onClick={() => {
                          setActiveScope(scopeKey);
                          trackHomepageEvent("homepage_scope_selected", {
                            section: "hero_search",
                            scope: scopeKey,
                            destination: scopeConfig.href,
                          });
                        }}
                        onKeyDown={(event) => handleScopeKeyDown(index, event)}
                        icon={scopeConfig.icon}
                        label={scopeConfig.label}
                        buttonRef={(node) => {
                          scopeTabRefs.current[index] = node;
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex w-full items-stretch overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
                    <input
                      type="search"
                      enterKeyHint="search"
                      inputMode="search"
                      aria-label={`${activeScopeConfig.label} search`}
                      placeholder={activeScopeConfig.placeholder}
                      value={searchQuery}
                      onFocus={() =>
                        trackHomepageEvent("homepage_search_focused", {
                          section: "hero_search",
                          source: "homepage_search_box",
                          scope: activeScope,
                        })
                      }
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          submitHomepageSearch("search_input_enter");
                      }}
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white/76 outline-none placeholder:text-white/34"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        submitHomepageSearch("search_button_click")
                      }
                      className="shrink-0 bg-[var(--accent)] px-5 text-sm font-semibold text-black hover:bg-[var(--accent-strong)]"
                    >
                      Search
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/48">
                    <span>
                      Search in{" "}
                      <span className="font-semibold text-white/78">
                        {activeScopeConfig.label}
                      </span>
                    </span>
                    <span className="hidden sm:inline">
                      Choose a path, then continue your search there.
                    </span>
                  </div>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <button
                    type="button"
                    className="bwe-cta-primary bwe-focus-ring h-12 w-full px-6"
                    onClick={() => {
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: `hero_open_${activeScope}`,
                        ctaLabel: activeScopeConfig.destinationLabel,
                        destination: activeScopeConfig.href,
                        query: searchQuery.trim(),
                      });
                      submitHomepageSearch("hero_primary_cta");
                    }}
                  >
                    {activeScopeConfig.destinationLabel}
                  </button>
                  <Link
                    href="/start-here"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_start_here",
                        ctaLabel: "Start Here",
                        destination: "/start-here",
                      })
                    }
                  >
                    <button className="bwe-cta-secondary bwe-focus-ring h-12 w-full px-5 text-sm font-semibold text-white/88">
                      Start here
                    </button>
                  </Link>
                </div>
                <div className="flex w-full flex-col gap-2 text-left sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <Link
                    href="/signup?intent=join-bwe-free"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_join_free",
                        ctaLabel: "Join BWE Free",
                        destination: "/signup?intent=join-bwe-free",
                      })
                    }
                    className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
                  >
                    Join BWE Free
                  </Link>
                  <Link
                    href="/start-here"
                    onClick={() =>
                      trackHomepageEvent("homepage_cta_clicked", {
                        section: "hero",
                        ctaId: "hero_business_owner_path",
                        ctaLabel: "Business Owner Path",
                        destination: "/start-here",
                      })
                    }
                    className="text-sm text-white/66 transition hover:text-white"
                  >
                    Business owner? Claim a listing, add your business, sell, or
                    hire.
                  </Link>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-5xl flex-col gap-3 border-t border-white/8 pt-4 text-left lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/58">
                  <Link
                    href="/business-directory/add-business"
                    className="bwe-open-link bwe-focus-ring text-sm"
                  >
                    Add a listing
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/60 sm:justify-end">
                <span>
                  <span className="font-semibold text-white">
                    {formatStat(
                      (trustStats.businesses ?? 0) +
                        (trustStats.organizations ?? 0),
                    )}
                  </span>{" "}
                  Directory Listings to Discover
                </span>
              </div>
            </div>
          </div>

          {showHomepageBanner ? (
            <section className="bwe-shell-panel mx-auto mt-4 max-w-5xl overflow-hidden rounded-[28px] p-3 shadow-[0_0_0_1px_rgba(212,175,55,0.12)]">
              <a
                href={homepageBanner!.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={homepageBanner!.image}
                  alt={homepageBanner!.name}
                  className="h-24 w-full rounded-xl object-cover sm:h-28"
                />
                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {homepageBanner!.name}
                    </div>
                    <div className="truncate text-xs text-white/70">
                      {homepageBanner!.tagline}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-bold text-[#F1D57A]">
                    Sponsored Banner · Limited Slot
                  </span>
                </div>
              </a>
            </section>
          ) : null}
        </div>
      </header>

      <main className="container relative z-10 mx-auto max-w-6xl px-4 pb-0 pt-3 sm:pt-4">
        <section className="mb-8 border-t border-white/8 pt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--accent)] sm:text-base">
                Featured Sponsors
              </h3>
              <p className="mt-1 text-[12px] text-white/52">
                {sponsorFeedLoaded
                  ? sponsorRail.length
                    ? "Current sponsor placements supporting discovery and visibility"
                    : "No active sponsor placements are running in this slot right now"
                  : "Loading current sponsor placements"}
              </p>
            </div>
            <Link
              href="/advertise/featured-sponsor"
              className="bwe-focus-ring shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-1 text-[10px] font-semibold text-[var(--accent)] transition hover:bg-white/5"
            >
              Become a sponsor →
            </Link>
          </div>

          <div className="relative h-28 w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/20 sm:h-36">
            {!sponsorFeedLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/55">
                Loading live sponsors...
              </div>
            ) : null}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/70 to-transparent" />

            {sponsorRail.length ? (
              <div className="animate-scroll absolute flex space-x-4 px-4 py-4 sm:space-x-5">
                {[...sponsorRail, ...sponsorRail].map((sponsor, index) => {
                  const card = (
                    <div className="relative h-20 w-36 overflow-hidden rounded-[18px] border border-white/10 shadow sm:h-24 sm:w-44">
                      <img
                        src={sponsor.img}
                        alt={sponsor.name}
                        className="h-full w-full object-cover"
                        loading={index < 4 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent px-2 py-1.5 text-left text-[10px] font-semibold text-white sm:text-[11px]">
                        {sponsor.name}
                      </div>
                    </div>
                  );

                  if (
                    typeof sponsor.url === "string" &&
                    sponsor.url.startsWith("/")
                  ) {
                    return (
                      <Link key={index} href={sponsor.url}>
                        {card}
                      </Link>
                    );
                  }

                  if (sponsor.url) {
                    return (
                      <a
                        key={index}
                        href={sponsor.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {card}
                      </a>
                    );
                  }

                  return <div key={index}>{card}</div>;
                })}
              </div>
            ) : sponsorFeedLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/55">
                No active featured sponsors in this slot right now.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mb-6 border-t border-white/8 pt-6 text-center">
          <p className="bwe-eyebrow text-white/58">Keep going</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
            See everything else BWE offers
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/62">
            Student opportunities, wealth building, creator tools, business
            growth, and more — organized in one hub.
          </p>
          <Link
            href="/explore"
            onClick={() =>
              trackHomepageEvent("homepage_cta_clicked", {
                section: "closing",
                ctaId: "homepage_closing_explore_hub",
                ctaLabel: "Explore the platform hub",
                destination: "/explore",
              })
            }
            className="bwe-cta-primary bwe-focus-ring mt-4 inline-flex px-6"
          >
            Explore the platform hub
          </Link>
        </section>
      </main>

      <style jsx>{`
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-pulseGlow {
          animation: pulseGlow 2.1s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
          }
          50% {
            box-shadow: 0 0 24px rgba(212, 175, 55, 0.45);
          }
        }
      `}</style>
    </div>
  );
}
