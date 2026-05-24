import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

const REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted to consultant",
  accepted: "Accepted by consultant",
  declined: "Declined by consultant",
  more_info_requested: "Consultant requested more info",
  under_admin_review: "Under admin review",
  rejected: "Rejected",
  blocked: "Blocked by moderation",
};

const REQUEST_STATUS_NEXT_STEP: Record<string, string> = {
  submitted: "Await consultant response.",
  accepted: "Move to interview scheduling or under review.",
  declined: "Select another consultant or revise request.",
  more_info_requested: "Send clarifying details in a follow-up request.",
  under_admin_review: "Await moderation disposition.",
  rejected: "Request closed by moderation.",
  blocked: "Revise message and resubmit.",
};

export default function EmployerConsultantProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultant, setConsultant] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState<
    "contact" | "interview_request"
  >("contact");
  const [requestStatus, setRequestStatus] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState<string>("saved");
  const [requestHistory, setRequestHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [profileRes, pipelineRes, requestsRes] = await Promise.all([
          fetch(`/api/employer/consultants/${id}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/employer/consultant-pipeline", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/employer/consultant-contact-requests", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const profileData = await profileRes.json();
        const pipelineData = await pipelineRes.json().catch(() => ({}));
        const requestsData = await requestsRes.json().catch(() => ({}));

        if (!profileRes.ok) {
          throw new Error(profileData?.error || "Failed to load profile");
        }

        setConsultant(profileData.consultant);

        const pipelineItems = Array.isArray(pipelineData?.items)
          ? pipelineData.items
          : [];
        const matchedPipeline = pipelineItems.find(
          (x: any) => String(x.consultantId || "") === String(id),
        );
        setCurrentPipeline(String(matchedPipeline?.status || "saved"));

        const allRequests = Array.isArray(requestsData?.items)
          ? requestsData.items
          : [];
        setRequestHistory(
          allRequests
            .filter((x: any) => String(x.consultantId || "") === String(id))
            .slice(0, 10),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function updatePipeline(status: string) {
    if (!consultant?.id) return;
    setPipelineBusy(true);
    setPipelineStatus("");
    try {
      const res = await fetch("/api/employer/consultant-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ consultantId: consultant.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update pipeline status");
      }
      setCurrentPipeline(status);
      setPipelineStatus(
        `Pipeline updated: ${String(status).replace("_", " ")}.`,
      );
    } catch (err) {
      setPipelineStatus(
        err instanceof Error ? err.message : "Failed to update pipeline status",
      );
    } finally {
      setPipelineBusy(false);
    }
  }

  async function sendContactRequest() {
    if (!consultant?.id) return;
    setRequestStatus("");
    const msg = message.trim();
    if (msg.length < 20) {
      setRequestStatus("Message must be at least 20 characters.");
      return;
    }

    const res = await fetch("/api/employer/consultant-contact-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        consultantId: consultant.id,
        requestType,
        message: msg,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRequestStatus(data?.error || "Failed to submit request");
      return;
    }
    setRequestStatus("Contact request submitted.");
    setMessage("");
    setCurrentPipeline(
      requestType === "interview_request" ? "interview_requested" : "contacted",
    );
    setRequestHistory((prev) => [
      {
        id: String(data?.id || `${Date.now()}`),
        requestType,
        message: msg,
        status: "submitted",
        moderationStatus: "clean",
        consultantResponseAction: null,
        consultantResponseNote: "",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/employer/consultants"
          className="text-sm text-yellow-300 hover:underline"
        >
          ← Back to consultant discovery
        </Link>

        {loading ? (
          <p className="mt-6 text-zinc-300">Loading consultant profile...</p>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-red-700/50 bg-red-950/40 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : consultant ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <h1 className="text-3xl font-extrabold">{consultant.name}</h1>
            <p className="mt-1 text-yellow-200">
              {consultant.professionalTitle}
            </p>
            <p className="mt-4 text-zinc-200">{consultant.summary}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h2 className="font-semibold">Experience & engagement</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  Years experience: {consultant.yearsExperience ?? "N/A"}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Engagement type: {consultant.engagementType}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Availability: {consultant.availability}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Location/remote:{" "}
                  {consultant.location || consultant.remoteStatus}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <h2 className="font-semibold">
                  Skills, tools, and certifications
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  Top skills: {consultant.topSkills?.join(", ") || "N/A"}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Tools/platforms:{" "}
                  {consultant.toolsPlatforms?.join(", ") || "N/A"}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Certifications:{" "}
                  {consultant.certifications?.join(", ") || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
              <h2 className="font-semibold">Industries & project history</h2>
              <p className="mt-2 text-sm text-zinc-300">
                Industries served:{" "}
                {consultant.industriesServed?.join(", ") || "N/A"}
              </p>
              <ul className="mt-3 list-disc pl-5 text-sm text-zinc-300">
                {(consultant.projectHistory || [])
                  .slice(0, 6)
                  .map((x: string) => (
                    <li key={x}>{x}</li>
                  ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {consultant.resumeUrl ? (
                <a
                  href={consultant.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                >
                  View Resume
                </a>
              ) : null}
              {consultant.portfolioUrl ? (
                <a
                  href={consultant.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                >
                  View Portfolio
                </a>
              ) : null}
              <button
                onClick={() => void updatePipeline("saved")}
                disabled={pipelineBusy}
                className="rounded-lg border border-yellow-400/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10 disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => void updatePipeline("contacted")}
                disabled={pipelineBusy}
                className="rounded-lg border border-yellow-400/40 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/10 disabled:opacity-60"
              >
                Contact
              </button>
              <button
                onClick={() => void updatePipeline("interview_requested")}
                disabled={pipelineBusy}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
              >
                Request Interview
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/20 px-2 py-1 text-zinc-200">
                Current pipeline:{" "}
                {String(currentPipeline || "saved").replace("_", " ")}
              </span>
              {pipelineStatus ? (
                <span className="text-emerald-100">{pipelineStatus}</span>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
                Contact / Request workflow
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={requestType}
                  onChange={(e) =>
                    setRequestType(
                      e.target.value as "contact" | "interview_request",
                    )
                  }
                  className="rounded border border-white/10 bg-black px-2 py-1 text-sm"
                >
                  <option value="contact">Contact request</option>
                  <option value="interview_request">Interview request</option>
                </select>
                <Link
                  href="/dashboard/employer/consultants/pipeline"
                  className="rounded border border-white/20 px-2 py-1 text-sm hover:bg-white/10"
                >
                  Open shortlist board
                </Link>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Share project scope, timeline, and expected next step (20+ chars)."
                className="mt-3 w-full rounded border border-white/10 bg-black px-3 py-2 text-sm"
              />
              <button
                onClick={() => void sendContactRequest()}
                className="mt-3 rounded bg-cyan-400 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-300"
              >
                Submit request
              </button>
              {requestStatus ? (
                <p className="mt-2 text-sm text-cyan-100">{requestStatus}</p>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                Request lifecycle history
              </h3>
              {requestHistory.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">
                  No requests sent to this consultant yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {requestHistory.map((r) => (
                    <li
                      key={r.id}
                      className="rounded border border-white/10 bg-black/30 p-3 text-xs"
                    >
                      <p className="text-zinc-100">
                        {r.requestType === "interview_request"
                          ? "Interview request"
                          : "Contact request"}
                      </p>
                      <p className="mt-1 text-zinc-300">{r.message}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                        <span className="rounded border border-white/15 px-2 py-0.5">
                          status:{" "}
                          {REQUEST_STATUS_LABELS[
                            String(r.status || "submitted")
                          ] ||
                            String(r.status || "submitted").replace("_", " ")}
                        </span>
                        <span className="rounded border border-white/15 px-2 py-0.5">
                          moderation:{" "}
                          {String(r.moderationStatus || "clean").replace(
                            "_",
                            " ",
                          )}
                        </span>
                        {r.consultantResponseAction ? (
                          <span className="rounded border border-cyan-400/30 px-2 py-0.5 text-cyan-200">
                            consultant:{" "}
                            {String(r.consultantResponseAction).replace(
                              "_",
                              " ",
                            )}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-400">
                        Next step:{" "}
                        {REQUEST_STATUS_NEXT_STEP[
                          String(r.status || "submitted")
                        ] || "Follow request lifecycle updates."}
                      </p>
                      {r.consultantResponseNote ? (
                        <p className="mt-2 text-cyan-100/90">
                          Consultant note: {r.consultantResponseNote}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
