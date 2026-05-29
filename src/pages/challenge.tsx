import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ChallengeShareCard from "@/components/challenge/ChallengeShareCard";

export default function ChallengePage() {
  const router = useRouter();
  const referredBy = useMemo(() => String(router.query.ref || ""), [router.query.ref]);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", city: "", state: "", wantsToRefer: true, ownsBusiness: false, businessName: "" });
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/challenge/stats").then((r) => r.json()).then(setStats).catch(() => setStats(null)); }, []);

  const submit = async (e: any) => {
    e.preventDefault(); setError("");
    const res = await fetch("/api/challenge/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, referredBy, source: "challenge-page", sourceDetail: referredBy ? "referral" : "direct" }) });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || "Unable to submit.");
    setDone(data);
  };

  return <main className="min-h-screen bg-black text-white p-4 sm:p-6"><div className="max-w-4xl mx-auto space-y-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37]">BWE 0.5% Challenge</h1>
    <p>Join the BWE 0.5% Challenge. Search Black first. Buy, review, refer, repeat.</p>
    <p>Invite family, friends, churches, schools, businesses, and organizations. Add or claim a Black-owned business.</p>
    <div className="flex flex-wrap gap-2"><Link href="/business-directory" className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold">Search Black-Owned Businesses</Link><Link href="/business-directory/add-business" className="px-4 py-2 rounded border border-[#D4AF37]">Add Your Business</Link></div>

    <section className="rounded border border-white/20 p-4">
      {stats?.ok ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm"><div><b>{stats.membersJoined}</b><div>Members</div></div><div><b>{stats.citiesRepresented}</b><div>Cities</div></div><div><b>{stats.businessOwnerInterestCount}</b><div>Business-owner interest</div></div><div><b>{stats.topCities?.[0]?.city || "-"}</b><div>Top city</div></div></div> : <p>Be one of the first members to join the BWE 0.5% Challenge.</p>}
    </section>

    {!done ? <form onSubmit={submit} className="space-y-3 rounded border border-white/20 p-4"><h2 className="text-xl font-bold">Join the Challenge</h2>
      <input required placeholder="Name" className="w-full p-2 rounded bg-zinc-900" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
      <input required type="email" placeholder="Email" className="w-full p-2 rounded bg-zinc-900" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input placeholder="City" className="w-full p-2 rounded bg-zinc-900" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/><input placeholder="State" className="w-full p-2 rounded bg-zinc-900" value={form.state} onChange={(e)=>setForm({...form,state:e.target.value})}/></div>
      {error ? <p className="text-red-300">{error}</p> : null}
      <button className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold">Join the Challenge</button>
    </form> : <section className="rounded border border-[#D4AF37] p-4"><h2 className="text-xl font-bold">You joined the BWE 0.5% Challenge. Now invite 3 people and search for one Black-owned business in your city.</h2><p className="mt-2">Referral link: <a className="text-[#D4AF37]" href={done.referralLink}>{done.referralLink}</a></p><div className="mt-3 flex flex-wrap gap-2"><button className="px-3 py-2 rounded bg-[#D4AF37] text-black">Invite 3 People</button><Link href={`/business-directory?search=${encodeURIComponent(form.city)}`} className="px-3 py-2 rounded border border-[#D4AF37]">Search My City</Link><button className="px-3 py-2 rounded border border-[#D4AF37]">Share on Social Media</button><Link href="/business-directory/add-business" className="px-3 py-2 rounded border border-[#D4AF37]">Add or Claim a Business</Link></div><div className="mt-3 space-y-2"><ChallengeShareCard variant="signup" referralLink={done.referralLink} /><ChallengeShareCard variant="search" /><ChallengeShareCard variant="business" /></div></section>}
  </div></main>;
}
