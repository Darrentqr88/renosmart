const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('C:/Users/User/Desktop/Price_Database_1000.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws);

const headerKey = Object.keys(raw[0])[0];
const rows = raw.filter(r => typeof r[headerKey] === 'number');

const COL = {
  no: headerKey,
  category: '__EMPTY',
  subcategory: '__EMPTY_1',
  item: '__EMPTY_2',
  material: '__EMPTY_3',
  unit: '__EMPTY_4',
  supplyType: '__EMPTY_5',
  myMin: '__EMPTY_6',
  myMax: '__EMPTY_7',
  sgMin: '__EMPTY_8',
  sgMax: '__EMPTY_9',
  propType: '__EMPTY_10',
  confidence: '__EMPTY_11',
};

function esc(s) { return (s || '').toString().trim().replace(/'/g, "''"); }
function num(v) { return Number(v) || 0; }

const lines = [];
lines.push('-- RenoSmart Price Intelligence Database Seed Data (v4 — 1000 Items, Mar 2026)');
lines.push('-- Auto-generated from Price_Database_1000.xlsx');
lines.push('-- Category > Subcategory > Material/Method, 4 regions each');
lines.push('');
lines.push('-- Step 1: Ensure columns exist');
lines.push("ALTER TABLE price_database ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '';");
lines.push("ALTER TABLE price_database ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'General';");
lines.push("ALTER TABLE price_database ADD COLUMN IF NOT EXISTS material_method TEXT NOT NULL DEFAULT 'Standard';");
lines.push("ALTER TABLE price_database ADD COLUMN IF NOT EXISTS supply_type TEXT NOT NULL DEFAULT 'supply_install';");
lines.push("ALTER TABLE price_database ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();");
lines.push('');
lines.push('-- Step 2: Drop old constraints, create new');
lines.push('ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_item_unique;');
lines.push('ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_database_category_unit_supply_type_region_key;');
lines.push('ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_hierarchy_unique;');
lines.push('ALTER TABLE price_database ADD CONSTRAINT price_db_hierarchy_unique');
lines.push('  UNIQUE (category, subcategory, material_method, unit, supply_type, region);');
lines.push('');
lines.push('-- Step 3: Clear old seed data');
lines.push('DELETE FROM price_database;');
lines.push('');

// Track unique keys to deduplicate
const seen = new Set();
let lastCategory = '';
let batchCount = 0;
let batchRows = 0;
const MAX_BATCH = 200; // Split into batches of 200 rows to avoid SQL limits

function startBatch() {
  lines.push('INSERT INTO price_database (item_name, category, subcategory, material_method, unit, supply_type, region, min_price, max_price, avg_price, sample_count, confidence, updated_at) VALUES');
  batchRows = 0;
  batchCount++;
}

function endBatch() {
  if (batchRows > 0) {
    // Replace last comma with semicolon
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.replace(/,$/, ';');
    lines.push('');
  }
}

let totalInserted = 0;

for (const r of rows) {
  const cat = esc(r[COL.category]);
  const sub = esc(r[COL.subcategory] || 'General');
  const item = esc(r[COL.item] || '');
  let mat = esc(r[COL.material] || 'Standard');
  const unit = esc(r[COL.unit] || 'unit');
  const stRaw = (r[COL.supplyType] || '').toString().trim();
  const st = stRaw === 'Labour Only' ? 'labour_only' : stRaw === 'Supply Only' ? 'supply_only' : 'supply_install';
  const conf = esc(r[COL.confidence] || 'mid');

  const myMin = num(r[COL.myMin]);
  const myMax = num(r[COL.myMax]);
  const sgMin = num(r[COL.sgMin]);
  const sgMax = num(r[COL.sgMax]);

  if (!cat || myMin === 0 || myMax === 0) continue;

  // Check for duplicate key
  const baseKey = [cat, sub, mat, unit, st].join('|');
  const klKey = baseKey + '|MY_KL';
  if (seen.has(klKey)) {
    // Make unique by appending part of item name
    const shortItem = item.substring(0, 40).replace(/'/g, '');
    mat = esc(mat + ' - ' + shortItem);
    const newKey = [cat, sub, mat, unit, st].join('|') + '|MY_KL';
    if (seen.has(newKey)) continue; // still dupe, skip
  }

  // Mark as seen for all 4 regions
  for (const reg of ['MY_KL', 'MY_JB', 'MY_PG', 'SG']) {
    seen.add([cat, sub, mat, unit, st, reg].join('|'));
  }

  // Category separator comment
  if (cat !== lastCategory) {
    if (batchRows > 0) endBatch();
    lines.push('-- ' + '='.repeat(50));
    lines.push('-- ' + cat.toUpperCase());
    lines.push('-- ' + '='.repeat(50));
    startBatch();
    lastCategory = cat;
  } else if (batchRows >= MAX_BATCH) {
    endBatch();
    startBatch();
  }

  const myAvg = Math.round((myMin + myMax) / 2 * 100) / 100;
  const sgAvg = Math.round((sgMin + sgMax) / 2 * 100) / 100;
  const jbMin = Math.round(myMin * 0.88 * 100) / 100;
  const jbMax = Math.round(myMax * 0.88 * 100) / 100;
  const jbAvg = Math.round((jbMin + jbMax) / 2 * 100) / 100;
  const pgMin = Math.round(myMin * 0.92 * 100) / 100;
  const pgMax = Math.round(myMax * 0.92 * 100) / 100;
  const pgAvg = Math.round((pgMin + pgMax) / 2 * 100) / 100;

  const samples = conf === 'high' ? 85 : conf === 'mid' ? 35 : 12;
  const jbSamples = Math.round(samples * 0.75);
  const pgSamples = Math.round(samples * 0.65);
  const sgSamples = Math.round(samples * 0.85);

  const v = (itemName, category, subcategory, material, u, supplyType, region, min, max, avg, sampleCount, confidence) =>
    `('${itemName}','${category}','${subcategory}','${material}','${u}','${supplyType}','${region}',${min.toFixed(2)},${max.toFixed(2)},${avg.toFixed(2)},${sampleCount},'${confidence}',NOW()),`;

  lines.push(v(item, cat, sub, mat, unit, st, 'MY_KL', myMin, myMax, myAvg, samples, conf));
  lines.push(v(item, cat, sub, mat, unit, st, 'MY_JB', jbMin, jbMax, jbAvg, jbSamples, conf));
  lines.push(v(item, cat, sub, mat, unit, st, 'MY_PG', pgMin, pgMax, pgAvg, pgSamples, conf));
  lines.push(v(item, cat, sub, mat, unit, st, 'SG', sgMin, sgMax, sgAvg, sgSamples, conf));
  batchRows += 4;
  totalInserted++;
}

endBatch();

lines.push('-- Done: ' + totalInserted + ' unique items x 4 regions = ' + (totalInserted * 4) + ' rows');

const sql = lines.join('\n');
fs.writeFileSync('C:/Users/User/renosmart-app/supabase/seed_price_database.sql', sql, 'utf8');
console.log('Generated SQL:');
console.log('  Items:', totalInserted);
console.log('  Total rows:', totalInserted * 4);
console.log('  Batches:', batchCount);
console.log('  File size:', Math.round(sql.length / 1024), 'KB');
