// src/pages/events/index.tsx
"use client";

import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  PlayCircle,
  Radio,
  RefreshCw,
  Globe2,
  MapPin,
} from "lucide-react";

type EventBadge = "BWE LIVE" | "US" | "GLOBAL" | "PARTNER";
type EventStatus = "CONFIRMED" | "PLANNED" | "TBD";

type EventItem = {
  id: string;
  badge: EventBadge;
  status: EventStatus;
  dateLabel: string; // displayed date
  startISO?: string; // optional for sorting
  endISO?: string; // optional
  title: string;
  location?: string; // city/country
  description: string[];
  href?: string; // official link
  streamUrl?: string; // livestream link (YouTube/StreamYard/Zoom)
  rsvpUrl?: string; // your RSVP page (future)
  tags?: string[];
};

type RssItem = {
  title: string;
  link?: string;
  isoDate?: string;
  source?: string;
  snippet?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** ------------------------------------------------------------
 *  BWE LIVE (teaches people about you)
 *  ------------------------------------------------------------ */
const BWE_LIVE_2026: EventItem[] = [
  {
    id: "bwe-live-demo-weekly",
    badge: "BWE LIVE",
    status: "PLANNED",
    dateLabel: "Every Tuesday (2026) • Live Stream",
    title: "BWE Live Demo + Q&A (Weekly)",
    location: "Online",
    description: [
      "Walkthrough: Directory + Marketplace + Jobs + Trusted listings.",
      "Live Q&A: how to use BWE, how to list, how to monetize and grow.",
    ],
    streamUrl: "https://youtube.com/@BlackWealthExchange/live", // update
    rsvpUrl: "/events/rsvp", // optional future page
    tags: ["demo", "q&a", "weekly"],
  },
  {
    id: "bwe-seller-workshop-weekly",
    badge: "BWE LIVE",
    status: "PLANNED",
    dateLabel: "Every Saturday (2026) • Seller Workshop",
    title: "Seller Setup + Listing Workshop (Weekly)",
    location: "Online",
    description: [
      "How to become a seller + Stripe payouts + listing best practices.",
      "Bring your product — we help you publish it correctly.",
    ],
    streamUrl: "https://youtube.com/@BlackWealthExchange/live", // update
    rsvpUrl: "/events/rsvp",
    tags: ["seller", "stripe", "workshop"],
  },
  {
    id: "bwe-q1-webinar",
    badge: "BWE LIVE",
    status: "PLANNED",
    dateLabel: "Mar 31, 2026 • Virtual (time TBD)",
    startISO: "2026-03-31T17:00:00.000Z",
    title: "Quarterly Webinar: Building Generational Wealth",
    location: "Online",
    description: [
      "Wealth frameworks: budgeting → investing → ownership.",
      "Interactive Q&A and resource drops.",
    ],
    rsvpUrl: "/events/rsvp",
    tags: ["webinar", "wealth"],
  },
  {
    id: "bwe-q2-webinar",
    badge: "BWE LIVE",
    status: "PLANNED",
    dateLabel: "Jun 30, 2026 • Virtual (time TBD)",
    startISO: "2026-06-30T17:00:00.000Z",
    title: "Quarterly Webinar: Tech + Growth Systems",
    location: "Online",
    description: [
      "Tools + workflows to scale Black-owned businesses.",
      "Automation, marketing systems, and lead capture.",
    ],
    rsvpUrl: "/events/rsvp",
    tags: ["webinar", "growth", "tech"],
  },
  {
    id: "bwe-q3-webinar",
    badge: "BWE LIVE",
    status: "PLANNED",
    dateLabel: "Sep 30, 2026 • Virtual (time TBD)",
    startISO: "2026-09-30T17:00:00.000Z",
    title: "Quarterly Webinar: Funding + Scale Readiness",
    location: "Online",
    description: [
      "Pitch readiness: story, numbers, offer, and proof.",
      "Crowdfunding + grants + investor basics.",
    ],
    rsvpUrl: "/events/rsvp",
    tags: ["webinar", "funding"],
  },
];

/** ------------------------------------------------------------
 *  MAJOR US EVENTS (2026)
 *  ------------------------------------------------------------ */
const MAJOR_US_2026: EventItem[] = [
  {
    id: "trinidad-carnival-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Feb 16–17, 2026 • Port of Spain, Trinidad & Tobago",
    startISO: "2026-02-16T00:00:00.000Z",
    endISO: "2026-02-17T23:59:59.000Z",
    title: "Trinidad & Tobago Carnival",
    location: "Trinidad & Tobago",
    description: [
      "One of the world’s most iconic Caribbean cultural celebrations.",
    ],
    href: "https://visittrinidad.tt/things-to-do/carnival/",
    tags: ["culture", "caribbean"],
  },
  {
    id: "be-women-of-power-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Mar 11–15, 2026 • Las Vegas, NV",
    startISO: "2026-03-11T00:00:00.000Z",
    endISO: "2026-03-15T23:59:59.000Z",
    title: "BLACK ENTERPRISE Women of Power Summit",
    location: "Las Vegas, NV",
    description: [
      "Leadership + career + entrepreneurship summit for Black women leaders.",
    ],
    href: "https://www.blackenterprise.com/black-enterprise-women-of-power-summit-2026/",
    tags: ["business", "leadership"],
  },
  {
    id: "nsbe-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Mar 18–22, 2026 • Baltimore, MD",
    startISO: "2026-03-18T00:00:00.000Z",
    endISO: "2026-03-22T23:59:59.000Z",
    title: "NSBE Annual Convention",
    location: "Baltimore, MD",
    description: [
      "STEM + career fair + community building for Black engineers.",
    ],
    href: "https://convention.nsbe.org/welcome/",
    tags: ["stem", "careers"],
  },
  {
    id: "essence-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Jul 3–5, 2026 • New Orleans, LA",
    startISO: "2026-07-03T00:00:00.000Z",
    endISO: "2026-07-05T23:59:59.000Z",
    title: "ESSENCE Festival of Culture®",
    location: "New Orleans, LA",
    description: [
      "Culture + entrepreneurship + music + community programming.",
    ],
    href: "https://www.essence.com/essencefestival2026/",
    tags: ["culture", "entrepreneurship"],
  },
  {
    id: "naacp-convention-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Jul 18–22, 2026 • Chicago, IL",
    startISO: "2026-07-18T00:00:00.000Z",
    endISO: "2026-07-22T23:59:59.000Z",
    title: "117th NAACP National Convention",
    location: "Chicago, IL",
    description: [
      "Civil rights, community leadership, advocacy, and national programming.",
    ],
    href: "https://naacp.org/convention",
    tags: ["civic", "leadership"],
  },
  {
    id: "urban-league-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Jul 29–Aug 1, 2026 • Nashville, TN",
    startISO: "2026-07-29T00:00:00.000Z",
    endISO: "2026-08-01T23:59:59.000Z",
    title: "National Urban League Conference (Nashville 2026)",
    location: "Nashville, TN",
    description: [
      "Policy, business, social justice, and community impact sessions.",
    ],
    href: "https://conference.iamempowered.com/",
    tags: ["policy", "business"],
  },
  {
    id: "cbc-alc-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Sep 16–20, 2026 • Washington, DC",
    startISO: "2026-09-16T00:00:00.000Z",
    endISO: "2026-09-20T23:59:59.000Z",
    title: "CBCF Annual Legislative Conference (ALC)",
    location: "Washington, DC",
    description: [
      "The nation’s leading public policy convening focused on the Black community.",
    ],
    href: "https://www.cbcfinc.org/events/annual-legislative-conference/",
    tags: ["policy", "leadership"],
  },
  {
    id: "nbmbaa-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Sep 23–26, 2026 • Los Angeles, CA",
    startISO: "2026-09-23T00:00:00.000Z",
    endISO: "2026-09-26T23:59:59.000Z",
    title: "National Black MBA Annual Conference & Exposition",
    location: "Los Angeles, CA",
    description: [
      "Career expo + executive networking + business opportunities.",
    ],
    href: "https://www.laconventioncenter.com/events/detail/national-black-mba-association-conference-exposition",
    tags: ["careers", "business"],
  },
  {
    id: "afrotech-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Nov 2–6, 2026 • Houston, TX",
    startISO: "2026-11-02T00:00:00.000Z",
    endISO: "2026-11-06T23:59:59.000Z",
    title: "AFROTECH™ Conference (10-Year Milestone)",
    location: "Houston, TX",
    description: ["Black tech innovation, hiring, startups, and networking."],
    href: "https://afrotechconference.com/",
    tags: ["tech", "startups", "careers"],
  },
  {
    id: "be-xcel-men-2026",
    badge: "US",
    status: "CONFIRMED",
    dateLabel: "Oct 21–23, 2026 • Orlando, FL",
    startISO: "2026-10-21T00:00:00.000Z",
    endISO: "2026-10-23T23:59:59.000Z",
    title: "BLACK ENTERPRISE XCEL Summit for Men",
    location: "Orlando, FL",
    description: [
      "Leadership + entrepreneurship platform for Black executives and founders.",
    ],
    href: "https://www.blackenterprise.com/beevents/",
    tags: ["leadership", "business"],
  },
];

/** ------------------------------------------------------------
 *  MAJOR GLOBAL EVENTS (2026)
 *  ------------------------------------------------------------ */
const MAJOR_GLOBAL_2026: EventItem[] = [
  {
    id: "afro-nation-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Jul 3–5, 2026 • Portimão, Portugal",
    startISO: "2026-07-03T00:00:00.000Z",
    endISO: "2026-07-05T23:59:59.000Z",
    title: "Afro Nation Portugal",
    location: "Portugal",
    description: ["Global afrobeats festival and diaspora gathering."],
    href: "https://www.afronation.com/",
    tags: ["music", "diaspora"],
  },
  {
    id: "toronto-caribbean-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Jul 30–Aug 3, 2026 • Toronto, Canada",
    startISO: "2026-07-30T00:00:00.000Z",
    endISO: "2026-08-03T23:59:59.000Z",
    title: "Toronto Caribbean Carnival (Caribana Weekend)",
    location: "Toronto, Canada",
    description: [
      "One of North America’s largest Caribbean cultural celebrations.",
    ],
    href: "https://www.caribanatoronto.com/",
    tags: ["culture", "caribbean"],
  },
  {
    id: "caribana-parade-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Aug 1, 2026 • Toronto, Canada",
    startISO: "2026-08-01T00:00:00.000Z",
    title: "Toronto Caribbean Carnival – Grand Parade",
    location: "Toronto, Canada",
    description: ["Grand Parade at Exhibition Place & Lakeshore Blvd."],
    href: "https://www.caribanatoronto.com/events/parade",
    tags: ["parade", "culture"],
  },
  {
    id: "notting-hill-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Aug 30–31, 2026 • London, UK",
    startISO: "2026-08-30T00:00:00.000Z",
    endISO: "2026-08-31T23:59:59.000Z",
    title: "Notting Hill Carnival",
    location: "London, UK",
    description: [
      "One of the world’s largest celebrations of Caribbean and Black British culture.",
    ],
    href: "https://nhcarnival.org/",
    tags: ["culture", "uk"],
  },
  {
    id: "notting-hill-panorama-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Aug 29, 2026 • London, UK",
    startISO: "2026-08-29T00:00:00.000Z",
    title: "UK National Panorama (Steel Band Competition Day)",
    location: "London, UK",
    description: [
      "Ticketed steel band competition (Panorama) during Carnival weekend.",
    ],
    href: "https://nhcarnival.org/carnival-info",
    tags: ["music", "steelpan"],
  },
  {
    id: "tobago-carnival-2026",
    badge: "GLOBAL",
    status: "CONFIRMED",
    dateLabel: "Oct 30–Nov 1, 2026 • Tobago",
    startISO: "2026-10-30T00:00:00.000Z",
    endISO: "2026-11-01T23:59:59.000Z",
    title: "Tobago Carnival",
    location: "Tobago",
    description: ["Caribbean carnival celebration on the island of Tobago."],
    href: "https://carnivalvibez.com/tobago-carnival/",
    tags: ["culture", "caribbean"],
  },
];

type ViewKey = "ALL" | "BWE" | "US" | "GLOBAL" | "COMMUNITY";

export default function EventsPage() {
  const [view, setView] = useState<ViewKey>("ALL");

  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState("");
  const [rssItems, setRssItems] = useState<RssItem[]>([]);

  const allEvents = useMemo(() => {
    const merged = [...BWE_LIVE_2026, ...MAJOR_US_2026, ...MAJOR_GLOBAL_2026];
    // Sort by start date (TBD/recurring stays at top of its section in UI)
    const sortable = merged.slice().sort((a, b) => {
      const ad = a.startISO
        ? new Date(a.startISO).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bd = b.startISO
        ? new Date(b.startISO).getTime()
        : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
    return sortable;
  }, []);

  const filtered = useMemo(() => {
    if (view === "ALL") return allEvents;
    if (view === "BWE") return allEvents.filter((e) => e.badge === "BWE LIVE");
    if (view === "US") return allEvents.filter((e) => e.badge === "US");
    if (view === "GLOBAL") return allEvents.filter((e) => e.badge === "GLOBAL");
    return [];
  }, [allEvents, view]);

  const refreshRss = async () => {
    setRssLoading(true);
    setRssError("");
    try {
      const res = await fetch("/api/events/rss");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load RSS feeds.");
      setRssItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setRssError(e?.message || "RSS error");
    } finally {
      setRssLoading(false);
    }
  };

  useEffect(() => {
    refreshRss();
  }, []);

  return (
    <>
      <Head>
        <title>Events (2026) | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Black Wealth Exchange events (2026): BWE Live streams, major US & global Black diaspora events, and community listings via RSS."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* subtle gold glow */}
        <div className="pointer-events-none fixed inset-0 opacity-60">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
        </div>

        <div className="relative p-8">
          <div className="max-w-6xl mx-auto">
            {/* HERO */}
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-gold mb-3">
                Events (2026)
              </h1>
              <p className="text-gray-300">
                Learn BWE through live demos + workshops, then connect with
                major Black events across the U.S. and worldwide.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://youtube.com/@BlackWealthExchange/live"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
                >
                  <PlayCircle className="h-5 w-5" />
                  Watch BWE Live
                </a>

                <Link
                  href="/marketplace/become-a-seller"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <Calendar className="h-5 w-5 text-yellow-300" />
                  Become a Seller
                </Link>
              </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {(
                [
                  ["ALL", "All"],
                  ["BWE", "BWE Live"],
                  ["US", "US"],
                  ["GLOBAL", "Global"],
                  ["COMMUNITY", "Community (RSS)"],
                ] as Array<[ViewKey, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={cx(
                    "px-4 py-2 rounded-full border text-sm font-semibold transition",
                    view === k
                      ? "bg-gold text-black border-yellow-500/40"
                      : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* MAIN CONTENT */}
            {view !== "COMMUNITY" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {filtered.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg hover:shadow-2xl transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-gold text-sm font-semibold">
                          {evt.dateLabel}
                        </div>
                        {evt.location ? (
                          <div className="mt-1 text-xs text-gray-400 inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {evt.location}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            "text-xs font-extrabold tracking-wide px-2 py-1 rounded-full border",
                            evt.badge === "BWE LIVE"
                              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                              : evt.badge === "US"
                                ? "border-white/10 bg-black/30 text-gray-200"
                                : "border-white/10 bg-black/30 text-gray-200",
                          )}
                        >
                          {evt.badge}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-black/30 text-gray-200">
                          {evt.status}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-3">{evt.title}</h2>

                    <div className="space-y-1">
                      {evt.description.map((line, i) => (
                        <p key={i} className="text-gray-300">
                          {line}
                        </p>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {evt.streamUrl ? (
                        <a
                          href={evt.streamUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition text-sm"
                        >
                          <Radio className="h-4 w-4" />
                          Watch Live
                        </a>
                      ) : null}

                      {evt.href ? (
                        <a
                          href={evt.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Official Site
                        </a>
                      ) : null}

                      {/* Optional future RSVP page */}
                      {evt.rsvpUrl ? (
                        <Link
                          href={evt.rsvpUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          RSVP
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gold">
                      Community Events (RSS)
                    </h2>
                    <p className="text-sm text-gray-400">
                      Auto-updated feeds (you control the allowlist). This is
                      how we “add everything” without manual work.
                    </p>
                  </div>

                  <button
                    onClick={refreshRss}
                    disabled={rssLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm disabled:opacity-60"
                  >
                    <RefreshCw
                      className={cx("h-4 w-4", rssLoading && "animate-spin")}
                    />
                    Refresh
                  </button>
                </div>

                {rssError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
                    {rssError}
                    <div className="text-xs text-gray-300 mt-2">
                      Add{" "}
                      <code className="text-gray-100">BWE_EVENTS_RSS_URLS</code>{" "}
                      +{" "}
                      <code className="text-gray-100">
                        BWE_EVENTS_RSS_ALLOWLIST
                      </code>{" "}
                      to enable feeds.
                    </div>
                  </div>
                ) : rssLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-gray-300">
                    Loading RSS feeds…
                  </div>
                ) : rssItems.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-gray-300">
                    No RSS items yet — add feed URLs to populate this section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rssItems.slice(0, 14).map((item) => (
                      <div
                        key={(item.link || item.title) + (item.isoDate || "")}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-xs text-gray-400 inline-flex items-center gap-2">
                            <Globe2 className="h-4 w-4 text-yellow-300" />
                            {formatDate(item.isoDate)}{" "}
                            {item.source ? `• ${item.source}` : ""}
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-black/30 text-gray-200">
                            RSS
                          </span>
                        </div>

                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-lg font-semibold text-gold hover:underline"
                          >
                            {item.title}
                          </a>
                        ) : (
                          <div className="text-lg font-semibold text-gold">
                            {item.title}
                          </div>
                        )}

                        {item.snippet ? (
                          <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                            {item.snippet}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FOOTER NOTE */}
            <div className="mt-12 text-center">
              <p className="text-gray-400 italic">
                BWE Live is designed to teach people how to use the platform.
                Community (RSS) keeps the events list growing automatically.
              </p>
              <div className="mt-6">
                <Link href="/" className="text-gold underline">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
