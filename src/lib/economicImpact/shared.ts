// src/lib/economicImpact/shared.ts
//
// Phase 6 -- Economic Intelligence. Shared types and helpers for every
// economic-impact resolver. The one rule every resolver in this directory
// follows: every number carries an explicit status --
//
//   "measured"           -- read directly from an authoritative collection
//                            (bmev_records, payments, users, jobs,
//                            applicants, referral_events, financial_transactions).
//   "attributed"         -- computed by joining two real records on a real
//                            key (e.g. a referral event's newUserId to that
//                            user's own verified purchases) -- never inferred.
//   "estimated"          -- a documented calculation over measured inputs
//                            (e.g. published tier price x active member
//                            count). The formula is always included.
//   "insufficient_data"  -- BWE does not have the data to support this
//                            metric honestly. `value` is null. This is a
//                            valid, expected outcome, not a bug.
//
// No resolver in this directory ever fabricates a number to fill a gap.

export type MetricStatus =
  | "measured"
  | "attributed"
  | "estimated"
  | "insufficient_data";

export type EconomicMetric = {
  key: string;
  label: string;
  status: MetricStatus;
  value: number | null;
  unit: "usd_cents" | "count" | "ratio";
  sourceCollections: string[];
  formula?: string;
  note?: string;
};

export function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object" && (value as any)?._bsontype === "ObjectId") {
    return String(value);
  }
  return s(value);
}

export function measured(
  key: string,
  label: string,
  value: number,
  unit: EconomicMetric["unit"],
  sourceCollections: string[],
  note?: string,
): EconomicMetric {
  return {
    key,
    label,
    status: "measured",
    value,
    unit,
    sourceCollections,
    note,
  };
}

export function attributed(
  key: string,
  label: string,
  value: number,
  unit: EconomicMetric["unit"],
  sourceCollections: string[],
  note: string,
): EconomicMetric {
  return {
    key,
    label,
    status: "attributed",
    value,
    unit,
    sourceCollections,
    note,
  };
}

export function estimated(
  key: string,
  label: string,
  value: number,
  unit: EconomicMetric["unit"],
  sourceCollections: string[],
  formula: string,
): EconomicMetric {
  return {
    key,
    label,
    status: "estimated",
    value,
    unit,
    sourceCollections,
    formula,
  };
}

export function insufficientData(
  key: string,
  label: string,
  note: string,
): EconomicMetric {
  return {
    key,
    label,
    status: "insufficient_data",
    value: null,
    unit: "count",
    sourceCollections: [],
    note,
  };
}
