import assert from "node:assert/strict";
import {
  buildDirectoryUrlQuery,
  buildHomepageDirectoryQuery,
  normalizeScope,
  normalizeSort,
} from "../src/lib/directory/queryState.js";

assert.equal(normalizeScope("org"), "organizations");
assert.equal(normalizeScope("biz"), "businesses");
assert.equal(normalizeSort("recent"), "newest");
assert.equal(normalizeSort("complete"), "completeness");

const homeQuery = buildHomepageDirectoryQuery({
  q: "coffee",
  scope: "org",
  sort: "recent",
  ai: true,
  verifiedOnly: true,
  sponsoredFirst: true,
  state: "ca",
  category: "Food",
});

assert.deepEqual(homeQuery, {
  q: "coffee",
  search: "coffee",
  type: "organizations",
  scope: "organizations",
  tab: "organizations",
  limit: 20,
  sort: "newest",
  ai: "1",
  verifiedOnly: "1",
  sponsoredFirst: "1",
  state: "CA",
  category: "Food",
});

const synced = buildDirectoryUrlQuery({
  routerQuery: { foo: "bar" },
  scope: "businesses",
  input: "",
  page: 1,
  category: "All",
  sort: "relevance",
  stateFilter: "",
  verifiedOnly: false,
  sponsoredFirst: false,
});

assert.equal(synced.type, "businesses");
assert.equal(synced.scope, "businesses");
assert.equal(synced.tab, "businesses");
assert.equal(synced.foo, "bar");
assert.ok(!("q" in synced));
assert.ok(!("search" in synced));
assert.ok(!("sort" in synced));
assert.ok(!("page" in synced));
assert.ok(!("category" in synced));

const filterOnly = buildDirectoryUrlQuery({
  routerQuery: {},
  scope: "businesses",
  input: "",
  page: 2,
  category: "All",
  sort: "newest",
  stateFilter: "ny",
  verifiedOnly: true,
  sponsoredFirst: true,
});

assert.equal(filterOnly.page, "2");
assert.equal(filterOnly.sort, "newest");
assert.equal(filterOnly.state, "NY");
assert.equal(filterOnly.verifiedOnly, "1");
assert.equal(filterOnly.sponsoredFirst, "1");

console.log("directory query-state checks passed");
