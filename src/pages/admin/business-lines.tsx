import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

const lines = [
  { title: "BWE Core Platform", items: ["Search", "Business Directory", "Marketplace", "Jobs", "Financial Education", "Black Card / Membership"] },
  { title: "BWE Growth & Revenue", items: ["Advertising", "Sponsorships", "Directory upgrades", "Employer job plans", "Affiliate revenue", "Consulting / Opportunity Network", "Manual / offline revenue"] },
  { title: "BWE Creator & Media", items: ["Music creators", "Books", "Animation brands", "YouTube / streaming", "Events / webinars"] },
  { title: "BWE Future Bets", items: ["Wealth Builder", "Travel Map", "Black Card rewards", "AI agents", "Mobile app"] },
];

export default function BusinessLinesPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">Business Lines</h1>
        <div className="grid md:grid-cols-2 gap-3">
          {lines.map((line) => (
            <div key={line.title} className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="text-yellow-300 font-semibold">{line.title}</h2>
              <ul className="mt-2 list-disc ml-5 text-zinc-300 text-sm space-y-1">
                {line.items.map((i)=><li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/business-lines");
