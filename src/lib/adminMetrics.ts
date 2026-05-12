import type { Db } from "mongodb";

export type SourceStatus =
  | "live"
  | "empty"
  | "collection_missing"
  | "needs_mapping";
export type Metric = {
  value: number | string;
  sourceStatus: SourceStatus;
  note?: string;
  link?: string;
};

async function hasCollection(db: Db, name: string) {
  const n = await db.listCollections({ name }, { nameOnly: true }).toArray();
  return n.length > 0;
}

export async function safeCount(
  db: Db,
  name: string,
  query: any = {},
): Promise<Metric> {
  if (!(await hasCollection(db, name)))
    return { value: 0, sourceStatus: "collection_missing", note: name };
  const value = await db.collection(name).countDocuments(query);
  return { value, sourceStatus: value > 0 ? "live" : "empty" };
}

export async function sumAmount(
  db: Db,
  name: string,
  match: any,
  amountFields: string[],
): Promise<Metric> {
  if (!(await hasCollection(db, name)))
    return { value: 0, sourceStatus: "collection_missing", note: name };
  const docs = await db
    .collection(name)
    .find(match)
    .project(Object.fromEntries(amountFields.map((f) => [f, 1])))
    .limit(10000)
    .toArray();
  let sum = 0;
  for (const d of docs as any[]) {
    const v =
      amountFields
        .map((f) => Number(d?.[f] ?? 0))
        .find((x) => Number.isFinite(x) && x > 0) || 0;
    sum += v;
  }
  return {
    value: Number(sum.toFixed(2)),
    sourceStatus: docs.length ? "live" : "empty",
  };
}

export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
export function startOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
