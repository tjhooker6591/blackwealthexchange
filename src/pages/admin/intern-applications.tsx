import { useEffect, useState } from "react";

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

      if (!Array.isArray(data)) {
        setApps([]);
        setPageError("Unexpected API response. Not an array.");
        return;
      }

      setApps(data);
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

  if (loading) return <p className="p-6 text-white">Loading…</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-gold mb-6">
        Intern Applications
      </h1>

      {pageError && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          {pageError}
        </div>
      )}

      {!pageError && apps.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-white/80">
          No applications found yet.
        </div>
      )}

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
                  </select>

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
    </div>
  );
}

