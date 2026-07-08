-- Migration 008: Normalize item_name in price_data_points
-- Adds product_note column and cleans existing item_name values

-- 1. Add product_note column (nullable, for secondary specs like cable gauge, surface treatment)
ALTER TABLE price_data_points ADD COLUMN IF NOT EXISTS product_note TEXT;

-- 2. Strip supply/labour/install prefix from existing item_name rows
--    Handles: "Supply To [any verb]", "Supply & Install", "Supply Labour Only To Install",
--             "Labour Only To Install", "To Install", "To Lay", "To Supply"
UPDATE price_data_points
SET item_name = trim(regexp_replace(
  item_name,
  '^(Supply\s+Labour\s+(Only\s+)?To\s+Install|Labour\s+(Only\s+)?To\s+Install|Supply\s+Only(\s+To\s+Install)?|Supply\s*(&|And)\s*Install|To\s+(Supply\s+And\s+Install|Install|Lay|Supply)|Supply\s+To)\s+',
  '',
  'i'
))
WHERE item_name ~* '^(Supply|Labour|To\s+(Lay|Supply|Install))';

-- 3. Strip trailing location/room context suffixes
--    Handles: "For Kitchen And Dining Area", "For Entrance And Pool Side Area",
--             "At Living Room", "For Master Bedroom", etc.
UPDATE price_data_points
SET item_name = trim(regexp_replace(
  item_name,
  '\s+(For|At)\s+[\w\s&/]+?(Area|Zone|Side|Level|Block|Floor|Entrance|Porch|Kitchen|Bedroom|Bathroom|Living|Dining|Store|Storeroom|Pool|Room|Hall|Foyer|Balcony|Garden|Yard|Toilet|WC|Carpark)?\s*$',
  '',
  'i'
))
WHERE item_name ~* '\s+(For|At)\s+\w';

-- 4. Final trim to remove any leftover whitespace or trailing punctuation
UPDATE price_data_points
SET item_name = trim(regexp_replace(item_name, '[\s,\-–]+$', ''))
WHERE item_name ~ '[\s,\-–]+$';
