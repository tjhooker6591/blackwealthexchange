import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, BadgeCheck, Star } from "lucide-react";
import useAuth from "@/hooks/useAuth";

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

const num = (value: string) => Number(value || 0);
const helper = "Enter estimates only. This is educational and not financial, tax, legal, or lending advice.";

const RealEstateToolkit = () => {
  const { user } = useAuth();
  const plan = String((user as any)?.currentPlan || "free").toLowerCase();
  const isPremium = plan === "premium" || plan === "founding";
  const isFounding = plan === "founding";

  const [annualIncome, setAnnualIncome] = useState("90000");
  const [monthlyDebts, setMonthlyDebts] = useState("1200");
  const [downPayment, setDownPayment] = useState("30000");
  const [interestRate, setInterestRate] = useState("6.5");
  const [loanTermYears, setLoanTermYears] = useState("30");
  const [taxInsMonthly, setTaxInsMonthly] = useState("450");

  const affordability = useMemo(() => {
    const grossMonthly = num(annualIncome) / 12;
    const maxHousingBudget = Math.max(grossMonthly * 0.31 - num(monthlyDebts), 0);
    const piBudget = Math.max(maxHousingBudget - num(taxInsMonthly), 0);
    const r = num(interestRate) / 100 / 12;
    const n = num(loanTermYears) * 12;
    const principal = r > 0 ? (piBudget * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)) : piBudget * n;
    const homePrice = principal + num(downPayment);
    const estPayment = piBudget + num(taxInsMonthly);
    const dti = grossMonthly > 0 ? ((num(monthlyDebts) + estPayment) / grossMonthly) * 100 : 0;
    return { maxHousingBudget, estPayment, homePrice, dti };
  }, [annualIncome, monthlyDebts, downPayment, interestRate, loanTermYears, taxInsMonthly]);

  const [targetHomePrice, setTargetHomePrice] = useState("400000");
  const [downPct, setDownPct] = useState("10");
  const [currentSavings, setCurrentSavings] = useState("15000");
  const [monthlySavings, setMonthlySavings] = useState("1200");

  const downPlan = useMemo(() => {
    const needed = num(targetHomePrice) * (num(downPct) / 100);
    const gap = Math.max(needed - num(currentSavings), 0);
    const months = num(monthlySavings) > 0 ? gap / num(monthlySavings) : Number.POSITIVE_INFINITY;
    return { needed, gap, months };
  }, [targetHomePrice, downPct, currentSavings, monthlySavings]);

  const [rtoRent, setRtoRent] = useState("2200");
  const [rtoCredit, setRtoCredit] = useState("300");
  const [rtoOptionFee, setRtoOptionFee] = useState("5000");
  const [rtoTargetPrice, setRtoTargetPrice] = useState("350000");
  const [rtoYears, setRtoYears] = useState("3");

  const rto = useMemo(() => {
    const months = num(rtoYears) * 12;
    const totalRent = num(rtoRent) * months;
    const totalCredits = num(rtoCredit) * months + num(rtoOptionFee);
    const remainingGap = Math.max(num(rtoTargetPrice) - totalCredits, 0);
    return { totalRent, totalCredits, remainingGap };
  }, [rtoRent, rtoCredit, rtoOptionFee, rtoTargetPrice, rtoYears]);

  const [rcPurchase, setRcPurchase] = useState("300000");
  const [rcDown, setRcDown] = useState("60000");
  const [rcMortgage, setRcMortgage] = useState("1600");
  const [rcRent, setRcRent] = useState("2600");
  const [rcTaxes, setRcTaxes] = useState("280");
  const [rcIns, setRcIns] = useState("120");
  const [rcRepairs, setRcRepairs] = useState("180");
  const [rcVacancy, setRcVacancy] = useState("130");
  const [rcMgmt, setRcMgmt] = useState("200");
  const [rcOther, setRcOther] = useState("0");

  const rc = useMemo(() => {
    const monthly = num(rcRent) - (num(rcMortgage) + num(rcTaxes) + num(rcIns) + num(rcRepairs) + num(rcVacancy) + num(rcMgmt) + num(rcOther));
    const annual = monthly * 12;
    const invested = Math.max(num(rcDown), 1);
    const coc = (annual / invested) * 100;
    return { monthly, annual, coc };
  }, [rcRent, rcMortgage, rcTaxes, rcIns, rcRepairs, rcVacancy, rcMgmt, rcOther, rcDown]);

  const [daPrice, setDaPrice] = useState("250000");
  const [daRepairs, setDaRepairs] = useState("40000");
  const [daArv, setDaArv] = useState("360000");
  const [daRent, setDaRent] = useState("2500");
  const [daHolding, setDaHolding] = useState("12000");
  const [daFinancing, setDaFinancing] = useState("15000");

  const deal = useMemo(() => {
    const totalCost = num(daPrice) + num(daRepairs) + num(daHolding) + num(daFinancing);
    const equitySpread = num(daArv) - totalCost;
    const arvMargin = num(daArv) > 0 ? (equitySpread / num(daArv)) * 100 : 0;
    const annualRent = num(daRent) * 12;
    const rentToCost = totalCost > 0 ? (annualRent / totalCost) * 100 : 0;
    const rating = arvMargin >= 15 && rentToCost >= 10 ? "Strong" : arvMargin >= 8 && rentToCost >= 7 ? "Moderate" : "Risky";
    return { totalCost, equitySpread, arvMargin, rentToCost, rating };
  }, [daPrice, daRepairs, daArv, daRent, daHolding, daFinancing]);

  const L = ({ t, v, s, d = false }: any) => <label>{t}<input className="mt-1 p-2 w-full bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={v} onChange={(e)=>s(e.target.value)} disabled={d} /></label>;

  return <div className="min-h-screen bg-black text-white"><main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
    <h1 className="text-3xl font-extrabold text-yellow-200">Real Estate Toolkit</h1>
    <div className="flex gap-2">{isFounding ? <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Star className="h-4 w-4"/>Founding Toolkit Access</span> : isPremium ? <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-200 inline-flex items-center gap-1"><BadgeCheck className="h-4 w-4"/>Premium Toolkit Unlocked</span> : <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Preview Mode</span>}</div>

    <section className="grid md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div><h2 className="font-bold text-yellow-200">Mortgage Affordability Calculator</h2><div className="grid grid-cols-2 gap-2 mt-2 text-sm"><L t="Annual household income (USD)" v={annualIncome} s={setAnnualIncome}/><L t="Monthly debt payments (USD, monthly)" v={monthlyDebts} s={setMonthlyDebts}/><L t="Down payment amount (USD)" v={downPayment} s={setDownPayment}/><L t="Interest rate %" v={interestRate} s={setInterestRate}/><L t="Loan term years" v={loanTermYears} s={setLoanTermYears}/><L t="Monthly taxes + insurance (USD, monthly)" v={taxInsMonthly} s={setTaxInsMonthly}/></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="mt-2 text-sm text-gray-300">Estimated max housing budget: {money(affordability.maxHousingBudget)} | Estimated monthly payment: {money(affordability.estPayment)} | Estimated affordable home price: {money(affordability.homePrice)} | Estimated debt-to-income ratio: {pct(affordability.dti)}</div></div>
      <div><h2 className="font-bold text-yellow-200">Down Payment Planner</h2><div className="grid grid-cols-2 gap-2 mt-2 text-sm"><L t="Target home price (USD)" v={targetHomePrice} s={setTargetHomePrice}/><L t="Down payment %" v={downPct} s={setDownPct}/><L t="Current savings (USD)" v={currentSavings} s={setCurrentSavings}/><L t="Monthly savings amount (USD)" v={monthlySavings} s={setMonthlySavings}/></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="mt-2 text-sm text-gray-300">Target down payment needed: {money(downPlan.needed)} | Remaining savings needed: {money(downPlan.gap)} | Estimated months to goal: {Number.isFinite(downPlan.months) ? downPlan.months.toFixed(1) : "∞"}</div></div></section>

    <section className="grid md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div><h2 className="font-bold text-yellow-200">Rent-to-Own Comparison Tool</h2><div className="grid grid-cols-2 gap-2 mt-2 text-sm"><L t="Monthly rent (USD)" v={rtoRent} s={setRtoRent}/><L t="Rent credit amount (USD, monthly credit)" v={rtoCredit} s={setRtoCredit}/><L t="Option fee (USD)" v={rtoOptionFee} s={setRtoOptionFee}/><L t="Target purchase price (USD)" v={rtoTargetPrice} s={setRtoTargetPrice}/><div className="col-span-2"><L t="Term in years" v={rtoYears} s={setRtoYears}/></div></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="mt-2 text-sm text-gray-300">Estimated total rent paid: {money(rto.totalRent)} | Estimated total credits: {money(rto.totalCredits)} | Estimated remaining purchase gap: {money(rto.remainingGap)}</div></div>
      <div><h2 className="font-bold text-yellow-200">Rental Cashflow Calculator</h2><div className="grid grid-cols-2 gap-2 mt-2 text-sm"><L t="Purchase price (USD)" v={rcPurchase} s={setRcPurchase}/><L t="Down payment (USD)" v={rcDown} s={setRcDown}/><L t="Monthly mortgage payment (USD)" v={rcMortgage} s={setRcMortgage}/><L t="Monthly rent (USD)" v={rcRent} s={setRcRent}/><L t="Monthly taxes (USD)" v={rcTaxes} s={setRcTaxes}/><L t="Monthly insurance (USD)" v={rcIns} s={setRcIns}/><L t="Monthly repairs / maintenance (USD)" v={rcRepairs} s={setRcRepairs}/><L t="Vacancy reserve (USD)" v={rcVacancy} s={setRcVacancy}/><L t="Property management (USD)" v={rcMgmt} s={setRcMgmt}/><L t="Other monthly costs (USD)" v={rcOther} s={setRcOther}/></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="mt-2 text-sm text-gray-300">Estimated monthly cashflow: {money(rc.monthly)} | Estimated annual cashflow: {money(rc.annual)} | Estimated cash-on-cash return: {pct(rc.coc)}</div></div></section>

    <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold text-yellow-200">Deal Analyzer {isPremium ? "" : "(Locked Preview)"}</h2>{!isPremium ? <div className="mt-2 text-sm text-yellow-100 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Premium required. Preview only.</div> : null}<div className="grid md:grid-cols-3 gap-2 mt-2 text-sm"><L t="Purchase price (USD)" v={daPrice} s={setDaPrice} d={!isPremium}/><L t="Repair / rehab estimate (USD)" v={daRepairs} s={setDaRepairs} d={!isPremium}/><L t="After repair value / ARV (USD)" v={daArv} s={setDaArv} d={!isPremium}/><L t="Expected monthly rent (USD)" v={daRent} s={setDaRent} d={!isPremium}/><L t="Closing / holding costs (USD)" v={daHolding} s={setDaHolding} d={!isPremium}/><L t="Financing cost estimate (USD)" v={daFinancing} s={setDaFinancing} d={!isPremium}/></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="mt-2 text-sm text-gray-300">Total project cost: {money(deal.totalCost)} | Equity spread: {money(deal.equitySpread)} | ARV margin: {pct(deal.arvMargin)} | Rent-to-cost: {pct(deal.rentToCost)} | Estimated deal rating: {deal.rating}</div></section>

    {!isPremium && <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5"><h3 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Unlock Real Estate Toolkit</h3><p className="text-sm text-gray-300 mt-1">Premium unlocks the full real estate toolkit. Founding includes advanced worksheets and priority resources.</p><Link href="/pricing?feature=real-estate-toolkit&returnTo=%2Freal-estate-toolkit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-black font-semibold">Unlock with Premium Membership <ArrowRight className="h-4 w-4" /></Link></section>}
  </main></div>;
};

export default RealEstateToolkit;
