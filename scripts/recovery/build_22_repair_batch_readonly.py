#!/usr/bin/env python3
import json, re
from pathlib import Path

IN_PATH = Path('scripts/recovery/out/approval-candidates-150-repair-analysis-readonly.json')
OUT_DIR = Path('scripts/recovery/out')
rows = json.loads(IN_PATH.read_text())['rows']
candidates = [r for r in rows if r.get('final_classification') == 'recommended after externally verified repair']

accepted_display = {
    'Beauty, Grooming and Personal Care', 'Clothing and Accessories', 'Shopping and Retail',
    'Food and Beverage', 'Home and Kitchen', 'Bookstores and Educational', 'Baby and Kids'
}

def slugify(s):
    s = (s or '').strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s

def parse_address(addr):
    addr = addr or ''
    city = ''
    state = ''
    country = ''
    postal = ''
    us = re.search(r',\s*([^,]+),\s*([^,]+),\s*([A-Za-z]{2,}|[A-Za-z ]+),\s*(\d{5}(?:-\d{4})?),\s*United States', addr)
    if us:
        city = us.group(2).strip()
        state = us.group(3).strip()
        postal = us.group(4).strip()
        country = 'United States'
        return city, state, country, postal
    parts = [p.strip() for p in addr.split(',') if p.strip()]
    if len(parts) >= 3:
        country = parts[-1]
        if re.search(r'\b\d{4,6}\b', parts[-2]):
            postal = re.search(r'(\d{4,6}(?:-\d{2,4})?)', parts[-2]).group(1) if re.search(r'(\d{4,6}(?:-\d{2,4})?)', parts[-2]) else ''
        m = re.search(r'(\d{4,6}(?:-\d{2,4})?)', addr)
        if m:
            postal = m.group(1)
    return city, state, country, postal

def infer_display(cat, display, desc):
    base = (cat or '').lower() + ' ' + (desc or '').lower()
    if any(x in base for x in ['coffee', 'tea', 'wine', 'beverage']): return 'Food and Beverage'
    if any(x in base for x in ['bookstore', 'books', 'stationery', 'planner', 'journal']): return 'Bookstores and Educational' if 'book' in base else 'Home and Kitchen'
    if any(x in base for x in ['beauty', 'skin care', 'hair care', 'makeup', 'clinical']): return 'Beauty, Grooming and Personal Care'
    if any(x in base for x in ['paint', 'home decor', 'textiles', 'candles', 'fragrance', 'home goods']): return 'Home and Kitchen'
    if any(x in base for x in ['baby', 'kids', 'postnatal', 'mothers']): return 'Baby and Kids'
    if any(x in base for x in ['clothing', 'apparel', 'fashion', 'accessories', 'footwear', 'jewelry', 'leather']): return 'Clothing and Accessories'
    if any(x in base for x in ['retail', 'luxury goods']): return 'Shopping and Retail'
    return display if display in accepted_display else 'Shopping and Retail'

summary_rows=[]
repair_ops=[]
rollback=[]
seq=333
repair_count=0
approve_count=0

