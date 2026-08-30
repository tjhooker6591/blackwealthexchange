import Head from "next/head";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/flow-events";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

const ROLES = [
  {
    key: "user",
    intent: "shopper",
    title: "Buyer / Shopper",
    summary:
      "Find trusted Black-owned products and businesses, then buy with confidence.",
    primary: { href: "/marketplace", label: "Shop Black-owned products" },
    secondary: {
      href: "/business-directory",
      label: "Find Black-owned businesses near me",
    },
  },
  {
    key: "business",
    intent: "list-business",
    title: "Business Owner (Directory)",
    summary:
      "Get your business discovered by customers actively looking to support Black-owned companies.",
    primary: {
      href: "/business-directory/add-business",
      label: "Get listed in directory",
    },
    secondary: {
      href: "/terms-of-service",
      label: "Review trust & policy standards",
    },
  },
  {
    key: "seller",
    intent: "become-seller",
    title: "Seller (Marketplace)",
    summary:
      "Launch products, get discovered, and start selling through BWE marketplace pathways.",
    primary: {
      href: "/marketplace/become-a-seller",
      label: "Start selling on BWE",
    },
    secondary: { href: "/marketplace", label: "See marketplace first" },
  },
  {
    key: "employer",
    intent: "hire-talent",
    title: "Employer",
    summary:
      "Post jobs and connect with talent aligned with your company and mission.",
    primary: { href: "/post-job", label: "Post a job" },
    secondary: { href: "/jobs", label: "View jobs discovery hub" },
  },
  {
    key: "user",
    intent: "find-jobs",
    title: "Job Seeker / Talent",
    summary:
      "Explore roles, filter by niche, and continue your job search journey in one place.",
    primary: { href: "/job-listings", label: "Browse live jobs" },
    secondary: { href: "/jobs", label: "Explore job niches" },
  },
];

export default function StartHerePage() {
  const { user } = useAuth();
  const title = "Start Here | Black Wealth Exchange";
  const description = truncateMeta(
    "Choose your path on Black Wealth Exchange: shop, get listed, sell products, post jobs, or find career opportunities.",
  );
  const canonical = canonicalUrl("/start-here");

  const roleResume =
    user?.accountType === "seller"
      ? { href: "/marketplace/dashboard", label: "Continue seller dashboard" }
      : user?.accountType === "business"
        ? {
            href: "/business-directory/add-business",
            label: "Continue business listing setup",
          }
        : user?.accountType === "employer"
          ? { href: "/employer/jobs", label: "Continue employer hiring flow" }
          : user?.accountType === "admin"
            ? { href: "/admin/dashboard", label: "Continue admin dashboard" }
            : {
                href: "/job-listings",
                label: "Continue exploring opportunities",
              };

  return (
    <main className="min-h-screen bg-[var(--surface-0)] py-8 text-white sm:py-10">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="bwe-section-wrap space-y-8">
        <header className="bwe-hero-panel overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-4xl">
            <div className="bwe-eyebrow">Orientation</div>
            <h1 className="bwe-display-title mt-3 max-w-3xl">
              Choose the BWE path that matches what you want to do next.
            </h1>
            <p className="bwe-lead mt-4 max-w-2xl">
              Discover businesses, shop products, build a business presence,
              sell, hire, or find opportunities without hunting through the full
              platform first.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={roleResume.href}
                onClick={() =>
                  trackFlowEvent({
                    eventType: "start_here_role_selected",
                    source: "start-here-header",
                    path: roleResume.href,
                  })
                }
                className="bwe-cta-primary bwe-focus-ring inline-flex min-h-12 items-center justify-center px-6 text-sm"
              >
                {roleResume.label}
              </Link>
              <Link
                href="/marketplace"
                className="bwe-cta-secondary bwe-focus-ring inline-flex min-h-12 items-center justify-center px-5 text-sm text-white/88"
              >
                Browse live marketplace
              </Link>
            </div>

            <div className="bwe-divider mt-6" />

            <div className="mt-4 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/42">
                  What BWE helps you do
                </div>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                  Move into trusted discovery, commerce, opportunity, and
                  ownership flows with clearer navigation and fewer wrong turns.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="bwe-soft-tile px-4 py-3 text-sm text-white/78">
                  Discover, shop, and support Black-owned businesses.
                </div>
                <div className="bwe-soft-tile px-4 py-3 text-sm text-white/78">
                  List, sell, hire, and keep moving into growth paths.
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="border-y border-white/8 py-4">
          <div className="grid gap-2 text-sm text-white/68 sm:grid-cols-3 lg:grid-cols-7">
            <div>Discover</div>
            <div>Shop</div>
            <div>Build wealth</div>
            <div>Find opportunities</div>
            <div>Grow a business</div>
            <div>Sell</div>
            <div>Hire</div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.title} className="bwe-soft-tile p-5 sm:p-6">
              <div className="bwe-eyebrow">
                {role.intent.replace(/-/g, " ")}
              </div>
              <h2 className="bwe-card-title mt-2">{role.title}</h2>
              <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-white/74">
                {role.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={role.primary.href}
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "start_here_role_selected",
                      source: "start-here-primary",
                      category: role.title,
                      path: role.primary.href,
                    })
                  }
                  className="bwe-cta-primary bwe-focus-ring inline-flex min-h-11 items-center justify-center px-4 text-sm"
                >
                  {role.primary.label}
                </Link>
                <Link
                  href={role.secondary.href}
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "start_here_role_selected",
                      source: "start-here-secondary",
                      category: role.title,
                      path: role.secondary.href,
                    })
                  }
                  className="bwe-link-pill bwe-focus-ring"
                >
                  {role.secondary.label}
                </Link>
              </div>
              <div className="mt-3">
                <Link
                  href={`/signup?accountType=${encodeURIComponent(role.key)}&intent=${encodeURIComponent(role.intent)}`}
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "signup_start",
                      source: "start-here-role-card",
                      category: role.title,
                    })
                  }
                  className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
                >
                  Join now for this path
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 border-t border-white/8 pt-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bwe-soft-tile p-6 text-sm text-white/75">
            <div className="bwe-eyebrow">Why join now</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
              <li>Save opportunities and continue where you left off.</li>
              <li>
                Unlock faster role-based onboarding for sellers, employers, and
                businesses.
              </li>
              <li>Get a cleaner path to buying, hiring, and growth actions.</li>
            </ul>
          </div>

          <div className="bwe-soft-tile p-6 text-sm text-white/75">
            <div className="bwe-eyebrow">Account access</div>
            <div className="mt-3 space-y-3">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="bwe-open-link bwe-focus-ring">
                  Log in
                </Link>
              </p>
              <p>
                New here?{" "}
                <Link
                  href="/signup?intent=join-bwe"
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "signup_start",
                      source: "start-here-footer",
                    })
                  }
                  className="bwe-open-link bwe-focus-ring"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
