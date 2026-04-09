import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmployerConsultantProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultant, setConsultant] = useState<any>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/employer/consultants/${id}`, {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load profile");
        setConsultant(data.consultant);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function updatePipeline(status: string) {
    if (!consultant?.id) return;
    await fetch("/api/employer/consultant-pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ consultantId: consultant.id, status }),
    });
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/employer/consultants" className="text-sm text-yellow-300 hover:underline">← Back to consultant discovery</Link>

        {loading ? (
          <p className="mt-6 text-zinc-300">Loading consultant profile...</p>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-red-700/50 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>
        ) : consultant ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <h1 className="text-3xl font-extrabold">{consultant.name}</h1>
            <p className="mt-1 text-yellow-200">{consultant.professionalTitle}</p>
            <p className="mt-4 text-zinc-200">{consultant.summary}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h2 className="font-semibold">Experience & engagement</h2>
                <p className="mt-2 text-sm text-zinc-300">Years experience: {consultant.yearsExperience ?? "N/A"}</p>
                <p className="mt-1 text-sm text-zinc-300">Engagement type: {consultant.engagementType}</p>
                <p className="mt-1 text-sm text-zinc-300">Availability: {consultant.availability}</p>
                <p className="mt-1 text-sm text-zinc-300">Location/remote: {consultant.location || consultant.remoteStatus}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h2 className="font-semibold">Skills, tools, and certifications</h2>
                <p className="mt-2 text-sm text-zinc-300">Top skills: {consultant.topSkills?.join(", ") || "N/A"}</p>
                <p className="mt-1 text-sm text-zinc-300">Tools/platforms: {consultant.toolsPlatforms?.join(", ") || "N/A"}</p>
                <p className="mt-1 text-sm text-zinc-300">Certifications: {consultant.certifications?.join(", ") || "N/A"}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
              <h2 className="font-semibold">Industries & project history</h2>
              <p className="mt-2 text-sm text-zinc-300">Industries served: {consultant.industriesServed?.join(", ") || "N/A"}</p>
              <ul className="mt-3 list-disc pl-5 text-sm text-zinc-300">
                {(consultant.projectHistory || []).slice(0, 6).map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {consultant.resumeUrl ? (
                <a href={consultant.resumeUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">View Resume</a>
              ) : null}
              {consultant.portfolioUrl ? (
                <a href={consultant.portfolioUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">View Portfolio</a>
              ) : null}
              <button onClick={() => void updatePipeline("saved")} className="rounded-lg border border-yellow-400/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10">Save</button>
              <button onClick={() => void updatePipeline("contacted")} className="rounded-lg border border-yellow-400/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10">Contact</button>
              <button onClick={() => void updatePipeline("interview_requested")} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black">Request Interview</button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
