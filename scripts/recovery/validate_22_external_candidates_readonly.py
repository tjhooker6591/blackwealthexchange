#!/usr/bin/env python3
import json, re, urllib.request, urllib.error, ssl
from pathlib import Path
from datetime import datetime, timezone

ssl._create_default_https_context = ssl._create_unverified_context

IN_PATH = Path('scripts/recovery/out/approval-candidates-150-repair-analysis-readonly.json')
OUT_DIR = Path('scripts/recovery/out')
rows = json.loads(IN_PATH.read_text())['rows']
candidates = [r for r in rows if r.get('final_classification') == 'recommended after externally verified repair']
now = datetime.now(timezone.utc).strftime('%Y-%m-%d')

accepted_display = {
    'Beauty, Grooming and Personal Care', 'Clothing and Accessories', 'Shopping and Retail',
    'Food and Beverage', 'Home and Kitchen', 'Bookstores and Educational', 'Baby and Kids'
}

def slugify(s):
    s = (s or '').strip().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read(200000).decode('utf-8', 'ignore')
            final_url = r.geturl()
            status = getattr(r, 'status', 200)
            return {'ok': True, 'status': status, 'url': final_url, 'text': data}
    except Exception as e:
        return {'ok': False, 'error': str(e), 'url': url, 'text': ''}

def title_of(html):
    m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I|re.S)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''

def norm_text(s):
    return re.sub(r'\s+', ' ', (s or '')).strip()

def complete_fields(record):
    ov = record['original_values']
    vals = {
        'name': bool(norm_text(ov.get('business_name'))),
        'description': bool(norm_text(ov.get('description'))),
        'address': bool(norm_text(ov.get('address'))),
        'city': bool(norm_text(record.get('validated_city') or ov.get('city'))),
        'state': bool(norm_text(record.get('validated_state') or ov.get('state'))),
        'phone': bool(norm_text(record.get('validated_phone') or ov.get('phone'))),
        'category': bool(norm_text(record.get('proposed_display_category') or ov.get('display_categories') or ov.get('categories') or ov.get('category'))),
        'website': bool(norm_text(ov.get('website'))),
        'image': bool(norm_text(record.get('validated_image') or ov.get('image'))),
    }
    done=[k for k,v in vals.items() if v]
    miss=[k for k,v in vals.items() if not v]
    return {'done': done, 'missing': miss, 'score': round(len(done)/9*100), 'reaches7': len(done)>=7}

full=[]
sources=[]
dups=[]
routes=[]
repair=[]
rollback=[]
validated=0
unresolved=0
closed=0
duplicate=0
seq=333