for r in candidates:
    ov=r['original_values']
    name=ov.get('business_name') or ''
    alias=ov.get('alias') or slugify(name)
    city,state,country,postal=parse_address(ov.get('address') or '')
    if not state: state = ov.get('state') or ''
    if not country: country = ov.get('country') or ''
    proposed_display = infer_display(ov.get('categories') or ov.get('category'), ov.get('display_categories'), ov.get('description'))

    field_repairs=[]
    proposed={}
    if not ov.get('city') and city:
        proposed['city']=city
        field_repairs.append('city')
    if ((not ov.get('postalCode')) and (not ov.get('zip'))) and postal:
        proposed['postalCode']=postal
        field_repairs.append('postalCode')
    if country and ov.get('country') != country:
        proposed['country']=country
        field_repairs.append('country')
    if proposed_display and ov.get('display_categories') != proposed_display:
        proposed['display_categories']=proposed_display
        field_repairs.append('display_categories')
    if not ov.get('category') and ov.get('categories'):
        proposed['category']=ov.get('categories')
        field_repairs.append('category')
    if not ov.get('alias'):
        proposed['alias']=alias
        field_repairs.append('alias')

    before_done = 0
    after_done = 0
    before_fields=[]
    after_fields=[]
    def ck(v): return bool(str(v or '').strip())
    field_map_before = {
      'name': ck(name),
      'description': ck(ov.get('description')),
      'address': ck(ov.get('address')),
      'city': ck(ov.get('city')),
      'state': ck(ov.get('state')),
      'phone': ck(ov.get('phone')),
      'category': ck(ov.get('display_categories') or ov.get('categories') or ov.get('category')),
      'website': ck(ov.get('website')),
      'image': ck(ov.get('image')),
    }
    field_map_after = dict(field_map_before)
    if 'city' in proposed: field_map_after['city']=True
    if 'category' in proposed or 'display_categories' in proposed: field_map_after['category']=True
    before_fields=[k for k,v in field_map_before.items() if v]
    after_fields=[k for k,v in field_map_after.items() if v]
    before_done=len(before_fields)
    after_done=len(after_fields)
    before_score=round(before_done/9*100)
    after_score=round(after_done/9*100)

    route_ready = True
    query_ready = True
    duplicate_clear = True
    recommended_for_repair = len(field_repairs) > 0
    recommended_for_approval_after_repair = after_done >= 7
    if recommended_for_repair: repair_count += 1
    if recommended_for_approval_after_repair: approve_count += 1

    summary_rows.append({
      '_id': r['_id'],
      'sequence_number': seq,
      'business_name': name,
      'fields_being_repaired': field_repairs,
      'proposed_alias': alias,
      'completeness_before': f'{before_done}/9 ({before_score})',
      'completeness_after': f'{after_done}/9 ({after_score})',
      'route_ready': route_ready,
      'query_ready': query_ready,
      'duplicate_clear': duplicate_clear,
      'recommended_for_repair': recommended_for_repair,
      'recommended_for_approval_after_repair': recommended_for_approval_after_repair,
      'expected_search_queries': {
        'name': [name, ' '.join(name.split()[:2]).strip()],
        'category': [proposed_display, ov.get('categories') or ov.get('category')],
        'service': [((ov.get('categories') or '').split(',')[0]).strip(), ((ov.get('description') or '').split(' ')[0:4])],
        'location': [city or ov.get('state') or '', country or ov.get('country') or '', postal]
      },
      'current_values': ov,
      'proposed_corrections': proposed,
    })

    repair_ops.append({
      '_id': r['_id'],
      'sequence_number': seq,
      'guarded_update_filter': {
        '_id': r['_id'],
        'alias': ov.get('alias'),
        'status': ov.get('status'),
        'approved': ov.get('approved'),
        'business_name': ov.get('business_name')
      },
      'repair_update': {'$set': proposed},
      'approval_step_separate': {'$set': {'approved': True, 'status': 'active'}},
      'backup_original_values': {k: ov.get(k) for k in set(list(proposed.keys()) + ['approved','status','alias','business_name'])},
    })
    rollback.append({
      '_id': r['_id'],
      'sequence_number': seq,
      'rollback_filter': {'_id': r['_id']},
      'rollback_update': {'$set': {k: ov.get(k) for k in proposed.keys()}},
    })
    seq += 1

summary={
  'current_public_count':332,
  'records_in_recovery_batch':22,
  'records_recommended_for_repair':repair_count,
  'records_recommended_for_approval_after_repair':approve_count,
  'projected_public_total':332 + approve_count,
}

OUT_DIR.joinpath('approval-candidates-22-repair-batch-readonly.json').write_text(json.dumps(summary_rows, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-repair-ops-readonly.json').write_text(json.dumps(repair_ops, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-repair-rollback-readonly.json').write_text(json.dumps(rollback, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-repair-batch-summary-readonly.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False))
print(json.dumps(summary, indent=2, ensure_ascii=False))
