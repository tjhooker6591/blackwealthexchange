// Acceptance tests for BWE inquiries (contact form -> reply, team alert,
// Speed-to-Lead hand-off, conversions). Email, network and the database are
// fakes: nothing is sent and no real data is touched.
// Run: npx tsx src/lib/__tests__/inquiries-tests.mts
import assert from "node:assert/strict";
import {
  createInquiry,
  processPendingForwards,
  unsubscribeEmail,
  unsubscribeToken,
  inquirySummary,
  InquiryError,
  ensureInquiryIndexes,
} from "../inquiries/service";

// ---- A small in-memory stand-in for the MongoDB calls the service makes ----
const get = (doc: any, path: string) =>
  path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), doc);
function matches(doc: any, q: any): boolean {
  return Object.entries(q || {}).every(([k, v]: [string, any]) => {
    if (k === "$or") return v.some((x: any) => matches(doc, x));
    const val = get(doc, k);
    if (
      v &&
      typeof v === "object" &&
      !(v instanceof Date) &&
      !Array.isArray(v)
    ) {
      if ("$in" in v) return v.$in.some((x: any) => String(x) === String(val));
      if ("$ne" in v) return val !== v.$ne;
      if ("$lte" in v) return val != null && new Date(val) <= v.$lte;
      if ("$gte" in v) return val != null && new Date(val) >= v.$gte;
    }
    if (v === null) return val == null;
    return String(val) === String(v);
  });
}
class Col {
  docs: any[] = [];
  unique: string[] = [];
  async createIndex(spec: any, opts: any = {}) {
    if (opts.unique) this.unique.push(Object.keys(spec)[0]);
  }
  async insertOne(doc: any) {
    for (const k of this.unique)
      if (this.docs.some((d) => d[k] === doc[k]))
        throw Object.assign(new Error("dup"), { code: 11000 });
    const d = { ...doc, _id: `id${this.docs.length + 1}` };
    this.docs.push(d);
    return { insertedId: d._id };
  }
  async findOne(q: any) {
    return this.docs.find((d) => matches(d, q)) || null;
  }
  async updateOne(q: any, u: any, opts: any = {}) {
    let d = this.docs.find((x) => matches(x, q));
    if (!d && opts.upsert) {
      d = { ...q, ...(u.$setOnInsert || {}) };
      this.docs.push(d);
    }
    if (d && u.$set) Object.assign(d, u.$set);
    return { matchedCount: d ? 1 : 0 };
  }
  async updateMany(q: any, u: any) {
    for (const d of this.docs.filter((x) => matches(x, q)))
      Object.assign(d, u.$set);
  }
  find(q: any) {
    let rows = this.docs.filter((d) => matches(d, q));
    const api = {
      sort: () => api,
      limit: (n: number) => {
        rows = rows.slice(0, n);
        return api;
      },
      toArray: async () => rows,
    };
    return api;
  }
}
class FakeDb {
  cols = new Map<string, Col>();
  collection(n: string) {
    if (!this.cols.has(n)) this.cols.set(n, new Col());
    return this.cols.get(n)!;
  }
}

// ---- Fake email, network and clock ----
function setup(stlResponses: Array<number | "network">) {
  const db = new FakeDb() as any;
  void ensureInquiryIndexes(db); // as the form's API does before saving
  const mail: any[] = [];
  const calls: any[] = [];
  let t = new Date("2026-10-27T15:00:00Z");
  const deps = {
    sendEmail: async (m: any) => {
      mail.push(m);
    },
    fetch: (async (url: string, init: any) => {
      calls.push({ url, body: JSON.parse(init.body) });
      const r = stlResponses.shift() ?? 201;
      if (r === "network") throw new Error("connect ECONNREFUSED");
      return {
        ok: r < 300,
        status: r,
        json: async () => ({
          ok: true,
          data: { lead_id: `lead-${calls.length}` },
        }),
      };
    }) as any,
    now: () => t,
    baseUrl: "https://www.blackwealthexchange.com",
    secret: "test-secret",
    teamEmail: "team@bwe.test",
    speedToLeadUrl: "https://usespeedtolead.com/public/v1/website/bwe/token",
  };
  return {
    db,
    deps,
    mail,
    calls,
    advance: (h: number) => {
      t = new Date(t.getTime() + h * 3600 * 1000);
    },
  };
}
const base = {
  name: "Dana Reed",
  email: "dana@reedcatering.test",
  message: "Hello, I have a question.",
};
let passed = 0;
const step = async (name: string, fn: () => Promise<void>) => {
  await fn();
  passed++;
  console.log(`ok ${passed}. ${name}`);
};

