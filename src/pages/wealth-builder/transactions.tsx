import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import { requireWealthBuilderPageUser } from "@/lib/wealth-builder/page-auth";

type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "debt-payment"
  | "savings";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string;
  merchant?: string;
  type: TransactionType;
  notes?: string;
};

const typeOptions: TransactionType[] = [
  "expense",
  "income",
  "savings",
  "debt-payment",
  "transfer",
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function WealthBuilderTransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    date: toDateInputValue(new Date()),
    amount: "",
    category: "",
    merchant: "",
    type: "expense" as TransactionType,
    notes: "",
  });

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/wealth-builder/transactions?limit=200",
      );
      const raw = await response.text();
      let payload: any = null;
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.message ||
            (response.status === 401
              ? "Please sign in with a user account to use Wealth Builder transactions."
              : "Failed to load transactions."),
        );
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  const totals = useMemo(() => {
    const income = items
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const expenses = items
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    return {
      income,
      expenses,
      net: income - expenses,
    };
  }, [items]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/wealth-builder/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          amount: Number(form.amount) || 0,
          category: form.category,
          merchant: form.merchant,
          type: form.type,
          notes: form.notes,
          source: "manual",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Failed to save transaction.");
      }

      setForm((current) => ({
        ...current,
        amount: "",
        category: "",
        merchant: "",
        notes: "",
      }));
      setSuccess("Transaction added.");
      await loadTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this transaction?")) return;

    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/wealth-builder/transactions/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Failed to delete transaction.");
      }
      setSuccess("Transaction deleted.");
      await loadTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction.",
      );
    }
  }

  return (
    <>
      <Head>
        <title>Transactions | Wealth Builder</title>
        <meta
          name="description"
          content="Track transactions and spending categories in Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Transactions
            </p>
            <h1 className="mt-3 text-4xl font-bold">Money activity tracker</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Track income, spending, savings contributions, and debt payments
              in one stream.
            </p>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                {success}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Income
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-300">
                  {formatCurrency(totals.income)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Expenses
                </p>
                <p className="mt-2 text-2xl font-bold text-red-300">
                  {formatCurrency(totals.expenses)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Net
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-300">
                  {formatCurrency(totals.net)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4">
              <p className="text-sm font-semibold text-indigo-200">
                Next best action
              </p>
              <p className="mt-1 text-sm text-zinc-200">
                {totals.net < 0
                  ? "You are net negative. Sync your budget actuals, then reduce high-spend categories before adding extra debt payments."
                  : "You are net positive. Sync budget actuals, then route surplus to highest-interest debt and emergency savings."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/wealth-builder/budget"
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-indigo-300"
                >
                  Open Budget
                </Link>
                <Link
                  href="/wealth-builder/debt"
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-indigo-300"
                >
                  Open Debt Plan
                </Link>
                <Link
                  href="/wealth-builder/savings"
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-indigo-300"
                >
                  Open Savings Goals
                </Link>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5"
            >
              <h2 className="text-lg font-semibold">Add transaction</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block text-zinc-300">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-zinc-300">Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, amount: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-zinc-300">Type</span>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        type: e.target.value as TransactionType,
                      }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                  >
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-zinc-300">Category</span>
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, category: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-zinc-300">
                    Merchant (optional)
                  </span>
                  <input
                    value={form.merchant}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, merchant: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-3">
                  <span className="mb-1 block text-zinc-300">
                    Notes (optional)
                  </span>
                  <input
                    value={form.notes}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, notes: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-2 font-semibold text-yellow-300 hover:bg-yellow-500/25 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save transaction"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-400">
                  Loading transactions...
                </p>
              ) : items.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-400">
                  No transactions yet.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {item.category}{" "}
                          {item.merchant ? `• ${item.merchant}` : ""}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(item.date).toLocaleDateString()} •{" "}
                          {item.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-yellow-300">
                          {formatCurrency(item.amount || 0)}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireWealthBuilderPageUser(context, "/wealth-builder/transactions");
};
