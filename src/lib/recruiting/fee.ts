// src/lib/recruiting/fee.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Single canonical
// source for the standard recruiting placement fee -- nothing else in
// the codebase should hardcode 15%/0.15 independently.
//
// Approved model: BWE's standard successful-placement fee is 15% of the
// candidate's agreed first-year compensation. This is NOT a Stripe
// marketplace/Connect application-fee split (there is no seller payout
// for recruiting) -- it is the commercial PRICE of the recruiting
// service itself. Once BWE invoices/collects that amount, 100% of it is
// BWE revenue (see recruiting's entry in src/lib/payments/revenue.ts).
//
// A specific engagement may still have a negotiated percentage or a
// negotiated fixed fee instead of the standard rate -- that override is
// recorded per-engagement (see recruiting_engagements' agreedFeeCents),
// not by changing this constant.

export const RECRUITING_STANDARD_FEE_PERCENT = 15;

/**
 * Standard recruiting placement fee: 15% of compensationCents, in
 * integer cents. Rounds to the nearest cent.
 */
export function calculateRecruitingFee(compensationCents: number): number {
  const comp = Math.max(0, Math.round(Number(compensationCents) || 0));
  return Math.round((comp * RECRUITING_STANDARD_FEE_PERCENT) / 100);
}
