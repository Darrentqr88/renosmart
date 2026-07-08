-- Migration 025: Align price_database subcategories/material_methods with item-classifier output
-- Fixes mismatch where seed data uses names the classifier doesn't produce

-- 1. Painting: "Specialty" → "Feature Wall" (classifier maps texture/limewash to Feature Wall)
UPDATE price_database
SET subcategory = 'Feature Wall'
WHERE category = 'Painting'
  AND subcategory = 'Specialty'
  AND material_method IN ('Textured Finish', 'Limewash');

-- 2. Table Top: align old seed subcategory "Stone Top" → "Kitchen Countertop"
-- (classifier maps kitchen-related countertops to Kitchen Countertop)
UPDATE price_database
SET subcategory = 'Kitchen Countertop'
WHERE category = 'Table Top'
  AND subcategory = 'Stone Top';

-- 3. Table Top: "Laminate Top" → "General Countertop" for Postform
UPDATE price_database
SET subcategory = 'General Countertop'
WHERE category = 'Table Top'
  AND subcategory = 'Laminate Top';
