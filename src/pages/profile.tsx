// pages/profile.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  resumeUrl?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Status flags
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setBio(data.bio || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading…
      </div>
    );
  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Profile not found.
      </div>
    );

  // Handlers
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bio }),
      });
      if (!res.ok) throw new Error();
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    }
  };

  const handleAvatarUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) return;
    setAvatarStatus("uploading");
    const form = new FormData();
    form.append("avatar", avatarFile);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error();
      const { avatarUrl } = await res.json();
      setProfile((p) => p && { ...p, avatar: avatarUrl });
      setAvatarFile(null);
      setAvatarStatus("success");
    } catch {
      setAvatarStatus("error");
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;
    setResumeStatus("uploading");
    const form = new FormData();
    form.append("resume", resumeFile);
    try {
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error();
      const { resumeUrl } = await res.json();
      setProfile((p) => p && { ...p, resumeUrl });
      setResumeFile(null);
      setResumeStatus("success");
    } catch {
      setResumeStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>

        {/* Avatar */}
        <div className="flex items-center space-x-4">
          <Image
            src={profile.avatar}
            alt="User Avatar"
            width={80}
            height={80}
            className="rounded-full"
          />
          <form
            onSubmit={handleAvatarUpload}
            className="flex items-center space-x-2"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-black"
            />
            <button
              type="submit"
              disabled={avatarStatus === "uploading"}
              className="px-3 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
            >
              {avatarStatus === "uploading" ? "Uploading…" : "Change Avatar"}
            </button>
            {avatarStatus === "success" && (
              <span className="text-green-400">✔️</span>
            )}
            {avatarStatus === "error" && (
              <span className="text-red-400">❌</span>
            )}
          </form>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block">
            Name
            <input
              className="w-full mt-1 p-2 text-black rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            Email
            <input
              type="email"
              className="w-full mt-1 p-2 text-black rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            Bio
            <textarea
              className="w-full mt-1 p-2 text-black rounded"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
          >
            {saveStatus === "saving" ? "Saving…" : "Save Profile"}
          </button>
          {saveStatus === "success" && <p className="text-green-400">Saved!</p>}
          {saveStatus === "error" && (
            <p className="text-red-400">Save failed.</p>
          )}
        </form>

        {/* Resume */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Resume</h2>
          {profile.resumeUrl && (
            <p>
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                View current resume
              </a>
            </p>
          )}
          <form
            onSubmit={handleResumeUpload}
            className="flex items-center space-x-2"
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="text-black"
            />
            <button
              type="submit"
              disabled={resumeStatus === "uploading"}
              className="px-3 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
            >
              {resumeStatus === "uploading" ? "Uploading…" : "Upload Resume"}
            </button>
            {resumeStatus === "success" && (
              <span className="text-green-400">✔️</span>
            )}
            {resumeStatus === "error" && (
              <span className="text-red-400">❌</span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
