import type { Db, Filter } from "mongodb";

export type AdminBusinessBucket = "pending" | "approved" | "rejected";

const PENDING_STATUSES = ["pending", "pending_approval", "pending_review"];
const APPROVED_STATUSES = ["approved", "active"];
const REJECTED_STATUSES = ["rejected", "denied"];

function normalizeStatusValue(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function hasAnyNormalizedStatus(statuses: string[]) {
  return {
    $in: statuses,
  };
}

export function getAdminBusinessBucketFilter(
  bucket: AdminBusinessBucket,
): Filter<any> {
  if (bucket === "pending") {
    return {
      $or: [
        { status: hasAnyNormalizedStatus(PENDING_STATUSES) },
        {
          $and: [
            {
              $or: [{ approved: false }, { approved: { $exists: false } }],
            },
            {
              $or: [
                { status: { $exists: false } },
                { status: "" },
                {
                  $expr: {
                    $in: [
                      {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: {
                                $toLower: { $ifNull: ["$status", ""] },
                              },
                              find: "-",
                              replacement: "_",
                            },
                          },
                          find: " ",
                          replacement: "_",
                        },
                      },
                      PENDING_STATUSES,
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (bucket === "approved") {
    return {
      $or: [
        { approved: true },
        { status: hasAnyNormalizedStatus(APPROVED_STATUSES) },
        {
          $expr: {
            $in: [
              {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: { $toLower: { $ifNull: ["$status", ""] } },
                      find: "-",
                      replacement: "_",
                    },
                  },
                  find: " ",
                  replacement: "_",
                },
              },
              APPROVED_STATUSES,
            ],
          },
        },
      ],
    };
  }

  return {
    $or: [
      { status: hasAnyNormalizedStatus(REJECTED_STATUSES) },
      {
        $expr: {
          $in: [
            {
              $replaceAll: {
                input: {
                  $replaceAll: {
                    input: { $toLower: { $ifNull: ["$status", ""] } },
                    find: "-",
                    replacement: "_",
                  },
                },
                find: " ",
                replacement: "_",
              },
            },
            REJECTED_STATUSES,
          ],
        },
      },
    ],
  };
}

export async function getAdminBusinessCounts(db: Db) {
  const businesses = db.collection("businesses");
  const [pending, approved, rejected, total] = await Promise.all([
    businesses.countDocuments(getAdminBusinessBucketFilter("pending")),
    businesses.countDocuments(getAdminBusinessBucketFilter("approved")),
    businesses.countDocuments(getAdminBusinessBucketFilter("rejected")),
    businesses.countDocuments({}),
  ]);

  return { pending, approved, rejected, total };
}

export function deriveAdminBusinessStatus(doc: any): AdminBusinessBucket {
  const normalizedStatus = normalizeStatusValue(doc?.status);

  if (REJECTED_STATUSES.includes(normalizedStatus)) return "rejected";
  if (APPROVED_STATUSES.includes(normalizedStatus)) return "approved";
  if (PENDING_STATUSES.includes(normalizedStatus)) return "pending";

  if (doc?.approved === true) return "approved";
  if (doc?.approved === false) return "pending";

  return "pending";
}
