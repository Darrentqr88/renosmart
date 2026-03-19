-- Migration: Add three-level classification to price database
-- Category > Subcategory > Material/Method

-- ============================================
-- 1. Add columns to price_data_points
-- ============================================
ALTER TABLE price_data_points ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'General';
ALTER TABLE price_data_points ADD COLUMN IF NOT EXISTS material_method TEXT NOT NULL DEFAULT 'Standard';

-- ============================================
-- 2. Add columns to price_database
-- ============================================
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'General';
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS material_method TEXT NOT NULL DEFAULT 'Standard';

-- ============================================
-- 3. Add columns to cost_records
-- ============================================
ALTER TABLE cost_records ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'General';
ALTER TABLE cost_records ADD COLUMN IF NOT EXISTS material_method TEXT NOT NULL DEFAULT 'Standard';

-- ============================================
-- 4. Drop old constraints on price_database
-- ============================================
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_database_category_unit_supply_type_region_key;
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_item_unique;
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_hierarchy_unique;

-- ============================================
-- 5. Create new unique constraint
-- ============================================
ALTER TABLE price_database ADD CONSTRAINT price_db_hierarchy_unique
  UNIQUE (category, subcategory, material_method, unit, supply_type, region);

-- ============================================
-- 6. Add indexes for hierarchical queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_price_db_hierarchy ON price_database(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_price_dp_hierarchy ON price_data_points(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_cost_records_hierarchy ON cost_records(category, subcategory);

-- ============================================
-- 7. Backfill existing price_database rows
-- ============================================
UPDATE price_database SET
  subcategory = CASE
    -- Demolition
    WHEN category = 'Demolition' AND item_name ILIKE '%floor%tile%' THEN 'Floor Hacking'
    WHEN category = 'Demolition' AND item_name ILIKE '%wall%' THEN 'Wall Hacking'
    WHEN category = 'Demolition' AND item_name ILIKE '%ceiling%' THEN 'Ceiling Removal'
    WHEN category = 'Demolition' AND item_name ILIKE '%door%' THEN 'Door/Window Removal'
    WHEN category = 'Demolition' AND item_name ILIKE '%debris%' THEN 'Debris Disposal'
    -- Tiling
    WHEN category = 'Tiling' AND item_name ILIKE '%floor%' THEN 'Floor Tiles'
    WHEN category = 'Tiling' AND item_name ILIKE '%wall%' THEN 'Wall Tiles'
    WHEN category = 'Tiling' AND item_name ILIKE '%outdoor%' THEN 'Outdoor/Balcony Tiles'
    WHEN category = 'Tiling' AND item_name ILIKE '%balcony%' THEN 'Outdoor/Balcony Tiles'
    WHEN category = 'Tiling' AND item_name ILIKE '%grout%' THEN 'Tile Grouting'
    WHEN category = 'Tiling' AND item_name ILIKE '%feature%' THEN 'Wall Tiles'
    -- Electrical
    WHEN category = 'Electrical' AND item_name ILIKE '%socket%' THEN 'Power Points'
    WHEN category = 'Electrical' AND item_name ILIKE '%power%' THEN 'Power Points'
    WHEN category = 'Electrical' AND item_name ILIKE '%light%' THEN 'Lighting Points'
    WHEN category = 'Electrical' AND item_name ILIKE '%DB%box%' THEN 'DB Box'
    WHEN category = 'Electrical' AND item_name ILIKE '%rewire%' THEN 'Rewiring'
    WHEN category = 'Electrical' AND item_name ILIKE '%TV%' THEN 'Data/Comms'
    WHEN category = 'Electrical' AND item_name ILIKE '%data%' THEN 'Data/Comms'
    WHEN category = 'Electrical' AND item_name ILIKE '%fan%' THEN 'Fan Points'
    -- Plumbing
    WHEN category = 'Plumbing' AND item_name ILIKE '%basin%' THEN 'Basin/Sink'
    WHEN category = 'Plumbing' AND item_name ILIKE '%sink%' THEN 'Basin/Sink'
    WHEN category = 'Plumbing' AND item_name ILIKE '%WC%' THEN 'WC/Toilet'
    WHEN category = 'Plumbing' AND item_name ILIKE '%shower%' THEN 'Shower'
    WHEN category = 'Plumbing' AND item_name ILIKE '%water heater%' THEN 'Water Heater'
    WHEN category = 'Plumbing' AND item_name ILIKE '%floor trap%' THEN 'Floor Trap'
    WHEN category = 'Plumbing' AND item_name ILIKE '%pipe%' THEN 'Piping Installation'
    -- Painting
    WHEN category = 'Painting' AND item_name ILIKE '%interior%' THEN 'Interior Wall'
    WHEN category = 'Painting' AND item_name ILIKE '%ceiling%' THEN 'Ceiling'
    WHEN category = 'Painting' AND item_name ILIKE '%feature%' THEN 'Feature Wall'
    WHEN category = 'Painting' AND item_name ILIKE '%texture%' THEN 'Feature Wall'
    WHEN category = 'Painting' AND item_name ILIKE '%exterior%' THEN 'Exterior'
    WHEN category = 'Painting' AND item_name ILIKE '%skim%' THEN 'Skimcoat/Prep'
    -- False Ceiling
    WHEN category = 'False Ceiling' AND item_name ILIKE '%plaster%ceil%' THEN 'False Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%plasterboard%' THEN 'False Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%L-box%' THEN 'Design Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%cove%' THEN 'Design Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%coffered%' THEN 'Design Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%tray%' THEN 'Design Ceiling'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%partition%' THEN 'Partition Wall'
    WHEN category = 'False Ceiling' AND item_name ILIKE '%corni%' THEN 'Cornice'
    -- Carpentry
    WHEN category = 'Carpentry' AND item_name ILIKE '%kitchen%' THEN 'Kitchen Cabinet'
    WHEN category = 'Carpentry' AND item_name ILIKE '%wardrobe%' THEN 'Wardrobe'
    WHEN category = 'Carpentry' AND item_name ILIKE '%TV%' THEN 'TV Console/Feature'
    WHEN category = 'Carpentry' AND item_name ILIKE '%shoe%' THEN 'Shoe Cabinet'
    WHEN category = 'Carpentry' AND item_name ILIKE '%vanity%' THEN 'Vanity Cabinet'
    WHEN category = 'Carpentry' AND item_name ILIKE '%study%' THEN 'Study/Bookshelf'
    WHEN category = 'Carpentry' AND item_name ILIKE '%book%' THEN 'Study/Bookshelf'
    -- Waterproofing
    WHEN category = 'Waterproofing' AND item_name ILIKE '%bathroom%' THEN 'Bathroom Floor'
    WHEN category = 'Waterproofing' AND item_name ILIKE '%roof%' THEN 'Flat Roof'
    WHEN category = 'Waterproofing' AND item_name ILIKE '%balcony%' THEN 'Balcony'
    WHEN category = 'Waterproofing' AND item_name ILIKE '%planter%' THEN 'Planter Box'
    WHEN category = 'Waterproofing' AND item_name ILIKE '%tank%' THEN 'Planter Box'
    -- Aluminium
    WHEN category = 'Aluminium' AND item_name ILIKE '%casement%' THEN 'Casement Window'
    WHEN category = 'Aluminium' AND item_name ILIKE '%sliding door%' THEN 'Sliding Door'
    WHEN category = 'Aluminium' AND item_name ILIKE '%sliding%' THEN 'Sliding Window'
    WHEN category = 'Aluminium' AND item_name ILIKE '%bi-fold%' THEN 'Bi-fold Door'
    WHEN category = 'Aluminium' AND item_name ILIKE '%partition%' THEN 'Fixed Panel / Screen'
    WHEN category = 'Aluminium' AND item_name ILIKE '%screen%' THEN 'Fixed Panel / Screen'
    -- Glass
    WHEN category = 'Glass' AND item_name ILIKE '%shower%' THEN 'Shower Screen'
    WHEN category = 'Glass' AND item_name ILIKE '%partition%' THEN 'Fixed Glass'
    WHEN category = 'Glass' AND item_name ILIKE '%frosted%' THEN 'Fixed Glass'
    WHEN category = 'Glass' AND item_name ILIKE '%mirror%' THEN 'Mirror'
    WHEN category = 'Glass' AND item_name ILIKE '%clear%' THEN 'Glass Panel'
    -- Flooring
    WHEN category = 'Flooring' AND item_name ILIKE '%solid%' THEN 'Timber'
    WHEN category = 'Flooring' AND item_name ILIKE '%parquet%' THEN 'Timber'
    WHEN category = 'Flooring' AND item_name ILIKE '%engineered%' THEN 'Timber'
    WHEN category = 'Flooring' AND item_name ILIKE '%vinyl%' THEN 'Vinyl'
    WHEN category = 'Flooring' AND item_name ILIKE '%LVT%' THEN 'Vinyl'
    WHEN category = 'Flooring' AND item_name ILIKE '%skirting%' THEN 'Skirting'
    -- Air Conditioning
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%1.0HP%' THEN 'Split Unit'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%1.5HP%' THEN 'Split Unit'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%2.0HP%' THEN 'Split Unit'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%split%' THEN 'Split Unit'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%refrig%' THEN 'Piping'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%trunk%' THEN 'Piping'
    WHEN category = 'Air Conditioning' AND item_name ILIKE '%pipe%' THEN 'Piping'
    -- Metal Work
    WHEN category = 'Metal Work' AND item_name ILIKE '%railing%' THEN 'Railing'
    WHEN category = 'Metal Work' AND item_name ILIKE '%gate%' THEN 'Gate'
    -- Cleaning
    WHEN category = 'Cleaning' AND item_name ILIKE '%post%' THEN 'Post-renovation'
    WHEN category = 'Cleaning' AND item_name ILIKE '%window%' THEN 'Window/Glass'
    WHEN category = 'Cleaning' AND item_name ILIKE '%chemical%' THEN 'Chemical Wash'
    ELSE 'General'
  END,
  material_method = CASE
    -- Tiling sizes
    WHEN item_name ILIKE '%basic%' AND category = 'Tiling' THEN '300x300'
    WHEN item_name ILIKE '%mid-range%' AND category = 'Tiling' THEN '600x600'
    WHEN item_name ILIKE '%premium%' AND category = 'Tiling' THEN '1200x600'
    WHEN item_name ILIKE '%large format%' AND category = 'Tiling' THEN '1200x600'
    WHEN item_name ILIKE '%mosaic%' THEN 'Feature/Mosaic'
    WHEN item_name ILIKE '%pattern%' THEN 'Feature/Mosaic'
    WHEN item_name ILIKE '%anti-slip%' THEN 'Anti-slip'
    WHEN item_name ILIKE '%epoxy%' THEN 'Epoxy Grout'
    -- Electrical
    WHEN item_name ILIKE '%13A%' THEN '13A Socket'
    WHEN item_name ILIKE '%12-way%' THEN '12-way'
    WHEN item_name ILIKE '%ceiling fan%' THEN 'Ceiling Fan'
    -- Plumbing
    WHEN item_name ILIKE '%polypipe%' THEN 'PVC'
    WHEN item_name ILIKE '%rain%' THEN 'Rain Shower Set'
    WHEN item_name ILIKE '%wall-hung%' THEN 'Wall-hung WC'
    -- Painting
    WHEN item_name ILIKE '%2-coat%' THEN '2-coat'
    WHEN item_name ILIKE '%texture%' THEN 'Texture Finish'
    WHEN item_name ILIKE '%weather%' THEN 'Weather-shield'
    -- False Ceiling
    WHEN item_name ILIKE '%plasterboard%' THEN 'Plasterboard'
    WHEN item_name ILIKE '%L-box%' THEN 'L-box/Cove'
    WHEN item_name ILIKE '%cove%' THEN 'L-box/Cove'
    WHEN item_name ILIKE '%coffered%' THEN 'Coffered/Tray'
    WHEN item_name ILIKE '%tray%' THEN 'Coffered/Tray'
    WHEN item_name ILIKE '%single%layer%' THEN 'Single Layer'
    WHEN item_name ILIKE '%PU cornice%' THEN 'PU Cornice'
    -- Carpentry
    WHEN item_name ILIKE '%sliding%' AND category = 'Carpentry' THEN 'Sliding Door'
    WHEN item_name ILIKE '%laminated%' THEN 'Laminated'
    -- Waterproofing
    WHEN item_name ILIKE '%membrane%' THEN 'Membrane'
    WHEN item_name ILIKE '%cementitious%' THEN 'Cementitious'
    WHEN item_name ILIKE '%torch%' THEN 'Torch-on Membrane'
    -- Glass
    WHEN item_name ILIKE '%tempered%10mm%' THEN 'Tempered 10mm'
    WHEN item_name ILIKE '%tempered%12mm%' THEN 'Tempered 12mm'
    WHEN item_name ILIKE '%frosted%' THEN 'Frosted/Sandblasted'
    WHEN item_name ILIKE '%sandblasted%' THEN 'Frosted/Sandblasted'
    -- Flooring
    WHEN item_name ILIKE '%solid%parquet%' THEN 'Solid Parquet'
    WHEN item_name ILIKE '%engineered%' THEN 'Engineered Timber'
    WHEN item_name ILIKE '%LVT%' OR item_name ILIKE '%vinyl%plank%' THEN 'LVT (Glue-down)'
    -- AC
    WHEN item_name ILIKE '%1.0HP%' THEN '1.0HP Inverter'
    WHEN item_name ILIKE '%1.5HP%' THEN '1.5HP Inverter'
    WHEN item_name ILIKE '%2.0HP%' THEN '2.0HP Inverter'
    -- Metal
    WHEN item_name ILIKE '%mild steel%' THEN 'Mild Steel (Powder Coated)'
    WHEN item_name ILIKE '%SS304%' OR item_name ILIKE '%stainless%' THEN 'Stainless Steel SS304'
    WHEN item_name ILIKE '%single leaf%' THEN 'Single Leaf'
    ELSE 'Standard'
  END
WHERE subcategory = 'General';
