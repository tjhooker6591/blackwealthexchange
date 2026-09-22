import json
from pathlib import Path
rows = json.loads(Path('scripts/recovery/out/all-businesses-enrichment-research-readonly.json').read_text())
remaining = [r for r in rows if r['protected_or_non_protected'] == 'non-protected']

def ids(seq):
    return [r['_id'] for r in seq]

missing_name = [r for r in remaining if r['business_name_missing_before']]
identified_missing_name = [r for r in missing_name if r['identified_missing_name']]
duplicate_rows = [r for r in remaining if r['duplicate_status'] != 'none']
manual_review_rows = [r for r in remaining if r['manual_review_required']]
unresolved_rows = [r for r in remaining if r['confidence'] == 'unresolved']
still_lack_info_rows = [r for r in remaining if any(x in r['current_exclusion_reason'] for x in ['missing business name','incomplete address','missing description','missing category','insufficient verification'])]
officialish = [r for r in remaining if r['researched_website'] or r['source_url_1']]
multiclue = []
for r in remaining:
    score = 0
    if r['researched_phone']: score += 1
    if r['researched_website']: score += 1
    if r['researched_address']: score += 1
    if r['researched_business_name']: score += 1
    if score >= 2:
        multiclue.append(r)

out = {
  'environment': json.loads(Path('scripts/recovery/out/all-businesses-enrichment-summary-readonly.json').read_text())['environment'],
  'counts': {
    'officialish_url_stored_rows': len(officialish),
    'multi_clue_rows': len(multiclue),
    'machine_identified_missing_name_rows': len(identified_missing_name),
    'possible_duplicate_rows': len(duplicate_rows),
    'manual_review_rows': len(manual_review_rows),
    'unresolved_rows': len(unresolved_rows),
    'still_lack_info_rows': len(still_lack_info_rows),
  },
  'row_ids': {
    'officialish_url_stored_rows': ids(officialish),
    'multi_clue_rows': ids(multiclue),
    'machine_identified_missing_name_rows': ids(identified_missing_name),
    'possible_duplicate_rows': ids(duplicate_rows),
    'manual_review_rows': ids(manual_review_rows),
    'unresolved_rows': ids(unresolved_rows),
    'still_lack_info_rows': ids(still_lack_info_rows),
  }
}
Path('scripts/recovery/out/batch0-provenance-row-ids.json').write_text(json.dumps(out, indent=2))
print(json.dumps({k:v for k,v in out['counts'].items()}, indent=2))
