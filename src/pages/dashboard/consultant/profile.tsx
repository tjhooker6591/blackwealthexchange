import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSULTANT_CATEGORIES } from "@/lib/consultants/catalog";

const DEFAULT = {
  name: "",
  professionalTitle: "",
  category: "",
  topSkills: "",
  yearsExperience: "",
  availability: "",
  engagementType: "",
  industriesServed: "",
  summary: "",
  toolsPlatforms: "",
  certifications: "",
  projectHistory: "",
  location: "",
  remoteStatus: "",
  portfolioUrl: "",
  resumeUrl: "",
};

export default function ConsultantProfileAuthoringPage() {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [completeness, setCompleteness] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/consultants/profile", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load profile");
        const p = data?.profile;
        if (p) {
          setForm({
            name: p.name || "",
            professionalTitle: p.professionalTitle || "",
            category: p.category || "",
            topSkills: (p.topSkills || []).join(", "),
            yearsExperience:
              typeof p.yearsExperience === "number"
                ? String(p.yearsExperience)
                : "",
            availability: p.availability || "",
            engagementType: p.engagementType || "",
            industriesServed: (p.industriesServed || []).join(", "),
            summary: p.summary || "",
            toolsPlatforms: (p.toolsPlatforms || []).join(", "),
            certifications: (p.certifications || []).join(", "),
            projectHistory: (p.projectHistory || []).join("\n"),
            location: p.location || "",
            remoteStatus: p.remoteStatus || "",
            portfolioUrl: p.portfolioUrl || "",
            resumeUrl: p.resumeUrl || "",
          });
          setCompleteness(
            typeof p.completenessScore === "number"
              ? p.completenessScore
              : null,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
    setOk("");
  };

  async function save() {
    setSaving(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/consultants/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          yearsExperience: Number(form.yearsExperience || 0),
          topSkills: form.topSkills,
          industriesServed: form.industriesServed,
          toolsPlatforms: form.toolsPlatforms,
          certifications: form.certifications,
          projectHistory: form.projectHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errors = Array.isArray(data?.validationErrors)
          ? data.validationErrors.join(" ")
          : data?.error || "Save failed";
        throw new Error(errors);
      }

      setCompleteness(data?.profile?.completenessScore ?? null);
      setOk("Consultant profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
              Consultant profile authoring
            </p>
            <h1 className="text-3xl font-extrabold">
              Build your consultant profile
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Structured profile fields improve discovery ranking, filter
              precision, and employer trust.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/consultant/requests"
              className="text-sm text-cyan-200 underline"
            >
              Open request inbox
            </Link>
            <Link
              href="/dashboard/employer/consultants"
              className="text-sm text-yellow-200 underline"
            >
              See employer view
            </Link>
          </div>
        </div>

        {completeness !== null ? (
          <div className="mb-4 rounded-lg border border-emerald-600/40 bg-emerald-900/20 p-3 text-sm text-emerald-100">
            Profile completeness: <strong>{completeness}%</strong>
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-lg border border-red-600/40 bg-red-900/20 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {ok ? (
          <div className="mb-4 rounded-lg border border-emerald-600/40 bg-emerald-900/20 p-3 text-sm text-emerald-100">
            {ok}
          </div>
        ) : null}

        <section className="grid gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-5 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <input
            value={form.professionalTitle}
            onChange={(e) => update("professionalTitle", e.target.value)}
            placeholder="Professional title*"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          >
            <option value="">Select category*</option>
            {CONSULTANT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={form.yearsExperience}
            onChange={(e) => update("yearsExperience", e.target.value)}
            placeholder="Years experience*"
            type="number"
            min={0}
            max={60}
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <input
            value={form.topSkills}
            onChange={(e) => update("topSkills", e.target.value)}
            placeholder="Top skills* (comma-separated)"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.industriesServed}
            onChange={(e) => update("industriesServed", e.target.value)}
            placeholder="Industries served* (comma-separated)"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.availability}
            onChange={(e) => update("availability", e.target.value)}
            placeholder="Availability*"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <input
            value={form.engagementType}
            onChange={(e) => update("engagementType", e.target.value)}
            placeholder="Engagement type*"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Location"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <input
            value={form.remoteStatus}
            onChange={(e) => update("remoteStatus", e.target.value)}
            placeholder="Remote status"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
          />
          <textarea
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Summary"
            rows={4}
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.toolsPlatforms}
            onChange={(e) => update("toolsPlatforms", e.target.value)}
            placeholder="Tools/platforms (comma-separated)"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.certifications}
            onChange={(e) => update("certifications", e.target.value)}
            placeholder="Certifications (comma-separated)"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={form.projectHistory}
            onChange={(e) => update("projectHistory", e.target.value)}
            placeholder="Project history (one per line)"
            rows={4}
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.portfolioUrl}
            onChange={(e) => update("portfolioUrl", e.target.value)}
            placeholder="Portfolio URL"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.resumeUrl}
            onChange={(e) => update("resumeUrl", e.target.value)}
            placeholder="Resume URL"
            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm md:col-span-2"
          />
          <button
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-extrabold text-black md:col-span-2"
          >
            {saving ? "Saving..." : "Save consultant profile"}
          </button>
        </section>
      </div>
    </main>
  );
}
