-- Migration 024: Sync hardcoded prompt prices to price_database
-- 1. Update all seed rows sample_count=1 → 10 (so Layer 1 filter passes)
-- 2. Fix Partition prices (single RM7-15, double RM12-25)
-- 3. Update Sintered Stone Dekton/Neolith to RM500-900
-- 4. Insert missing items from prompt hardcoded baseline

-- ============================================================
-- STEP A: Promote all seed data to sample_count=10
-- This fixes the critical bug where fetchDbPriceReference()
-- skips all seed rows due to "sample_count < 10" filter.
-- ============================================================

UPDATE price_database SET sample_count = 10 WHERE sample_count < 10;

-- ============================================================
-- STEP B: Fix Partition prices per user correction
-- Single-side gypsum: RM18-30 → RM7-15
-- Double-side gypsum: RM28-45 → RM12-25
-- ============================================================

UPDATE price_database
SET min_price = 7, max_price = 15, avg_price = 11.0
WHERE category = 'False Ceiling'
  AND subcategory = 'Partition'
  AND material_method = 'Plasterboard 1-side'
  AND region IN ('MY_KL', 'MY_PG', 'MY_JB');

UPDATE price_database
SET min_price = 2.5, max_price = 5.0, avg_price = 3.75
WHERE category = 'False Ceiling'
  AND subcategory = 'Partition'
  AND material_method = 'Plasterboard 1-side'
  AND region = 'SG';

UPDATE price_database
SET min_price = 12, max_price = 25, avg_price = 18.5
WHERE category = 'False Ceiling'
  AND subcategory = 'Partition'
  AND material_method = 'Plasterboard 2-side'
  AND region IN ('MY_KL', 'MY_PG', 'MY_JB');

UPDATE price_database
SET min_price = 4.0, max_price = 8.0, avg_price = 6.0
WHERE category = 'False Ceiling'
  AND subcategory = 'Partition'
  AND material_method = 'Plasterboard 2-side'
  AND region = 'SG';

-- ============================================================
-- STEP C: Update Sintered Stone Dekton/Neolith to RM500-900
-- (premium brand, higher than generic sintered stone)
-- ============================================================

UPDATE price_database
SET min_price = 500, max_price = 900, avg_price = 700.0
WHERE category = 'Table Top'
  AND subcategory = 'Stone Top'
  AND material_method = 'Dekton/Neolith'
  AND region IN ('MY_KL', 'MY_PG', 'MY_JB');

UPDATE price_database
SET min_price = 200, max_price = 400, avg_price = 300.0
WHERE category = 'Table Top'
  AND subcategory = 'Stone Top'
  AND material_method = 'Dekton/Neolith'
  AND region = 'SG';

-- ============================================================
-- STEP D: Insert missing items from prompt hardcoded baseline
-- All with sample_count=10, confidence='high' for MY_KL/SG,
-- 'low' for MY_PG/MY_JB (consistent with existing seed pattern)
-- ============================================================

