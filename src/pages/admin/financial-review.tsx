import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { useEffect, useState } from "react";
import Link from "next/link";

type Data = any;

export default function FinancialReviewPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch('/api/admin/financial-review', { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const streams = data?.byStream || {};

  return <div className="min-h-screen bg-black text-white p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold text-yellow-400">Financial Review</h1><Link href="/admin/dashboard" className="text-sm border border-zinc-700 px-3 py-2 rounded">Back to Admin</Link></div>

      <section className="grid md:grid-cols-4 gap-4">
        <Card t="Total Revenue" v={data?.totalRevenue} />
        <Card t="Revenue This Month" v={data?.revenueThisMonth} />
        <Card t="Pending / Unconfirmed Revenue" v={data?.pendingRevenue} />
        <Card t="Refunded / Failed Payments" v={data?.failedOrRefunded} />
      </section>

      <Section title="Revenue Streams">
        {[
          ['Advertising / Sponsorship Revenue','advertising'],
          ['Marketplace Platform Fees','marketplace'],
          ['Job Posting Revenue','jobs'],
          ['Membership / Black Card Revenue','membership_black_card'],
          ['Course / Financial Literacy Revenue','courses'],
          ['Consulting / Opportunity Network Revenue','consulting_opportunity_network'],
          ['Music Creator Plan Revenue','music_creator_plan'],
          ['Directory Listing / Featured Placement Revenue','directory'],
          ['Affiliate Revenue','affiliate_liability'],
          ['Other / Manual Revenue','other'],
        ].map(([label,key]) => <div key={String(key)} className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">{label}: <span className="text-yellow-300">{streams[key]?.count ? money(streams[key].retained) : 'Not connected yet'}</span></div>)}
      </Section>

      <Section title="Transaction Review"><pre className="text-xs overflow-auto">{JSON.stringify(data?.latestTransactions || [], null, 2)}</pre></Section>
      <Section title="Pending Payments / Failed Payments"><pre className="text-xs overflow-auto">{JSON.stringify({pendingRevenue:data?.pendingRevenue, failedOrRefunded:data?.failedOrRefunded}, null, 2)}</pre></Section>
      <Section title="Refunds / Disputes"><p className="text-sm text-zinc-300">Using payment status fields only. If no dispute feed is connected, values remain zero.</p></Section>
      <Section title="Monthly Revenue Trend"><p className="text-sm text-zinc-300">Use existing Platform Analytics monthly series. This page is central finance control for stream-level review.</p></Section>
      <Section title="Export / Report Preparation"><p className="text-sm text-zinc-300">Latest transactions are shown from real payment records only, no synthetic values.</p></Section>
    </div>
  </div>;
}

function money(v:any){return `$${(Number(v||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function Card({t,v}:{t:string,v:any}){return <div className="rounded border border-zinc-800 bg-zinc-950 p-4"><p className="text-xs text-zinc-400">{t}</p><p className="text-xl text-yellow-300 font-bold">{money(v)}</p></div>}
function Section({title,children}:{title:string,children:any}){return <section className="rounded border border-zinc-800 bg-zinc-950 p-4"><h2 className="text-lg text-yellow-400 mb-2">{title}</h2>{children}</section>}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps('/admin/financial-review');
