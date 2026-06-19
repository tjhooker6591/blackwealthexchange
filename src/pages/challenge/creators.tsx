import { useState } from "react";
import ChallengeShareCard from "@/components/challenge/ChallengeShareCard";

export default function ChallengeCreatorsPage() {
  const [form, setForm] = useState<any>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: any) => {
    e.preventDefault();
    const r = await fetch("/api/challenge/creators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) return setError(d?.error || "Unable to submit");
    setDone(true);
  };
  return <main className="min-h-screen bg-black text-white p-6"><div className="max-w-2xl mx-auto"><h1 className="text-3xl font-extrabold text-[#D4AF37]">Challenge Creators & Ambassadors</h1>{done ? <div className="mt-4 space-y-3"><p>Thank you for joining the campaign.</p><ChallengeShareCard variant="creator" /></div> : <form className="space-y-2 mt-4" onSubmit={submit}><input required placeholder="Name" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,name:e.target.value})}/><input required type="email" placeholder="Email" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,email:e.target.value})}/><input placeholder="City" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,city:e.target.value})}/><input placeholder="State" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,state:e.target.value})}/><input placeholder="Platform" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,platform:e.target.value})}/><input placeholder="Handle" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,handle:e.target.value})}/><input placeholder="Follower count" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,followerCount:e.target.value})}/><input placeholder="Content category" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,contentCategory:e.target.value})}/><textarea placeholder="Why do you want to support BWE?" className="w-full p-2 rounded bg-zinc-900" onChange={(e)=>setForm({...form,whySupport:e.target.value})}/>{error?<p className="text-red-300">{error}</p>:null}<button className="px-4 py-2 rounded bg-[#D4AF37] text-black font-bold">Join as Creator/Ambassador</button></form>}</div></main>;
}
