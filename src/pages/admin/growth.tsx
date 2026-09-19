// src/pages/admin/growth.tsx
//
// BWE Acquisition & Proof -- Growth Operations (Admin Acquisition Queue).
// Implements section 1-6 of
// /Users/blackforge/Downloads/BWE_Acquisition_and_Proof_Implementation.md
// as one practical admin experience, mirroring the deliberately-simple
// list + detail pattern already established in
// src/pages/admin/service-engagements.tsx ("Not a CRM").

import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type PriorityScoreEntry = { score: 0 | 1 | 2; note: string | null };
type PriorityScore = {
  reachableContact: PriorityScoreEntry;
  relevantOffer: PriorityScoreEntry;
  profileImprovement: PriorityScoreEntry;
  onboardingReadiness: PriorityScoreEntry;
  buyerChannel: PriorityScoreEntry;
};

type Prospect = {
  _id: string;
  businessId: string | null;
  externalProspectName: string | null;
  displayName: string;
  stage: string;
  paidStatus: string;
  lossState: string;
  lossReason: string | null;
  priorityScore: PriorityScore;
  priorityTotal: number;
  assignedOperator: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  evidenceNotes: string;
  sourceUrl: string | null;
  contactRoute: string | null;
  targetOffer: string | null;
  doNotContact: boolean;
  createdAt: string;
};

const STAGES = [
  "researched",
  "contacted",
  "replied",
  "demo_completed",
  "onboarding_started",
  "activated",
];

function cents(n: number | null | undefined) {
  return `$${((n || 0) / 100).toFixed(2)}`;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    throw new Error(
      json?.message || json?.error || `Request failed (${res.status})`,
    );
  }
  return json;
}

function NewProspectForm({ onCreated }: { onCreated: () => void }) {
  const [businessId, setBusinessId] = useState("");
  const [externalName, setExternalName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contactRoute, setContactRoute] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [targetOffer, setTargetOffer] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/acquisition/prospects", {
        method: "POST",
        body: JSON.stringify({
          businessId: businessId || null,
          externalProspectName: businessId ? null : externalName || null,
          sourceUrl,
          contactRoute,
          evidenceNotes,
          targetOffer,
        }),
      });
      setBusinessId("");
      setExternalName("");
      setSourceUrl("");
      setContactRoute("");
      setEvidenceNotes("");
      setTargetOffer("");
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-2">
      <h2 className="text-lg font-semibold text-yellow-300">New prospect</h2>
      <p className="text-xs text-zinc-500">
        Canonical businessId matches an existing directory record. Only use an
        external name when no directory match exists -- never creates a
        duplicate directory record.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          placeholder="Canonical businessId (preferred)"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
        />
        <input
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          placeholder="External prospect name (only if no businessId)"
          value={externalName}
          onChange={(e) => setExternalName(e.target.value)}
          disabled={Boolean(businessId)}
        />
        <input
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          placeholder="Source URL"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <input
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm"
          placeholder="Publicly documented contact route"
          value={contactRoute}
          onChange={(e) => setContactRoute(e.target.value)}
        />
        <input
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm sm:col-span-2"
          placeholder="Target offer"
          value={targetOffer}
          onChange={(e) => setTargetOffer(e.target.value)}
        />
        <textarea
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm sm:col-span-2"
          placeholder="Evidence notes"
          value={evidenceNotes}
          onChange={(e) => setEvidenceNotes(e.target.value)}
        />
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <button
        onClick={submit}
        disabled={saving || (!businessId && !externalName)}
        className="rounded bg-yellow-400 text-black text-sm font-semibold px-3 py-1.5 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Add to queue"}
      </button>
    </div>
  );
}

