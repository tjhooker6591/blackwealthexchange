// Tests for the AI Productivity for Business course: content integrity,
// server-side quiz grading, lesson unlock order, and capstone completion.
// The database is an in-memory fake; nothing real is touched.
// Run: npx tsx src/lib/__tests__/ai-course-tests.mts
import assert from "node:assert/strict";
import {
  aiProductivityCourse as course,
  gradeQuiz,
  publicQuiz,
  choiceOrder,
  validateCapstone,
  CAPSTONE_FIELDS,
} from "../courses/aiProductivity";
import {
  getProgress,
  recordQuizAttempt,
  saveCapstone,
} from "../courses/aiProductivity/server";
import { toVideoSource } from "../courses/aiProductivity/videos";

// ---- tiny fake of the Mongo calls used by server.ts ----
function matches(doc: any, q: any) {
  return Object.entries(q).every(([k, v]) =>
    v === null ? doc[k] == null : doc[k] === v,
  );
}
class Col {
  docs: any[] = [];
  find(q: any) {
    return { toArray: async () => this.docs.filter((d) => matches(d, q)) };
  }
  async findOne(q: any) {
    return this.docs.find((d) => matches(d, q)) || null;
  }
  async updateOne(q: any, u: any, opts: any = {}) {
    let d = this.docs.find((x) => matches(x, q));
    if (!d) {
      if (!opts.upsert) return { matchedCount: 0 };
      d = { ...q, ...(u.$setOnInsert || {}) };
      this.docs.push(d);
    }
    Object.assign(d, u.$set || {});
    for (const [k, v] of Object.entries(u.$inc || {}))
      d[k] = (d[k] || 0) + (v as number);
    for (const [k, v] of Object.entries(u.$max || {}))
      d[k] = Math.max(d[k] ?? -Infinity, v as number);
    return { matchedCount: 1 };
  }
}
function fakeDb() {
  const cols: Record<string, Col> = {};
  return { collection: (n: string) => (cols[n] ||= new Col()) } as any;
}

let passed = 0;
async function test(name: string, fn: () => Promise<void> | void) {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}

// Correct answers as display positions (what the browser sends).
const perfect = (n: number) =>
  course.lessons[n - 1].quiz.map((q, qi) =>
    choiceOrder(n, qi, q.choices.length).indexOf(q.answer),
  );

await test("12 lessons, unique slugs, 4 valid questions each", () => {
  assert.equal(course.lessons.length, 12);
  assert.equal(new Set(course.lessons.map((l) => l.slug)).size, 12);
  course.lessons.forEach((l, i) => {
    assert.equal(l.number, i + 1);
    assert.ok(l.quiz.length >= 4, `lesson ${l.number} quiz`);
    assert.ok(l.reading.length >= 3 && l.walkthrough.steps.length >= 3);
    assert.ok(l.reflection.length === 3);
    for (const q of l.quiz)
      assert.ok(q.answer >= 0 && q.answer < q.choices.length);
  });
});

await test("course price is $49", () => assert.equal(course.priceCents, 4900));

await test("browser quiz never includes answers", () => {
  const json = JSON.stringify(publicQuiz(course.lessons[0]));
  assert.ok(!json.includes('"answer"') && !json.includes('"why"'));
});

await test("shuffled choices: same order every time, answers spread out, perfect scores 100", () => {
  assert.deepEqual(
    publicQuiz(course.lessons[2]),
    publicQuiz(course.lessons[2]),
  );
  const spots: Record<number, number> = {};
  course.lessons.forEach((l) => {
    perfect(l.number).forEach((p) => (spots[p] = (spots[p] || 0) + 1));
    assert.equal(gradeQuiz(l, perfect(l.number)).score, 100);
    // shown choices are the same set as the content's
    publicQuiz(l).forEach((q, qi) =>
      assert.deepEqual([...q.choices].sort(), [...l.quiz[qi].choices].sort()),
    );
  });
  const most = Math.max(...Object.values(spots));
  assert.ok(most <= 20, `answers too concentrated: ${JSON.stringify(spots)}`);
  console.log("   answer positions:", JSON.stringify(spots));
});

await test("grading: 3/4 passes at 75%, 2/4 fails, junk input scores 0", () => {
  const l = course.lessons[0];
  const three = perfect(1).map((a, i) =>
    i === 0 ? (a + 1) % l.quiz[0].choices.length : a,
  );
  assert.deepEqual(
    [gradeQuiz(l, three).score, gradeQuiz(l, three).passed],
    [75, true],
  );
  const two = three.map((a, i) =>
    i === 1 ? (a + 1) % l.quiz[1].choices.length : a,
  );
  assert.equal(gradeQuiz(l, two).passed, false);
  assert.equal(gradeQuiz(l, "nope").score, 0);
});

await test("lessons unlock one at a time; first pass time is kept; best score kept", async () => {
  const db = fakeDb();
  let p = await getProgress(db, "u1");
  assert.equal(p.unlockedThrough, 1);
  await recordQuizAttempt(db, "u1", 1, 50, false);
  p = await getProgress(db, "u1");
  assert.equal(p.unlockedThrough, 1);
  await recordQuizAttempt(db, "u1", 1, 100, true);
  p = await getProgress(db, "u1");
  const firstPass = p.lessons[0].passedAt;
  assert.equal(p.unlockedThrough, 2);
  await recordQuizAttempt(db, "u1", 1, 75, true);
  p = await getProgress(db, "u1");
  assert.equal(p.lessons[0].passedAt, firstPass);
  assert.equal(p.lessons[0].bestScore, 100);
  assert.equal(p.lessons[0].attempts, 3);
  // passing lesson 3 out of order does not unlock past lesson 2
  await recordQuizAttempt(db, "u1", 3, 100, true);
  assert.equal((await getProgress(db, "u1")).unlockedThrough, 2);
});

await test("capstone requires every field; completion needs all lessons + capstone", async () => {
  assert.equal(validateCapstone({}).missing.length, CAPSTONE_FIELDS.length);
  const full = Object.fromEntries(
    CAPSTONE_FIELDS.map((f) => [f.key, "A complete answer for this part."]),
  );
  assert.equal(validateCapstone(full).missing.length, 0);

  const db = fakeDb();
  for (let n = 1; n <= 11; n++) await recordQuizAttempt(db, "u2", n, 100, true);
  await saveCapstone(db, "u2", "a@b.co", validateCapstone(full).answers);
  let p = await getProgress(db, "u2");
  assert.ok(
    p.capstoneSubmittedAt && !p.completedAt,
    "lesson 12 not passed yet",
  );
  await recordQuizAttempt(db, "u2", 12, 100, true);
  p = await getProgress(db, "u2");
  assert.equal(p.passedCount, 12);
  assert.ok(p.completedAt);
});

await test("video config accepts YouTube IDs/links and https files only", () => {
  assert.equal(toVideoSource("dQw4w9WgXcQ")?.kind, "youtube");
  assert.equal(
    toVideoSource("https://youtu.be/dQw4w9WgXcQ")?.src,
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(toVideoSource("https://cdn.example.com/a.mp4")?.kind, "file");
  assert.equal(toVideoSource("javascript:alert(1)"), null);
  assert.equal(toVideoSource(null), null);
});

console.log(`\n${passed} tests passed`);
process.exit(0);
