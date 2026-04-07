import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type GoalStatus = "active" | "completed" | "paused" | "cancelled" | "archived";

type SavingsGoal = {
  id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  monthlyContributionTarget: number;
  status: GoalStatus;
  createdAt?: string;
  updatedAt?: string;
};

type GoalsListResponse = {
  ok: boolean;
  items?: SavingsGoal[];
  message?: string;
};

type GoalDetailResponse = {
  ok: boolean;
  item?: SavingsGoal | null;
  deletedId?: string;
  message?: string;
};

type GoalFormState = {
  goalName: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  monthlyContributionTarget: string;
  status: GoalStatus;
};

const defaultForm: GoalFormState = {
  goalName: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  monthlyContributionTarget: "",
  status: "active",
};

const statusOptions: GoalStatus[] = [
  "active",
  "completed",
  "paused",
  "cancelled",
  "archived",
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getNumericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatDateForInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getProgressPercent(currentAmount: number, targetAmount: number) {
  if (targetAmount <= 0) return 0;
  return Math.max(0, Math.min(100, (currentAmount / targetAmount) * 100));
}

export default function WealthBuilderSavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [form, setForm] = useState<GoalFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const activeGoals = useMemo(
    () => goals.filter((item) => item.status === "active"),
    [goals],
  );

  const totalTarget = useMemo(
    () =>
      goals.reduce((sum, item) => sum + (Number(item.targetAmount) || 0), 0),
    [goals],
  );

  const totalSaved = useMemo(
    () =>
      goals.reduce((sum, item) => sum + (Number(item.currentAmount) || 0), 0),
    [goals],
  );

  const totalRemaining = useMemo(
    () => Math.max(totalTarget - totalSaved, 0),
    [totalTarget, totalSaved],
  );

  async function loadGoals() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wealth-builder/goals");
      const data: GoalsListResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load savings goals.");
      }

      setGoals(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load savings goals.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
  }

  function startEdit(item: SavingsGoal) {
    setEditingId(item.id);
    setForm({
      goalName: item.goalName || "",
      targetAmount: String(item.targetAmount ?? ""),
      currentAmount: String(item.currentAmount ?? ""),
      targetDate: formatDateForInput(item.targetDate),
      monthlyContributionTarget: String(item.monthlyContributionTarget ?? ""),
      status: item.status || "active",
    });
    setError("");
    setSuccess("");
  }

  function updateForm<K extends keyof GoalFormState>(
    field: K,
    value: GoalFormState[K],
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
      if (!form.goalName.trim()) {
        throw new Error("Goal name is required.");
      }

      const payload = {
        goalName: form.goalName.trim(),
        targetAmount: getNumericValue(form.targetAmount),
        currentAmount: getNumericValue(form.currentAmount),
        targetDate: form.targetDate ? form.targetDate : null,
        monthlyContributionTarget: getNumericValue(
          form.monthlyContributionTarget,
        ),
        status: form.status,
      };

      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `/api/wealth-builder/goals/${editingId}`
        : "/api/wealth-builder/goals";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: GoalDetailResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to save savings goal.");
      }

      setSuccess(isEditing ? "Savings goal updated." : "Savings goal added.");
      resetForm();
      await loadGoals();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save savings goal.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this savings goal?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/wealth-builder/goals/${id}`, {
        method: "DELETE",
      });

      const data: GoalDetailResponse = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to delete savings goal.");
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Savings goal deleted.");
      await loadGoals();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete savings goal.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Head>
        <title>Savings | Wealth Builder</title>
        <meta
          name="description"
          content="Track and manage savings goals inside Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Savings
            </p>
            <h1 className="mt-3 text-4xl font-bold">Savings goals</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Create savings goals, track progress, and keep clear visibility
              into what you are building toward.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Total Saved
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(totalSaved)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Total current savings across all goals.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Total Target
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  {formatCurrency(totalTarget)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Combined target amount across all goals.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <h2 className="text-lg font-semibold text-yellow-300">
                  Active Goals
                </h2>
                <p className="mt-3 text-2xl font-bold">{activeGoals.length}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Still in progress and actively being worked.
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
                      {editingId ? "Edit Savings Goal" : "Add Savings Goal"}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Define a target amount, track current savings, and set an
                      expected monthly contribution.
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
                      Goal Name
                    </span>
                    <input
                      type="text"
                      value={form.goalName}
                      onChange={(e) => updateForm("goalName", e.target.value)}
                      placeholder="Emergency Fund, Travel Fund, Down Payment..."
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Target Amount
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.targetAmount}
                        onChange={(e) =>
                          updateForm("targetAmount", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Current Amount
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.currentAmount}
                        onChange={(e) =>
                          updateForm("currentAmount", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Target Date
                      </span>
                      <input
                        type="date"
                        value={form.targetDate}
                        onChange={(e) =>
                          updateForm("targetDate", e.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-zinc-300">
                        Monthly Contribution Target
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.monthlyContributionTarget}
                        onChange={(e) =>
                          updateForm(
                            "monthlyContributionTarget",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-300">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateForm("status", e.target.value as GoalStatus)
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
                          ? "Update Goal"
                          : "Add Goal"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void loadGoals()}
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
                      Savings Goals
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Track progress across all savings goals tied to this user
                      profile.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300">
                    {goals.length} goal{goals.length === 1 ? "" : "s"}
                  </div>
                </div>

                {loading ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                    Loading savings goals...
                  </div>
                ) : goals.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6">
                    <h3 className="text-lg font-semibold text-white">
                      No savings goals yet
                    </h3>
                    <p className="mt-3 text-sm text-zinc-300">
                      Add your first goal to start tracking progress toward
                      savings milestones.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {goals.map((item) => {
                      const progressPercent = getProgressPercent(
                        Number(item.currentAmount) || 0,
                        Number(item.targetAmount) || 0,
                      );

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-black/30 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold text-yellow-300">
                                {item.goalName}
                              </h3>
                              <p className="mt-2 text-sm text-zinc-400">
                                {item.status} •{" "}
                                {item.targetDate
                                  ? `Target: ${new Date(item.targetDate).toLocaleDateString("en-US")}`
                                  : "No target date"}
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
                                Current Amount
                              </p>
                              <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(
                                  Number(item.currentAmount) || 0,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-400">
                                Target Amount
                              </p>
                              <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(Number(item.targetAmount) || 0)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-400">
                                Monthly Target
                              </p>
                              <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(
                                  Number(item.monthlyContributionTarget) || 0,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
                              <p className="text-xs uppercase tracking-wide text-zinc-400">
                                Remaining
                              </p>
                              <p className="mt-2 text-lg font-bold text-white">
                                {formatCurrency(
                                  Math.max(
                                    (Number(item.targetAmount) || 0) -
                                      (Number(item.currentAmount) || 0),
                                    0,
                                  ),
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                              <span>Progress</span>
                              <span>{progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-yellow-400 transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {goals.length > 0 ? (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
                    <h3 className="text-lg font-semibold text-white">
                      Savings Snapshot
                    </h3>
                    <p className="mt-2 text-sm text-zinc-300">
                      {formatCurrency(totalRemaining)} remains across all
                      current savings targets.
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
