import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Mode = "employer" | "candidate";

export default function RecruitingConsultingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("employer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = router.query.type;
    if (t === "candidate" || t === "employer") setMode(t);
  }, [router.query.type]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/consulting-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, name, email, company, phone, details }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setErr(data?.error || "Submission failed.");
      } else {
        setMsg(data.message || "Submitted.");
        setName("");
        setEmail("");
        setCompany("");
        setPhone("");
        setDetails("");
      }
    } catch {
      setErr("Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[#D4AF37] hover:underline">
          ← Back to Homepage
        </Link>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
            BWE Recruiting & Consulting Services
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Connect Employers with Vetted Black Talent
          </h1>
          <p className="mt-2 text-sm text-white/70 sm:text-base">
            We operate as your middle-layer partner: talent sourcing, candidate qualification,
            and guided placement support.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setMode("employer")}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                mode === "employer" ? "bg-[#D4AF37] text-black" : "text-white/75 hover:bg-white/10"
              }`}
            >
              Employer Request
            </button>
            <button
              type="button"
              onClick={() => setMode("candidate")}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                mode === "candidate" ? "bg-[#D4AF37] text-black" : "text-white/75 hover:bg-white/10"
              }`}
            >
              Talent Intake
            </button>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
              required
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
              required
            />
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={mode === "employer" ? "Company" : "Current school/company (optional)"}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
            />
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder={
                mode === "employer"
                  ? "Tell us what role(s) you need to fill, timeline, and budget range."
                  : "Share your target role, skills, availability, and goals."
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
              required
            />

            {err ? <div className="text-sm text-red-300">{err}</div> : null}
            {msg ? <div className="text-sm text-emerald-300">{msg}</div> : null}

            <button
              disabled={loading}
              className="h-11 rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black transition hover:bg-yellow-500 disabled:opacity-60"
            >
              {loading ? "Submitting..." : mode === "employer" ? "Submit Employer Request" : "Submit Talent Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
