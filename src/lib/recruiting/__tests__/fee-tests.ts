// src/lib/recruiting/__tests__/fee-tests.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Canonical fee
// calculator tests. Run with: npx tsx src/lib/recruiting/__tests__/fee-tests.ts

import * as assert from "node:assert/strict";
import {
  calculateRecruitingFee,
  RECRUITING_STANDARD_FEE_PERCENT,
} from "../fee";

function main() {
  assert.equal(RECRUITING_STANDARD_FEE_PERCENT, 15);

  // Spec example: $100,000 first-year compensation -> $15,000 standard fee.
  assert.equal(calculateRecruitingFee(10_000_000), 1_500_000);

  // $0 compensation -> $0 fee (no negative/NaN behavior).
  assert.equal(calculateRecruitingFee(0), 0);

  // Negative input clamps to 0, never a negative fee.
  assert.equal(calculateRecruitingFee(-5000), 0);

  // Rounds to the nearest cent rather than truncating/floating-point drifting.
  assert.equal(calculateRecruitingFee(999), 150); // 999 * 0.15 = 149.85 -> 150
  assert.equal(calculateRecruitingFee(1001), 150); // 1001 * 0.15 = 150.15 -> 150

  // Non-numeric/garbage input never throws, treated as 0.
  assert.equal(calculateRecruitingFee(NaN), 0);
  assert.equal(calculateRecruitingFee(undefined as unknown as number), 0);

  console.log("recruiting fee-tests: ok");
}

main();
