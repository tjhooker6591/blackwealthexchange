type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
};

export default function SummaryCard({
  title,
  value,
  description,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-lg">
      <p className="text-sm uppercase tracking-wide text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-yellow-300">{value}</p>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  );
}
