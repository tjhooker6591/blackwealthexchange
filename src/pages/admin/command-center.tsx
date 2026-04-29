import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Metric = { value: number | string; sourceStatus: string; note?: string; link?: string };

function Card({ label, m }: { label: string; m: Metric }) {
  const badge = m?.sourceStatus || "needs_mapping";
  return <div className="rounded border border-zinc-800 bg-zinc-950 p-3"><div className="text-xs text-zinc-400">{label}</div><div className="text-2xl font-bold text-yellow-300">{String(m?.value ?? 0)}</div><div className="text-[11px] text-zinc-500">{badge}{m?.note?` • ${m.note}`:""}</div></div>;
}

export default function Page(){
  const [d,setD]=useState<any>(null); const [e,setE]=useState("");
  useEffect(()=>{fetch('/api/admin/metrics/command-center',{credentials:'include'}).then(async r=>{const j=await r.json();if(!r.ok) throw new Error(j?.message||'Failed'); setD(j);}).catch(err=>setE(err.message));},[]);
  if(e) return <main className="min-h-screen bg-black text-white p-8">Error: {e}</main>;
  if(!d) return <main className="min-h-screen bg-black text-white p-8">Loading command center...</main>;
  const sec=(title:string,obj:any)=><section className="space-y-2"><h2 className="text-xl font-semibold text-yellow-400">{title}</h2><div className="grid md:grid-cols-4 gap-3">{Object.entries(obj||{}).map(([k,v]:any)=><Card key={k} label={k} m={v} />)}</div></section>;
  return <main className="min-h-screen bg-black text-white p-8"><div className="max-w-7xl mx-auto space-y-6"><h1 className="text-3xl font-bold text-yellow-400">CEO Command Center</h1><div className="text-sm text-zinc-400">Generated: {d.generatedAt}</div>{sec('Company Health',d.companyHealth)}{sec('Revenue Health',d.revenueHealth)}{sec('Support Health',d.supportHealth)}{sec('Product / Engineering Health',d.productEngineeringHealth)}{sec('Growth Health',d.growthHealth)}{sec('Trust & Safety Health',d.trustSafetyHealth)}<section className="space-y-2"><h2 className="text-xl font-semibold text-yellow-400">Executive Priorities</h2><pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">{JSON.stringify(d.executivePriorities,null,2)}</pre></section></div></main>;
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps('/admin/command-center');
