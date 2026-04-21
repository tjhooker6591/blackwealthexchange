import React, { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Row = {
  targetType: string;
  targetId: string;
  title: string;
  status: string;
  updatedAt?: string;
};

export default function ContentModeration() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/content-moderation/queue", {
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Failed to load moderation queue");
      setLoading(false);
      return;
    }
    setItems(Array.isArray(json.items) ? json.items : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (row: Row, action: string) => {
    const r = (reason[row.targetId] || "").trim();
    if (!r) {
      setError("Reason required");
      return;
    }
    setSaving(row.targetId);
    const res = await fetch("/api/admin/content-moderation/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        targetType: row.targetType,
        targetId: row.targetId,
        action,
        reason: r,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json?.error || "Action failed");
    await load();
    setSaving("");
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-gold mb-2">Content Moderation</h1>
      <p className="text-gray-400 mb-4">
        Real moderation queue with audited actions.
      </p>
      {error ? <div className="mb-3 text-red-300">{error}</div> : null}
      {loading ? (
        <p>Loading moderation queue...</p>
      ) : (
        <div className="space-y-3">
          {items.map((row) => (
            <div
              key={row.targetType + row.targetId}
              className="border border-gray-800 rounded p-3 bg-gray-900"
            >
              <div className="text-sm">
                <span className="text-gold">{row.targetType}</span> •{" "}
                {row.title} • status: {row.status}
              </div>
              <input
                className="mt-2 w-full bg-black border border-gray-700 rounded px-2 py-1 text-sm"
                placeholder="reason (required)"
                value={reason[row.targetId] || ""}
                onChange={(e) =>
                  setReason((prev) => ({
                    ...prev,
                    [row.targetId]: e.target.value,
                  }))
                }
              />
              <div className="mt-2 flex gap-2">
                <button
                  disabled={saving === row.targetId}
                  onClick={() => act(row, "approve")}
                  className="px-2 py-1 rounded bg-emerald-600 text-black text-sm"
                >
                  Approve
                </button>
                <button
                  disabled={saving === row.targetId}
                  onClick={() => act(row, "reject")}
                  className="px-2 py-1 rounded bg-orange-600 text-black text-sm"
                >
                  Reject
                </button>
                <button
                  disabled={saving === row.targetId}
                  onClick={() => act(row, "remove")}
                  className="px-2 py-1 rounded bg-red-600 text-black text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token)
    return {
      redirect: {
        destination: "/login?redirect=/admin/content-moderation",
        permanent: false,
      },
    };
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };
    if (!(payload.isAdmin === true || payload.accountType === "admin"))
      return { redirect: { destination: "/login?redirect=/admin/content-moderation", permanent: false } };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/content-moderation",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
