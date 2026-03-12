import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function FinancialLiteracyLanding() {
  const title = "Financial Literacy for Black Communities | Black Wealth Exchange";
  const description = truncateMeta("Learn practical budgeting, credit, investing, and wealth-building strategies designed for Black communities.");
  const canonical = canonicalUrl("/financial-literacy-for-black-communities");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "Black Wealth Exchange" },
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head><title>{title}</title><meta name="description" content={description} /><link rel="canonical" href={canonical} /></Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-extrabold text-[#D4AF37]">Financial literacy for Black communities</h1>
        <p className="text-white/80">Build confidence with money decisions that matter: budgeting, debt reduction, credit repair, investing basics, and long-term wealth planning.</p>
        <ul className="list-disc ml-5 text-white/80 space-y-2">
          <li>Understand how to build and protect credit profiles.</li>
          <li>Learn investing fundamentals for long-term wealth-building.</li>
          <li>Use practical cash-flow systems for family and business stability.</li>
        </ul>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/financial-literacy" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Open financial literacy page</Link>
          <Link href="/wealth-building-resources" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Wealth-building resources</Link>
          <Link href="/resources" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Resources library</Link>
        </div>
      </div>
    </div>
  );
}
