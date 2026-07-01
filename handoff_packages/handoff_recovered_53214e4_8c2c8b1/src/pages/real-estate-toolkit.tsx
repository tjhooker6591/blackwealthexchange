import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, BadgeCheck, Star } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const helper = "Enter estimates only. This is educational and not financial, tax, legal, or lending advice.";
const num = (v: string) => Number(v || 0);
const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—");
const pct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(2)}%` : "—");

const Field = ({ label, value, setValue, disabled = false }: any) => (
  <label className="text-sm block">{label}
    <input className="mt-1 p-2 w-full bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} disabled={disabled} />
  </label>
);

const Locked = ({ title, text }: { title: string; text: string }) => (
  <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="absolute inset-0 bg-black/65 rounded-xl flex items-center justify-center"><div className="text-center text-yellow-200"><Lock className="h-5 w-5 mx-auto mb-1" />{text}</div></div>
    <h4 className="font-bold text-yellow-200">{title}</h4><div className="h-16" />
  </div>
);

export default function RealEstateToolkit() {
  const { user } = useAuth();
  const plan = String((user as any)?.currentPlan || "free").toLowerCase();
  const isPremium = plan === "premium" || plan === "founding";
  const isFounding = plan === "founding";
  const isPreview = !isPremium;

  const [annualIncome, setAnnualIncome] = useState("90000");
  const [monthlyDebts, setMonthlyDebts] = useState("1200");
  const [downPayment, setDownPayment] = useState("30000");
  const [interestRate, setInterestRate] = useState("6.5");
  const [loanTermYears, setLoanTermYears] = useState("30");
  const [taxInsMonthly, setTaxInsMonthly] = useState("450");
  const [targetHomePrice, setTargetHomePrice] = useState("400000");
  const [downPct, setDownPct] = useState("10");
  const [currentSavings, setCurrentSavings] = useState("15000");
  const [monthlySavings, setMonthlySavings] = useState("1200");
  const [rtoRent, setRtoRent] = useState("2200");
  const [rtoCredit, setRtoCredit] = useState("300");
  const [rtoOptionFee, setRtoOptionFee] = useState("5000");
  const [rtoTargetPrice, setRtoTargetPrice] = useState("350000");
  const [rtoYears, setRtoYears] = useState("3");
  const [rcDown, setRcDown] = useState("60000");
  const [rcMortgage, setRcMortgage] = useState("1600");
  const [rcRent, setRcRent] = useState("2600");
  const [rcTaxes, setRcTaxes] = useState("280");
  const [rcIns, setRcIns] = useState("120");
  const [rcRepairs, setRcRepairs] = useState("180");
  const [rcVacancy, setRcVacancy] = useState("130");
  const [rcMgmt, setRcMgmt] = useState("200");
  const [rcOther, setRcOther] = useState("0");
  const [daPrice, setDaPrice] = useState("250000");
  const [daRepairs, setDaRepairs] = useState("40000");
  const [daArv, setDaArv] = useState("360000");
  const [daRent, setDaRent] = useState("2500");
  const [daHolding, setDaHolding] = useState("12000");
  const [daFinancing, setDaFinancing] = useState("15000");

  const affordability = useMemo(() => { const gm = num(annualIncome)/12; const mh = Math.max(gm*0.31-num(monthlyDebts),0); const est = mh; return { mh, est, dti: gm>0?((num(monthlyDebts)+est)/gm)*100:0 }; }, [annualIncome, monthlyDebts]);
  const downPlan = useMemo(() => { const needed = num(targetHomePrice)*(num(downPct)/100); const gap = Math.max(needed-num(currentSavings),0); const months = num(monthlySavings)>0?gap/num(monthlySavings):Infinity; return { needed, gap, months }; }, [targetHomePrice, downPct, currentSavings, monthlySavings]);
  const _rto = useMemo(() => { const m = num(rtoYears)*12; const credits = num(rtoCredit)*m+num(rtoOptionFee); return { totalRent: num(rtoRent)*m, totalCredits: credits, remainingGap: Math.max(num(rtoTargetPrice)-credits,0) }; }, [rtoRent, rtoCredit, rtoOptionFee, rtoTargetPrice, rtoYears]);
  const rc = useMemo(() => { const monthly = num(rcRent)-(num(rcMortgage)+num(rcTaxes)+num(rcIns)+num(rcRepairs)+num(rcVacancy)+num(rcMgmt)+num(rcOther)); const annual = monthly*12; const coc = annual/Math.max(num(rcDown),1)*100; return { monthly, annual, coc }; }, [rcDown,rcMortgage,rcRent,rcTaxes,rcIns,rcRepairs,rcVacancy,rcMgmt,rcOther]);
  const deal = useMemo(() => { const total = num(daPrice)+num(daRepairs)+num(daHolding)+num(daFinancing); const spread = num(daArv)-total; const rentToCost = total>0?(num(daRent)*12/total)*100:0; const rating = spread>50000&&rentToCost>10?"Strong":spread>20000?"Moderate":"Risky"; return { total, spread, rentToCost, rating }; }, [daPrice,daRepairs,daHolding,daFinancing,daArv,daRent]);

  return <div className="min-h-screen bg-black text-white"><main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
    <h1 className="text-3xl font-extrabold text-yellow-200">Real Estate Toolkit</h1>
    <div className="flex gap-2">{isFounding ? <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Star className="h-4 w-4"/>Founding Toolkit Access</span> : isPremium ? <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-200 inline-flex items-center gap-1"><BadgeCheck className="h-4 w-4"/>Premium Toolkit Unlocked</span> : <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Preview Mode</span>}</div>

    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="font-bold text-yellow-200">What you get</h2>
      <div className="grid md:grid-cols-3 gap-3 mt-2 text-sm">
        <div className="border border-white/10 rounded p-3"><div className="font-semibold">Free Preview</div><ul className="text-gray-300 mt-1"><li>Sample calculators</li><li>Basic checklist preview</li><li>Directory links</li></ul></div>
        <div className="border border-green-500/30 rounded p-3"><div className="font-semibold text-green-200">Premium</div><ul className="text-gray-300 mt-1"><li>Full calculators</li><li>Full deal analyzer</li><li>Full checklists + docs</li></ul></div>
        <div className="border border-yellow-500/30 rounded p-3"><div className="font-semibold text-yellow-200">Founding</div><ul className="text-gray-300 mt-1"><li>Everything in Premium</li><li>Advanced underwriting worksheet</li><li>Property comparison worksheet</li><li>Priority resource checklist</li></ul></div>
      </div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold text-yellow-200">Free Preview Tools</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div><h3 className="font-semibold text-yellow-100">Preview calculator: Mortgage Affordability</h3><div className="grid grid-cols-2 gap-2 mt-2"><Field label="Annual household income (USD)" value={annualIncome} setValue={setAnnualIncome} /><Field label="Monthly debt payments (USD, monthly)" value={monthlyDebts} setValue={setMonthlyDebts} /><Field label="Down payment amount (USD)" value={downPayment} setValue={setDownPayment} /><Field label="Interest rate %" value={interestRate} setValue={setInterestRate} /><Field label="Loan term years" value={loanTermYears} setValue={setLoanTermYears} /><Field label="Monthly taxes + insurance (USD, monthly)" value={taxInsMonthly} setValue={setTaxInsMonthly} /></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="text-sm text-gray-300">Estimated debt-to-income ratio: {pct(affordability.dti)}</div></div>
        <div><h3 className="font-semibold text-yellow-100">Preview calculator: Down Payment Planner</h3><div className="grid grid-cols-2 gap-2 mt-2"><Field label="Target home price (USD)" value={targetHomePrice} setValue={setTargetHomePrice} /><Field label="Down payment %" value={downPct} setValue={setDownPct} /><Field label="Current savings (USD)" value={currentSavings} setValue={setCurrentSavings} /><Field label="Monthly savings amount (USD)" value={monthlySavings} setValue={setMonthlySavings} /></div><p className="mt-2 text-xs text-gray-400">{helper}</p><div className="text-sm text-gray-300">Remaining savings needed: {money(downPlan.gap)} | Estimated months to goal: {Number.isFinite(downPlan.months)?downPlan.months.toFixed(1):"∞"}</div></div>
      </div>
      {isPreview && <div className="grid md:grid-cols-2 gap-3 mt-4"><Locked title="Deal Analyzer" text="Premium required" /><Locked title="Founding Advanced Tools" text="Founding required" /></div>}
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold text-yellow-200">Premium Toolkit Tools</h2>
      {!isPremium ? <div className="grid md:grid-cols-2 gap-3 mt-2"><Locked title="Deal Analyzer" text="Unlock with Premium or Founding membership" /><Locked title="Full Document Pack + Checklists" text="Premium required" /></div> : <div className="space-y-4 mt-2">
        <div className="text-green-200 text-sm">Unlocked</div>
        <div><h3 className="font-semibold">Open Rent-to-Own Tool</h3><div className="grid grid-cols-2 gap-2 mt-2"><Field label="Monthly rent (USD)" value={rtoRent} setValue={setRtoRent} /><Field label="Rent credit amount (USD or monthly credit)" value={rtoCredit} setValue={setRtoCredit} /><Field label="Option fee (USD)" value={rtoOptionFee} setValue={setRtoOptionFee} /><Field label="Target purchase price (USD)" value={rtoTargetPrice} setValue={setRtoTargetPrice} /><div className="col-span-2"><Field label="Term in years" value={rtoYears} setValue={setRtoYears} /></div></div><p className="mt-2 text-xs text-gray-400">{helper}</p></div>
        <div><h3 className="font-semibold">Open Rental Cashflow Calculator</h3><div className="grid grid-cols-2 gap-2 mt-2"><Field label="Purchase price (USD)" value={targetHomePrice} setValue={setTargetHomePrice} /><Field label="Down payment (USD)" value={rcDown} setValue={setRcDown} /><Field label="Monthly mortgage payment (USD)" value={rcMortgage} setValue={setRcMortgage} /><Field label="Monthly rent (USD)" value={rcRent} setValue={setRcRent} /><Field label="Monthly taxes (USD)" value={rcTaxes} setValue={setRcTaxes} /><Field label="Monthly insurance (USD)" value={rcIns} setValue={setRcIns} /><Field label="Monthly repairs / maintenance (USD)" value={rcRepairs} setValue={setRcRepairs} /><Field label="Vacancy reserve (USD)" value={rcVacancy} setValue={setRcVacancy} /><Field label="Property management (USD)" value={rcMgmt} setValue={setRcMgmt} /><Field label="Other monthly costs (USD)" value={rcOther} setValue={setRcOther} /></div><div className="text-sm text-gray-300 mt-2">Estimated monthly cashflow: {money(rc.monthly)} | Estimated annual cashflow: {money(rc.annual)} | Estimated cash-on-cash return: {pct(rc.coc)}</div></div>
        <div><h3 className="font-semibold">Open Deal Analyzer</h3><div className="grid md:grid-cols-3 gap-2 mt-2"><Field label="Purchase price (USD)" value={daPrice} setValue={setDaPrice} /><Field label="Repair / rehab estimate (USD)" value={daRepairs} setValue={setDaRepairs} /><Field label="After repair value / ARV (USD)" value={daArv} setValue={setDaArv} /><Field label="Expected monthly rent (USD)" value={daRent} setValue={setDaRent} /><Field label="Closing / holding costs (USD)" value={daHolding} setValue={setDaHolding} /><Field label="Financing cost estimate (USD)" value={daFinancing} setValue={setDaFinancing} /></div><div className="text-sm text-gray-300 mt-2">Estimated deal rating: {deal.rating}</div></div>
        <button onClick={() => window.print()} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Open Checklists (print enabled)</button>
      </div>}
    </section>

    <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold text-yellow-200">Founding Advanced Tools</h2>
      {!isFounding ? <div className="grid md:grid-cols-2 gap-3 mt-2"><Locked title="Advanced Underwriting Worksheet" text="Founding required" /><Locked title="Property Comparison Worksheet" text="Founding required" /></div> : <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm text-gray-300"><div className="rounded-xl border border-white/10 p-3"><div className="font-semibold text-yellow-200">Open Founding Advanced Worksheet</div><div>Advanced underwriting worksheet (usable)</div></div><div className="rounded-xl border border-white/10 p-3"><div className="font-semibold text-yellow-200">Property comparison worksheet</div><div>Compare cashflow and return profiles side-by-side</div></div><div className="rounded-xl border border-white/10 p-3 md:col-span-2"><div className="font-semibold text-yellow-200">Priority resource checklist</div><ul className="list-disc pl-5 mt-1"><li>Priority lender Q&A prep</li><li>Priority inspection escalation flow</li><li>Early-access tools note: Coming soon</li></ul></div></div>}
    </section>

    {isPreview && <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5"><h3 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Unlock Real Estate Toolkit</h3><p className="text-sm text-gray-300 mt-1">Unlock with Premium or Founding membership.</p><Link href="/pricing?feature=real-estate-toolkit&returnTo=%2Freal-estate-toolkit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-black font-semibold">Unlock with Premium Membership <ArrowRight className="h-4 w-4" /></Link></section>}
  </main></div>;
}
