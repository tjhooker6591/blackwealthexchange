import SupportTicketForm from "@/components/support/SupportTicketForm";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">Support Center</h1>
        <p className="text-zinc-300">Tell us what you need help with.</p>
        <SupportTicketForm />
      </div>
    </main>
  );
}