await step(
  "A business claiming its listing: saved, reply, team alert, sent to Speed-to-Lead",
  async () => {
    const s = setup([201]);
    const r: any = await createInquiry(
      s.db,
      {
        ...base,
        category: "listing_claim",
        businessName: "Reed Catering",
        phone: "(404) 555-0142",
        listingUrl:
          "https://www.blackwealthexchange.com/business/reed-catering",
      },
      s.deps,
    );
    assert.equal(r.ok, true);
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.origin, "Black Wealth Exchange");
    assert.equal(rec.category, "listing_claim");
    assert.equal(rec.reply.state, "sent");
    assert.equal(rec.teamAlert.state, "sent");
    assert.equal(rec.speedToLead.state, "sent");
    assert.equal(
      rec.speedToLead.leadId,
      "lead-1",
      "Speed-to-Lead lead reference stored in BWE",
    );
    const reply = s.mail.find((m) => m.to === base.email);
    assert.match(reply.text, /\$49 a month/);
    assert.match(reply.text, /founding-membership/);
    assert.match(reply.text, /unsubscribe/);
    assert.ok(
      s.mail.some(
        (m) => m.to === "team@bwe.test" && /Claim or correct/.test(m.subject),
      ),
    );
    const sent = s.calls[0].body;
    assert.deepEqual(
      Object.keys(sent).sort(),
      ["campaign", "email", "name", "phone", "service_needed", "sms_consent"],
      "only what Speed-to-Lead needs",
    );
    assert.equal(sent.sms_consent, false, "no texting consent on this form");
    assert.equal(sent.campaign, "bwe-inquiry-listing_claim");
    assert.equal(sent.phone, "4045550142");
  },
);

await step(
  "A business asking about the $49/month membership, no phone: reply + alert, not sent to Speed-to-Lead",
  async () => {
    const s = setup([]);
    await createInquiry(s.db, { ...base, category: "membership" }, s.deps);
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.speedToLead.state, "not_applicable");
    assert.equal(rec.speedToLead.reason, "no_phone");
    assert.equal(s.calls.length, 0);
    assert.match(
      s.mail.find((m) => m.to === base.email).text,
      /nothing is charged until you check out/,
    );
  },
);

await step(
  "A consulting lead while BWE isn't live in Speed-to-Lead: waits, then sends after go-live",
  async () => {
    const s = setup([503, 201]);
    await createInquiry(
      s.db,
      { ...base, category: "consulting", phone: "4045550142" },
      s.deps,
    );
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.speedToLead.state, "waiting_for_go_live");
    assert.equal(
      (await processPendingForwards(s.db, s.deps)).processed,
      0,
      "not retried before its time",
    );
    s.advance(25);
    await processPendingForwards(s.db, s.deps);
    assert.equal(rec.speedToLead.state, "sent");
    assert.equal(rec.speedToLead.attempts, 2);
  },
);

await step(
  "A shopper looking for a business: reply with the directory, no alert, never sent to Speed-to-Lead",
  async () => {
    const s = setup([]);
    await createInquiry(
      s.db,
      { ...base, category: "shopper", phone: "4045550142" },
      s.deps,
    );
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.teamAlert.state, "not_applicable");
    assert.equal(rec.speedToLead.reason, "category");
    assert.equal(s.mail.length, 1);
    assert.match(s.mail[0].text, /business-directory/);
    assert.doesNotMatch(
      s.mail[0].text,
      /membership|\$49/,
      "no membership pitch to shoppers",
    );
  },
);

await step(
  "A duplicate submission: one record, one reply, one alert, one hand-off",
  async () => {
    const s = setup([201, 201]);
    const input = { ...base, category: "advertising", phone: "4045550142" };
    await createInquiry(s.db, input, s.deps);
    const again: any = await createInquiry(
      s.db,
      { ...input, email: "DANA@reedcatering.test" },
      s.deps,
    );
    assert.equal(again.duplicate, true);
    assert.equal(s.db.collection("inquiries").docs.length, 1);
    assert.equal(s.mail.length, 2, "reply + alert, once");
    assert.equal(s.calls.length, 1);
  },
);

