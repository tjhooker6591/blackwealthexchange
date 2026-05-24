import SupportTicketForm from "@/components/support/SupportTicketForm";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">report issue</h1>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
          Select category and submit your support ticket.
        </div>
        <SupportTicketForm defaultCategory="General Question" />
      </div>
    </main>
  );
}
