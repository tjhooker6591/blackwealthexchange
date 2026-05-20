import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Calculator, CheckSquare, Users } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const RealEstateToolkit = () => {
  const { user } = useAuth();
  const plan = String((user as any)?.currentPlan || "free").toLowerCase();
  const isPremium = plan === "premium" || plan === "founding";
  const isFounding = plan === "founding";

  const [income, setIncome] = useState(8500);
  const [debt, setDebt] = useState(900);
  const [_rate] = useState(6.5);
  const [years] = useState(30);
  const [down, setDown] = useState(35000);

  const [rent, setRent] = useState(2200);
  const [mortgage, setMortgage] = useState(1400);
  const [ops, setOps] = useState(500);

  const affordability = useMemo(() => {
    const maxPiti = income * 0.31 - debt;
    return Math.max(maxPiti, 0);
  }, [income, debt]);

  const cashflow = useMemo(() => rent - mortgage - ops, [rent, mortgage, ops]);
  const months = years * 12;
  const downPlan = useMemo(() => {
    const monthlyTarget = down / 18;
    return { monthlyTarget, months };
  }, [down, months]);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-yellow-200">Real Estate Toolkit</h1>
          <Link href="/real-estate" className="text-yellow-200 inline-flex items-center gap-2">Back <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <p className="text-gray-300">Use calculators, checklists, and worksheets to plan homebuying, rent-to-own, rental cashflow, and investment decisions.</p>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200">Homebuying readiness checklist</h2>
          <ul className="mt-2 text-sm text-gray-300 space-y-1"><li>• Credit reviewed</li><li>• Debt plan defined</li><li>• Emergency reserves set</li><li>• Pre-approval prep ready</li></ul>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Calculator className="h-4 w-4" /> Mortgage affordability calculator</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={income} onChange={(e)=>setIncome(Number(e.target.value))} />
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={debt} onChange={(e)=>setDebt(Number(e.target.value))} />
            </div>
            <p className="mt-2 text-sm text-gray-300">Estimated max monthly housing budget: ${affordability.toFixed(0)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Down payment planner</h2>
            <input className="mt-2 bg-black/50 border border-white/10 rounded p-2 w-full" type="number" value={down} onChange={(e)=>setDown(Number(e.target.value))} />
            <p className="mt-2 text-sm text-gray-300">Target monthly save (18 months): ${downPlan.monthlyTarget.toFixed(0)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200">Rent-to-own comparison guide/tool</h2>
          <p className="text-sm text-gray-300 mt-2">Compare monthly payment, option fee, repair responsibility, and buyout timeline before committing.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Rental cashflow calculator</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={rent} onChange={(e)=>setRent(Number(e.target.value))} />
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={mortgage} onChange={(e)=>setMortgage(Number(e.target.value))} />
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={ops} onChange={(e)=>setOps(Number(e.target.value))} />
            </div>
            <p className="mt-2 text-sm text-gray-300">Net monthly cashflow: ${cashflow.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Deal analyzer</h2>
            {isPremium ? <p className="text-sm text-gray-300 mt-2">Unlocked: use full underwriting worksheet and scenario ranges.</p> : <p className="text-sm text-gray-300 mt-2">Preview available. Full analyzer unlocks with Premium.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200 inline-flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Checklists & document packs</h2>
          <ul className="mt-2 text-sm text-gray-300 space-y-1"><li>• Property visit checklist</li><li>• Repair/inspection checklist</li><li>• First-time homebuyer document pack</li></ul>
          {isFounding && <p className="mt-2 text-sm text-yellow-200">Founding bonus: advanced worksheet pack and early-access tools unlocked.</p>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Users className="h-4 w-4" /> Black-owned professionals/directories</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link href="/business-directory?category=Real%20Estate" className="text-yellow-200">BWE Real Estate Directory</Link>
            <a className="text-yellow-200" href="https://www.nareb.com/find-a-realtist" target="_blank" rel="noreferrer">NAREB</a>
          </div>
        </section>

        {!isPremium && (
          <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <h3 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Unlock with Premium Membership</h3>
            <p className="text-sm text-gray-300 mt-1">The full Real Estate Toolkit is included with Premium and Founding membership. Premium unlocks core tools. Founding includes advanced worksheets and priority resources.</p>
            <Link href="/pricing?feature=real-estate-toolkit&returnTo=%2Freal-estate-toolkit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-black font-semibold">Unlock Real Estate Toolkit <ArrowRight className="h-4 w-4" /></Link>
          </section>
        )}
      </main>
    </div>
  );
};

export default RealEstateToolkit;
