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
    secondary: { href: "/trust", label: "Review trust & policy standards" },
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
    secondary: { href: "/black-jobs", label: "View jobs discovery hub" },
  },
  {
    key: "user",
    intent: "find-jobs",
    title: "Job Seeker / Talent",
    summary:
      "Explore roles, filter by niche, and continue your job search journey in one place.",
    primary: { href: "/job-listings", label: "Browse live jobs" },
    secondary: { href: "/black-jobs", label: "Explore job niches" },
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
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">Start Here</h1>
          <p className="mt-2 max-w-3xl text-white/80">
            Choose the path that matches your goal. Each flow is designed to get
            you to value quickly with clear next steps.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={roleResume.href}
              onClick={() =>
                trackFlowEvent({
                  eventType: "start_here_role_selected",
                  source: "start-here-header",
                  path: roleResume.href,
                })
              }
              className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-extrabold text-black hover:bg-yellow-400"
            >
              {roleResume.label}
            </Link>
            <Link
              href="/trust"
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Review trust standards
            </Link>
          </div>
        </header>


        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-lg font-bold text-white">{role.title}</h2>
              <p className="mt-2 text-sm text-white/75">{role.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/signup?accountType=${encodeURIComponent(role.key)}&intent=${encodeURIComponent(role.intent)}`}
                  onClick={() =>
                    trackFlowEvent({
                      eventType: "signup_start",
                      source: "start-here-role-card",
                      category: role.title,
                    })
                  }
                  className="rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20"
                >
                  Join now for this path
                </Link>
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
                  className="rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-bold text-black hover:bg-yellow-400"
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
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {role.secondary.label}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75">
          <div className="font-semibold text-white">Why join now?</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">
            <li>Save opportunities and continue where you left off.</li>
            <li>
              Unlock faster role-based onboarding (seller, employer, business
              owner).
            </li>
            <li>Get a cleaner path to buying, hiring, and growth actions.</li>
          </ul>
          <div className="mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-[#D4AF37] underline">
              Log in
            </Link>
            . New here?{" "}
            <Link
              href="/signup?intent=join-bwe"
              onClick={() =>
                trackFlowEvent({
                  eventType: "signup_start",
                  source: "start-here-footer",
                })
              }
              className="text-[#D4AF37] underline"
            >
              Create an account
            </Link>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
