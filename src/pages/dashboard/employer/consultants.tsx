import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CONSULTANT_CATEGORIES,
  CONSULTANT_PIPELINE_STATUSES,
} from "@/lib/consultants/catalog";

type Consultant = {
  id: string;
  name: string;
  professionalTitle: string;
  category: string;
  topSkills: string[];
  yearsExperience: number | null;
  industriesServed: string[];
  summary: string;
  engagementType: string;
  availability: string;
  resumeUrl: string | null;
  trust: { featured: boolean; verified: boolean; vetted: boolean };
};

type PipelineItem = {
  id: string;
  consultantId: string;
  status: (typeof CONSULTANT_PIPELINE_STATUSES)[number];
};

export default function EmployerConsultantDiscoveryPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (skills.trim()) params.set("skills", skills.trim());

      const [consultantsRes, pipelineRes] = await Promise.all([
        fetch(`/api/employer/consultants?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/employer/consultant-pipeline`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const consultantData = await consultantsRes.json();
      const pipelineData = await pipelineRes.json();

      if (!consultantsRes.ok) {
        throw new Error(consultantData?.error || "Failed to load consultants");
      }

      setConsultants(Array.isArray(consultantData?.consultants) ? consultantData.consultants : []);
      setPipeline(Array.isArray(pipelineData?.items) ? pipelineData.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consultants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pipelineMap = useMemo(() => {
    const map = new Map<string, PipelineItem>();
    for (const item of pipeline) map.set(item.consultantId, item);
    return map;
  }, [pipeline]);

  async function saveConsultant(consultantId: string, status: string) {
    await fetch("/api/employer/consultant-pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ consultantId, status }),
    });
    await load();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">Employer discovery hub</p>
            <h1 className="mt-2 text-3xl font-extrabold">Consultant Marketplace</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Find, shortlist, and move qualified consultants through your hiring pipeline.
            </p>
          </div>
          <Link href="/recruiting-consulting?type=employer" className="rounded-xl border border-yellow-500/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10">
            Submit staffing brief
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, title, skills"
              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {CONSULTANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Skills (comma-separated)"
              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
            />
            <button onClick={() => void load()} className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black">Apply filters</button>
          </div>
        </section>

        {error ? <div className="mt-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">{error}</div> : null}

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="text-sm text-zinc-300">Loading consultants...</div>
          ) : consultants.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
              No consultants matched your filters.
            </div>
          ) : (
            consultants.map((c) => {
              const state = pipelineMap.get(c.id)?.status || "saved";
              return (
                <article key={c.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white">{c.name}</h3>
                      <p className="text-sm text-yellow-200">{c.professionalTitle}</p>
                    </div>
                    <span className="rounded-full border border-cyan-300/40 px-2 py-1 text-[11px] text-cyan-200">{c.category}</span>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300 line-clamp-3">{c.summary}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.topSkills.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-200">{s}</span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                    <p>Experience: {c.yearsExperience ? `${c.yearsExperience} yrs` : "N/A"}</p>
                    <p>Availability: {c.availability}</p>
                    <p>Engagement: {c.engagementType}</p>
                    <p>Resume: {c.resumeUrl ? "Available" : "Not uploaded"}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/dashboard/employer/consultants/${c.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10">View Profile</Link>
                    <button onClick={() => void saveConsultant(c.id, "saved")} className="rounded-lg border border-yellow-400/40 px-3 py-2 text-xs text-yellow-200 hover:bg-yellow-500/10">Save</button>
                    <button onClick={() => void saveConsultant(c.id, "interview_requested")} className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-black">Request Interview</button>
                  </div>

                  <p className="mt-3 text-[11px] text-zinc-400">Pipeline status: {state.replace("_", " ")}</p>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
