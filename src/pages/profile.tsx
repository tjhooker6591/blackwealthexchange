"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

type AccountType =
  | "user"
  | "business"
  | "seller"
  | "employer"
  | "admin"
  | string;

type MeUser = {
  email: string;
  accountType: AccountType;
  businessName?: string;
};

type AssetMeta = {
  url: string;
  filename?: string;
  uploadedAt?: string;
  contentType?: string;
  size?: number;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  avatar: AssetMeta | null;
  resume: AssetMeta | null;
  // compatibility
  profileImage?: string;
  resumeUrl?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function formatBytes(size?: number) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = size;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ProfilePage() {
  const router = useRouter();

  const [me, setMe] = useState<MeUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [imgStatus, setImgStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const [removeAvatarBusy, setRemoveAvatarBusy] = useState(false);
  const [removeResumeBusy, setRemoveResumeBusy] = useState(false);

  const fetchProfile = useCallback(
    async (signal?: AbortSignal) => {
      const meRes = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        signal,
      });

      if (!meRes.ok) {
        router.replace("/login?redirect=/profile");
        return;
      }

      const meData = await meRes.json().catch(() => null);
      const meUser = (meData?.user ?? null) as MeUser | null;
      if (!meUser?.accountType) {
        router.replace("/login?redirect=/profile");
        return;
      }

      setMe(meUser);

      const res = await fetch("/api/profile", {
        cache: "no-store",
        credentials: "include",
        signal,
      });
      if (!res.ok) throw new Error("Failed to load profile");

      const data: UserProfile = await res.json();
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || meUser.email || "");
      setBio(data.bio || "");
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        await fetchProfile(controller.signal);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [fetchProfile]);

  const whoLabel = useMemo(() => {
    if (!me) return "";
    return me.businessName || me.email;
  }, [me]);

  const avatarUrl = useMemo(() => {
    return (
      profile?.avatar?.url ||
      profile?.profileImageUrl ||
      profile?.profileImage ||
      ""
    );
  }, [profile]);

  const initials = useMemo(() => {
    const n = (name || whoLabel || "").trim();
    if (!n) return "B";
    const parts = n.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "B";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [name, whoLabel]);

  if (loading) return <Loader />;
  if (!profile) return <NotFound />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, bio }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImageFile) return;

    if (profileImageFile.size > 5 * 1024 * 1024) {
      setImgStatus("error");
      return;
    }

    setImgStatus("uploading");
    const form = new FormData();
    form.append("profileImage", profileImageFile);

    try {
      const res = await fetch("/api/profile/image", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error();
      await fetchProfile(); // refresh from persisted backend state
      setProfileImageFile(null);
      setImgStatus("success");
      setTimeout(() => setImgStatus("idle"), 1500);
    } catch {
      setImgStatus("error");
    }
  };

  const handleRemoveAvatar = async () => {
    if (removeAvatarBusy) return;
    setRemoveAvatarBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ removeAvatar: true }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile(); // refresh from persisted backend state
    } catch {
      // no-op UI fallback
    } finally {
      setRemoveAvatarBusy(false);
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    if (resumeFile.size > 10 * 1024 * 1024) {
      setResumeStatus("error");
      return;
    }

    setResumeStatus("uploading");
    const form = new FormData();
    form.append("resume", resumeFile);

    try {
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error();
      await fetchProfile(); // refresh from persisted backend state
      setResumeFile(null);
      setResumeStatus("success");
      setTimeout(() => setResumeStatus("idle"), 1500);
    } catch {
      setResumeStatus("error");
    }
  };

  const handleRemoveResume = async () => {
    if (removeResumeBusy) return;
    setRemoveResumeBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ removeResume: true }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile(); // refresh from persisted backend state
    } catch {
      // no-op
    } finally {
      setRemoveResumeBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative mx-auto max-w-4xl p-6 space-y-8">
        {/* Header with persisted avatar */}
        <section className="rounded-2xl border border-yellow-500/20 bg-gray-900/60 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden border border-yellow-500/25 bg-black/40">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile avatar"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-yellow-200 font-bold text-xl">
                    {initials}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 tracking-tight">
                  Your Profile
                </h1>
                <p className="text-gray-300 mt-1">
                  Manage your profile, avatar, and resume.
                  {me?.accountType ? (
                    <span className="ml-2 inline-flex items-center rounded-full border border-yellow-500/25 px-2 py-0.5 text-[11px] text-yellow-200">
                      {String(me.accountType).toUpperCase()}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
              >
                Back
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
              >
                Home
              </Link>
            </div>
          </div>
        </section>

        {/* Avatar Management */}
        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/60 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-yellow-200">Profile Photo</h2>
          <p className="text-gray-300 text-sm mt-1">
            Current avatar is loaded from persisted profile data.
          </p>

          <div className="mt-4 grid gap-3 text-sm text-gray-300">
            <div>
              Current:{" "}
              {profile.avatar?.filename ||
                (avatarUrl ? "Uploaded avatar" : "No avatar uploaded")}
            </div>
            {profile.avatar?.uploadedAt ? (
              <div>Uploaded: {formatDate(profile.avatar.uploadedAt)}</div>
            ) : null}
          </div>

          <form
            onSubmit={handleImageUpload}
            encType="multipart/form-data"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)}
              className="text-xs text-gray-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-gray-100 hover:file:bg-white/15"
            />
            <button
              type="submit"
              disabled={imgStatus === "uploading" || !profileImageFile}
              className={cx(
                "px-4 py-2 rounded-xl font-semibold transition text-sm",
                "bg-yellow-400 text-black hover:bg-yellow-300",
                (imgStatus === "uploading" || !profileImageFile) &&
                  "opacity-60 cursor-not-allowed",
              )}
            >
              {imgStatus === "uploading" ? "Uploading…" : "Replace Avatar"}
            </button>

            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={removeAvatarBusy || !avatarUrl}
              className={cx(
                "px-4 py-2 rounded-xl border border-red-400/50 text-red-300 hover:bg-red-500/10 transition text-sm",
                (removeAvatarBusy || !avatarUrl) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {removeAvatarBusy ? "Removing…" : "Remove Avatar"}
            </button>

            {imgStatus === "success" && (
              <span className="text-green-400 text-sm">Updated</span>
            )}
            {imgStatus === "error" && (
              <span className="text-red-400 text-sm">Upload failed</span>
            )}
          </form>

          <div className="mt-2 text-[11px] text-gray-400">
            Max 5MB. JPG/PNG recommended.
          </div>
        </section>

        {/* Profile details */}
        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/60 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-yellow-200">Profile Details</h2>

          <form onSubmit={handleSave} className="mt-6 grid gap-4">
            <label className="block">
              <div className="text-sm text-gray-200 font-semibold">Name</div>
              <input
                className="w-full mt-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-yellow-400/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-200 font-semibold">
                Email (locked)
              </div>
              <input
                type="email"
                className="w-full mt-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-gray-300 outline-none"
                value={email}
                readOnly
              />
            </label>

            <label className="block">
              <div className="text-sm text-gray-200 font-semibold">Bio</div>
              <textarea
                className="w-full mt-2 min-h-[120px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-yellow-400/40"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people what you do."
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className={cx(
                  "px-5 py-2 rounded-xl font-semibold transition",
                  "bg-yellow-400 text-black hover:bg-yellow-300",
                  saveStatus === "saving" && "opacity-60 cursor-not-allowed",
                )}
              >
                {saveStatus === "saving" ? "Saving…" : "Save Profile"}
              </button>
              {saveStatus === "success" && (
                <p className="text-green-400">Saved</p>
              )}
              {saveStatus === "error" && (
                <p className="text-red-400">Save failed</p>
              )}
            </div>
          </form>
        </section>

        {/* Current Resume */}
        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/60 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-yellow-200">Current Resume</h2>
          <p className="text-gray-300 text-sm mt-1">
            Upload, view, download, replace, or remove your currently saved
            resume.
          </p>

          {profile.resume?.url ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-200 space-y-2">
              <div>
                <span className="text-gray-400">Filename:</span>{" "}
                {profile.resume.filename || "Resume file"}
              </div>
              <div>
                <span className="text-gray-400">Uploaded:</span>{" "}
                {formatDate(profile.resume.uploadedAt) || "Unknown"}
              </div>
              {profile.resume.contentType ? (
                <div>
                  <span className="text-gray-400">Type:</span>{" "}
                  {profile.resume.contentType}
                </div>
              ) : null}
              {profile.resume.size ? (
                <div>
                  <span className="text-gray-400">Size:</span>{" "}
                  {formatBytes(profile.resume.size)}
                </div>
              ) : null}

              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={profile.resume.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded border border-yellow-400/40 text-yellow-200 hover:bg-yellow-400/10"
                >
                  View
                </a>
                <a
                  href={profile.resume.url}
                  download={profile.resume.filename || "resume"}
                  className="px-3 py-2 rounded border border-white/20 text-white hover:bg-white/10"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  disabled={removeResumeBusy}
                  className={cx(
                    "px-3 py-2 rounded border border-red-400/50 text-red-300 hover:bg-red-500/10",
                    removeResumeBusy && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {removeResumeBusy ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-700 bg-black/20 p-4 text-sm text-gray-400">
              No resume uploaded yet.
            </div>
          )}

          <form
            onSubmit={handleResumeUpload}
            encType="multipart/form-data"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="text-xs text-gray-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-gray-100 hover:file:bg-white/15"
            />
            <button
              type="submit"
              disabled={resumeStatus === "uploading" || !resumeFile}
              className={cx(
                "px-4 py-2 rounded-xl font-semibold transition text-sm",
                "bg-yellow-400 text-black hover:bg-yellow-300",
                (resumeStatus === "uploading" || !resumeFile) &&
                  "opacity-60 cursor-not-allowed",
              )}
            >
              {resumeStatus === "uploading" ? "Uploading…" : "Replace Resume"}
            </button>

            {resumeStatus === "success" && (
              <span className="text-green-400 text-sm">Updated</span>
            )}
            {resumeStatus === "error" && (
              <span className="text-red-400 text-sm">Upload failed</span>
            )}
          </form>

          <div className="mt-2 text-[11px] text-gray-400">
            Max 10MB. PDF/DOC/DOCX.
          </div>
        </section>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative p-6">
      <GlowBackground />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="mt-3 h-4 w-1/2 bg-white/10 rounded animate-pulse" />
        <div className="mt-6 h-10 w-full bg-white/10 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative p-6">
      <GlowBackground />
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/25 bg-red-500/10 p-6 shadow-xl">
        <div className="text-xl font-bold text-red-200">Profile not found.</div>
        <p className="text-gray-200 mt-2">
          If you just signed up, your profile may not be created yet.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
