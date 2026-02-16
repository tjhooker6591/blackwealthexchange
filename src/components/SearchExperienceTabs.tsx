// src/components/SearchExperienceTabs.tsx
"use client";

import React from "react";
import {
  Sparkles,
  Search,
  Store,
  Building2,
  ShoppingBag,
  Newspaper,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";

export type SearchTabKey =
  | "all"
  | "businesses"
  | "organizations"
  | "shopping"
  | "news"
  | "more"
  | "tools";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SearchExperienceTabs({
  activeTab,
  onSelect,
  aiMode,
  onToggleAi,
}: {
  activeTab: SearchTabKey;
  onSelect: (k: SearchTabKey) => void;
  aiMode: boolean;
  onToggleAi: () => void;
}) {
  const tabs: Array<{
    key: SearchTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: "all", label: "All", icon: Search },
    { key: "businesses", label: "Businesses", icon: Store },
    { key: "organizations", label: "Organizations", icon: Building2 },
    { key: "shopping", label: "Shopping", icon: ShoppingBag },
    { key: "news", label: "News", icon: Newspaper },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div className="flex items-center justify-between gap-3">
      {/* AI MODE (premium toggle) */}
      <button
        type="button"
        onClick={onToggleAi}
        aria-pressed={aiMode}
        className={cx(
          "group relative inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-[12px] font-extrabold transition",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
          aiMode
            ? "border-[#D4AF37]/55 bg-[#D4AF37]/12 text-[#D4AF37]"
            : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.05]"
        )}
        title="Toggle AI Mode"
      >
        <span
          className={cx(
            "flex h-7 w-7 items-center justify-center rounded-xl border transition",
            aiMode
              ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
              : "border-white/10 bg-black/20"
          )}
        >
          <Sparkles className={cx("h-4 w-4", aiMode ? "text-[#D4AF37]" : "text-white/70")} />
        </span>
        <span className="leading-none">
          AI <span className="text-white/70 font-black">Mode</span>
        </span>
      </button>

      {/* Tabs */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelect(t.key)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-[12px] font-extrabold transition",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
                  active
                    ? "border-[#D4AF37]/55 bg-[#D4AF37]/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/[0.05]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cx("h-4 w-4", active ? "text-[#D4AF37]" : "text-white/65")} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools */}
      <button
        type="button"
        onClick={() => onSelect("tools")}
        className={cx(
          "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-[12px] font-extrabold transition",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
          activeTab === "tools"
            ? "border-[#D4AF37]/55 bg-[#D4AF37]/12 text-white"
            : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.05]"
        )}
        title="Open Tools (Filters)"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" />
        Tools
      </button>
    </div>
  );
}

