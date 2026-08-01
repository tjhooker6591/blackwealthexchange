import assert from "node:assert/strict";
import {
  buildDirectoryProfileUpdate,
  mapDirectoryProfileFromDoc,
  normalizeDirectoryProfileInput,
} from "../../directoryProfileContract.ts";

const partialInput = normalizeDirectoryProfileInput({
  displayName: "Renamed Business",
});
assert.equal(partialInput.displayName, "Renamed Business");
assert.equal(partialInput.website, undefined);
assert.equal(partialInput.facebook, undefined);
assert.equal(partialInput.secondaryCategories, undefined);
assert.equal(partialInput.galleryImages, undefined);
assert.equal(partialInput.tags, undefined);
assert.equal(partialInput.additionalCtas, undefined);

const partialUpdate = buildDirectoryProfileUpdate(partialInput);
assert.equal(partialUpdate.$set.businessName, "Renamed Business");
assert.equal(partialUpdate.$unset?.website, undefined);
assert.equal(partialUpdate.$unset?.["social.facebook"], undefined);
assert.equal(partialUpdate.$set.updatedAt instanceof Date, true);

const clearingInput = normalizeDirectoryProfileInput({
  website: "",
  facebook: "",
  logo: "",
  coverImage: "",
  secondaryCategories: [],
  galleryImages: [],
  tags: [],
  additionalCtas: [],
  addressLine2: "",
});
const clearingUpdate = buildDirectoryProfileUpdate(clearingInput);
assert.equal(clearingUpdate.$unset.website, "");
assert.equal(clearingUpdate.$unset["social.facebook"], "");
assert.equal(clearingUpdate.$unset.logo, "");
assert.equal(clearingUpdate.$unset.image, "");
assert.equal(clearingUpdate.$unset.coverImage, "");
assert.equal(clearingUpdate.$unset.categories, "");
assert.equal(clearingUpdate.$unset.secondaryCategories, "");
assert.equal(clearingUpdate.$unset.images, "");
assert.equal(clearingUpdate.$unset.galleryImages, "");
assert.equal(clearingUpdate.$unset.tags, "");
assert.equal(clearingUpdate.$unset.additionalCtas, "");
assert.equal(clearingUpdate.$unset.addressLine2, "");
assert.equal(clearingUpdate.$unset.suite, "");
assert.equal(clearingUpdate.$unset.unit, "");

const explicitMediaInput = normalizeDirectoryProfileInput({
  logo: null,
  coverImage: null,
});
const explicitMediaUpdate = buildDirectoryProfileUpdate(explicitMediaInput);
assert.equal(explicitMediaUpdate.$unset.logo, "");
assert.equal(explicitMediaUpdate.$unset.image, "");
assert.equal(explicitMediaUpdate.$unset.coverImage, "");

const protectedFieldUpdate = buildDirectoryProfileUpdate(
  normalizeDirectoryProfileInput({
    displayName: "Protected Check",
    _id: "hijack",
    claimedByUserId: "other-user",
    ownershipReviewStatus: "ownership_verified",
    claimStage: "ownership_verified",
    status: "verified",
    amountPaid: 9999,
  }),
);
assert.equal(protectedFieldUpdate.$set.businessName, "Protected Check");
assert.equal("_id" in (protectedFieldUpdate.$set || {}), false);
assert.equal("claimedByUserId" in (protectedFieldUpdate.$set || {}), false);
assert.equal(
  "ownershipReviewStatus" in (protectedFieldUpdate.$set || {}),
  false,
);
assert.equal("claimStage" in (protectedFieldUpdate.$set || {}), false);
assert.equal("status" in (protectedFieldUpdate.$set || {}), false);
assert.equal("amountPaid" in (protectedFieldUpdate.$set || {}), false);

const mapped = mapDirectoryProfileFromDoc({
  _id: "biz-123",
  business_name: "Mapped Business",
  address: "123 Main St",
  addressLine2: "Suite 200",
  city: "Atlanta",
  state: "GA",
  zip: "30303",
  social: {
    facebook: "facebook.com/mapped",
    instagram: "instagram.com/mapped",
  },
  image: "/cover.png",
  logo: "/logo.png",
});
assert.equal(mapped.id, "biz-123");
assert.equal(mapped.displayName, "Mapped Business");
assert.equal(mapped.addressLine2, "Suite 200");
assert.equal(mapped.city, "Atlanta");
assert.equal(mapped.state, "GA");
assert.equal(mapped.postalCode, "30303");
assert.equal(mapped.facebook, "https://facebook.com/mapped");
assert.equal(mapped.instagram, "https://instagram.com/mapped");
assert.equal(mapped.coverImage, "/cover.png");
assert.equal(mapped.logo, "/logo.png");

console.log("directory-profile-contract-tests: ok");