function ProspectDetail({
  prospectId,
  onChanged,
}: {
  prospectId: string;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [previews, setPreviews] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const d = await api(`/api/admin/acquisition/prospects/${prospectId}`);
      setDetail(d.prospect);
      const ob = await api(
        `/api/admin/acquisition/onboarding/${prospectId}`,
      ).catch(() => null);
      setOnboarding(ob?.onboarding || null);
      if (d.prospect?.businessId) {
        const [c, p, s] = await Promise.all([
          api(
            `/api/admin/acquisition/campaigns?businessId=${d.prospect.businessId}`,
          ).catch(() => ({ campaigns: [] })),
          api(`/api/admin/acquisition/previews?prospectId=${prospectId}`).catch(
            () => ({ previews: [] }),
          ),
          api(
            `/api/admin/acquisition/stories?businessId=${d.prospect.businessId}`,
          ).catch(() => ({ stories: [] })),
        ]);
        setCampaigns(c.campaigns || []);
        setPreviews(p.previews || []);
        setStories(s.stories || []);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  async function act(fn: () => Promise<any>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <div className="text-sm text-zinc-500">Loading...</div>;

  const currentStageIndex = STAGES.indexOf(detail.stage);
  const nextStage = STAGES[currentStageIndex + 1];

  return (
    <div className="space-y-4 text-sm">
      {error ? <p className="text-red-400 text-xs">{error}</p> : null}

      <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold text-yellow-300">
              {detail.businessId ? (
                <Link
                  href={`/business/${detail.businessId}`}
                  target="_blank"
                  className="hover:underline"
                >
                  {detail.externalProspectName || detail.businessId}
                </Link>
              ) : (
                detail.externalProspectName || "Unnamed prospect"
              )}
            </div>
            <div className="text-xs text-zinc-500">
              Stage: <span className="text-white">{detail.stage}</span> · Paid:{" "}
              <span className="text-white">{detail.paidStatus}</span> · Loss:{" "}
              <span className="text-white">{detail.lossState}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {nextStage &&
            detail.lossState === "active" &&
            nextStage !== "activated" ? (
              <button
                disabled={busy}
                onClick={() =>
                  act(() =>
                    api(`/api/admin/acquisition/prospects/${prospectId}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        action: "transition_stage",
                        toStage: nextStage,
                      }),
                    }),
                  )
                }
                className="rounded border border-yellow-500/40 text-yellow-300 px-2 py-1 text-xs"
              >
                Advance to {nextStage.replace("_", " ")}
              </button>
            ) : null}
            {detail.stage !== "activated" && detail.lossState === "active" ? (
              <>
                <button
                  disabled={busy}
                  onClick={() =>
                    act(() =>
                      api(`/api/admin/acquisition/prospects/${prospectId}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                          action: "set_loss_state",
                          lossState: "not_now",
                          lossReason: "Not ready",
                        }),
                      }),
                    )
                  }
                  className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                >
                  Not now
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    act(() =>
                      api(`/api/admin/acquisition/prospects/${prospectId}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                          action: "set_loss_state",
                          lossState: "disqualified",
                          lossReason: "Disqualified",
                        }),
                      }),
                    )
                  }
                  className="rounded border border-red-800 px-2 py-1 text-xs text-red-300"
                >
                  Disqualify
                </button>
              </>
            ) : null}
            {detail.lossState !== "active" ? (
              <button
                disabled={busy}
                onClick={() =>
                  act(() =>
                    api(`/api/admin/acquisition/prospects/${prospectId}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        action: "set_loss_state",
                        lossState: "active",
                      }),
                    }),
                  )
                }
                className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
              >
                Reactivate
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-zinc-400">
          {detail.evidenceNotes || "No evidence notes yet."}
        </p>
        <div className="mt-2 text-xs text-zinc-500 flex flex-wrap gap-3">
          <span>Target offer: {detail.targetOffer || "—"}</span>
          <span>Contact: {detail.contactRoute || "—"}</span>
          <span>Priority: {detail.priorityTotal}/10</span>
        </div>
      </div>

      {/* Onboarding checklist */}
      {detail.businessId ? (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
          <h3 className="font-semibold text-yellow-300 mb-2">
            Onboarding checklist
          </h3>
          {onboarding ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {Object.entries(onboarding.checklist).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={value === true}
                    disabled={busy || value === null}
                    onChange={(e) =>
                      act(() =>
                        api(`/api/admin/acquisition/onboarding/${prospectId}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            checklist: { [key]: e.target.checked },
                          }),
                        }),
                      )
                    }
                  />
                  {key}
                  {value === null ? " (n/a)" : ""}
                </label>
              ))}
            </div>
          ) : null}
          <button
            disabled={busy || detail.stage === "activated"}
            onClick={() =>
              act(() =>
                api(`/api/admin/acquisition/prospects/${prospectId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ action: "activate" }),
                }),
              )
            }
            className="mt-3 rounded bg-yellow-400 text-black text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
          >
            {detail.stage === "activated"
              ? "Activated"
              : "Activate (requires checklist + verified claim)"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">
          Onboarding requires a canonical businessId.
        </p>
      )}

      {/* Campaigns */}
      {detail.businessId ? (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
          <h3 className="font-semibold text-yellow-300 mb-2">
            Buyer campaigns
          </h3>
          <ul className="space-y-1 text-xs text-zinc-400">
            {campaigns.map((c) => (
              <li key={c._id}>
                {c.campaignId} — {c.channel} → {c.destination} (
                {cents(c.costCents)})
              </li>
            ))}
            {!campaigns.length ? <li>No campaigns recorded yet.</li> : null}
          </ul>
        </div>
      ) : null}

      {/* Stories */}
      {detail.businessId ? (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
          <h3 className="font-semibold text-yellow-300 mb-2">
            Customer stories
          </h3>
          <ul className="space-y-2 text-xs text-zinc-400">
            {stories.map((story) => (
              <li
                key={story._id}
                className="border border-zinc-800 rounded p-2"
              >
                <div className="flex items-center justify-between">
                  <span>
                    v{story.contentVersion} — {story.state}
                  </span>
                  {story.state !== "published" ? (
                    <button
                      disabled={busy}
                      onClick={() => {
                        const next =
                          story.state === "draft"
                            ? "owner_reviewed"
                            : story.state === "owner_reviewed"
                              ? "approved"
                              : "published";
                        act(() =>
                          api(`/api/admin/acquisition/stories/${story._id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              action: "advance_state",
                              toState: next,
                            }),
                          }),
                        );
                      }}
                      className="rounded border border-yellow-500/40 text-yellow-300 px-2 py-0.5"
                    >
                      Advance
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            {!stories.length ? <li>No draft stories yet.</li> : null}
          </ul>
        </div>
      ) : null}

      {/* Previews */}
      {detail.businessId ? (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
          <h3 className="font-semibold text-yellow-300 mb-2">
            Private previews
          </h3>
          <ul className="space-y-1 text-xs text-zinc-400">
            {previews.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/preview/${p.accessToken}`}
                  target="_blank"
                  className="text-yellow-300 hover:underline"
                >
                  /preview/{p.accessToken.slice(0, 10)}…
                </Link>{" "}
                {p.revoked
                  ? "(revoked)"
                  : `expires ${new Date(p.expiresAt).toLocaleDateString()}`}{" "}
                · internal views {p.internalViewCount}
              </li>
            ))}
            {!previews.length ? <li>No previews created yet.</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function GrowthOperationsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const qs = stageFilter ? `?stage=${stageFilter}` : "";
      const data = await api(`/api/admin/acquisition/prospects${qs}`);
      setProspects(data.prospects || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              Growth Operations
            </h1>
            <p className="text-sm text-zinc-500">
              Acquisition queue -- real businesses only, immutable stage
              history, free activation tracked separately from paid conversion.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/acquisition-report"
              className="text-sm border border-zinc-700 px-3 py-2 rounded"
            >
              Financial view
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-sm border border-zinc-700 px-3 py-2 rounded"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <NewProspectForm onCreated={load} />

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setStageFilter("")}
            className={`px-2 py-1 rounded border ${!stageFilter ? "border-yellow-400 text-yellow-300" : "border-zinc-700 text-zinc-400"}`}
          >
            All
          </button>
          {STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-2 py-1 rounded border ${stageFilter === stage ? "border-yellow-400 text-yellow-300" : "border-zinc-700 text-zinc-400"}`}
            >
              {stage.replace("_", " ")}
            </button>
          ))}
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded border border-zinc-800 bg-zinc-950 overflow-hidden">
            {loading ? (
              <p className="p-3 text-sm text-zinc-500">Loading...</p>
            ) : prospects.length ? (
              <ul className="divide-y divide-zinc-800">
                {prospects.map((p) => (
                  <li
                    key={p._id}
                    onClick={() => setSelected(p._id)}
                    className={`p-3 text-sm cursor-pointer hover:bg-zinc-900 ${selected === p._id ? "bg-zinc-900" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.displayName}</span>
                      <span className="text-xs text-zinc-500">
                        {p.stage.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      paid: {p.paidStatus} · priority {p.priorityTotal}/10{" "}
                      {p.lossState !== "active" ? `· ${p.lossState}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-sm text-zinc-500">
                No prospects in this view yet.
              </p>
            )}
          </div>

          <div>
            {selected ? (
              <ProspectDetail prospectId={selected} onChanged={load} />
            ) : (
              <p className="text-sm text-zinc-500">Select a prospect.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/growth");
