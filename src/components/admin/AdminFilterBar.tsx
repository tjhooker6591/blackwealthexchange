// src/components/admin/AdminFilterBar.tsx
import React from "react";

type StatusOption = "all" | "pending" | "approved" | "rejected" | "flagged";
type TypeOption =
  | "all"
  | "business"
  | "seller"
  | "employer"
  | "ad"
  | "affiliate"
  | "job";
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";
type RangeOption = "all" | "7" | "30" | "90";

export type AdminFilters = {
  search: string;
  status: StatusOption;
  type: TypeOption;
  range: RangeOption;
  sort: SortOption;
};

type Props = {
  value: AdminFilters;
  onChange: (next: AdminFilters) => void;
  onReset?: () => void;

  showType?: boolean;
  showRange?: boolean;
  showSort?: boolean;
  showStatus?: boolean; // ✅ NEW
};

const pillBase =
  "px-3 py-1.5 rounded-full text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400/30";

export default function AdminFilterBar({
  value,
  onChange,
  onReset,
  showType = true,
  showRange = true,
  showSort = true,
  showStatus = true, // ✅ NEW default
}: Props) {
  // ✅ SWC-safe helper
  function set<K extends keyof AdminFilters>(key: K, v: AdminFilters[K]) {
    onChange({ ...value, [key]: v });
  }

  const statusOptions: { key: StatusOption; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "flagged", label: "Flagged" },
  ];

  return (
    <div className="w-full rounded-2xl border border-yellow-400/20 bg-black/60 backdrop-blur px-4 py-4 shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-xs text-yellow-200/80 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              value={value.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Search by name, email, business…"
              className="w-full rounded-xl border border-yellow-400/20 bg-black px-4 py-2.5 text-white placeholder:text-white/40 shadow-inner focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 outline-none"
            />
            {value.search?.length > 0 && (
              <button
                type="button"
                onClick={() => set("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                aria-label="Clear search"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {showType && (
            <div className="min-w-[180px]">
              <label className="block text-xs text-yellow-200/80 mb-1">
                Type
              </label>
              <select
                value={value.type}
                onChange={(e) => set("type", e.target.value as TypeOption)}
                className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white shadow-inner focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 outline-none"
              >
                <option value="all">All</option>
                <option value="business">Business</option>
                <option value="seller">Seller</option>
                <option value="employer">Employer</option>
                <option value="ad">Ad</option>
                <option value="affiliate">Affiliate</option>
                <option value="job">Job</option>
              </select>
            </div>
          )}

          {showRange && (
            <div className="min-w-[160px]">
              <label className="block text-xs text-yellow-200/80 mb-1">
                Date Range
              </label>
              <select
                value={value.range}
                onChange={(e) => set("range", e.target.value as RangeOption)}
                className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white shadow-inner focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 outline-none"
              >
                <option value="all">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          )}

          {showSort && (
            <div className="min-w-[170px]">
              <label className="block text-xs text-yellow-200/80 mb-1">
                Sort
              </label>
              <select
                value={value.sort}
                onChange={(e) => set("sort", e.target.value as SortOption)}
                className="w-full rounded-xl border border-yellow-400/20 bg-black px-3 py-2.5 text-white shadow-inner focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onReset?.();
              onChange({
                search: "",
                status: "all",
                type: "all",
                range: "all",
                sort: "newest",
              });
            }}
            className="rounded-xl border border-yellow-400/30 bg-black px-4 py-2.5 text-yellow-200 hover:bg-yellow-400/10 hover:border-yellow-400/50 transition shadow"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ✅ Status pills are optional now */}
      {showStatus && (
        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((opt) => {
            const active = value.status === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => set("status", opt.key)}
                className={[
                  pillBase,
                  active
                    ? "border-yellow-400/70 bg-yellow-400/15 text-yellow-200 shadow"
                    : "border-white/10 bg-black text-white/75 hover:text-white hover:border-yellow-400/30 hover:bg-yellow-400/5",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
