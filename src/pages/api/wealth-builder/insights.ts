import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { getMonthRange } from "@/lib/wealth-builder/helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const debts = db.collection("financial_debts");
  const goals = db.collection("savings_goals");
  const budgets = db.collection("budget_plans");
  const transactions = db.collection("financial_transactions");
  const profiles = db.collection("financial_profiles");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthRange(year, month);

  const [profile, debtItems, goalItems, budgetPlan, transactionItems] = await Promise.all([
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
  ]);

  const insights: Array<{ type: string; title: string; message: string }> = [];

  if (debtItems.length > 0) {
    const highestInterestDebt = debtItems
      .filter((item) => typeof item.interestRate === "number")
      .sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];

    if (highestInterestDebt) {
      insights.push({
        type: "debt",
        title: "Highest-interest debt",
        message: `${highestInterestDebt.name} has the highest interest rate at ${highestInterestDebt.interestRate}%.`,
      });
    }
  }

  const expenseTransactions = transactionItems.filter((item) => item.type === "expense");
  if (expenseTransactions.length > 0) {
    const totalsByCategory = expenseTransactions.reduce<Record<string, number>>((acc, item) => {
      const key = typeof item.category === "string" && item.category ? item.category : "Other";
      acc[key] = (acc[key] || 0) + (typeof item.amount === "number" ? item.amount : 0);
      return acc;
    }, {});

    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        type: "spending",
        title: "Top spending category",
        message: `${topCategory[0]} is your largest expense category this month at $${topCategory[1].toFixed(2)}.`,
      });
    }
  }

  if (goalItems.length > 0) {
    const activeGoal = goalItems.find((item) => item.status === "active");
    if (activeGoal && typeof activeGoal.targetAmount === "number" && typeof activeGoal.currentAmount === "number") {
      const remaining = Math.max(activeGoal.targetAmount - activeGoal.currentAmount, 0);
      insights.push({
        type: "savings",
        title: "Savings progress",
        message: `${activeGoal.goalName} has $${remaining.toFixed(2)} remaining to reach the target.`,
      });
    }
  }

  if (budgetPlan && Array.isArray(budgetPlan.categories)) {
    const totalPlanned = budgetPlan.categories.reduce(
      (sum: number, item: any) => sum + (typeof item.plannedAmount === "number" ? item.plannedAmount : 0),
      0
    );
    const totalActual = budgetPlan.categories.reduce(
      (sum: number, item: any) => sum + (typeof item.actualAmount === "number" ? item.actualAmount : 0),
      0
    );

    insights.push({
      type: "budget",
      title: "Budget snapshot",
      message:
        totalActual > totalPlanned
          ? `You are currently $${(totalActual - totalPlanned).toFixed(2)} over your planned budget.`
          : `You are currently within budget by $${(totalPlanned - totalActual).toFixed(2)}.`,
    });
  }

  if (profile && typeof profile.monthlyIncome === "number") {
    const monthlyExpenses = expenseTransactions.reduce(
      (sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0),
      0
    );
    insights.push({
      type: "cashflow",
      title: "Monthly cash flow",
      message: `Based on current entries, approximately $${(profile.monthlyIncome - monthlyExpenses).toFixed(2)} remains after this month's tracked expenses.`,
    });
  }

  return res.status(200).json({
    ok: true,
    insights,
  });
}
