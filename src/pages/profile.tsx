import React, { useEffect, useState } from "react";
import Image from "next/legacy/image";

// Define types for user and business data.
interface Business {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  resumeUrl?: string;
  business?: Business;
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
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  // Status per operation
  const [profileStatus, setProfileStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load");
        const data: UserProfile = await res.json();
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setBio(data.bio || "");
        setResumeUrl(data.resumeUrl || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        No profile found.
      </div>
    );

  // handlers
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, bio }),
      });
      if (!res.ok) throw new Error();
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setProfileStatus("success");
    } catch {
      setProfileStatus("error");
    }
  };

  const uploadAvatar = async (e: React.FormEvent) => {
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
      setProfile((prev) => prev && { ...prev, avatar: avatarUrl });
      setAvatarFile(null);
      setAvatarStatus("success");
    } catch {
      setAvatarStatus("error");
    }
  };

  const uploadResume = async (e: React.FormEvent) => {
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
      const { resumeUrl: newUrl } = await res.json();
      setProfile((prev) => prev && { ...prev, resumeUrl: newUrl });
      setResumeUrl(newUrl);
      setResumeFile(null);
      setResumeStatus("success");
    } catch {
      setResumeStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg space-y-8">
        <h1 className="text-4xl font-bold">Your Profile</h1>

        {/* Avatar Upload */}
        <div className="flex items-center space-x-4">
          <Image
            src={profile.avatar}
            alt="Avatar"
            width={100}
            height={100}
            className="rounded-full"
          />
          <form onSubmit={uploadAvatar} className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-black"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
              disabled={avatarStatus === "uploading"}
            >
              {avatarStatus === "uploading" ? "Uploading…" : "Upload Avatar"}
            </button>
            {avatarStatus === "success" && (
              <span className="text-green-400">Done!</span>
            )}
            {avatarStatus === "error" && (
              <span className="text-red-400">Error.</span>
            )}
          </form>
        </div>

        {/* Edit Profile */}
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block">
            Name
            <input
              className="w-full mt-1 p-2 text-black rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            Email
            <input
              type="email"
              className="w-full mt-1 p-2 text-black rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
            disabled={profileStatus === "saving"}
          >
            {profileStatus === "saving" ? "Saving…" : "Save Profile"}
          </button>
          {profileStatus === "success" && (
            <p className="text-green-400">Profile saved!</p>
          )}
          {profileStatus === "error" && (
            <p className="text-red-400">Save failed.</p>
          )}
        </form>

        {/* Resume Upload */}
        <form onSubmit={uploadResume} className="space-y-4">
          <h2 className="text-2xl font-semibold">Resume</h2>
          {resumeUrl && (
            <p>
              Current resume:{" "}
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                View
              </a>
            </p>
          )}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="text-black"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
            disabled={resumeStatus === "uploading"}
          >
            {resumeStatus === "uploading" ? "Uploading…" : "Upload Resume"}
          </button>
          {resumeStatus === "success" && (
            <p className="text-green-400">Resume uploaded!</p>
          )}
          {resumeStatus === "error" && (
            <p className="text-red-400">Upload failed.</p>
          )}
        </form>

        {/* Business Info */}
        {profile.business ? (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-4">Your Business</h2>
            <div className="flex items-center space-x-4">
              {profile.business.logo && (
                <Image
                  src={profile.business.logo}
                  alt={`${profile.business.name} Logo`}
                  width={80}
                  height={80}
                  className="rounded"
                />
              )}
              <div>
                <h3 className="text-xl">{profile.business.name}</h3>
                {profile.business.description && (
                  <p>{profile.business.description}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-8">
            You have not registered a business yet. Please update your profile.
          </p>
        )}
      </div>
    </div>
  );
}
