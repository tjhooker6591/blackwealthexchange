import { useState } from "react";

type ShareVariant = "signup" | "referral" | "search" | "business" | "creator";

const copyByVariant: Record<ShareVariant, string> = {
  signup: "I joined the BWE 0.5% Challenge. Search Black first. Buy, review, refer, repeat.",
  referral: "I joined the BWE 0.5% Challenge. Search Black first. Buy, review, refer, repeat.",
  search: "I found Black-owned businesses in my city on Black Wealth Exchange. Join the challenge.",
  business: "One small shift by millions of people can redirect billions into Black-owned businesses, jobs, ownership, and opportunity.",
  creator: "I joined the BWE 0.5% Challenge. Search Black first. Buy, review, refer, repeat.",
};

export default function ChallengeShareCard({ variant, referralLink }: { variant: ShareVariant; referralLink?: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${copyByVariant[variant]}${referralLink ? ` ${referralLink}` : ""}`;
  return (
    <div className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3">
      <p className="text-sm text-white/90">{text}</p>
      <button
        type="button"
        className="mt-2 rounded bg-[#D4AF37] px-3 py-1.5 text-sm font-bold text-black"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? "Copied" : "Copy share text"}
      </button>
    </div>
  );
}
