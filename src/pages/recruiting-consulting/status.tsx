import { useState } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  lane: string;
  submissionType: string;
  status: string;
  lifecycleStage: string;
  nextAction: string;
  moderationStatus: string;
  stageLabel: string;
  actionOwner:
    | "submitter"
    | "internal_team"
    | "internal_review"
    | "complete"
    | string;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
  followUpAt: string | null;
};

function statusTone(status: string) {
  if (["approved", "closed_won"].includes(status)) return "text-emerald-300";
  if (["flagged", "spam", "blocked"].includes(status)) return "text-amber-300";
  if (["closed_lost", "declined"].includes(status)) return "text-rose-300";
  return "text-white/90";
}

function ownerLabel(owner: string) {
  return owner.replaceAll("_", " ");
}

export default function ConsultingSubmissionStatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Submission[]>([]);

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/consulting-submission-status?email=${encodeURIComponent(email.trim().toLowerCase())}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load status");
      setItems(Array.isArray(data?.submissions) ? data.submissions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/recruiting-consulting"
          className="text-sm text-[#D4AF37] hover:underline"
        >
          ← Back to Recruiting & Consulting
        </Link>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
            Submission Status
          </div>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Check Your Consulting Request Status
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Enter the same email used for your intake to view current status and
            next action.
          </p>
          <p className="mt-1 text-xs text-white/50">
            We keep up to your 10 most recent consulting submissions and show
            who owns the next action.
          </p>

          <form onSubmit={checkStatus} className="mt-4 space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
            />
            <button
              disabled={loading}
              className="h-11 rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black transition hover:bg-yellow-500 disabled:opacity-60"
            >
              {loading ? "Checking..." : "Check status"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {items.length ? (
            <div className="mt-5 space-y-3">
              {items.map((x) => (
                <article
                  key={x.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded border border-white/20 px-2 py-1 text-white/80">
                      {x.lane}
                    </span>
                    <span className="rounded border border-[#D4AF37]/40 px-2 py-1 text-[#D4AF37]">
                      {x.submissionType}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm font-semibold ${statusTone(x.status)}`}
                  >
                    Status: {x.status}
                  </p>
                  <p className="text-sm text-white/80">
                    Lifecycle: {x.stageLabel || x.lifecycleStage}
                  </p>
                  <p className="text-sm text-white/80">
                    Next action: {x.nextAction}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Moderation: {x.moderationStatus} • Source: {x.source}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Action owner: {ownerLabel(x.actionOwner)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Submitted:{" "}
                    {x.createdAt ? new Date(x.createdAt).toLocaleString() : "-"}
                    {x.followUpAt
                      ? ` • Follow-up: ${new Date(x.followUpAt).toLocaleString()}`
                      : ""}
                  </p>
                </article>
              ))}
            </div>
          ) : !loading ? (
            <p className="mt-4 text-sm text-white/60">
              No submissions found yet for this email.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
