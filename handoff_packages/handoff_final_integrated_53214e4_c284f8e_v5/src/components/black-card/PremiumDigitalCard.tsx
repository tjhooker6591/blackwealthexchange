type Props = {
  memberName: string;
  memberId: string;
  status?: "Active" | "Inactive";
  verificationId?: string;
  cardTier?: string;
  planName?: string;
  isExample?: boolean;
};

export default function PremiumDigitalCard({
  memberName,
  memberId,
  status = "Active",
  verificationId,
  cardTier = "Standard",
  planName = "Premium",
  isExample = false,
}: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[560px] overflow-visible rounded-[20px] border border-[#D4AF37]/40 bg-gradient-to-br from-[#17120A] via-[#060606] to-[#141008] p-4 pb-5 shadow-[0_28px_80px_rgba(0,0,0,0.66)] sm:rounded-[26px] sm:p-6 sm:pb-7 sm:shadow-[0_40px_120px_rgba(0,0,0,0.72)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,216,120,0.20),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(212,175,55,0.16),transparent_36%)]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.10) 22%, transparent 45%)",
        }}
      />
      <div className="absolute inset-[1px] rounded-[18px] border border-white/10 sm:rounded-[24px]" />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 7px)",
        }}
      />

      <div className="relative flex min-h-[250px] flex-col justify-between sm:min-h-[320px]">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#F0D789] sm:text-[11px] sm:tracking-[0.24em]">
              BWE Black Card
            </div>
            <div className="mt-1 whitespace-nowrap text-[clamp(18px,6.8vw,34px)] font-black leading-none tracking-[0.02em] text-[#F8E6AA] sm:tracking-[0.03em]">
              BLACK CARD
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80 sm:text-sm sm:tracking-[0.12em]">
              Digital Member Card
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-[#D4AF37]/45 bg-black/45 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-[#F1D57A] sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]">
            Verified BWE Member
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:mt-5 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
          <div className="text-white">
            <div className="text-white/55">Member</div>
            <div className="text-sm font-semibold tracking-wide sm:text-base">
              {memberName}
            </div>
          </div>
          <div className="text-white">
            <div className="text-white/55">Member ID</div>
            <div className="text-sm font-semibold tracking-wide sm:text-base">
              {memberId}
            </div>
          </div>
          <div className="text-white">
            <div className="text-white/55">Status</div>
            <div className="text-sm font-semibold tracking-wide text-green-300 sm:text-base">
              {status}
            </div>
          </div>
          <div className="text-white">
            <div className="text-white/55">Verification ID</div>
            <div className="font-mono text-xs tracking-wide text-[#F3DD97] sm:text-sm">
              {verificationId || "DE9C3C65D5F2"}
            </div>
          </div>
          <div className="text-white">
            <div className="text-white/55">Card Tier</div>
            <div className="text-sm font-semibold tracking-wide sm:text-base">
              {cardTier}
            </div>
          </div>
          <div className="text-white">
            <div className="text-white/55">Current Plan</div>
            <div className="text-sm font-semibold tracking-wide sm:text-base">
              {planName}
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-[#D4AF37]/20 pt-2.5 sm:mt-5 sm:pt-3.5">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[#E8CC76] sm:text-[11px] sm:tracking-[0.12em]">
            Membership ID Card — Not a payment card
          </div>
          {isExample ? (
            <div className="mt-1 text-[10px] text-white/65 sm:text-[11px]">
              Example card shown for illustration.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
