import assert from "node:assert/strict";
import { buildFoundingTransitionState } from "../../founding-membership.ts";

const pending = buildFoundingTransitionState({ action: "reopen_verification" });
assert.equal(pending.resultingStatus, "ownership_verification_pending");
assert.equal(pending.fulfillmentStatus, "pending_verification_queue");
assert.equal(pending.evidencePortalStatus, "open");

const verified = buildFoundingTransitionState({ action: "verify" });
assert.equal(verified.resultingStatus, "ownership_verified");
assert.equal(verified.claimStatus, "ownership_verified");
assert.equal(verified.claimStage, "ownership_verified");
assert.equal(verified.managementAccessStatus, "approved");
assert.equal(verified.ownershipAccessStatus, "approved");
assert.equal(verified.fulfillmentStatus, "active");
assert.equal(verified.evidencePortalStatus, "complete");
assert.equal(verified.paymentStatus, "paid");
assert.equal(verified.paymentAmountCents, 4900);
assert.equal(verified.paymentDisplayAmount, "$49.00 USD");

const evidence = buildFoundingTransitionState({
  action: "request_more_evidence",
});
assert.equal(evidence.resultingStatus, "additional_evidence_required");
assert.equal(evidence.claimStage, "ownership_verification_pending");
assert.equal(evidence.evidencePortalStatus, "open");

const failed = buildFoundingTransitionState({ action: "verification_failed" });
assert.equal(failed.resultingStatus, "ownership_verification_failed");
assert.equal(failed.claimLocked, false);
assert.equal(failed.fulfillmentStatus, "closed");

const disputed = buildFoundingTransitionState({ action: "mark_disputed" });
assert.equal(disputed.resultingStatus, "disputed");
assert.equal(disputed.publicListingStatus, "verification_pending");

console.log("transition-helper-tests: ok");
