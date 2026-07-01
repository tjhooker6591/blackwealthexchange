const fs=require('fs');
const r=JSON.parse(fs.readFileSync('/Users/blackforge/workspace/bwe/repos/repo_clean/scripts/recovery/out/r2-recovery-report.json','utf8'));
const rb=JSON.parse(fs.readFileSync('/Users/blackforge/workspace/bwe/repos/repo_clean/scripts/recovery/out/rollback-recovery-batch-R2-25.json','utf8'));
const beforeById=Object.fromEntries((rb.before||[]).map(d=>[String(d._id),d]));
for(const rec of r.records){
  const b=beforeById[rec.id]||{};
  const after={city:b.city||'',state:b.state||'',category:b.category||'',phone:b.phone||'',website:b.website||'',sourceUrl:b.sourceUrl||''};
  for(const [k,v] of Object.entries(rec.fields||{})){ if(['city','state','category'].includes(k)) after[k]=v.after||''; }
  const eligible=!!(after.city&&after.state&&after.category&&(after.phone||after.website||after.sourceUrl));
  const enrich=!(after.website||after.sourceUrl);
  const changed=Object.keys(rec.fields||{}).filter(f=>!['recoveryStatus','recoveryEvidence','recoveredAt','recoveredBy'].includes(f));
  const baf=changed.map(f=>`${f}: ${JSON.stringify(rec.fields[f].before)} -> ${JSON.stringify(rec.fields[f].after)}`).join('; ');
  const rules=rec.ruleSummary.map(x=>`${x.field}:${x.rule}`).join('|');
  const conf=[...new Set(rec.ruleSummary.map(x=>x.confidence))].join(',');
  console.log([rec.id,(rec.name||'(blank)'),changed.join(','),baf,rules,conf,eligible?'yes':'no',enrich?'yes':'no'].join('\t'));
}