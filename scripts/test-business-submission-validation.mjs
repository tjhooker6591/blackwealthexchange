import assert from "node:assert/strict";
import {
  buildUniqueSlug,
  getCreateBusinessDuplicateError,
  getCreateBusinessSuccessMessage,
  normalizeLocationParts,
  normalizeOptionalUrl,
  slugifyBusinessName,
  validateBusinessSubmission,
} from "../src/lib/businessSubmission.ts";

function makeValidInput() {
  return {
    businessName: "SweetTe’s bakery",
    category: "Food",
    location: "Allentown pa",
    phone: "9415265647",
    email: "sweettesbakery@gmail.com",
    website: "",
    description: "Fresh baked goods and desserts.",
    facebook: "",
    twitter: "",
  };
}

function expectError(input, message) {
  const result = validateBusinessSubmission(input);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, message);
  }
}

const valid = validateBusinessSubmission(makeValidInput());
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.value.businessName, "SweetTe’s bakery");
  assert.equal(valid.value.email, "sweettesbakery@gmail.com");
  assert.equal(valid.value.category, "food");
  assert.equal(valid.value.phone, "9415265647");
  assert.equal(valid.value.website, "");
  assert.equal(valid.value.facebook, "");
  assert.equal(valid.value.twitter, "");
  assert.equal(valid.value.normalizedLocation.normalized, "Allentown, PA");
  assert.equal(valid.value.normalizedLocation.city, "Allentown");
  assert.equal(valid.value.normalizedLocation.state, "PA");
  assert.equal(valid.value.slugBase, "sweette-s-bakery");
}

const withUrls = validateBusinessSubmission({
  ...makeValidInput(),
  website: "sweetesbakery.com",
  facebook: "facebook.com/sweetesbakery",
});
assert.equal(withUrls.ok, true);
if (withUrls.ok) {
  assert.equal(withUrls.value.website, "https://sweetesbakery.com");
  assert.equal(withUrls.value.facebook, "https://facebook.com/sweetesbakery");
}

expectError(
  { ...makeValidInput(), email: "not-an-email" },
  "Please enter a valid email address.",
);
expectError(
  { ...makeValidInput(), phone: "123" },
  "Please enter a valid phone number with at least 10 digits.",
);
expectError(
  { ...makeValidInput(), description: "   " },
  "Please add a short business description.",
);
expectError(
  { ...makeValidInput(), location: "   " },
  "Please enter a location, for example: Allentown, PA.",
);

assert.deepEqual(normalizeLocationParts("Allentown pa"), {
  normalized: "Allentown, PA",
  city: "Allentown",
  state: "PA",
});
assert.equal(normalizeOptionalUrl("sweetesbakery.com"), "https://sweetesbakery.com");
assert.equal(normalizeOptionalUrl("facebook.com/sweetesbakery"), "https://facebook.com/sweetesbakery");
assert.equal(slugifyBusinessName("SweetTe’s bakery"), "sweette-s-bakery");
assert.equal(buildUniqueSlug("sweette-s-bakery", 0), "sweette-s-bakery");
assert.equal(buildUniqueSlug("sweette-s-bakery", 2), "sweette-s-bakery-3");
assert.equal(
  getCreateBusinessDuplicateError(),
  "A business with this name appears to already exist. Please update the business name slightly or contact support if this is your listing.",
);
assert.equal(getCreateBusinessSuccessMessage(), "Business submitted for review.");

const frontendErrorShape = {
  ok: false,
  error: "Please enter a valid email address.",
};
const frontendMessageShape = {
  ok: true,
  message: "Business submitted for review.",
};
assert.equal(frontendErrorShape.error, "Please enter a valid email address.");
assert.equal(frontendMessageShape.message, "Business submitted for review.");

console.log("business submission validation tests: PASS");
console.log("No DB imports, no MONGODB_URI usage, no production writes.");
