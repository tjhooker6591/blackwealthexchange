import React, { useState } from "react";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export default function UnifiedVerifierPage() {
  const [filters, setFilters] = useState({
    email: "",
    userId: "",
    stripeSessionId: "",
    paymentIntentId: "",
    itemId: "",
  });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(
      ([k, v]) => v.trim() && qs.set(k, v.trim()),
    );
    const res = await fetch(`/api/admin/verifier/unified?${qs.toString()}`, {
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Failed");
      setLoading(false);
      return;
    }
    setItems(Array.isArray(json?.items) ? json.items : []);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-gold mb-4">
        Unified Paid → Fulfilled → Entitled Verifier
      </h1>
      <div className="grid md:grid-cols-5 gap-2">
        {Object.entries(filters).map(([k, v]) => (
          <input
            key={k}
            value={v}
            onChange={(e) => setFilters((p) => ({ ...p, [k]: e.target.value }))}
            placeholder={k}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm"
          />
        ))}
      </div>
      <button
        onClick={run}
        className="mt-3 bg-gold text-black px-3 py-2 rounded text-sm"
      >
        {loading ? "Running..." : "Run Verification"}
      </button>
      {error ? <p className="text-red-300 mt-2">{error}</p> : null}
      <div className="mt-4 space-y-2">
        {items.map((it, idx) => (
          <pre
            key={idx}
            className="bg-gray-900 border border-gray-800 rounded p-3 text-xs overflow-x-auto"
          >
            {JSON.stringify(it, null, 2)}
          </pre>
        ))}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token)
    return {
      redirect: {
        destination: "/login?redirect=/admin/verifier-unified",
        permanent: false,
      },
    };
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };
    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return { redirect: { destination: "/login?redirect=/admin/verifier-unified", permanent: false } };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/verifier-unified",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
