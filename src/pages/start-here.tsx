import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const ROLES = [
  {
    title: "Buyer / Shopper",
    summary: "Find trusted Black-owned products and businesses, then buy with confidence.",
    primary: { href: "/marketplace", label: "Shop Black-owned products" },
    secondary: { href: "/business-directory", label: "Find Black-owned businesses near me" },
  },
  {
    title: "Business Owner (Directory)",
    summary: "Get your business discovered by customers actively looking to support Black-owned companies.",
    primary: { href: "/business-directory/add-business", label: "Get listed in directory" },
    secondary: { href: "/trust", label: "Review trust & policy standards" },
  },
  {
    title: "Seller (Marketplace)",
    summary: "Launch products, get discovered, and start selling through BWE marketplace pathways.",
    primary: { href: "/marketplace/become-a-seller", label: "Start selling on BWE" },
    secondary: { href: "/marketplace", label: "See marketplace first" },
  },
  {
    title: "Employer",
    summary: "Post jobs and connect with talent aligned with your company and mission.",
    primary: { href: "/post-job", label: "Post a job" },
    secondary: { href: "/black-jobs", label: "View jobs discovery hub" },
  },
  {
    title: "Job Seeker / Talent",
    summary: "Explore roles, filter by niche, and continue your job search journey in one place.",
    primary: { href: "/job-listings", label: "Browse live jobs" },
    secondary: { href: "/black-jobs", label: "Explore job niches" },
  },
];

export default function StartHerePage() {
  const { user } = useAuth();
  const [recentProducts, setRecentProducts] = useState<Array<{ _id: string; name: string }>>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<Array<{ alias: string; name: string }>>([]);

  const title = "Start Here | Black Wealth Exchange";
  const description = truncateMeta(
    "Choose your path on Black Wealth Exchange: shop, get listed, sell products, post jobs, or find career opportunities.",
  );
  const canonical = canonicalUrl("/start-here");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rpRaw = window.localStorage.getItem("bwe:recent-products");
      const rbRaw = window.localStorage.getItem("bwe:recent-businesses");
      const rp = rpRaw ? JSON.parse(rpRaw) : [];
      const rb = rbRaw ? JSON.parse(rbRaw) : [];
      setRecentProducts(
        Array.isArray(rp)
          ? rp
              .filter((x: any) => x?._id && x?.name)
              .slice(0, 3)
              .map((x: any) => ({ _id: String(x._id), name: String(x.name) }))
          : [],
      );
      setRecentBusinesses(
        Array.isArray(rb)
          ? rb
              .filter((x: any) => x?.alias && x?.name)
              .slice(0, 3)
              .map((x: any) => ({ alias: String(x.alias), name: String(x.name) }))
          : [],
      );
    } catch {
      setRecentProducts([]);
      setRecentBusinesses([]);
    }
  }, []);

  const roleResume =
    user?.accountType === "seller"
      ? { href: "/marketplace/dashboard", label: "Continue seller dashboard" }
      : user?.accountType === "business"
        ? { href: "/business-directory/add-business", label: "Continue business listing setup" }
        : user?.accountType === "employer"
          ? { href: "/employer/jobs", label: "Continue employer hiring flow" }
          : user?.accountType === "admin"
            ? { href: "/admin/dashboard", label: "Continue admin dashboard" }
            : { href: "/job-listings", label: "Continue exploring opportunities" };

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
            <Link href={roleResume.href} className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-extrabold text-black hover:bg-yellow-400">
              {roleResume.label}
            </Link>
            <Link href="/trust" className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">
              Review trust standards
            </Link>
          </div>
        </header>

        {(recentProducts.length > 0 || recentBusinesses.length > 0) && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-extrabold uppercase tracking-wide text-white/60">Continue where you left off</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {recentProducts.map((p) => (
                <Link key={p._id} href={`/marketplace/product/${p._id}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">
                  {p.name}
                </Link>
              ))}
              {recentBusinesses.map((b) => (
                <Link key={b.alias} href={`/business-directory/${encodeURIComponent(b.alias)}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">
                  {b.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold text-white">{role.title}</h2>
              <p className="mt-2 text-sm text-white/75">{role.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={role.primary.href} className="rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-bold text-black hover:bg-yellow-400">
                  {role.primary.label}
                </Link>
                <Link href={role.secondary.href} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  {role.secondary.label}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75">
          Already have an account? <Link href="/login" className="text-[#D4AF37] underline">Log in</Link>.
          New here? <Link href="/signup" className="text-[#D4AF37] underline">Create an account</Link>.
        </section>
      </div>
    </main>
  );
}
