import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import { requireWealthBuilderPageUser } from "@/lib/wealth-builder/page-auth";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

type BudgetPlan = {
  id: string;
  month: number;
  year: number;
  totalBudgeted: number;
  categories: BudgetCategory[];
  createdAt?: string;
  updatedAt?: string;
};

type BudgetApiResponse = {
  ok: boolean;
  item?: BudgetPlan | null;
  message?: string;
};

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function monthLabel(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

function emptyCategory(): BudgetCategory {
  return {
    name: "",
    plannedAmount: 0,
    actualAmount: 0,
  };
}

export default function WealthBuilderBudgetPage() {
  const [month, setMonth] = useState<number>(getCurrentMonth());
  const [year, setYear] = useState<number>(getCurrentYear());
  const [planId, setPlanId] = useState<string | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([
    emptyCategory(),
    emptyCategory(),
    emptyCategory(),
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncingActuals, setSyncingActuals] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const totalPlanned = useMemo(() => {
    return categories.reduce(
      (sum, item) => sum + (Number(item.plannedAmount) || 0),
      0,
    );
  }, [categories]);

  const totalActual = useMemo(() => {
    return categories.reduce(
      (sum, item) => sum + (Number(item.actualAmount) || 0),
      0,
    );
  }, [categories]);

  const remaining = useMemo(
    () => totalPlanned - totalActual,
    [totalPlanned, totalActual],
  );

  async function loadBudget(selectedMonth: number, selectedYear: number) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/wealth-builder/budget?month=${selectedMonth}&year=${selectedYear}`,
      );
      const data: BudgetApiResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load budget.");
      }

      if (data.item) {
        setPlanId(data.item.id);
        setCategories(
          Array.isArray(data.item.categories) && data.item.categories.length > 0
            ? data.item.categories.map((item) => ({
                name: item.name || "",
                plannedAmount: Number(item.plannedAmount) || 0,
                actualAmount: Number(item.actualAmount) || 0,
              }))
            : [emptyCategory()],
        );
      } else {
        setPlanId(null);
        setCategories([emptyCategory(), emptyCategory(), emptyCategory()]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load budget.";
      setError(message);
      setPlanId(null);
      setCategories([emptyCategory(), emptyCategory(), emptyCategory()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBudget(month, year);
  }, [month, year]);

  function updateCategory(
    index: number,
    field: keyof BudgetCategory,
    value: string,
  ) {
    setCategories((current) =>
      current.map((item, i) => {
        if (i !== index) return item;

        if (field === "name") {
          return { ...item, name: value };
        }

        const parsed = Number(value);
        return {
          ...item,
          [field]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
        };
      }),
    );
  }

  function addCategory() {
    setCategories((current) => [...current, emptyCategory()]);
  }

  function removeCategory(index: number) {
    setCategories((current) => {
      if (current.length === 1) return [emptyCategory()];
      return current.filter((_, i) => i !== index);
    });
  }

  async function syncActualsFromTransactions() {
    setSyncingActuals(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/wealth-builder/budget/suggested-actuals?month=${month}&year=${year}`,
      );
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Failed to sync actuals.");
      }

      const suggested: Array<{ category: string; amount: number }> =
        Array.isArray(payload?.suggestedActuals)
          ? payload.suggestedActuals
          : [];

      if (suggested.length === 0) {
        setSuccess("No expense transactions found for this month to sync.");
        return;
      }

      setCategories((current) => {
        const mapped = new Map<string, number>(
          suggested.map((item) => [
            item.category.toLowerCase(),
            Number(item.amount) || 0,
          ]),
        );

        const next = current.map((item) => {
          const key = item.name.trim().toLowerCase();
          if (!key || !mapped.has(key)) return item;
          return {
            ...item,
            actualAmount: mapped.get(key) || 0,
          };
        });

        const knownKeys = new Set(
          next.map((item) => item.name.trim().toLowerCase()).filter(Boolean),
        );

        for (const row of suggested) {
          const key = String(row.category || "")
            .trim()
            .toLowerCase();
          if (!key || knownKeys.has(key)) continue;
          next.push({
            name: row.category,
            plannedAmount: 0,
            actualAmount: Number(row.amount) || 0,
          });
        }

        return next;
      });

      setSuccess(
        `Synced actuals from ${payload.transactionCount || 0} expense transactions. Review, then save budget.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync actuals.");
    } finally {
      setSyncingActuals(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const cleanedCategories = categories
        .map((item) => ({
          name: item.name.trim(),
          plannedAmount: Number(item.plannedAmount) || 0,
          actualAmount: Number(item.actualAmount) || 0,
        }))
        .filter((item) => item.name);

      const response = await fetch("/api/wealth-builder/budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          year,
          totalBudgeted: cleanedCategories.reduce(
            (sum, item) => sum + item.plannedAmount,
            0,
          ),
          categories: cleanedCategories,
        }),
      });

      const data: BudgetApiResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to save budget.");
      }

      setSuccess(`Budget saved for ${monthLabel(month)} ${year}.`);
      if (data.item?.id) {
        setPlanId(data.item.id);
      }

      await loadBudget(month, year);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save budget.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!planId) return;

    const confirmed = window.confirm(
      `Delete the budget for ${monthLabel(month)} ${year}?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/wealth-builder/budget/${planId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to delete budget.");
      }

      setPlanId(null);
      setCategories([emptyCategory(), emptyCategory(), emptyCategory()]);
      setSuccess(`Budget deleted for ${monthLabel(month)} ${year}.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete budget.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Budget | Wealth Builder</title>
        <meta
          name="description"
          content="Create and manage a monthly budget inside Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Budget
            </p>
            <h1 className="mt-3 text-4xl font-bold">Monthly budget planner</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Build a monthly budget, track category targets, and compare
              planned spending against actual amounts as you build out your
              personal finance view.
            </p>

            <div className="mt-6 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-4 text-sm text-cyan-100">
              <p className="font-semibold">Connected flow</p>
              <p className="mt-1 text-cyan-50/90">
                Transactions feed this budget. This budget sets your debt and
                savings capacity. Keep all four modules in sync weekly.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm uppercase tracking-wide text-zinc-400">
                  Total Planned
                </p>
                <p className="mt-3 text-3xl font-bold text-yellow-300">
                  ${totalPlanned.toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Sum of all planned category amounts.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm uppercase tracking-wide text-zinc-400">
                  Total Actual
                </p>
                <p className="mt-3 text-3xl font-bold text-yellow-300">
                  ${totalActual.toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Sum of currently entered actual amounts.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm uppercase tracking-wide text-zinc-400">
                  Budget Status
                </p>
                <p className="mt-3 text-3xl font-bold text-yellow-300">
                  {remaining >= 0
                    ? `$${remaining.toFixed(2)} left`
                    : `$${Math.abs(remaining).toFixed(2)} over`}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Difference between planned and actual totals.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Month
                </span>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
                    <option key={value} value={value}>
                      {monthLabel(value)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Year
                </span>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value) || getCurrentYear())
                  }
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void loadBudget(month, year)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
                >
                  Reload Budget
                </button>
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

            <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {monthLabel(month)} {year} Budget
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Add categories, set planned amounts, and optionally track
                    actual spend.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void syncActualsFromTransactions()}
                    disabled={syncingActuals || loading}
                    className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {syncingActuals
                      ? "Syncing..."
                      : "Sync Actuals from Transactions"}
                  </button>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-full border border-yellow-400 bg-yellow-500/15 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
                  >
                    Add Category
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="mt-6 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                  Loading budget data...
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {categories.map((item, index) => (
                    <div
                      key={`budget-category-${index}`}
                      className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                    >
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-zinc-300">
                          Category Name
                        </span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateCategory(index, "name", e.target.value)
                          }
                          placeholder="Housing, Food, Transportation..."
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-zinc-300">
                          Planned Amount
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.plannedAmount}
                          onChange={(e) =>
                            updateCategory(
                              index,
                              "plannedAmount",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-zinc-300">
                          Actual Amount
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.actualAmount}
                          onChange={(e) =>
                            updateCategory(
                              index,
                              "actualAmount",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
                        />
                      </label>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : planId
                      ? "Update Budget"
                      : "Save Budget"}
                </button>

                {planId ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete Budget"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireWealthBuilderPageUser(context, "/wealth-builder/budget");
};
