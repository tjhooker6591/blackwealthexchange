// src/pages/admin/business-of-the-day.tsx
//
// Daily social feature queue. Proposes one public listing, drafts the caption
// and image card from that listing's own fields, and waits for an admin to
// approve, edit or skip. Nothing is posted or emailed automatically.

import type { GetServerSideProps } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Card = {
  eyebrow: string;
  name: string;
  location: string;
  category: string;
  line: string;
  footer: string;
};

type Candidate = {
  listing: {
    id: string;
    name: string;
    location: string;
    category: string;
    description: string;
    website: string;
    email: string;
    hasImage: boolean;
    claimed: boolean;
  };
  listingUrl: string;
  caption: string;
  card: Card;
  ownerEmail: { to: string; subject: string; text: string } | null;
};

type HistoryRow = {
  businessId: string;
  businessName: string;
  slug: string;
  status: string;
  decidedAt: string | null;
  ownerEmailSentAt: string | null;
  ownerEmailTo: string | null;
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:\s]+$/, "")}…`;
    return kept;
  }
  return lines;
}

function drawCard(canvas: HTMLCanvasElement, card: Card) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pad = 90;
  const width = CARD_WIDTH - pad * 2;
  const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const serif = "Georgia, 'Times New Roman', serif";

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, CARD_WIDTH - 72, CARD_HEIGHT - 72);

  ctx.textBaseline = "top";
  ctx.fillStyle = "#eab308";
  ctx.font = `700 34px ${sans}`;
  ctx.fillText(card.eyebrow, pad, 130);
  ctx.fillRect(pad, 190, 120, 6);

  let y = 270;
  let nameSize = 104;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${nameSize}px ${serif}`;
  let nameLines = wrapLines(ctx, card.name, width, 99);
  while (nameLines.length > 3 && nameSize > 60) {
    nameSize -= 8;
    ctx.font = `700 ${nameSize}px ${serif}`;
    nameLines = wrapLines(ctx, card.name, width, 99);
  }
  for (const line of nameLines.slice(0, 4)) {
    ctx.fillText(line, pad, y);
    y += Math.round(nameSize * 1.12);
  }

  y += 28;
  const meta = [card.location, card.category].filter(Boolean).join("  ·  ");
  if (meta) {
    ctx.fillStyle = "#eab308";
    ctx.font = `600 40px ${sans}`;
    for (const line of wrapLines(ctx, meta, width, 2)) {
      ctx.fillText(line, pad, y);
      y += 52;
    }
  }

  y += 36;
  ctx.fillStyle = "#d4d4d8";
  ctx.font = `400 44px ${sans}`;
  for (const line of wrapLines(ctx, card.line, width, 6)) {
    if (y > CARD_HEIGHT - 300) break;
    ctx.fillText(line, pad, y);
    y += 60;
  }

  ctx.fillStyle = "#eab308";
  ctx.fillRect(pad, CARD_HEIGHT - 232, width, 3);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 46px ${serif}`;
  ctx.fillText("Black Wealth Exchange", pad, CARD_HEIGHT - 200);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `400 34px ${sans}`;
  ctx.fillText(card.footer, pad, CARD_HEIGHT - 138);
}

export default function BusinessOfTheDayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [caption, setCaption] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [city, setCity] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [approved, setApproved] = useState<Candidate | null>(null);
  const [emailSentTo, setEmailSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (cityFilter: string) => {
    setLoading(true);
    setError("");
    try {
      const qs = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : "";
      const res = await fetch(`/api/admin/social/business-of-the-day${qs}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load");
      setCandidate(json.candidate);
      setCaption(json.candidate?.caption || "");
      setRemaining(json.remaining);
      setHistory(json.history || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const shown = approved || candidate;

  useEffect(() => {
    if (canvasRef.current && shown) drawCard(canvasRef.current, shown.card);
  }, [shown]);

  async function act(action: string, businessId: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/social/business-of-the-day", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, businessId, caption }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Action failed");
      return json;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!candidate) return;
    const ok = await act("approve", candidate.listing.id);
    if (!ok) return;
    setApproved(candidate);
    setEmailSentTo("");
    setNotice(
      "Marked as featured. Download the card and copy the caption to post it.",
    );
  }

  async function skip() {
    if (!candidate) return;
    const ok = await act("skip", candidate.listing.id);
    if (ok) await load(appliedCity);
  }

  async function sendOwnerEmail() {
    if (!approved) return;
    const ok = await act("send_owner_email", approved.listing.id);
    if (ok) {
      setEmailSentTo(ok.to);
      setNotice(`Owner email sent to ${ok.to}.`);
    }
  }

  async function next() {
    setApproved(null);
    setNotice("");
    await load(appliedCity);
  }

  function downloadCard() {
    const canvas = canvasRef.current;
    if (!canvas || !shown) return;
    const link = document.createElement("a");
    link.download = `bwe-business-of-the-day-${shown.listing.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setNotice("Caption copied.");
    } catch {
      setError("Could not copy. Select the caption text and copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              Business of the Day
            </h1>
            <p className="text-sm text-zinc-400">
              One listing a day, drafted from its own details. Nothing is posted
              or emailed until you do it here.
            </p>
          </div>
          <Link
            href="/admin/growth"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Growth Operations
          </Link>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedCity(city.trim());
            setApproved(null);
            load(city.trim());
          }}
        >
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filter by city, e.g. Atlanta"
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded border border-zinc-700 px-3 py-2 text-sm"
          >
            Apply
          </button>
          {remaining !== null ? (
            <span className="text-xs text-zinc-500">
              {remaining} listing{remaining === 1 ? "" : "s"} left to feature
              {appliedCity ? ` matching "${appliedCity}"` : ""}
            </span>
          ) : null}
        </form>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="text-sm text-green-400">{notice}</p> : null}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : !shown ? (
          <p className="text-sm text-zinc-400">
            No listings left to feature
            {appliedCity ? ` matching "${appliedCity}"` : ""}. Listings need a
            description of at least a sentence to qualify.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div>
              <canvas
                ref={canvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="w-full rounded border border-zinc-800"
              />
              <button
                type="button"
                onClick={downloadCard}
                className="mt-2 w-full rounded border border-zinc-700 px-3 py-2 text-sm"
              >
                Download card (PNG)
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="text-xl font-semibold text-yellow-300">
                  {shown.listing.name}
                </h2>
                <p className="text-sm text-zinc-400">
                  {[shown.listing.location, shown.listing.category]
                    .filter(Boolean)
                    .join(" · ") || "No location or category on file"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {shown.listing.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    href={shown.listingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-400 underline"
                  >
                    BWE listing
                  </a>
                  {shown.listing.website ? (
                    <a
                      href={
                        /^https?:\/\//.test(shown.listing.website)
                          ? shown.listing.website
                          : `https://${shown.listing.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-400 underline"
                    >
                      Their website
                    </a>
                  ) : null}
                  <span className="text-zinc-500">
                    {shown.listing.claimed ? "Claimed" : "Unclaimed"} ·{" "}
                    {shown.listing.email ? "email on file" : "no email on file"}
                  </span>
                </div>
                <p className="mt-3 rounded border border-yellow-900 bg-yellow-950/40 p-2 text-xs text-yellow-200">
                  Before posting, open their website and confirm the details are
                  right and that the business is Black-owned. Many listings were
                  imported and have not been verified.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-zinc-200">
                  Caption (edit freely)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={9}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 p-3 text-sm"
                />
                <button
                  type="button"
                  onClick={copyCaption}
                  className="mt-2 rounded border border-zinc-700 px-3 py-2 text-sm"
                >
                  Copy caption
                </button>
              </div>

              {!approved ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={approve}
                    className="rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    Approve and mark as featured
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={skip}
                    className="rounded border border-zinc-700 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Skip this business
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="font-semibold text-yellow-300">
                    Tell the owner
                  </h3>
                  {approved.ownerEmail ? (
                    <>
                      <p className="text-xs text-zinc-500">
                        To {approved.ownerEmail.to} · Subject:{" "}
                        {approved.ownerEmail.subject}
                      </p>
                      <pre className="whitespace-pre-wrap rounded border border-zinc-800 bg-black p-3 text-xs text-zinc-300">
                        {approved.ownerEmail.text}
                      </pre>
                      <button
                        type="button"
                        disabled={busy || Boolean(emailSentTo)}
                        onClick={sendOwnerEmail}
                        className="rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                      >
                        {emailSentTo
                          ? "Email sent"
                          : "Send this email to the owner"}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      No email on file for this business. Tag them on the post,
                      or reach them through their website.
                    </p>
                  )}
                  <div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={next}
                      className="rounded border border-zinc-700 px-4 py-2 text-sm disabled:opacity-50"
                    >
                      Next business
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="mb-2 font-semibold text-yellow-300">Recent</h2>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing featured yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-zinc-300">
              {history.map((row) => (
                <li key={row.businessId}>
                  <span
                    className={
                      row.status === "approved"
                        ? "text-green-400"
                        : "text-zinc-500"
                    }
                  >
                    {row.status === "approved" ? "Featured" : "Skipped"}
                  </span>{" "}
                  · {row.businessName}
                  {row.decidedAt
                    ? ` · ${new Date(row.decidedAt).toLocaleDateString()}`
                    : ""}
                  {row.ownerEmailSentAt ? " · owner emailed" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/business-of-the-day",
);
