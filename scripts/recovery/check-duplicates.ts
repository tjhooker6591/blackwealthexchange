import fs from "node:fs";
import path from "node:path";

const inPath = path.join(process.cwd(), "scripts", "recovery", "out", "match-existing-665.json");
const outPath = path.join(process.cwd(), "scripts", "recovery", "out", "duplicate-report.json");

const data = JSON.parse(fs.readFileSync(inPath, "utf8"));
const rows = data.results as any[];

const keyMap = new Map<string, any[]>();
for (const r of rows) {
  const k = `${(r.business_name || "").toLowerCase()}|${(r.state || "").toLowerCase()}|${(r.recovered_city || "").toLowerCase()}`;
  if (!keyMap.has(k)) keyMap.set(k, []);
  keyMap.get(k)!.push(r);
}

const groups = [...keyMap.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => ({ key: k, count: v.length, records: v.map((x) => x._id) }));

const duplicateRecordIds = groups.flatMap((g) => g.records);
const batchA = (data.batchA || []) as any[];
const excludedFromBatchA = batchA.filter((r:any)=> duplicateRecordIds.includes(r._id)).map((r:any)=>r._id);
const report = { groups, totalGroups: groups.length, candidatesChecked: rows.length, duplicateRecords: duplicateRecordIds.length, excludedFromBatchA };
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outPath, totalGroups: groups.length, candidatesChecked: rows.length, duplicateRecords: duplicateRecordIds.length, excludedFromBatchA: excludedFromBatchA.length }, null, 2));
