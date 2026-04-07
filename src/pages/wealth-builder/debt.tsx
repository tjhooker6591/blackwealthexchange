import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type DebtStatus =
  | "active"
  | "paid"
  | "paused"
  | "delinquent"
  | "collections"
  | "closed";

type DebtItem = {
  id: string;
  name: string;
  lender?: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate?: string | null;
  category?: string;
  status: DebtStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DebtListResponse = {
  ok: boolean;
  items?: DebtItem[];
  message?: string;
};

type DebtDetailResponse = {
  ok: boolean;
  item?: DebtItem | null;
  deletedId?: string;
  message?: string;
};

type DebtFormState = {
  name: string;
  lender: string;
  balance: string;
  interestRate: string;
  minimumPayment: string;
  dueDate: string;
  category: string;
  status: DebtStatus;
  notes: string;
};

const defaultForm: DebtFormState = {
  name: "",
  lender: "",
  balance: "",
  interestRate: "",
  minimumPayment: "",
  dueDate: "",
  category: "",
  status: "active",
  notes: "",
};

const statusOptions: DebtStatus[] = [
  "active",
  "paid",
  "paused",
  "delinquent",
  "collections",
  "closed",
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDateForInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getNumericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default function WealthBuilderDebtPage() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [form, setForm] = useState<DebtFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const activeDebts = useMemo(
    () =>
      debts.filter(
        (item) => item.status !== "paid" && item.status !== "closed",
      ),
    [debts],
  );

  const totalDebt = useMemo(
    () =>
      activeDebts.reduce((sum, item) => sum + (Number(item.balance) || 0), 0),
    [activeDebts],
  );

  const monthlyMinimums = useMemo(
    () =>
      activeDebts.reduce(
        (sum, item) => sum + (Number(item.minimumPayment) || 0),
        0,
      ),
    [activeDebts],
  );

  const highestInterestDebt = useMemo(() => {
    if (!activeDebts.length) return null;
    return [...activeDebts].sort(
      (a, b) => (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0),
    )[0];
  }, [activeDebts]);

  async function loadDebts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wealth-builder/debts");
      const data: DebtListResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load debt records.");
      }

      setDebts(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load debt records.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDebts();
  }, []);

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
  }

  function startEdit(item: DebtItem) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      lender: item.lender || "",
      balance: String(item.balance ?? ""),
      interestRate: String(item.interestRate ?? ""),
      minimumPayment: String(item.minimumPayment ?? ""),
      dueDate: formatDateForInput(item.dueDate),
      category: item.category || "",
      status: item.status || "active",
      notes: item.notes || "",
    });
    setError("");
    setSuccess("");
  }

  function updateForm<K extends keyof DebtFormState>(
    field: K,
    value: DebtFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.name.trim()) {
        throw new Error("Debt name is required.");
      }

      const payload = {
        name: form.name.trim(),
        lender: form.lender.trim(),
        balance: getNumericValue(form.balance),
        interestRate: getNumericValue(form.interestRate),
        minimumPayment: getNumericValue(form.minimumPayment),
        dueDate: form.dueDate ? form.dueDate : null,
        category: form.category.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `/api/wealth-builder/debts/${editingId}`
        : "/api/wealth-builder/debts";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: DebtDetailResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to save debt record.");
      }

      setSuccess(isEditing ? "Debt record updated." : "Debt record added.");
      resetForm();
      await loadDebts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save debt record.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this debt record?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/wealth-builder/debts/${id}`, {
        method: "DELETE",
      });

      const data: DebtDetailResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to delete debt record.");
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Debt record deleted.");
      await loadDebts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete debt record.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Head>
        <title>Debt | Wealth Builder</title>
        <meta
          name="description"
          content="Track and manage debt records inside Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Debt
            </p>
            <h1 className="mt-3 text-4xl font-bold">Debt organizer</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Add debt accounts, track balances and interest rates, and keep
              your monthly minimum obligations visible in one place.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Total Debt
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(totalDebt)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Sum of active debt balances.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Highest Interest Debt
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  {highestInterestDebt
                    ? `${highestInterestDebt.name} (${highestInterestDebt.interestRate}%)`
                    : "—"}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Helps identify the most expensive debt.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Monthly Minimums
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(monthlyMinimums)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Sum of required minimum payments.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-6 rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
                {success}
              </div>
            ) : null}

            <div className="mt-8 grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
              <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {editingId ? "Edit Debt Record" : "Add Debt Record"}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Capture the debt name, lender, balance, rate, and payment
                      details.
                    </p>
                  </div>

                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">
                      Debt Name
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Credit Card, Auto Loan, Student Loan..."
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">
                      Lender
                    </span>
                    <input
                      type="text"
                      value={form.lender}
                      onChange={(e) => updateForm("lender", e.target.value)}
                      placeholder="Bank or lender"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Balance
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.balance}
                        onChange={(e) => updateForm("balance", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Interest Rate %
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.interestRate}
                        onChange={(e) =>
                          updateForm("interestRate", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Minimum Payment
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.minimumPayment}
                        onChange={(e) =>
                          updateForm("minimumPayment", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Due Date
                      </span>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => updateForm("dueDate", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Category
                      </span>
                      <input
                        type="text"
                        value={form.category}
                        onChange={(e) => updateForm("category", e.target.value)}
                        placeholder="Credit card, auto, student, personal..."
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Status
                      </span>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          updateForm("status", e.target.value as DebtStatus)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">
                      Notes
                    </span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      rows={4}
                      placeholder="Optional notes about payoff plan, hardship, or account details..."
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                    />
                  </label>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? editingId
                          ? "Updating..."
                          : "Saving..."
                        : editingId
                          ? "Update Debt"
                          : "Add Debt"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void loadDebts()}
                      disabled={loading}
                      className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Debt Records
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      View and manage all debt accounts tied to this user
                      profile.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300">
                    {debts.length} record{debts.length === 1 ? "" : "s"}
                  </div>
                </div>

                {loading ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                    Loading debt records...
                  </div>
                ) : debts.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6">
                    <h3 className="text-lg font-semibold text-white">
                      No debt records yet
                    </h3>
                    <p className="mt-3 text-sm text-zinc-300">
                      Add your first debt record to start tracking balances,
                      interest rates, and minimum payments.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {debts.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-yellow-300">
                              {item.name}
                            </h3>
                            <p className="mt-2 text-sm text-zinc-400">
                              {item.lender || "No lender"} •{" "}
                              {item.category || "No category"} • {item.status}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === item.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              Balance
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              {formatCurrency(Number(item.balance) || 0)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              Interest Rate
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              {Number(item.interestRate) || 0}%
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              Minimum Payment
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              {formatCurrency(Number(item.minimumPayment) || 0)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              Due Date
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              {item.dueDate
                                ? new Date(item.dueDate).toLocaleDateString(
                                    "en-US",
                                  )
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {item.notes ? (
                          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">
                              Notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                              {item.notes}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
