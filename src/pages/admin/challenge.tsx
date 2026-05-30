import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function AdminChallengePage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/challenge").then((r)=>r.json()).then(setData); }, []);
  return <main className="min-h-screen bg-black text-white p-6"><div className="max-w-5xl mx-auto"><h1 className="text-3xl font-extrabold text-[#D4AF37]">Admin Challenge Dashboard</h1>{!data?.ok?<p className="mt-3">Loading...</p>:<div className="mt-4 space-y-4"><p>Total members: {data.totalMembers}</p><p>Business-owner interest: {data.businessOwnerInterestCount}</p><p>Creator interest count: {data.creatorInterestCount}</p><Link href="/api/admin/challenge?format=csv" className="inline-block rounded border border-[#D4AF37]/40 px-3 py-1 text-sm text-[#D4AF37]">Export CSV</Link><section><h2 className="font-bold">By city</h2><ul>{data.byCity?.slice(0,10).map((r:any)=><li key={r._id || 'unknown-city'}>{r._id || "(blank)"}: {r.count}</li>)}</ul></section><section><h2 className="font-bold">By state</h2><ul>{data.byState?.slice(0,10).map((r:any)=><li key={r._id || 'unknown-state'}>{r._id || "(blank)"}: {r.count}</li>)}</ul></section><section><h2 className="font-bold">Top referrers</h2><ul>{data.topReferrers?.map((r:any)=><li key={r._id}>{r._id}: {r.count}</li>)}</ul></section><section><h2 className="font-bold">Source breakdown</h2><ul>{data.sourceBreakdown?.map((r:any)=><li key={r._id || 'unknown-source'}>{r._id || "(blank)"}: {r.count}</li>)}</ul></section><section><h2 className="font-bold">Recent signups</h2><ul>{data.recentSignups?.slice(0,10).map((m:any)=><li key={m._id}>{m.name} ({m.email}) - {m.city}, {m.state}</li>)}</ul></section></div>}</div></main>;
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/challenge");
