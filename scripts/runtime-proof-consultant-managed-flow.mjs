#!/usr/bin/env node
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("MONGODB_URI is required");

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const now = new Date();
const runId = `proof-${Date.now()}`;
const employerId = `employer-${runId}`;
const consultantId = `consultant-${runId}`;

const requests = db.collection("employer_consultant_contact_requests");
const pipeline = db.collection("employer_consultant_pipeline");
const events = db.collection("flow_events");

const blocked = await requests.insertOne({
  employerId,
  employerEmail: `${runId}@example.com`,
  consultantId,
  requestType: "contact",
  message: "blocked proof payload",
  moderationStatus: "blocked",
  moderationReasons: ["unsafe_link"],
  status: "blocked",
  createdAt: now,
  updatedAt: now,
});

await events.insertOne({
  eventType: "consultant_contact_request_blocked",
  employerId,
  consultantId,
  requestId: String(blocked.insertedId),
  createdAt: now,
});

const acceptedAt = new Date();
await requests.updateOne(
  { _id: blocked.insertedId },
  {
    $set: {
      status: "accepted",
      consultantResponseAction: "accept",
      consultantRespondedAt: acceptedAt,
      updatedAt: acceptedAt,
    },
  },
);

await pipeline.updateOne(
  { employerId, consultantId },
  {
    $set: {
      status: "under_review",
      employerId,
      consultantId,
      updatedAt: acceptedAt,
    },
    $setOnInsert: { createdAt: acceptedAt },
  },
  { upsert: true },
);

const moderatedAt = new Date();
await requests.updateOne(
  { _id: blocked.insertedId },
  {
    $set: {
      adminDisposition: "resolved",
      adminDispositionNote: "manual proof disposition",
      adminDispositionBy: "runtime-proof",
      adminDispositionAt: moderatedAt,
      updatedAt: moderatedAt,
    },
  },
);

await events.insertOne({
  eventType: "consultant_contact_request_moderated",
  requestId: String(blocked.insertedId),
  source_variant: "resolved",
  actedBy: "runtime-proof",
  createdAt: moderatedAt,
});

const finalRequest = await requests.findOne({ _id: blocked.insertedId });
const finalPipeline = await pipeline.findOne({ employerId, consultantId });

console.log(
  JSON.stringify(
    {
      ok: true,
      requestId: String(blocked.insertedId),
      requestStatus: finalRequest?.status || null,
      adminDisposition: finalRequest?.adminDisposition || null,
      pipelineStatus: finalPipeline?.status || null,
      checks: {
        persistedBlockedRequest: !!finalRequest,
        consultantResponseApplied:
          finalRequest?.consultantResponseAction === "accept",
        adminDispositionApplied: finalRequest?.adminDisposition === "resolved",
        pipelineSynchronized: finalPipeline?.status === "under_review",
      },
    },
    null,
    2,
  ),
);

await client.close();
