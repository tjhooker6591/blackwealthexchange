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

const RealEstateToolkit = () => {
  const { user } = useAuth();
  const plan = String((user as any)?.currentPlan || "free").toLowerCase();
  const isPremium = plan === "premium" || plan === "founding";
  const isFounding = plan === "founding";

  // 1) Mortgage affordability
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
    const dti = grossMonthly > 0 ? ((monthlyDebts + estPayment) / grossMonthly) * 100 : 0;
    return { maxHousingBudget, estPayment, homePrice, dti };
  }, [annualIncome, monthlyDebts, downPayment, interestRate, loanTermYears, taxInsMonthly]);

  // 2) Down payment planner
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

  // 3) Rent-to-own
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

  // 4) Rental cashflow
  const [rcPurchase, setRcPurchase] = useState("300000");
  const [rcDown, setRcDown] = useState("60000");
  const [rcMortgage, setRcMortgage] = useState("1600");
  const [rcRent, setRcRent] = useState("2600");
  const [rcTaxes, setRcTaxes] = useState("280");
  const [rcIns, setRcIns] = useState("120");
  const [rcRepairs, setRcRepairs] = useState("180");
  const [rcVacancy, setRcVacancy] = useState("130");
  const [rcMgmt, setRcMgmt] = useState("200");

  const rc = useMemo(() => {
    const monthly = num(rcRent) - (num(rcMortgage) + num(rcTaxes) + num(rcIns) + num(rcRepairs) + num(rcVacancy) + num(rcMgmt));
    const annual = monthly * 12;
    const invested = Math.max(num(rcDown), 1);
    const coc = (annual / invested) * 100;
    return { monthly, annual, coc };
  }, [rcRent, rcMortgage, rcTaxes, rcIns, rcRepairs, rcVacancy, rcMgmt, rcDown]);

  // 5) Deal analyzer (premium)
  const [daPrice, setDaPrice] = useState("250000");
  const [daRepairs, setDaRepairs] = useState("40000");
  const [daArv, setDaArv] = useState("360000");
  const [daRent, setDaRent] = useState("2500");
  const [daHolding, setDaHolding] = useState(12000);
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

  // 6) checklists
  const homeItems = ["Credit reviewed", "Debt plan set", "Emergency fund ready", "Pre-approval prep complete"];
  const visitItems = ["Neighborhood check", "Roof/HVAC check", "Water damage signs", "Comps reviewed"];
  const repairItems = ["Foundation notes", "Electrical", "Plumbing", "Pest/moisture"];
  const docItems = ["ID + income docs", "Bank statements", "Tax returns", "Pre-approval letter"];

  const [homeCheck, setHomeCheck] = useState<boolean[]>(homeItems.map(() => false));
  const [visitCheck, setVisitCheck] = useState<boolean[]>(visitItems.map(() => false));
  const [repairCheck, setRepairCheck] = useState<boolean[]>(repairItems.map(() => false));
  const [docCheck, setDocCheck] = useState<boolean[]>(docItems.map(() => false));

  const progress = (arr: boolean[]) => `${arr.filter(Boolean).length}/${arr.length}`;
  const toggle = (arr: boolean[], i: number, set: (v: boolean[]) => void) => set(arr.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-3xl font-extrabold text-yellow-200">Real Estate Toolkit</h1>

        <div className="flex gap-2">
          {isFounding ? <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Star className="h-4 w-4"/>Founding Toolkit Access</span> : isPremium ? <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-200 inline-flex items-center gap-1"><BadgeCheck className="h-4 w-4"/>Premium Toolkit Unlocked</span> : <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Preview Mode</span>}
        </div>

        <section className="grid md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <h2 className="font-bold text-yellow-200">Mortgage Affordability Calculator</h2>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={annualIncome} onChange={(e)=>setAnnualIncome(e.target.value)} placeholder="Annual income"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={monthlyDebts} onChange={(e)=>setMonthlyDebts(e.target.value)} placeholder="Monthly debts"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={downPayment} onChange={(e)=>setDownPayment(e.target.value)} placeholder="Down payment"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" step="0.01" value={interestRate} onChange={(e)=>setInterestRate(e.target.value)} placeholder="Rate"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={loanTermYears} onChange={(e)=>setLoanTermYears(e.target.value)} placeholder="Term"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={taxInsMonthly} onChange={(e)=>setTaxInsMonthly(e.target.value)} placeholder="Taxes/insurance"/>
            </div>
            <div className="mt-2 text-sm text-gray-300">Max housing budget: {money(affordability.maxHousingBudget)} | Est monthly payment: {money(affordability.estPayment)} | Affordable price: {money(affordability.homePrice)} | DTI: {pct(affordability.dti)} {affordability.dti > 43 ? "(Warning: high DTI)" : ""}</div>
          </div>
          <div>
            <h2 className="font-bold text-yellow-200">Down Payment Planner</h2>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={targetHomePrice} onChange={(e)=>setTargetHomePrice(e.target.value)} placeholder="Target price"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={downPct} onChange={(e)=>setDownPct(e.target.value)} placeholder="Down %"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={currentSavings} onChange={(e)=>setCurrentSavings(e.target.value)} placeholder="Current savings"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={monthlySavings} onChange={(e)=>setMonthlySavings(e.target.value)} placeholder="Monthly savings"/>
            </div>
            <div className="mt-2 text-sm text-gray-300">Needed: {money(downPlan.needed)} | Gap: {money(downPlan.gap)} | Months to goal: {Number.isFinite(downPlan.months) ? downPlan.months.toFixed(1) : "∞"}</div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <h2 className="font-bold text-yellow-200">Rent-to-Own Comparison Tool</h2>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rtoRent} onChange={(e)=>setRtoRent(e.target.value)} placeholder="Monthly rent"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rtoCredit} onChange={(e)=>setRtoCredit(e.target.value)} placeholder="Rent credit"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rtoOptionFee} onChange={(e)=>setRtoOptionFee(e.target.value)} placeholder="Option fee"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rtoTargetPrice} onChange={(e)=>setRtoTargetPrice(e.target.value)} placeholder="Target price"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded col-span-2" type="text" inputMode="decimal" value={rtoYears} onChange={(e)=>setRtoYears(e.target.value)} placeholder="Years"/>
            </div>
            <div className="mt-2 text-sm text-gray-300">Total rent paid: {money(rto.totalRent)} | Total credits: {money(rto.totalCredits)} | Remaining purchase gap: {money(rto.remainingGap)} {rto.remainingGap > rtoTargetPrice * 0.7 ? "(Warning: large remaining gap)" : ""}</div>
          </div>
          <div>
            <h2 className="font-bold text-yellow-200">Rental Cashflow Calculator</h2>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcPurchase} onChange={(e)=>setRcPurchase(e.target.value)} placeholder="Purchase"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcDown} onChange={(e)=>setRcDown(e.target.value)} placeholder="Down"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcMortgage} onChange={(e)=>setRcMortgage(e.target.value)} placeholder="Mortgage"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcRent} onChange={(e)=>setRcRent(e.target.value)} placeholder="Rent"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcTaxes} onChange={(e)=>setRcTaxes(e.target.value)} placeholder="Taxes"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcIns} onChange={(e)=>setRcIns(e.target.value)} placeholder="Insurance"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcRepairs} onChange={(e)=>setRcRepairs(e.target.value)} placeholder="Repairs"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={rcVacancy} onChange={(e)=>setRcVacancy(e.target.value)} placeholder="Vacancy"/>
              <input className="p-2 bg-black/50 border border-white/10 rounded col-span-2" type="text" inputMode="decimal" value={rcMgmt} onChange={(e)=>setRcMgmt(e.target.value)} placeholder="Mgmt"/>
            </div>
            <div className="mt-2 text-sm text-gray-300">Monthly cashflow: {money(rc.monthly)} | Annual cashflow: {money(rc.annual)} | Cash-on-cash: {pct(rc.coc)} {rc.monthly < 0 ? "(Warning: negative cashflow)" : ""}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-bold text-yellow-200">Deal Analyzer {isPremium ? "" : "(Locked Preview)"}</h2>
          {!isPremium ? <div className="mt-2 text-sm text-yellow-100 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Premium required. Preview only.</div> : null}
          <div className="grid md:grid-cols-3 gap-2 mt-2 text-sm opacity-100">
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daPrice} onChange={(e)=>setDaPrice(e.target.value)} placeholder="Purchase" disabled={!isPremium}/>
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daRepairs} onChange={(e)=>setDaRepairs(e.target.value)} placeholder="Repairs" disabled={!isPremium}/>
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daArv} onChange={(e)=>setDaArv(e.target.value)} placeholder="ARV" disabled={!isPremium}/>
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daRent} onChange={(e)=>setDaRent(e.target.value)} placeholder="Rent" disabled={!isPremium}/>
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daHolding} onChange={(e)=>setDaHolding(e.target.value)} placeholder="Holding/closing" disabled={!isPremium}/>
            <input className="p-2 bg-black/50 border border-white/10 rounded" type="text" inputMode="decimal" value={daFinancing} onChange={(e)=>setDaFinancing(e.target.value)} placeholder="Financing" disabled={!isPremium}/>
          </div>
          <div className="mt-2 text-sm text-gray-300">Total project cost: {money(deal.totalCost)} | Equity spread: {money(deal.equitySpread)} | ARV margin: {pct(deal.arvMargin)} | Rent-to-cost: {pct(deal.rentToCost)} | Rating: {deal.rating}</div>
        </section>

        <section className="grid md:grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          {[
            ["Homebuying Readiness Checklist", homeItems, homeCheck, setHomeCheck],
            ["Property Visit Checklist", visitItems, visitCheck, setVisitCheck],
            ["Repair/Inspection Checklist", repairItems, repairCheck, setRepairCheck],
            ["First-Time Homebuyer Document Checklist", docItems, docCheck, setDocCheck],
          ].map(([title, items, checks, setter], idx) => (
            <div key={idx} className="rounded-xl border border-white/10 p-3">
              <div className="font-bold text-yellow-200">{String(title)}</div>
              <div className="text-xs text-gray-400">Progress: {progress(checks as boolean[])}</div>
              <ul className="mt-2 space-y-1 text-sm">
                {(items as string[]).map((it, i) => (
                  <li key={i}>
                    <label className="inline-flex gap-2 items-center"><input type="checkbox" checked={(checks as boolean[])[i]} onChange={() => toggle(checks as boolean[], i, setter as any)} /> {it}</label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button onClick={() => window.print()} className="md:col-span-2 mt-2 rounded-lg border border-white/20 px-3 py-2 text-sm">Print Checklists</button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-bold text-yellow-200">Founding Extras</h2>
          {!isFounding ? <div className="mt-2 text-sm text-yellow-100 inline-flex items-center gap-1"><Lock className="h-4 w-4"/>Founding required</div> : null}
          {isFounding ? (
            <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm text-gray-300">
              <div className="rounded-xl border border-white/10 p-3">
                <div className="font-semibold text-yellow-200">Advanced Underwriting Worksheet</div>
                <table className="w-full mt-2 text-xs"><tbody><tr><td>NOI</td><td>{money(rc.annual + (rcMortgage * 12))}</td></tr><tr><td>Cap Rate</td><td>{pct(((rc.annual + rcMortgage * 12) / Math.max(rcPurchase,1))*100)}</td></tr></tbody></table>
              </div>
              <div className="rounded-xl border border-white/10 p-3">
                <div className="font-semibold text-yellow-200">Property Comparison Worksheet</div>
                <table className="w-full mt-2 text-xs"><tbody><tr><td>Property A cashflow</td><td>{money(rc.monthly)}</td></tr><tr><td>Deal Analyzer rating</td><td>{deal.rating}</td></tr></tbody></table>
              </div>
              <div className="rounded-xl border border-white/10 p-3 md:col-span-2">
                <div className="font-semibold text-yellow-200">Priority Resource Checklist</div>
                <ul className="list-disc pl-5 mt-1"><li>Priority lender Q&A prep</li><li>Priority inspection escalation flow</li><li>Early-access tools queue</li></ul>
              </div>
            </div>
          ) : null}
        </section>

        {!isPremium && (
          <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <h3 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Unlock Real Estate Toolkit</h3>
            <p className="text-sm text-gray-300 mt-1">Premium unlocks the full real estate toolkit. Founding includes advanced worksheets and priority resources.</p>
            <Link href="/pricing?feature=real-estate-toolkit&returnTo=%2Freal-estate-toolkit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-black font-semibold">Unlock with Premium Membership <ArrowRight className="h-4 w-4" /></Link>
          </section>
        )}
      </main>
    </div>
  );
};

export default RealEstateToolkit;