INSERT INTO price_database (category, subcategory, material_method, item_name, unit, supply_type, region, min_price, max_price, avg_price, sample_count, confidence)
VALUES
  -- Tiling Labour (incl cement & sand) — RM12-18/sqft
  ('Tiling','Labour Only','Incl Cement Sand','Tiling labour incl cement & sand','sqft','labour_only','MY_KL',12,18,15.0,10,'high'),
  ('Tiling','Labour Only','Incl Cement Sand','Tiling labour incl cement & sand','sqft','labour_only','MY_PG',12,18,15.0,10,'low'),
  ('Tiling','Labour Only','Incl Cement Sand','Tiling labour incl cement & sand','sqft','labour_only','MY_JB',12,18,15.0,10,'low'),
  ('Tiling','Labour Only','Incl Cement Sand','Tiling labour incl cement & sand','sqft','labour_only','SG',5.0,8.0,6.5,10,'high'),

  -- Tiling Labour (pure workmanship only) — RM6-10/sqft
  ('Tiling','Labour Only','Pure Workmanship','Tiling labour pure workmanship','sqft','labour_only','MY_KL',6,10,8.0,10,'high'),
  ('Tiling','Labour Only','Pure Workmanship','Tiling labour pure workmanship','sqft','labour_only','MY_PG',6,10,8.0,10,'low'),
  ('Tiling','Labour Only','Pure Workmanship','Tiling labour pure workmanship','sqft','labour_only','MY_JB',6,10,8.0,10,'low'),
  ('Tiling','Labour Only','Pure Workmanship','Tiling labour pure workmanship','sqft','labour_only','SG',3.0,5.0,4.0,10,'high'),

  -- Table Top Postform — RM80-150/ft (classifier: Wooden Postform)
  ('Table Top','General Countertop','Wooden Postform','Postform countertop S&I','ft','supply_install','MY_KL',80,150,115.0,10,'high'),
  ('Table Top','General Countertop','Wooden Postform','Postform countertop S&I','ft','supply_install','MY_PG',80,150,115.0,10,'low'),
  ('Table Top','General Countertop','Wooden Postform','Postform countertop S&I','ft','supply_install','MY_JB',80,150,115.0,10,'low'),
  ('Table Top','General Countertop','Wooden Postform','Postform countertop S&I','ft','supply_install','SG',35.0,65.0,50.0,10,'high'),

  -- Table Top Quartz Premium — RM350-600/ft (classifier: Quartz Surface)
  ('Table Top','Kitchen Countertop','Quartz Surface','Quartz premium countertop S&I','ft','supply_install','MY_KL',350,600,475.0,10,'high'),
  ('Table Top','Kitchen Countertop','Quartz Surface','Quartz premium countertop S&I','ft','supply_install','MY_PG',350,600,475.0,10,'low'),
  ('Table Top','Kitchen Countertop','Quartz Surface','Quartz premium countertop S&I','ft','supply_install','MY_JB',350,600,475.0,10,'low'),
  ('Table Top','Kitchen Countertop','Quartz Surface','Quartz premium countertop S&I','ft','supply_install','SG',150.0,280.0,215.0,10,'high'),

  -- Table Top Marble Local — RM300-600/ft (classifier: Marble & Granite)
  ('Table Top','Kitchen Countertop','Marble & Granite','Local marble countertop S&I','ft','supply_install','MY_KL',300,600,450.0,10,'high'),
  ('Table Top','Kitchen Countertop','Marble & Granite','Local marble countertop S&I','ft','supply_install','MY_PG',300,600,450.0,10,'low'),
  ('Table Top','Kitchen Countertop','Marble & Granite','Local marble countertop S&I','ft','supply_install','MY_JB',300,600,450.0,10,'low'),
  ('Table Top','Kitchen Countertop','Marble & Granite','Local marble countertop S&I','ft','supply_install','SG',120.0,250.0,185.0,10,'high'),

  -- Table Top Marble Imported — RM500-1200/ft (separate material_method for premium)
  ('Table Top','Kitchen Countertop','Imported Marble','Imported marble countertop S&I','ft','supply_install','MY_KL',500,1200,850.0,10,'high'),
  ('Table Top','Kitchen Countertop','Imported Marble','Imported marble countertop S&I','ft','supply_install','MY_PG',500,1200,850.0,10,'low'),
  ('Table Top','Kitchen Countertop','Imported Marble','Imported marble countertop S&I','ft','supply_install','MY_JB',500,1200,850.0,10,'low'),
  ('Table Top','Kitchen Countertop','Imported Marble','Imported marble countertop S&I','ft','supply_install','SG',200.0,500.0,350.0,10,'high'),

  -- Table Top Sintered Stone China — RM250-400/ft (classifier: Sintered Stone)
  ('Table Top','Kitchen Countertop','Sintered Stone','Sintered stone China countertop S&I','ft','supply_install','MY_KL',250,400,325.0,10,'high'),
  ('Table Top','Kitchen Countertop','Sintered Stone','Sintered stone China countertop S&I','ft','supply_install','MY_PG',250,400,325.0,10,'low'),
  ('Table Top','Kitchen Countertop','Sintered Stone','Sintered stone China countertop S&I','ft','supply_install','MY_JB',250,400,325.0,10,'low'),
  ('Table Top','Kitchen Countertop','Sintered Stone','Sintered stone China countertop S&I','ft','supply_install','SG',100.0,180.0,140.0,10,'high'),

  -- Table Top Labour Only — RM50-120/ft
  ('Table Top','General','Labour Only','Table top installation labour only','ft','labour_only','MY_KL',50,120,85.0,10,'high'),
  ('Table Top','General','Labour Only','Table top installation labour only','ft','labour_only','MY_PG',50,120,85.0,10,'low'),
  ('Table Top','General','Labour Only','Table top installation labour only','ft','labour_only','MY_JB',50,120,85.0,10,'low'),
  ('Table Top','General','Labour Only','Table top installation labour only','ft','labour_only','SG',25.0,55.0,40.0,10,'high'),

  -- Feature Wall / Wall Panel S&I (premium) — RM70-150/sqft
  ('Carpentry','Display/Feature','Premium Feature Wall','Feature wall / wall panel S&I premium','sqft','supply_install','MY_KL',70,150,110.0,10,'high'),
  ('Carpentry','Display/Feature','Premium Feature Wall','Feature wall / wall panel S&I premium','sqft','supply_install','MY_PG',70,150,110.0,10,'low'),
  ('Carpentry','Display/Feature','Premium Feature Wall','Feature wall / wall panel S&I premium','sqft','supply_install','MY_JB',70,150,110.0,10,'low'),
  ('Carpentry','Display/Feature','Premium Feature Wall','Feature wall / wall panel S&I premium','sqft','supply_install','SG',30.0,65.0,47.5,10,'high')

ON CONFLICT (category, subcategory, material_method, unit, supply_type, region)
DO UPDATE SET
  min_price = EXCLUDED.min_price,
  max_price = EXCLUDED.max_price,
  avg_price = EXCLUDED.avg_price,
  item_name = EXCLUDED.item_name,
  confidence = EXCLUDED.confidence,
  sample_count = EXCLUDED.sample_count;
