import Head from "next/head";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function SupportTicketEntryPage({
  title,
  intro,
  metaTitle,
  metaDescription,
  canonicalPath,
  defaultCategory,
}: {
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  defaultCategory?: string;
}) {
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={truncateMeta(metaDescription)} />
        <link rel="canonical" href={canonicalUrl(canonicalPath)} />
      </Head>
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold text-yellow-400">{title}</h1>
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
            {intro}
          </div>
          <SupportTicketForm defaultCategory={defaultCategory} />
        </div>
      </main>
    </>
  );
}
