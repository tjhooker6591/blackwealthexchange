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

      <div className="bwe-section-wrap space-y-6">
        <header className="bwe-hero-panel overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8">
          <div className="max-w-4xl">
            <div className="bwe-shell-label">Orientation</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
              Start with the intent that fits your economic goal.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
              BWE is built for discovery, commerce, opportunity, and ownership.
              Choose the path that matches what you want to do right now, then
              move directly into the working product flow.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bwe-badge" data-tone="accent">
                Discover
              </span>
              <span className="bwe-badge">Shop</span>
              <span className="bwe-badge">Build wealth</span>
              <span className="bwe-badge">Find opportunities</span>
              <span className="bwe-badge">Grow a business</span>
              <span className="bwe-badge">Sell</span>
              <span className="bwe-badge">Hire</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="bwe-shell-panel rounded-[28px] p-5">
              <div className="bwe-shell-label">Fastest next step</div>
              <div className="mt-2 text-xl font-extrabold text-white">
                {roleResume.label}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Resume the most relevant destination for the current account
                state, or choose a new path below if your goal has changed.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={roleResume.href}
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "start_here_role_selected",
                      source: "start-here-header",
                      path: roleResume.href,
                    })
                  }
                  className="bwe-focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent)] px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-black hover:bg-[var(--accent-strong)]"
                >
                  {roleResume.label}
                </Link>
                <Link
                  href="/terms-of-service"
                  className="bwe-link-pill bwe-focus-ring"
                >
                  Review trust standards
                </Link>
              </div>
            </div>

            <div className="bwe-shell-panel rounded-[28px] p-5">
              <div className="bwe-shell-label">What BWE helps you do</div>
              <ul className="mt-3 space-y-3 text-sm text-white/78">
                <li>Find Black-owned businesses and products faster.</li>
                <li>Move from discovery into trusted commerce pathways.</li>
                <li>Get into jobs, opportunities, hiring, and growth flows.</li>
                <li>
                  Keep navigation clear whether you are buying or building.
                </li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <article
              key={role.title}
              className="bwe-shell-panel rounded-[28px] p-5 sm:p-6"
            >
              <div className="bwe-shell-label">
                {role.intent.replace(/-/g, " ")}
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-white">
                {role.title}
              </h2>
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
                  className="bwe-focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent)] px-4 text-sm font-extrabold text-black hover:bg-[var(--accent-strong)]"
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
                  className="text-sm font-semibold text-[var(--accent)] underline underline-offset-4"
                >
                  Join now for this path
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bwe-shell-panel rounded-[28px] p-6 text-sm text-white/75">
            <div className="bwe-shell-label">Why join now</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/82">
              <li>Save opportunities and continue where you left off.</li>
              <li>
                Unlock faster role-based onboarding for sellers, employers, and
                businesses.
              </li>
              <li>Get a cleaner path to buying, hiring, and growth actions.</li>
            </ul>
          </div>

          <div className="bwe-shell-panel rounded-[28px] p-6 text-sm text-white/75">
            <div className="bwe-shell-label">Account access</div>
            <div className="mt-3 space-y-3">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-[var(--accent)] underline">
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
                  className="text-[var(--accent)] underline"
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
