"""
run_migration_012.py
Runs migration 012 via Supabase REST API (PostgREST).
Step 1: DELETE commercial/niche items
Step 2: UPSERT 208 seed items × 4 regions
"""

import sys, os, json, time
sys.path.insert(0, os.path.dirname(__file__))
from build_price_db import ITEMS
import requests

URL = "https://obwcntliainlbxuzfeew.supabase.co/rest/v1/price_database"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9id2NudGxpYWlubGJ4dXpmZWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDk1MDQsImV4cCI6MjA4ODc4NTUwNH0.JUysYTQX9LMkdO2fiDjkhoOrh8rf4Km6tZB0ePsiYXA"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

def delete(params):
    r = requests.delete(URL, headers=HEADERS, params=params)
    return r.status_code

def avg(a, b):
    return round((a + b) / 2, 2)

# -----------------------------------------------------------------------
# STEP 1: DELETE commercial/niche categories entirely
# -----------------------------------------------------------------------
print("STEP 1: Deleting commercial/niche categories...")

niche_cats = ['Commercial Specialty', 'Fire Safety', 'Signage']
for cat in niche_cats:
    code = delete({"category": f"eq.{cat}"})
    print(f"  DELETE category={cat}: {code}")

# -----------------------------------------------------------------------
# STEP 2: DELETE commercial subcategories
# -----------------------------------------------------------------------
print("\nSTEP 2: Deleting commercial subcategories...")

delete_rules = [
    {"category": "eq.Air Conditioning", "subcategory": "in.(Commercial HVAC,VRV/VRF System)"},
    {"category": "eq.Aluminium & Glass", "subcategory": "eq.Commercial"},
    {"category": "eq.Aluminium", "subcategory": "eq.Commercial"},
    {"category": "eq.Glass", "subcategory": "eq.Commercial"},
    {"category": "eq.Carpentry", "subcategory": "in.(Commercial,F&B Fitout,Office Fitout)"},
    {"category": "eq.Electrical", "subcategory": "in.(Commercial Electrical,Mall Electrical,Office Electrical,Retail Electrical,F&B Electrical,Industrial,BMS/Building Management)"},
    {"category": "eq.Flooring", "subcategory": "in.(Commercial,Commercial Flooring)"},
    {"category": "eq.Metal Work", "subcategory": "in.(Commercial,Industrial)"},
    {"category": "eq.Painting", "subcategory": "in.(Commercial,F&B Painting,Industrial Coating)"},
    {"category": "eq.Plumbing", "subcategory": "in.(Commercial,F&B Plumbing,Industrial)"},
    {"category": "eq.Demolition", "subcategory": "in.(Reinstatement,Commercial Demolition)"},
    {"category": "eq.Construction", "subcategory": "in.(Commercial Construction,Mall Construction,Industrial Construction)"},
    {"category": "eq.Security System", "subcategory": "in.(Access Control,Mall Security,Commercial Security)"},
    {"subcategory": "eq.Condo Work"},
    {"category": "eq.Landscape", "subcategory": "in.(Commercial Landscape,Golf Course)"},
]

for rule in delete_rules:
    code = delete(rule)
    desc = " AND ".join(f"{k}={v}" for k, v in rule.items())
    print(f"  DELETE {desc}: {code}")

# -----------------------------------------------------------------------
# STEP 3: UPSERT seed items
# -----------------------------------------------------------------------
print(f"\nSTEP 3: Upserting {len(ITEMS)} items × 4 regions...")

rows = []
for item in ITEMS:
    kl_min = item['kl_min']
    kl_max = item['kl_max']
    kl_avg = avg(kl_min, kl_max)
    sg_min = item.get('sg_min')
    sg_max = item.get('sg_max')

    base = {
        "category": item['cat'],
        "subcategory": item['subcat'],
        "material_method": item['method'],
        "item_name": item['name'],
        "unit": item['unit'],
        "supply_type": item['supply'],
        "sample_count": 1,
    }

    # MY_KL
    rows.append({**base, "region": "MY_KL", "min_price": kl_min, "max_price": kl_max, "avg_price": kl_avg, "confidence": "high"})
    # MY_PG (= KL)
    rows.append({**base, "region": "MY_PG", "min_price": kl_min, "max_price": kl_max, "avg_price": kl_avg, "confidence": "low"})
    # MY_JB (= KL)
    rows.append({**base, "region": "MY_JB", "min_price": kl_min, "max_price": kl_max, "avg_price": kl_avg, "confidence": "low"})
    # SG — only if real data
    if sg_min is not None and sg_max is not None:
        sg_a = avg(sg_min, sg_max)
        rows.append({**base, "region": "SG", "min_price": sg_min, "max_price": sg_max, "avg_price": sg_a, "confidence": "high"})

print(f"  Total rows to upsert: {len(rows)}")

# Upsert via PostgREST (Prefer: resolution=merge-duplicates uses ON CONFLICT)
upsert_headers = {
    **HEADERS,
    "Prefer": "resolution=merge-duplicates",
}

BATCH = 50
ok = 0
fail = 0
upsert_url = URL + "?on_conflict=category,subcategory,material_method,unit,supply_type,region"
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    r = requests.post(upsert_url, headers=upsert_headers, json=batch)
    if r.status_code in (200, 201):
        ok += len(batch)
    else:
        fail += len(batch)
        print(f"  BATCH {i//BATCH+1} FAILED ({r.status_code}): {r.text[:200]}")
    if (i // BATCH) % 5 == 0:
        print(f"  Progress: {min(i+BATCH, len(rows))}/{len(rows)} rows...")

print(f"\nDone! OK: {ok}, Failed: {fail}")
print(f"Total items: {len(ITEMS)}, Total rows attempted: {len(rows)}")
