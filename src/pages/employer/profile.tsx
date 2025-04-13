"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

type User = {
  email: string;
  accountType: string;
};

type CompanyProfile = {
  businessName: string;
  website: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
};

export default function EmployerProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CompanyProfile>({
    businessName: "",
    website: "",
    description: "",
    logoUrl: "",
    contactEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);

        const profileRes = await axios.get("/api/employer/profile", {
          params: { email: data.user.email },
        });

        if (profileRes.data) {
          setProfile(profileRes.data);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await axios.post("/api/employer/profile/update", {
        ...profile,
        email: user.email,
      });
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center py-20">Loading profile...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gold mb-6 text-center">
          Manage Company Profile
        </h1>

        {message && (
          <div className="mb-4 text-center text-sm text-green-400">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Business Name
            </label>
            <input
              name="businessName"
              type="text"
              value={profile.businessName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Website</label>
            <input
              name="website"
              type="url"
              value={profile.website}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              name="contactEmail"
              type="email"
              value={profile.contactEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Logo URL</label>
            <input
              name="logoUrl"
              type="url"
              value={profile.logoUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Company Description
            </label>
            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Tell us about your company..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-black font-semibold py-2 rounded hover:bg-yellow-400 transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
