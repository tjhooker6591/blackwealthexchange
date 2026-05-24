import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { getMonthRange, serializeDoc } from "@/lib/wealth-builder/helpers";

type RecurringBill = {
  merchant: string;
  avgAmount: number;
  occurrences: number;
  nextEstimatedDate: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function detectRecurringBills(items: any[]): RecurringBill[] {
  const expenseWithMerchant = items.filter(
    (item) =>
      item.type === "expense" &&
      typeof item.merchant === "string" &&
      item.merchant.trim(),
  );

  const grouped = expenseWithMerchant.reduce<Record<string, any[]>>(
    (acc, item) => {
      const key = String(item.merchant).trim().toLowerCase();
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  const recurring: RecurringBill[] = [];

  for (const [merchantKey, merchantItems] of Object.entries(grouped)) {
    if (merchantItems.length < 2) continue;

    const sorted = [...merchantItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1].date).getTime();
      const next = new Date(sorted[i].date).getTime();
      const days = Math.round((next - prev) / (1000 * 60 * 60 * 24));
      if (Number.isFinite(days)) intervals.push(days);
    }

    const monthlyLike = intervals.some((days) => days >= 24 && days <= 38);
    if (!monthlyLike) continue;

    const avgAmount =
      sorted.reduce(
        (sum, item) =>
          sum + (typeof item.amount === "number" ? item.amount : 0),
        0,
      ) / sorted.length;

    const avgInterval =
      intervals.length > 0
        ? Math.round(
            intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
          )
        : 30;

    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(
      lastDate.getDate() + (Number.isFinite(avgInterval) ? avgInterval : 30),
    );

    recurring.push({
      merchant: merchantItems[0]?.merchant || merchantKey,
      avgAmount,
      occurrences: sorted.length,
      nextEstimatedDate: Number.isFinite(nextDate.getTime())
        ? nextDate.toISOString()
        : null,
    });
  }

  return recurring.sort((a, b) => b.avgAmount - a.avgAmount).slice(0, 8);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (
    req.method === "GET" &&
    String(req.headers.accept || "").includes("text/html")
  ) {
    return res.redirect(307, "/wealth-builder/dashboard");
  }

  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();

  const profiles = db.collection("financial_profiles");
  const debts = db.collection("financial_debts");
  const goals = db.collection("savings_goals");
  const budgets = db.collection("budget_plans");
  const transactions = db.collection("financial_transactions");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthRange(year, month);
  const trailingStart = new Date(now);
  trailingStart.setDate(trailingStart.getDate() - 120);

  const [
    profile,
    debtItems,
    goalItems,
    budgetPlan,
    transactionItems,
    trailingTransactions,
  ] = await Promise.all([
    profiles.findOne({ userId: auth.userId, accountType: "user" }),
    debts.find({ userId: auth.userId, accountType: "user" }).toArray(),
    goals.find({ userId: auth.userId, accountType: "user" }).toArray(),
    budgets.findOne({ userId: auth.userId, accountType: "user", month, year }),
    transactions
      .find({
        userId: auth.userId,
        accountType: "user",
        date: { $gte: start, $lt: end },
      })
      .toArray(),
    transactions
      .find({
        userId: auth.userId,
        accountType: "user",
        date: { $gte: trailingStart, $lte: now },
      })
      .toArray(),
  ]);

  const activeDebts = debtItems.filter(
    (item) => item.status !== "paid" && item.status !== "closed",
  );

  const totalDebt = activeDebts.reduce(
    (sum, item) => sum + (typeof item.balance === "number" ? item.balance : 0),
    0,
  );

  const totalMinimumPayments = activeDebts.reduce(
    (sum, item) =>
      sum + (typeof item.minimumPayment === "number" ? item.minimumPayment : 0),
    0,
  );

  const totalSavings = goalItems.reduce(
    (sum, item) =>
      sum + (typeof item.currentAmount === "number" ? item.currentAmount : 0),
    0,
  );

  const activeGoals = goalItems.filter(
    (item) => item.status === "active",
  ).length;

  const monthIncome = transactionItems
    .filter((item) => item.type === "income")
    .reduce(
      (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
      0,
    );

  const monthExpenses = transactionItems
    .filter((item) => item.type === "expense")
    .reduce(
      (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
      0,
    );

  const categorySpending = transactionItems
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((acc, item) => {
      const key =
        typeof item.category === "string" && item.category.trim()
          ? item.category.trim()
          : "Other";
      acc[key] =
        (acc[key] || 0) + (typeof item.amount === "number" ? item.amount : 0);
      return acc;
    }, {});

  const budgetTotalPlanned = Array.isArray(budgetPlan?.categories)
    ? budgetPlan.categories.reduce(
        (sum: number, item: any) =>
          sum +
          (typeof item.plannedAmount === "number" ? item.plannedAmount : 0),
        0,
      )
    : 0;

  const safeToSpend = Math.max(budgetTotalPlanned - monthExpenses, 0);
  const totalCash = Math.max(monthIncome - monthExpenses, 0);
  const netWorth = totalCash + totalSavings - totalDebt;

  const debtToIncome = monthIncome > 0 ? totalDebt / monthIncome : 0;
  const savingsRate = monthIncome > 0 ? totalSavings / monthIncome : 0;
  const monthlySurplus = monthIncome - monthExpenses;
  const cashflowHealth: "surplus" | "breakeven" | "deficit" =
    monthlySurplus > 0
      ? "surplus"
      : monthlySurplus < 0
        ? "deficit"
        : "breakeven";
  const monthlyDebtCapacity =
    totalMinimumPayments + Math.max(monthlySurplus * 0.25, 0);
  const estimatedDebtFreeMonths =
    totalDebt > 0 && monthlyDebtCapacity > 0
      ? Math.ceil(totalDebt / monthlyDebtCapacity)
      : null;
  const emergencyFundTarget = Math.max(monthExpenses * 3, 1500);
  const emergencyFundCoverageMonths =
    monthExpenses > 0 ? totalSavings / monthExpenses : 0;
  const emergencyFundProgress = clamp(
    emergencyFundTarget > 0 ? (totalSavings / emergencyFundTarget) * 100 : 0,
    0,
    100,
  );

  const budgetScore =
    budgetTotalPlanned > 0
      ? clamp(
          ((budgetTotalPlanned - monthExpenses) / budgetTotalPlanned) * 100,
          0,
          100,
        )
      : 50;
  const debtScore = clamp(100 - debtToIncome * 35, 0, 100);
  const savingsScore = clamp(savingsRate * 100, 0, 100);
  const healthScore = Math.round(
    budgetScore * 0.45 + debtScore * 0.35 + savingsScore * 0.2,
  );

  const recurringBills = detectRecurringBills(trailingTransactions);

  const alerts: string[] = [];
  if (budgetTotalPlanned > 0 && monthExpenses > budgetTotalPlanned) {
    alerts.push(
      `You're over budget by $${(monthExpenses - budgetTotalPlanned).toFixed(2)} this month.`,
    );
  }
  if (debtToIncome > 1.5) {
    alerts.push(
      "Debt is significantly higher than this month's tracked income.",
    );
  }
  if (recurringBills.length >= 4) {
    alerts.push(
      `${recurringBills.length} recurring bills were detected. Review subscriptions for possible savings.`,
    );
  }

  const recommendations: string[] = [];
  if (totalMinimumPayments > 0) {
    recommendations.push(
      `Cover at least $${totalMinimumPayments.toFixed(2)} in minimum debt payments this month to stay current.`,
    );
  }
  if (safeToSpend > 0) {
    recommendations.push(
      `You can safely spend about $${safeToSpend.toFixed(2)} before hitting your budget cap.`,
    );
  }
  const highestRateDebt = [...activeDebts]
    .filter((item) => typeof item.interestRate === "number")
    .sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];
  if (highestRateDebt) {
    recommendations.push(
      `Prioritize extra payments on ${highestRateDebt.name || "your highest-interest debt"} (${highestRateDebt.interestRate}% APR).`,
    );
  }

  const nextActions: Array<{
    id: string;
    title: string;
    detail: string;
    href: string;
    priority: "high" | "medium" | "low";
  }> = [];

  const connectedFlow = [
    {
      id: "transactions",
      label: "Transactions",
      href: "/wealth-builder/transactions",
      status: transactionItems.length > 0 ? "active" : "needs_setup",
      metric:
        transactionItems.length > 0
          ? `${transactionItems.length} entries this month`
          : "No monthly entries yet",
      guidance:
        transactionItems.length > 0
          ? "Keep entries current so every downstream module stays accurate."
          : "Start here first — all planning modules depend on transaction data.",
    },
    {
      id: "budget",
      label: "Budget",
      href: "/wealth-builder/budget",
      status: budgetPlan ? "active" : "needs_setup",
      metric: budgetPlan
        ? `${Math.max((monthExpenses / Math.max(budgetTotalPlanned, 1)) * 100, 0).toFixed(0)}% of plan used`
        : "Not configured",
      guidance: budgetPlan
        ? "Review category drift and rebalance before month-end."
        : "Set category caps so safe-to-spend is meaningful.",
    },
    {
      id: "debt",
      label: "Debt",
      href: "/wealth-builder/debt",
      status: activeDebts.length > 0 ? "active" : "needs_setup",
      metric:
        activeDebts.length > 0
          ? `${activeDebts.length} active account${activeDebts.length > 1 ? "s" : ""}`
          : "No tracked accounts",
      guidance:
        activeDebts.length > 0
          ? estimatedDebtFreeMonths
            ? `At current pace, debt-free estimate: ~${estimatedDebtFreeMonths} month${estimatedDebtFreeMonths > 1 ? "s" : ""}.`
            : "Add repayment capacity to generate payoff forecast."
          : "Add debt balances and APR to unlock payoff sequencing.",
    },
    {
      id: "savings",
      label: "Savings",
      href: "/wealth-builder/savings",
      status: activeGoals > 0 ? "active" : "needs_setup",
      metric:
        activeGoals > 0
          ? `${activeGoals} active goal${activeGoals > 1 ? "s" : ""}`
          : "No active goals",
      guidance:
        activeGoals > 0
          ? `Emergency fund progress: ${Math.round(emergencyFundProgress)}% of 3-month target.`
          : "Create an emergency goal to stabilize your plan.",
    },
  ] as const;

  if (transactionItems.length === 0) {
    nextActions.push({
      id: "add-transactions",
      title: "Add your first transactions",
      detail:
        "Import or add income/expense activity to unlock accurate insights.",
      href: "/wealth-builder/transactions",
      priority: "high",
    });
  }

  if (!budgetPlan) {
    nextActions.push({
      id: "set-budget",
      title: "Set this month's budget",
      detail: "Define your spending guardrails so safe-to-spend is meaningful.",
      href: "/wealth-builder/budget",
      priority: "high",
    });
  } else if (monthExpenses > budgetTotalPlanned) {
    nextActions.push({
      id: "rebalance-budget",
      title: "Rebalance over-budget categories",
      detail: `You are currently $${(monthExpenses - budgetTotalPlanned).toFixed(2)} over plan.`,
      href: "/wealth-builder/budget",
      priority: "high",
    });
  }

  if (activeDebts.length === 0) {
    nextActions.push({
      id: "add-debt",
      title: "Add debt accounts",
      detail: "Track balances and APR to build a payoff strategy.",
      href: "/wealth-builder/debt",
      priority: "medium",
    });
  } else if (highestRateDebt) {
    nextActions.push({
      id: "pay-high-apr",
      title: "Target highest APR debt",
      detail: `${highestRateDebt.name || "Debt"} at ${highestRateDebt.interestRate}% APR should be prioritized.`,
      href: "/wealth-builder/debt",
      priority: "medium",
    });
  }

  if (activeGoals === 0) {
    nextActions.push({
      id: "create-goal",
      title: "Create a savings goal",
      detail: "Set an emergency fund target to improve resilience.",
      href: "/wealth-builder/savings",
      priority: "medium",
    });
  }

  if (nextActions.length === 0) {
    nextActions.push({
      id: "keep-momentum",
      title: "Keep momentum",
      detail:
        "Review recurring bills and continue weekly check-ins to stay on track.",
      href: "/wealth-builder/insights",
      priority: "low",
    });
  }

  return res.status(200).json({
    ok: true,
    dashboard: {
      profile: serializeDoc(profile),
      summary: {
        monthlyIncome:
          typeof profile?.monthlyIncome === "number"
            ? profile.monthlyIncome
            : 0,
        totalDebt,
        totalMinimumPayments,
        totalSavings,
        activeGoals,
        budgetStatus: budgetPlan ? "Configured" : "Not Set",
        monthIncome,
        monthExpenses,
        totalCash,
        netWorth,
        safeToSpend,
        healthScore,
        debtToIncome,
        savingsRate,
        recurringBillsCount: recurringBills.length,
        monthlySurplus,
        cashflowHealth,
        estimatedDebtFreeMonths,
        emergencyFundTarget,
        emergencyFundCoverageMonths,
        emergencyFundProgress,
      },
      budgetPlan: serializeDoc(budgetPlan),
      recurringBills,
      categorySpending: Object.entries(categorySpending)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      alerts,
      recommendations,
      nextActions,
      nextActionCount: nextActions.length,
      connectedFlow,
      recentTransactionsCount: transactionItems.length,
    },
  });
}
