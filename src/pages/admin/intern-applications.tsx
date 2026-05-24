import Link from "next/link";
import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type InternApplication = {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  role: string;
  skills?: string;
  links?: string;
  why?: string;
  status: "new" | "reviewed" | "contacted" | "accepted" | "rejected";
  createdAt?: string;
  meta?: any;
};

export default function InternApplicationsAdmin() {
  const [apps, setApps] = useState<InternApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const getId = (app: InternApplication) => app._id || app.id || "";

  const load = async () => {
    try {
      setLoading(true);
      setPageError(null);

      const res = await fetch("/api/admin/intern-applications", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setApps([]);
        setPageError(data?.error || "Failed to load applications.");
        return;
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.applications)
          ? data.applications
          : [];

      if (!Array.isArray(rows)) {
        setApps([]);
        setPageError("Unexpected API response. Not an array.");
        return;
      }

      setApps(rows);
    } catch (err) {
      console.error(err);
      setApps([]);
      setPageError("Network error loading applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    if (!id) {
      alert("Missing application id.");
      return;
    }

    try {
      const res = await fetch("/api/admin/intern-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to update status.");
        return;
      }

      load();
    } catch (err) {
      console.error(err);
      alert("Network error updating status.");
    }
  };

  const deleteApplication = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this application from active review?")) return;
    try {
      const res = await fetch("/api/admin/intern-applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, reason: "Removed by admin" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || "Failed to delete application.");
        return;
      }
      load();
    } catch (err) {
      console.error(err);
      alert("Network error deleting application.");
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-1">
              Intern Applications
            </h1>
            <p className="text-sm text-gray-400">
              Review internship candidates and move each application through the
              intake pipeline.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200">
            Applications: {apps.length}
          </span>
          <button
            onClick={load}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200 hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            Loading internship applications…
          </div>
        ) : null}

        {pageError && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {pageError}
          </div>
        )}

        {!pageError && apps.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-white/80">
            No intern applications are currently available.
          </div>
        )}

        {!loading ? (
          <div className="space-y-4">
            {apps.map((app) => {
              const appId = getId(app);

              return (
                <div
                  key={appId || `${app.email}-${app.createdAt}`}
                  className="border border-gold rounded-lg p-4 bg-black"
                >
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-lg">{app.fullName}</h2>
                      <p className="text-sm text-gray-400">{app.email}</p>

                      <p className="text-sm mt-2">
                        <strong>Role:</strong> {app.role}
                      </p>

                      {app.skills && (
                        <p className="text-sm">
                          <strong>Skills:</strong> {app.skills}
                        </p>
                      )}

                      {app.why && (
                        <p className="text-sm mt-2 text-gray-300">{app.why}</p>
                      )}

                      {app.createdAt && (
                        <p className="text-xs mt-2 text-white/50">
                          Submitted: {new Date(app.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(appId, e.target.value)}
                        className="bg-black border border-gold p-2 rounded w-full md:w-auto"
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="deleted">Deleted</option>
                      </select>

                      <button
                        onClick={() => deleteApplication(appId)}
                        className="w-full md:w-auto rounded bg-red-700/80 px-3 py-2 text-xs font-semibold"
                      >
                        Delete
                      </button>

                      {app.links && (
                        <a
                          href={app.links}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-yellow-400 underline text-sm"
                        >
                          View Links
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/intern-applications",
);
