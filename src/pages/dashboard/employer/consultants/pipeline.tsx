import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CONSULTANT_PIPELINE_STATUSES } from "@/lib/consultants/catalog";

type PipelineItem = {
  id: string;
  consultantId: string;
  status: (typeof CONSULTANT_PIPELINE_STATUSES)[number];
  notes?: string;
};

type Consultant = {
  id: string;
  name: string;
  professionalTitle: string;
  category: string;
  completenessScore: number;
};

const STATUS_LABELS: Record<
  (typeof CONSULTANT_PIPELINE_STATUSES)[number],
  string
> = {
  saved: "Saved",
  contacted: "Contacted",
  interview_requested: "Interview Requested",
  under_review: "Under Review",
  hired: "Hired",
};

const STATUS_NEXT: Record<
  (typeof CONSULTANT_PIPELINE_STATUSES)[number],
  (typeof CONSULTANT_PIPELINE_STATUSES)[number][]
> = {
  saved: ["contacted", "interview_requested"],
  contacted: ["interview_requested", "under_review"],
  interview_requested: ["under_review", "hired"],
  under_review: ["hired", "saved"],
  hired: ["under_review"],
};

export default function EmployerConsultantPipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyMoveId, setBusyMoveId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [pipelineRes, consultantsRes, requestsRes] = await Promise.all([
        fetch("/api/employer/consultant-pipeline", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/employer/consultants?limit=100", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/employer/consultant-contact-requests", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const pipelineJson = await pipelineRes.json();
      const consultantsJson = await consultantsRes.json();
      const requestsJson = await requestsRes.json();

      if (!pipelineRes.ok) {
        throw new Error(pipelineJson?.error || "Failed to load pipeline");
      }

      setPipeline(Array.isArray(pipelineJson?.items) ? pipelineJson.items : []);
      setConsultants(
        Array.isArray(consultantsJson?.consultants)
          ? consultantsJson.consultants
          : [],
      );
      setRequests(Array.isArray(requestsJson?.items) ? requestsJson.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const consultantMap = useMemo(() => {
    const map = new Map<string, Consultant>();
    for (const c of consultants) map.set(c.id, c);
    return map;
  }, [consultants]);

  const grouped = useMemo(() => {
    const bucket: Record<
      (typeof CONSULTANT_PIPELINE_STATUSES)[number],
      PipelineItem[]
    > = {
      saved: [],
      contacted: [],
      interview_requested: [],
      under_review: [],
      hired: [],
    };
    for (const item of pipeline) {
      if (bucket[item.status]) bucket[item.status].push(item);
    }
    return bucket;
  }, [pipeline]);

  const metrics = useMemo(() => {
    const totalInPipeline = pipeline.length;
    const interviewRequested = pipeline.filter(
      (x) => x.status === "interview_requested",
    ).length;
    const consultantResponded = requests.filter(
      (r) => !!r.consultantResponseAction,
    ).length;
    const blockedRequests = requests.filter(
      (r) => String(r.moderationStatus || "") === "blocked",
    ).length;

    return {
      totalInPipeline,
      interviewRequested,
      consultantResponded,
      blockedRequests,
    };
  }, [pipeline, requests]);

  async function move(item: PipelineItem, status: string) {
    setError("");
    setSuccess("");
    setBusyMoveId(item.id);
    try {
      const res = await fetch("/api/employer/consultant-pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update pipeline item");
      }
      setSuccess(
        `Moved consultant to ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}.`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update pipeline item",
      );
    } finally {
      setBusyMoveId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
              Employer pipeline board
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">
              Consultant Shortlist Board
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Track consultants through saved → contacted → interview requested
              → under review → hired.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/employer/consultants"
              className="rounded-xl border border-yellow-500/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10"
            >
              Open Discovery
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}

        <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Total in pipeline
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {metrics.totalInPipeline}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Interview requested
            </p>
            <p className="mt-1 text-2xl font-extrabold text-yellow-200">
              {metrics.interviewRequested}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Consultant responded
            </p>
            <p className="mt-1 text-2xl font-extrabold text-cyan-200">
              {metrics.consultantResponded}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Blocked requests
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-200">
              {metrics.blockedRequests}
            </p>
          </article>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <h2 className="text-lg font-semibold">Recent contact requests</h2>
          {requests.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">
              No contact requests yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {requests.slice(0, 8).map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <p className="font-semibold text-zinc-100">
                    {
                      STATUS_LABELS[
                        (r.requestType === "interview_request"
                          ? "interview_requested"
                          : "contacted") as keyof typeof STATUS_LABELS
                      ]
                    }{" "}
                    request for{" "}
                    {consultantMap.get(r.consultantId)?.name || r.consultantId}
                  </p>
                  <p className="mt-1 text-zinc-300">{r.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                    <span className="rounded border border-white/15 px-2 py-0.5">
                      request: {r.status || "submitted"}
                    </span>
                    <span className="rounded border border-white/15 px-2 py-0.5">
                      moderation: {r.moderationStatus || "clean"}
                    </span>
                    {r.consultantResponseAction ? (
                      <span className="rounded border border-cyan-400/30 px-2 py-0.5 text-cyan-200">
                        consultant:{" "}
                        {String(r.consultantResponseAction).replace("_", " ")}
                      </span>
                    ) : null}
                  </div>
                  {r.consultantResponseNote ? (
                    <p className="mt-2 text-xs text-cyan-100/90">
                      Consultant note: {r.consultantResponseNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {loading ? (
          <p className="text-zinc-300">Loading pipeline board...</p>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {CONSULTANT_PIPELINE_STATUSES.map((status) => (
              <div
                key={status}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-3"
              >
                <h3 className="text-sm font-bold text-yellow-200">
                  {STATUS_LABELS[status]}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {grouped[status].length} consultant(s)
                </p>

                <div className="mt-3 space-y-2">
                  {grouped[status].length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-zinc-500">
                      No consultants
                    </div>
                  ) : (
                    grouped[status].map((item) => {
                      const c = consultantMap.get(item.consultantId);
                      return (
                        <article
                          key={item.id}
                          className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs"
                        >
                          <p className="font-semibold text-zinc-100">
                            {c?.name || item.consultantId}
                          </p>
                          <p className="mt-1 text-zinc-300">
                            {c?.professionalTitle || "Consultant"}
                          </p>
                          <p className="mt-1 text-zinc-400">
                            {c?.category || "Category N/A"}
                          </p>
                          <p className="mt-1 text-zinc-400">
                            Profile quality: {c?.completenessScore ?? "N/A"}%
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {STATUS_NEXT[status].map((next) => (
                              <button
                                key={next}
                                onClick={() => void move(item, next)}
                                disabled={busyMoveId === item.id}
                                className="rounded border border-yellow-400/40 px-2 py-1 text-[10px] text-yellow-200 hover:bg-yellow-500/10 disabled:opacity-50"
                              >
                                Move to {STATUS_LABELS[next]}
                              </button>
                            ))}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
