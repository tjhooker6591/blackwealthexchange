import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Calculator,
  CheckSquare,
  Users,
  BadgeCheck,
  Star,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const RealEstateToolkit = () => {
  const { user } = useAuth();
  const plan = String((user as any)?.currentPlan || "free").toLowerCase();
  const isPremium = plan === "premium" || plan === "founding";
  const isFounding = plan === "founding";
  const isPreview = !isPremium;

  const [income, setIncome] = useState(8500);
  const [debt, setDebt] = useState(900);
  const [down, setDown] = useState(35000);
  const [rent, setRent] = useState(2200);
  const [mortgage, setMortgage] = useState(1400);
  const [ops, setOps] = useState(500);

  const affordability = useMemo(() => {
    const maxPiti = income * 0.31 - debt;
    return Math.max(maxPiti, 0);
  }, [income, debt]);

  const cashflow = useMemo(() => rent - mortgage - ops, [rent, mortgage, ops]);
  const monthlyTarget = useMemo(() => down / 18, [down]);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-yellow-200">Real Estate Toolkit</h1>
            <p className="mt-2 text-gray-300">
              Plan, calculate, and compare real estate decisions with practical calculators, checklists, worksheets, and deal-planning tools.
            </p>
          </div>
          <Link href="/real-estate" className="text-yellow-200 inline-flex items-center gap-2">
            Back <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {isFounding ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-200">
                <Star className="h-4 w-4" /> Founding Toolkit Access
              </span>
            ) : isPremium ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-200">
                <BadgeCheck className="h-4 w-4" /> Premium Toolkit Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-200">
                <Lock className="h-4 w-4" /> Preview Mode
              </span>
            )}
          </div>

          <div className="mt-4">
            <h2 className="font-bold text-yellow-200">What this toolkit includes</h2>
            <ul className="mt-2 grid md:grid-cols-2 gap-1 text-sm text-gray-300">
              <li>• Affordability planning</li>
              <li>• Down payment planning</li>
              <li>• Rent-to-own comparison</li>
              <li>• Rental cashflow calculator</li>
              <li>• Deal analyzer</li>
              <li>• Property visit checklist</li>
              <li>• Repair/inspection checklist</li>
              <li>• First-time homebuyer document pack</li>
              <li>• Black-owned real estate professional directory links</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-x-auto">
          <h2 className="font-bold text-yellow-200">Access levels</h2>
          <table className="mt-3 min-w-full text-left text-sm">
            <thead className="text-yellow-100">
              <tr>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Includes</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-t border-white/10"><td className="py-2 pr-4 font-semibold">Free Preview</td><td className="py-2 pr-4">Basic calculators, basic checklist, directory links</td></tr>
              <tr className="border-t border-white/10"><td className="py-2 pr-4 font-semibold">Premium</td><td className="py-2 pr-4">Full toolkit, deal analyzer, worksheets, document packs</td></tr>
              <tr className="border-t border-white/10"><td className="py-2 pr-4 font-semibold">Founding</td><td className="py-2 pr-4">Everything in Premium, advanced worksheet pack, early access tools, priority resources</td></tr>
            </tbody>
          </table>
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
            <p className="mt-2 text-sm text-gray-300">Target monthly save (18 months): ${monthlyTarget.toFixed(0)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200">Rent-to-own comparison guide/tool</h2>
          <p className="text-sm text-gray-300 mt-2">Compare payment, option fee, responsibilities, and buyout timeline before committing.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Rental cashflow calculator {isPreview ? "(Preview)" : ""}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={rent} onChange={(e)=>setRent(Number(e.target.value))} />
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={mortgage} onChange={(e)=>setMortgage(Number(e.target.value))} />
              <input className="bg-black/50 border border-white/10 rounded p-2" type="number" value={ops} onChange={(e)=>setOps(Number(e.target.value))} />
            </div>
            <p className="mt-2 text-sm text-gray-300">Net monthly cashflow: ${cashflow.toFixed(0)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Deal Analyzer</h2>
            {isPremium ? (
              <p className="text-sm text-gray-300 mt-2">Unlocked: full underwriting worksheet, scenario ranges, and deal comparison.</p>
            ) : (
              <div className="mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                <p className="text-sm text-yellow-100 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Premium required</p>
                <p className="text-sm text-gray-300 mt-1">Preview available. Premium unlocks full underwriting worksheet, scenario ranges, and deal comparison.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200 inline-flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Checklists & document packs</h2>
            <ul className="mt-2 text-sm text-gray-300 space-y-1">
              <li>• Property visit checklist</li>
              <li>• Repair/inspection checklist</li>
              <li>• First-time homebuyer document pack</li>
            </ul>
            {!isPremium && <p className="mt-2 text-xs text-yellow-100 inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Premium required for downloadable worksheets.</p>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold text-yellow-200">Advanced tools</h2>
            {isPremium ? (
              <ul className="mt-2 text-sm text-gray-300 space-y-1">
                <li>• Advanced underwriting worksheet</li>
                <li>• Property comparison worksheet</li>
                {isFounding && <li className="text-yellow-200">• Founding bonus: advanced worksheet pack + early-access tools + priority resources</li>}
              </ul>
            ) : (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 mt-2">
                <p className="text-sm text-yellow-100 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Premium required</p>
                <p className="text-sm text-gray-300 mt-1">Unlock downloadable worksheets, advanced underwriting, property comparison, and founding bonus tools.</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-yellow-200 inline-flex items-center gap-2"><Users className="h-4 w-4" /> Black-owned real estate professional directory links</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <Link href="/business-directory?category=Real%20Estate" className="text-yellow-200">BWE Real Estate Directory</Link>
            <a className="text-yellow-200" href="https://www.nareb.com/find-a-realtist" target="_blank" rel="noreferrer">NAREB</a>
          </div>
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
