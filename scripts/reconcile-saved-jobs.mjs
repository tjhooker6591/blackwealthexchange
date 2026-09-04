import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    ObjectId.isValid(value) &&
    String(new ObjectId(value)) === value
  );
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "bwes-cluster";
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);

    const savedJobsDocs = await db.collection("savedJobs").find({}).toArray();

    // 1) Duplicates within savedJobs (same userId+jobId pair, regardless of validity)
    const seen = new Map();
    for (const doc of savedJobsDocs) {
      const key = `${String(doc.userId)}|${String(doc.jobId)}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(String(doc._id));
    }
    const duplicateGroups = [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => ({ key, ids }));

    // 2) Invalid/orphaned entries within savedJobs: non-ObjectId userId/jobId, or jobId not present in jobs
    const validJobIds = savedJobsDocs
      .map((d) => d.jobId)
      .filter((id) => isValidObjectId(String(id)));
    const jobsFound = validJobIds.length
      ? await db
          .collection("jobs")
          .find({
            _id: { $in: validJobIds.map((id) => new ObjectId(String(id))) },
          })
          .project({ _id: 1 })
          .toArray()
      : [];
    const existingJobIdSet = new Set(jobsFound.map((j) => String(j._id)));

    const invalidEntries = savedJobsDocs
      .filter((doc) => {
        const userIdOk = isValidObjectId(String(doc.userId));
        const jobIdOk = isValidObjectId(String(doc.jobId));
        if (!userIdOk || !jobIdOk) return true;
        if (!existingJobIdSet.has(String(doc.jobId))) return true;
        return false;
      })
      .map((doc) => ({
        id: String(doc._id),
        userId: String(doc.userId),
        jobId: String(doc.jobId),
        reason: !isValidObjectId(String(doc.userId))
          ? "invalid_userId"
          : !isValidObjectId(String(doc.jobId))
            ? "invalid_jobId"
            : "job_not_found",
      }));

    // 3) Backfill candidates: users.savedJobs array entries not present in savedJobs collection
    const usersWithSaved = await db
      .collection("users")
      .find({ savedJobs: { $exists: true, $ne: [] } })
      .project({ _id: 1, email: 1, savedJobs: 1 })
      .toArray();

    const existingPairSet = new Set(
      savedJobsDocs.map((d) => `${String(d.userId)}|${String(d.jobId)}`),
    );

    const backfillCandidates = [];
    for (const user of usersWithSaved) {
      const userId = String(user._id);
      const arr = Array.isArray(user.savedJobs) ? user.savedJobs : [];
      for (const rawJobId of arr) {
        const jobId = String(rawJobId);
        if (!isValidObjectId(jobId)) continue;
        const key = `${userId}|${jobId}`;
        if (existingPairSet.has(key)) continue;
        backfillCandidates.push({
          userId,
          jobId,
          sourceUserEmail: user.email || null,
        });
      }
    }

    let backfilled = 0;
    if (APPLY) {
      for (const candidate of backfillCandidates) {
        const result = await db.collection("savedJobs").updateOne(
          {
            userId: new ObjectId(candidate.userId),
            jobId: new ObjectId(candidate.jobId),
          },
          {
            $setOnInsert: {
              userId: new ObjectId(candidate.userId),
              jobId: new ObjectId(candidate.jobId),
              savedAt: new Date(),
              backfilledFrom: "users.savedJobs",
              backfilledAt: new Date(),
            },
          },
          { upsert: true },
        );
        if (result.upsertedCount) backfilled += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          db: dbName,
          apply: APPLY,
          savedJobsTotalDocs: savedJobsDocs.length,
          duplicateGroups,
          invalidEntries,
          usersWithSavedArray: usersWithSaved.length,
          backfillCandidateCount: backfillCandidates.length,
          backfillCandidates,
          backfilled,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
