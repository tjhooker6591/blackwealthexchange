import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { getMonthRange, serializeDoc } from "@/lib/wealth-builder/helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const totalDebt = debtItems
    .filter((item) => item.status !== "paid" && item.status !== "closed")
    .reduce((sum, item) => sum + (typeof item.balance === "number" ? item.balance : 0), 0);

  const totalMinimumPayments = debtItems
    .filter((item) => item.status !== "paid" && item.status !== "closed")
    .reduce((sum, item) => sum + (typeof item.minimumPayment === "number" ? item.minimumPayment : 0), 0);

  const totalSavings = goalItems.reduce(
    (sum, item) => sum + (typeof item.currentAmount === "number" ? item.currentAmount : 0),
    0
  );

  const activeGoals = goalItems.filter((item) => item.status === "active").length;

  const monthIncome = transactionItems
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0), 0);

  const monthExpenses = transactionItems
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + (typeof item.amount === "number" ? item.amount : 0), 0);

  return res.status(200).json({
    ok: true,
    dashboard: {
      profile: serializeDoc(profile),
      summary: {
        monthlyIncome: typeof profile?.monthlyIncome === "number" ? profile.monthlyIncome : 0,
        totalDebt,
        totalMinimumPayments,
        totalSavings,
        activeGoals,
        budgetStatus: budgetPlan ? "Configured" : "Not Set",
        monthIncome,
        monthExpenses,
      },
      budgetPlan: serializeDoc(budgetPlan),
      recentTransactionsCount: transactionItems.length,
    },
  });
}