await step(
  "A failed Speed-to-Lead request: inquiry kept, retried with backoff, then marked failed",
  async () => {
    const s = setup(["network", 500, 500, 500, 500, 500]);
    const r: any = await createInquiry(
      s.db,
      { ...base, category: "partnership", phone: "4045550142" },
      s.deps,
    );
    assert.equal(r.ok, true, "the person's submission still succeeds");
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.speedToLead.state, "retrying");
    assert.equal(rec.speedToLead.lastError, "network");
    for (let i = 0; i < 5; i++) {
      s.advance(48);
      await processPendingForwards(s.db, s.deps);
    }
    assert.equal(rec.speedToLead.state, "failed");
    assert.equal(rec.speedToLead.attempts, 6);
    assert.equal(
      rec.speedToLead.lastError,
      "http_500",
      "error code only, no personal data",
    );
  },
);

await step(
  "A contact who unsubscribed: saved, no reply sent, team still alerted",
  async () => {
    const s = setup([201]);
    await s.db
      .collection("email_suppressions")
      .updateOne(
        { email: base.email },
        { $setOnInsert: { email: base.email } },
        { upsert: true },
      );
    await createInquiry(s.db, { ...base, category: "membership" }, s.deps);
    const rec = s.db.collection("inquiries").docs[0];
    assert.equal(rec.reply.state, "skipped_opted_out");
    assert.equal(rec.optedOut, true);
    assert.ok(!s.mail.some((m) => m.to === base.email));
    assert.ok(s.mail.some((m) => m.to === "team@bwe.test"));
  },
);

await step(
  "Unsubscribe link: right token adds to do-not-email, wrong token doesn't",
  async () => {
    const s = setup([]);
    assert.equal(
      await unsubscribeEmail(s.db, base.email, "wrong", "test-secret"),
      false,
    );
    assert.equal(
      await unsubscribeEmail(
        s.db,
        base.email,
        unsubscribeToken(base.email, "test-secret"),
        "test-secret",
      ),
      true,
    );
    assert.ok(
      await s.db
        .collection("email_suppressions")
        .findOne({ email: base.email }),
    );
  },
);

await step("Bots (honeypot) are ignored; bad input is explained", async () => {
  const s = setup([]);
  assert.equal(
    (
      (await createInquiry(
        s.db,
        { ...base, category: "membership", website: "http://spam" },
        s.deps,
      )) as any
    ).ignored,
    true,
  );
  assert.equal(s.db.collection("inquiries").docs.length, 0);
  await assert.rejects(
    createInquiry(
      s.db,
      { ...base, category: "membership", email: "BLACKWEALTHEXCHANGE" },
      s.deps,
    ),
    (e: any) => e instanceof InquiryError && e.field === "email",
  );
  await assert.rejects(
    createInquiry(s.db, { ...base, category: "nope" }, s.deps),
    (e: any) => e.field === "category",
  );
});

await step(
  "Conversions: an inquiry followed by a paid membership counts; test memberships don't",
  async () => {
    const s = setup([]);
    await createInquiry(s.db, { ...base, category: "membership" }, s.deps);
    await createInquiry(
      s.db,
      { ...base, email: "other@x.test", category: "membership" },
      s.deps,
    );
    const later = new Date("2026-11-01T00:00:00Z");
    s.db
      .collection("business_memberships")
      .docs.push({
        email: base.email,
        createdAt: later,
        paymentAmountCents: 4900,
        membershipStatus: "active",
      });
    s.db
      .collection("business_memberships")
      .docs.push({
        email: "other@x.test",
        createdAt: later,
        paymentAmountCents: 4900,
        isTestMembership: true,
      });
    const sum = await inquirySummary(s.db);
    assert.equal(sum.inquiries, 2);
    assert.equal(sum.convertedToMembers, 1);
    assert.equal(sum.membershipRevenueCents, 4900);
    assert.equal(sum.byCategory.membership.converted, 1);
  },
);

console.log(`INQUIRY ACCEPTANCE TESTS PASSED (${passed})`);
