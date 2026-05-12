import SupportTicketForm from "@/components/support/SupportTicketForm";
export default function NewSupport() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">
          Open Support Ticket
        </h1>
        <p className="text-zinc-300">
          Billing/security categories auto-tag higher priority.
        </p>
        <SupportTicketForm />
      </div>
    </main>
  );
}
