import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  accountType?: string;
  createdAt?: string | null;
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError("");
        const res = await fetch("/api/admin/get-users?limit=200", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Admin access required to view user records.");
          }
          throw new Error(data?.error || "Failed to load users.");
        }

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : [];
        setUsers(rows);
      } catch (err) {
        console.error("Failed to load users", err);
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.accountType || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, query]);

  return (
    <>
      <Head>
        <title>Admin User Management | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>
      <div className="min-h-screen bg-black text-white p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl text-gold font-bold mb-1">
                User & Account Management
              </h1>
              <p className="text-sm text-zinc-400">
                Review user records and roles from a single admin control view.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="text-xs uppercase tracking-wide text-zinc-400">
                Total users loaded
              </div>
              <div className="mt-1 text-2xl font-bold text-gold">
                {users.length}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:col-span-2">
              <label
                htmlFor="user-search"
                className="mb-1 block text-xs text-zinc-400"
              >
                Search by name, email, or role
              </label>
              <input
                id="user-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. admin, user@example.com"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-gold/60 focus:outline-none"
              />
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p>No users match the current search query.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="p-3 border-b border-gray-700">Name</th>
                    <th className="p-3 border-b border-gray-700">Email</th>
                    <th className="p-3 border-b border-gray-700">Role</th>
                    <th className="p-3 border-b border-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-zinc-800">
                      <td className="p-3">{user.name || "N/A"}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.accountType || "User"}</td>
                      <td className="p-3">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserManagement;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/user-management",
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      role?: string;
      isAdmin?: boolean;
      roles?: string[];
    };

    const isAdmin =
      payload.isAdmin === true ||
      payload.accountType === "admin" ||
      payload.role === "admin" ||
      (Array.isArray(payload.roles) && payload.roles.includes("admin"));

    if (!isAdmin) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/user-management",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/user-management",
        permanent: false,
      },
    };
  }
};