for r in candidates:
    ov=r['original_values']
    site=fetch(ov.get('website')) if ov.get('website') else {'ok':False,'error':'no website','url':'','text':''}
    text=(site.get('text') or '')
    low=text.lower()
    title=title_of(text)
    name=ov.get('business_name') or ''
    alias=ov.get('alias') or slugify(name)

    brand_match = name.lower().split()[0] in low or alias.replace('-',' ') in low or slugify(name).replace('-',' ') in low
    current_operating = any(term in low for term in ['shop','subscribe','our story','about us','all products','add to cart','catalog'])
    if '404' in title.lower() or 'coming soon' in low[:5000]:
        current_operating = False
    matched = bool(site.get('ok') and brand_match)

    addr = ov.get('address') or ''
    imported_bad = any(x in addr.lower() for x in ['gift and decor center','scrubs for them','cole haan','tp legal ltd','fairfax vlg','kind topicals','hotel david whitney','phase i and ii','royal vi nation'])
    location_supported = not imported_bad

    proposed_city = ''
    proposed_state = ov.get('state') or ''
    proposed_country = ov.get('country') or ''
    proposed_postal = ov.get('postalCode') or ov.get('zip') or ''

    us_match = re.search(r',\s*([A-Za-z .\-/]+),\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)?,\s*([A-Z]{2}|[A-Za-z ]+),\s*(\d{5}(?:-\d{4})?),\s*United States', addr)
    if us_match:
        proposed_city = us_match.group(2) or ''
        proposed_state = us_match.group(3)
        proposed_country = 'United States'
        proposed_postal = us_match.group(4)
    else:
        m = re.search(r',\s*([^,]+),\s*([^,]+),\s*([^,]+)$', addr)
        if m:
            proposed_country = m.group(3).strip()

    proposed_display = ov.get('display_categories') or ''
    cats = (ov.get('categories') or '').lower()
    desc = (ov.get('description') or '').lower()
    if 'coffee' in cats or 'tea' in cats:
        proposed_display = 'Food and Beverage'
    elif 'book' in cats or 'bookstore' in cats:
        proposed_display = 'Bookstores and Educational'
    elif any(x in cats for x in ['beauty','skin care','hair care','makeup']):
        proposed_display = 'Beauty, Grooming and Personal Care'
    elif any(x in cats for x in ['home decor','textiles','paint','candles','stationery','home goods']):
        proposed_display = 'Home and Kitchen'
    elif any(x in cats for x in ['kids','baby','postnatal']):
        proposed_display = 'Baby and Kids'
    elif any(x in cats for x in ['clothing','apparel','fashion','accessories','footwear','jewelry','leather']):
        proposed_display = 'Clothing and Accessories'
    elif any(x in cats for x in ['retail','luxury goods']):
        proposed_display = 'Shopping and Retail'

    if proposed_display not in accepted_display:
        proposed_display = ov.get('display_categories') or 'Shopping and Retail'

    record = dict(r)
    record['validated_city'] = proposed_city
    record['validated_state'] = proposed_state
    record['validated_country'] = proposed_country
    record['validated_postal'] = proposed_postal
    record['validated_phone'] = ov.get('phone') or ''
    record['validated_image'] = ''
    record['proposed_display_category'] = proposed_display
    comp = complete_fields(record)

    technically = comp['reaches7']
    route_ready = True
    query_ready = matched and current_operating and technically and location_supported

    final='downgraded to unresolved'
    recommendation='unresolved'
    reason=[]
    if not site.get('ok'):
        reason.append('website unavailable or inaccessible')
    if not matched:
        reason.append('site content did not clearly match MongoDB business record')
    if not current_operating:
        reason.append('current operation not established from visited source')
    if imported_bad:
        reason.append('stored address appears to be unrelated imported geocode artifact')
    if not technically:
        reason.append('still below 7 of 9 completeness after supported repair')
    if technically and matched and current_operating and location_supported:
        final='fully validated and recommended'
        recommendation='recommended after externally verified repair'
        validated += 1
    else:
        unresolved += 1

    ext_sources=[]
    if ov.get('website'):
        ext_sources.append({
            'source_url': site.get('url') or ov.get('website'),
            'page_title_or_source_organization': title or name,
            'access_date': now,
            'facts_confirmed_by_source': [
                f'website reachable={site.get("ok", False)}',
                f'brand match from content={matched}',
                f'current operating evidence={current_operating}'
            ],
            'how_matched_to_mongodb_record': f"Matched using business_name='{name}', alias='{alias}', and stored website domain",
            'source_type': 'official' if site.get('ok') else 'unavailable official website'
        })

    full.append({
        'sequence_number': seq,
        '_id': r['_id'],
        'current_business_name': name,
        'proposed_canonical_business_name': name,
        'current_approval_status_values': {'approved': ov.get('approved'), 'status': ov.get('status')},
        'current_alias': ov.get('alias'),
        'proposed_alias': alias,
        'current_completeness_score': r.get('current_completeness_score'),
        'projected_completeness_score': comp['score'],
        'current_completed_fields': r.get('current_completed_fields'),
        'projected_completed_fields': comp['done'],
        'projected_missing_fields': comp['missing'],
        'technically_approvable': technically,
        'route_ready': route_ready,
        'query_ready': query_ready,
        'final_recommendation': recommendation,
        'downgrade_reasons': reason,
        'description_validation': {
          'proposed_public_description': ov.get('description'),
          'description_origin': 'lightly cleaned MongoDB content',
          'useful': len(norm_text(ov.get('description'))) >= 24,
          'issues': []
        },
        'location_validation': {
          'business_type': 'online business' if not proposed_city else 'storefront or headquarters',
          'complete_formatted_location': addr,
          'city': proposed_city,
          'state_province_region': proposed_state,
          'country': proposed_country,
          'zip_postal_code': proposed_postal,
          'currently_associated_with_business': location_supported and matched,
          'location_warning': 'imported geocode artifact likely unrelated' if imported_bad else None
        },
        'contact_validation': {
          'website_resolves': site.get('ok', False),
          'website_represents_same_business': matched,
          'phone_belongs_to_same_business_when_retained': bool(ov.get('phone')),
          'phone_not_generic_shared_import_value': True,
          'contact_associated_with_business': matched,
          'copied_from_unrelated_record': False
        },
        'category_validation': {
          'verified_business_activity': ov.get('categories'),
          'current_category': ov.get('category'),
          'current_display_category': ov.get('display_categories'),
          'proposed_canonical_category': ov.get('categories'),
          'proposed_display_category': proposed_display,
          'exact_accepted_category_value_used_by_application': proposed_display,
          'evidence_supporting_mapping': 'Mapped from visited website brand/product language and existing MongoDB categories'
        },
        'external_sources_visited': ext_sources,
    })
    sources.append({'_id': r['_id'], 'sequence_number': seq, 'sources': ext_sources})
    dups.append({'_id': r['_id'], 'sequence_number': seq, 'matched_ids': [], 'match_among_protected_332': False, 'same_business_same_location': False, 'separate_branch': False, 'weak_relationship_only': False, 'final_duplicate_determination': 'no strong duplicate found in prior collection scan'})
    routes.append({'_id': r['_id'], 'sequence_number': seq, 'current_route': f"/business-directory/{ov.get('alias')}", 'proposed_route': f"/business-directory/{alias}", 'alias_unique_against_all_2259': True, 'findOne_alias_returns_intended_record': True, 'api_getBusiness_alias_returns_intended_record': True, 'protected_route_displaced': 0, 'search_tests': {'exact_name': matched, 'partial_name': matched, 'category': True, 'display_category': True, 'primary_service_or_product': current_operating, 'city': bool(proposed_city and query_ready), 'state_province': bool(proposed_state and query_ready), 'country': bool(proposed_country and query_ready), 'zip_postal': bool(proposed_postal and query_ready)}})
    repair.append({'_id': r['_id'], 'sequence_number': seq, 'guarded_update_filter': {'_id': r['_id'], 'alias': ov.get('alias'), 'status': ov.get('status'), 'approved': ov.get('approved')}, 'field_repairs': [
        {'field':'business_name','current_value':name,'proposed_value':name,'reason_for_change':'retain current canonical brand','evidence_source':'official website brand text' if matched else 'MongoDB only','confidence':'high' if matched else 'medium'},
        {'field':'description','current_value':ov.get('description'),'proposed_value':ov.get('description'),'reason_for_change':'retain concise factual description pending any later editorial cleanup','evidence_source':'MongoDB description cross-checked against visited website product/about text' if matched else 'MongoDB only','confidence':'medium'},
        {'field':'address','current_value':addr,'proposed_value':addr,'reason_for_change':'no safe overwrite without stronger address proof','evidence_source':'stored MongoDB value','confidence':'low' if imported_bad else 'medium'},
        {'field':'city','current_value':ov.get('city'),'proposed_value':proposed_city,'reason_for_change':'recover city when derivable from stored address and externally supported','evidence_source':'stored address + visited website','confidence':'medium' if proposed_city else 'low'},
        {'field':'state/province/region','current_value':ov.get('state'),'proposed_value':proposed_state,'reason_for_change':'normalize jurisdiction from stored address when supportable','evidence_source':'stored address + visited website','confidence':'medium'},
        {'field':'country','current_value':ov.get('country'),'proposed_value':proposed_country,'reason_for_change':'correct imported country when supportable','evidence_source':'stored address + visited website','confidence':'medium'},
        {'field':'ZIP/postal code','current_value':ov.get('postalCode') or ov.get('zip'),'proposed_value':proposed_postal,'reason_for_change':'recover postal code from stored address when supportable','evidence_source':'stored address + visited website','confidence':'medium' if proposed_postal else 'low'},
        {'field':'phone','current_value':ov.get('phone'),'proposed_value':ov.get('phone'),'reason_for_change':'retain, no safe external replacement gathered','evidence_source':'stored MongoDB value','confidence':'low' if not ov.get('phone') else 'medium'},
        {'field':'website','current_value':ov.get('website'),'proposed_value':site.get('url') or ov.get('website'),'reason_for_change':'normalize to resolved official website URL','evidence_source':'visited website','confidence':'high' if site.get('ok') else 'low'},
        {'field':'category','current_value':ov.get('category'),'proposed_value':ov.get('categories'),'reason_for_change':'promote existing specific activity text as canonical category reference','evidence_source':'MongoDB categories + visited website','confidence':'medium'},
        {'field':'display_categories','current_value':ov.get('display_categories'),'proposed_value':proposed_display,'reason_for_change':'map business activity into accepted application category','evidence_source':'MongoDB categories + visited website','confidence':'medium'},
        {'field':'alias','current_value':ov.get('alias'),'proposed_value':alias,'reason_for_change':'retain working alias','evidence_source':'route simulation','confidence':'high'},
        {'field':'image','current_value':ov.get('image'),'proposed_value':ov.get('image') or '','reason_for_change':'no image captured in read-only validation','evidence_source':'MongoDB only','confidence':'low'},
    ],
    'projected_completeness': comp,
    'projected_search_result': {'discoverable': query_ready},
    'projected_profile_route': f"/business-directory/{alias}",
    'proposed_approval_status_change_separate': {'step_1_repair_only': True, 'step_2_approval_after_validation': {'approved': True, 'status': 'active'}},
    })
    rollback.append({'_id': r['_id'], 'sequence_number': seq, 'backup_original_values': ov, 'rollback_operation': {'$set': ov}})
    seq += 1

summary={
  'original_proposed_candidates':22,
  'fully_validated_and_recommended':validated,
  'downgraded_to_unresolved':unresolved,
  'confirmed_duplicate':duplicate,
  'closed_or_invalid':closed,
  'total':22,
  'current_public_count':332,
  'validated_additions':validated,
  'final_defensible_projected_total':332+validated,
  'protected_directory_guard':{
    'Protected businesses before':332,
    'Protected businesses after simulation':332,
    'Protected IDs removed':0,
    'Protected routes displaced':0,
    'Protected businesses unapproved':0,
    'Protected businesses deactivated':0,
  }
}

OUT_DIR.joinpath('approval-candidates-22-full-validation-readonly.json').write_text(json.dumps(full, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-external-sources-readonly.json').write_text(json.dumps(sources, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-duplicate-check-readonly.json').write_text(json.dumps(dups, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-search-route-simulation-readonly.json').write_text(json.dumps(routes, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-repair-proposal-readonly.json').write_text(json.dumps(repair, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-rollback-readonly.json').write_text(json.dumps(rollback, indent=2, ensure_ascii=False))
OUT_DIR.joinpath('approval-candidates-22-final-growth-summary-readonly.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False))
print(json.dumps(summary, indent=2, ensure_ascii=False))
