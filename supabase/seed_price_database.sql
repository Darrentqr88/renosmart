-- RenoSmart Price Intelligence Database Seed Data
-- Malaysia prices in RM (MY_KL base, MY_JB ~88%, MY_PG ~92%)
-- Singapore prices in SGD
-- Run this in Supabase SQL Editor

-- Step 1: Add item_name column
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '';

-- Step 2: Unique constraint
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_item_unique;
ALTER TABLE price_database ADD CONSTRAINT price_db_item_unique UNIQUE (item_name, category, unit, region);

-- Step 3: Seed data
INSERT INTO price_database (item_name, category, unit, region, min_price, max_price, avg_price, sample_count, confidence, updated_at) VALUES

-- ═══════════════════════════════════
-- DEMOLITION
-- ═══════════════════════════════════
('Hack & remove floor tiles','Demolition','sqft','MY_KL',2.50,4.50,3.50,85,'high',NOW()),
('Hack & remove floor tiles','Demolition','sqft','MY_JB',2.20,3.96,3.08,62,'high',NOW()),
('Hack & remove floor tiles','Demolition','sqft','MY_PG',2.30,4.14,3.22,54,'high',NOW()),
('Hack & remove floor tiles','Demolition','sqft','SG',4.00,7.50,5.75,73,'high',NOW()),

('Demolish non-structural wall','Demolition','sqft','MY_KL',6.00,10.00,8.00,78,'high',NOW()),
('Demolish non-structural wall','Demolition','sqft','MY_JB',5.28,8.80,7.04,58,'high',NOW()),
('Demolish non-structural wall','Demolition','sqft','MY_PG',5.52,9.20,7.36,49,'high',NOW()),
('Demolish non-structural wall','Demolition','sqft','SG',10.00,18.00,14.00,65,'high',NOW()),

('Remove false ceiling','Demolition','sqft','MY_KL',2.00,3.50,2.75,70,'high',NOW()),
('Remove false ceiling','Demolition','sqft','MY_JB',1.76,3.08,2.42,52,'high',NOW()),
('Remove false ceiling','Demolition','sqft','MY_PG',1.84,3.22,2.53,45,'high',NOW()),
('Remove false ceiling','Demolition','sqft','SG',3.50,6.00,4.75,58,'high',NOW()),

('Remove door & frame','Demolition','unit','MY_KL',120.00,250.00,185.00,65,'high',NOW()),
('Remove door & frame','Demolition','unit','MY_JB',105.60,220.00,162.80,48,'high',NOW()),
('Remove door & frame','Demolition','unit','MY_PG',110.40,230.00,170.20,41,'high',NOW()),
('Remove door & frame','Demolition','unit','SG',200.00,400.00,300.00,55,'high',NOW()),

('Debris removal & disposal','Demolition','load','MY_KL',300.00,600.00,450.00,72,'high',NOW()),
('Debris removal & disposal','Demolition','load','MY_JB',264.00,528.00,396.00,54,'high',NOW()),
('Debris removal & disposal','Demolition','load','MY_PG',276.00,552.00,414.00,46,'high',NOW()),
('Debris removal & disposal','Demolition','load','SG',500.00,1000.00,750.00,60,'high',NOW()),

-- ═══════════════════════════════════
-- TILING
-- ═══════════════════════════════════
('Floor tiles S&I (basic grade)','Tiling','sqft','MY_KL',5.50,8.50,7.00,210,'high',NOW()),
('Floor tiles S&I (basic grade)','Tiling','sqft','MY_JB',4.84,7.48,6.16,158,'high',NOW()),
('Floor tiles S&I (basic grade)','Tiling','sqft','MY_PG',5.06,7.82,6.44,132,'high',NOW()),
('Floor tiles S&I (basic grade)','Tiling','sqft','SG',9.00,15.00,12.00,185,'high',NOW()),

('Floor tiles S&I (mid-range)','Tiling','sqft','MY_KL',8.50,13.00,10.75,178,'high',NOW()),
('Floor tiles S&I (mid-range)','Tiling','sqft','MY_JB',7.48,11.44,9.46,134,'high',NOW()),
('Floor tiles S&I (mid-range)','Tiling','sqft','MY_PG',7.82,11.96,9.89,112,'high',NOW()),
('Floor tiles S&I (mid-range)','Tiling','sqft','SG',14.00,22.00,18.00,155,'high',NOW()),

('Floor tiles S&I (premium/large format)','Tiling','sqft','MY_KL',13.00,22.00,17.50,142,'high',NOW()),
('Floor tiles S&I (premium/large format)','Tiling','sqft','MY_JB',11.44,19.36,15.40,108,'high',NOW()),
('Floor tiles S&I (premium/large format)','Tiling','sqft','MY_PG',11.96,20.24,16.10,92,'high',NOW()),
('Floor tiles S&I (premium/large format)','Tiling','sqft','SG',22.00,38.00,30.00,125,'high',NOW()),

('Bathroom wall tiles S&I','Tiling','sqft','MY_KL',7.00,12.00,9.50,195,'high',NOW()),
('Bathroom wall tiles S&I','Tiling','sqft','MY_JB',6.16,10.56,8.36,148,'high',NOW()),
('Bathroom wall tiles S&I','Tiling','sqft','MY_PG',6.44,11.04,8.74,124,'high',NOW()),
('Bathroom wall tiles S&I','Tiling','sqft','SG',12.00,20.00,16.00,170,'high',NOW()),

('Feature wall tiles (mosaic/pattern)','Tiling','sqft','MY_KL',15.00,30.00,22.50,98,'high',NOW()),
('Feature wall tiles (mosaic/pattern)','Tiling','sqft','MY_JB',13.20,26.40,19.80,74,'high',NOW()),
('Feature wall tiles (mosaic/pattern)','Tiling','sqft','MY_PG',13.80,27.60,20.70,62,'high',NOW()),
('Feature wall tiles (mosaic/pattern)','Tiling','sqft','SG',25.00,50.00,37.50,85,'high',NOW()),

('Outdoor/balcony anti-slip tiles S&I','Tiling','sqft','MY_KL',8.00,14.00,11.00,115,'high',NOW()),
('Outdoor/balcony anti-slip tiles S&I','Tiling','sqft','MY_JB',7.04,12.32,9.68,88,'high',NOW()),
('Outdoor/balcony anti-slip tiles S&I','Tiling','sqft','MY_PG',7.36,12.88,10.12,74,'high',NOW()),
('Outdoor/balcony anti-slip tiles S&I','Tiling','sqft','SG',13.00,22.00,17.50,100,'high',NOW()),

('Tile grouting only (labour)','Tiling','sqft','MY_KL',1.50,3.00,2.25,88,'high',NOW()),
('Tile grouting only (labour)','Tiling','sqft','MY_JB',1.32,2.64,1.98,66,'high',NOW()),
('Tile grouting only (labour)','Tiling','sqft','MY_PG',1.38,2.76,2.07,55,'high',NOW()),
('Tile grouting only (labour)','Tiling','sqft','SG',2.50,5.00,3.75,75,'high',NOW()),

-- ═══════════════════════════════════
-- ELECTRICAL
-- ═══════════════════════════════════
('13A power socket point (new)','Electrical','point','MY_KL',90.00,160.00,125.00,320,'high',NOW()),
('13A power socket point (new)','Electrical','point','MY_JB',79.20,140.80,110.00,242,'high',NOW()),
('13A power socket point (new)','Electrical','point','MY_PG',82.80,147.20,115.00,205,'high',NOW()),
('13A power socket point (new)','Electrical','point','SG',150.00,260.00,205.00,285,'high',NOW()),

('Lighting point (new)','Electrical','point','MY_KL',70.00,110.00,90.00,285,'high',NOW()),
('Lighting point (new)','Electrical','point','MY_JB',61.60,96.80,79.20,215,'high',NOW()),
('Lighting point (new)','Electrical','point','MY_PG',64.40,101.20,82.80,182,'high',NOW()),
('Lighting point (new)','Electrical','point','SG',120.00,200.00,160.00,250,'high',NOW()),

('DB box replacement (12-way)','Electrical','unit','MY_KL',900.00,1600.00,1250.00,145,'high',NOW()),
('DB box replacement (12-way)','Electrical','unit','MY_JB',792.00,1408.00,1100.00,110,'high',NOW()),
('DB box replacement (12-way)','Electrical','unit','MY_PG',828.00,1472.00,1150.00,92,'high',NOW()),
('DB box replacement (12-way)','Electrical','unit','SG',1500.00,2800.00,2150.00,128,'high',NOW()),

('Rewire existing point','Electrical','point','MY_KL',55.00,100.00,77.50,198,'high',NOW()),
('Rewire existing point','Electrical','point','MY_JB',48.40,88.00,68.20,150,'high',NOW()),
('Rewire existing point','Electrical','point','MY_PG',50.60,92.00,71.30,128,'high',NOW()),
('Rewire existing point','Electrical','point','SG',90.00,170.00,130.00,175,'high',NOW()),

('TV/data/telephone point','Electrical','point','MY_KL',85.00,135.00,110.00,175,'high',NOW()),
('TV/data/telephone point','Electrical','point','MY_JB',74.80,118.80,96.80,132,'high',NOW()),
('TV/data/telephone point','Electrical','point','MY_PG',78.20,124.20,101.20,112,'high',NOW()),
('TV/data/telephone point','Electrical','point','SG',140.00,240.00,190.00,155,'high',NOW()),

('Ceiling fan point with regulator','Electrical','point','MY_KL',80.00,130.00,105.00,165,'high',NOW()),
('Ceiling fan point with regulator','Electrical','point','MY_JB',70.40,114.40,92.40,125,'high',NOW()),
('Ceiling fan point with regulator','Electrical','point','MY_PG',73.60,119.60,96.60,105,'high',NOW()),
('Ceiling fan point with regulator','Electrical','point','SG',130.00,230.00,180.00,145,'high',NOW()),

-- ═══════════════════════════════════
-- PLUMBING
-- ═══════════════════════════════════
('Basin mixer tap S&I','Plumbing','unit','MY_KL',250.00,550.00,400.00,185,'high',NOW()),
('Basin mixer tap S&I','Plumbing','unit','MY_JB',220.00,484.00,352.00,140,'high',NOW()),
('Basin mixer tap S&I','Plumbing','unit','MY_PG',230.00,506.00,368.00,118,'high',NOW()),
('Basin mixer tap S&I','Plumbing','unit','SG',400.00,900.00,650.00,162,'high',NOW()),

('Shower set S&I (rain + handheld)','Plumbing','unit','MY_KL',450.00,900.00,675.00,175,'high',NOW()),
('Shower set S&I (rain + handheld)','Plumbing','unit','MY_JB',396.00,792.00,594.00,132,'high',NOW()),
('Shower set S&I (rain + handheld)','Plumbing','unit','MY_PG',414.00,828.00,621.00,112,'high',NOW()),
('Shower set S&I (rain + handheld)','Plumbing','unit','SG',750.00,1500.00,1125.00,152,'high',NOW()),

('Water heater point (piping)','Plumbing','point','MY_KL',180.00,320.00,250.00,152,'high',NOW()),
('Water heater point (piping)','Plumbing','point','MY_JB',158.40,281.60,220.00,115,'high',NOW()),
('Water heater point (piping)','Plumbing','point','MY_PG',165.60,294.40,230.00,98,'high',NOW()),
('Water heater point (piping)','Plumbing','point','SG',300.00,550.00,425.00,135,'high',NOW()),

('Floor trap (replace)','Plumbing','unit','MY_KL',90.00,170.00,130.00,142,'high',NOW()),
('Floor trap (replace)','Plumbing','unit','MY_JB',79.20,149.60,114.40,108,'high',NOW()),
('Floor trap (replace)','Plumbing','unit','MY_PG',82.80,156.40,119.60,92,'high',NOW()),
('Floor trap (replace)','Plumbing','unit','SG',150.00,280.00,215.00,125,'high',NOW()),

('Pipe works — polypipe replacement','Plumbing','m','MY_KL',65.00,130.00,97.50,132,'high',NOW()),
('Pipe works — polypipe replacement','Plumbing','m','MY_JB',57.20,114.40,85.80,100,'high',NOW()),
('Pipe works — polypipe replacement','Plumbing','m','MY_PG',59.80,119.60,89.70,85,'high',NOW()),
('Pipe works — polypipe replacement','Plumbing','m','SG',110.00,220.00,165.00,115,'high',NOW()),

('WC pan & cistern S&I','Plumbing','unit','MY_KL',500.00,1200.00,850.00,165,'high',NOW()),
('WC pan & cistern S&I','Plumbing','unit','MY_JB',440.00,1056.00,748.00,125,'high',NOW()),
('WC pan & cistern S&I','Plumbing','unit','MY_PG',460.00,1104.00,782.00,105,'high',NOW()),
('WC pan & cistern S&I','Plumbing','unit','SG',850.00,2000.00,1425.00,145,'high',NOW()),

('Kitchen sink & tap S&I','Plumbing','unit','MY_KL',350.00,800.00,575.00,158,'high',NOW()),
('Kitchen sink & tap S&I','Plumbing','unit','MY_JB',308.00,704.00,506.00,120,'high',NOW()),
('Kitchen sink & tap S&I','Plumbing','unit','MY_PG',322.00,736.00,529.00,102,'high',NOW()),
('Kitchen sink & tap S&I','Plumbing','unit','SG',580.00,1350.00,965.00,138,'high',NOW()),

-- ═══════════════════════════════════
-- PAINTING
-- ═══════════════════════════════════
('Interior walls 2-coat finish','Painting','sqft','MY_KL',1.50,2.80,2.15,380,'high',NOW()),
('Interior walls 2-coat finish','Painting','sqft','MY_JB',1.32,2.46,1.89,288,'high',NOW()),
('Interior walls 2-coat finish','Painting','sqft','MY_PG',1.38,2.58,1.98,244,'high',NOW()),
('Interior walls 2-coat finish','Painting','sqft','SG',2.50,4.50,3.50,335,'high',NOW()),

('Ceiling 2-coat finish','Painting','sqft','MY_KL',1.30,2.20,1.75,355,'high',NOW()),
('Ceiling 2-coat finish','Painting','sqft','MY_JB',1.14,1.94,1.54,268,'high',NOW()),
('Ceiling 2-coat finish','Painting','sqft','MY_PG',1.20,2.02,1.61,228,'high',NOW()),
('Ceiling 2-coat finish','Painting','sqft','SG',2.20,3.80,3.00,312,'high',NOW()),

('Feature wall texture/design finish','Painting','sqft','MY_KL',4.50,9.00,6.75,145,'high',NOW()),
('Feature wall texture/design finish','Painting','sqft','MY_JB',3.96,7.92,5.94,110,'high',NOW()),
('Feature wall texture/design finish','Painting','sqft','MY_PG',4.14,8.28,6.21,92,'high',NOW()),
('Feature wall texture/design finish','Painting','sqft','SG',7.50,15.00,11.25,128,'high',NOW()),

('Skimcoat & sanding (wall prep)','Painting','sqft','MY_KL',1.20,2.20,1.70,298,'high',NOW()),
('Skimcoat & sanding (wall prep)','Painting','sqft','MY_JB',1.06,1.94,1.50,226,'high',NOW()),
('Skimcoat & sanding (wall prep)','Painting','sqft','MY_PG',1.10,2.02,1.56,192,'high',NOW()),
('Skimcoat & sanding (wall prep)','Painting','sqft','SG',2.00,3.80,2.90,262,'high',NOW()),

('Exterior wall painting','Painting','sqft','MY_KL',1.80,3.50,2.65,215,'high',NOW()),
('Exterior wall painting','Painting','sqft','MY_JB',1.58,3.08,2.33,162,'high',NOW()),
('Exterior wall painting','Painting','sqft','MY_PG',1.66,3.22,2.44,138,'high',NOW()),
('Exterior wall painting','Painting','sqft','SG',3.00,5.80,4.40,188,'high',NOW()),

-- ═══════════════════════════════════
-- FALSE CEILING
-- ═══════════════════════════════════
('Plasterboard false ceiling','False Ceiling','sqft','MY_KL',7.00,13.00,10.00,265,'high',NOW()),
('Plasterboard false ceiling','False Ceiling','sqft','MY_JB',6.16,11.44,8.80,200,'high',NOW()),
('Plasterboard false ceiling','False Ceiling','sqft','MY_PG',6.44,11.96,9.20,170,'high',NOW()),
('Plasterboard false ceiling','False Ceiling','sqft','SG',12.00,22.00,17.00,232,'high',NOW()),

('L-box cove lighting design','False Ceiling','lm','MY_KL',45.00,90.00,67.50,198,'high',NOW()),
('L-box cove lighting design','False Ceiling','lm','MY_JB',39.60,79.20,59.40,150,'high',NOW()),
('L-box cove lighting design','False Ceiling','lm','MY_PG',41.40,82.80,62.10,128,'high',NOW()),
('L-box cove lighting design','False Ceiling','lm','SG',75.00,150.00,112.50,175,'high',NOW()),

('Coffered/tray ceiling feature','False Ceiling','sqft','MY_KL',14.00,25.00,19.50,125,'high',NOW()),
('Coffered/tray ceiling feature','False Ceiling','sqft','MY_JB',12.32,22.00,17.16,95,'high',NOW()),
('Coffered/tray ceiling feature','False Ceiling','sqft','MY_PG',12.88,23.00,17.94,80,'high',NOW()),
('Coffered/tray ceiling feature','False Ceiling','sqft','SG',23.00,42.00,32.50,110,'high',NOW()),

('Gypsum board partition wall','False Ceiling','sqft','MY_KL',35.00,65.00,50.00,145,'high',NOW()),
('Gypsum board partition wall','False Ceiling','sqft','MY_JB',30.80,57.20,44.00,110,'high',NOW()),
('Gypsum board partition wall','False Ceiling','sqft','MY_PG',32.20,59.80,46.00,92,'high',NOW()),
('Gypsum board partition wall','False Ceiling','sqft','SG',58.00,110.00,84.00,128,'high',NOW()),

('Cornicing (cornice strip)','False Ceiling','lm','MY_KL',8.00,15.00,11.50,175,'high',NOW()),
('Cornicing (cornice strip)','False Ceiling','lm','MY_JB',7.04,13.20,10.12,132,'high',NOW()),
('Cornicing (cornice strip)','False Ceiling','lm','MY_PG',7.36,13.80,10.58,112,'high',NOW()),
('Cornicing (cornice strip)','False Ceiling','lm','SG',13.00,25.00,19.00,155,'high',NOW()),

-- ═══════════════════════════════════
-- CARPENTRY
-- ═══════════════════════════════════
('Kitchen lower cabinet S&I','Carpentry','ft run','MY_KL',380.00,650.00,515.00,245,'high',NOW()),
('Kitchen lower cabinet S&I','Carpentry','ft run','MY_JB',334.40,572.00,453.20,185,'high',NOW()),
('Kitchen lower cabinet S&I','Carpentry','ft run','MY_PG',349.60,598.00,474.00,158,'high',NOW()),
('Kitchen lower cabinet S&I','Carpentry','ft run','SG',630.00,1100.00,865.00,215,'high',NOW()),

('Kitchen upper cabinet S&I','Carpentry','ft run','MY_KL',320.00,550.00,435.00,232,'high',NOW()),
('Kitchen upper cabinet S&I','Carpentry','ft run','MY_JB',281.60,484.00,382.80,175,'high',NOW()),
('Kitchen upper cabinet S&I','Carpentry','ft run','MY_PG',294.40,506.00,400.20,148,'high',NOW()),
('Kitchen upper cabinet S&I','Carpentry','ft run','SG',530.00,920.00,725.00,205,'high',NOW()),

('Wardrobe with sliding door','Carpentry','ft','MY_KL',550.00,950.00,750.00,218,'high',NOW()),
('Wardrobe with sliding door','Carpentry','ft','MY_JB',484.00,836.00,660.00,165,'high',NOW()),
('Wardrobe with sliding door','Carpentry','ft','MY_PG',506.00,874.00,690.00,140,'high',NOW()),
('Wardrobe with sliding door','Carpentry','ft','SG',920.00,1600.00,1260.00,192,'high',NOW()),

('TV feature wall with shelving','Carpentry','ft','MY_KL',850.00,1600.00,1225.00,185,'high',NOW()),
('TV feature wall with shelving','Carpentry','ft','MY_JB',748.00,1408.00,1078.00,140,'high',NOW()),
('TV feature wall with shelving','Carpentry','ft','MY_PG',782.00,1472.00,1127.00,118,'high',NOW()),
('TV feature wall with shelving','Carpentry','ft','SG',1420.00,2700.00,2060.00,162,'high',NOW()),

('Shoe cabinet built-in','Carpentry','ft','MY_KL',380.00,650.00,515.00,175,'high',NOW()),
('Shoe cabinet built-in','Carpentry','ft','MY_JB',334.40,572.00,453.20,132,'high',NOW()),
('Shoe cabinet built-in','Carpentry','ft','MY_PG',349.60,598.00,474.00,112,'high',NOW()),
('Shoe cabinet built-in','Carpentry','ft','SG',630.00,1090.00,860.00,155,'high',NOW()),

('Vanity cabinet bathroom','Carpentry','ft','MY_KL',420.00,750.00,585.00,168,'high',NOW()),
('Vanity cabinet bathroom','Carpentry','ft','MY_JB',369.60,660.00,514.80,128,'high',NOW()),
('Vanity cabinet bathroom','Carpentry','ft','MY_PG',386.40,690.00,538.20,108,'high',NOW()),
('Vanity cabinet bathroom','Carpentry','ft','SG',700.00,1260.00,980.00,148,'high',NOW()),

('Study desk & bookshelf unit','Carpentry','ft','MY_KL',550.00,1000.00,775.00,152,'high',NOW()),
('Study desk & bookshelf unit','Carpentry','ft','MY_JB',484.00,880.00,682.00,115,'high',NOW()),
('Study desk & bookshelf unit','Carpentry','ft','MY_PG',506.00,920.00,713.00,98,'high',NOW()),
('Study desk & bookshelf unit','Carpentry','ft','SG',920.00,1680.00,1300.00,135,'high',NOW()),

-- ═══════════════════════════════════
-- WATERPROOFING
-- ═══════════════════════════════════
('Bathroom floor waterproofing','Waterproofing','sqft','MY_KL',6.00,11.00,8.50,195,'high',NOW()),
('Bathroom floor waterproofing','Waterproofing','sqft','MY_JB',5.28,9.68,7.48,148,'high',NOW()),
('Bathroom floor waterproofing','Waterproofing','sqft','MY_PG',5.52,10.12,7.82,125,'high',NOW()),
('Bathroom floor waterproofing','Waterproofing','sqft','SG',10.00,18.00,14.00,172,'high',NOW()),

('Flat roof waterproofing (membrane)','Waterproofing','sqft','MY_KL',9.00,17.00,13.00,145,'high',NOW()),
('Flat roof waterproofing (membrane)','Waterproofing','sqft','MY_JB',7.92,14.96,11.44,110,'high',NOW()),
('Flat roof waterproofing (membrane)','Waterproofing','sqft','MY_PG',8.28,15.64,11.96,92,'high',NOW()),
('Flat roof waterproofing (membrane)','Waterproofing','sqft','SG',15.00,28.00,21.50,128,'high',NOW()),

('Balcony floor waterproofing','Waterproofing','sqft','MY_KL',7.00,12.00,9.50,165,'high',NOW()),
('Balcony floor waterproofing','Waterproofing','sqft','MY_JB',6.16,10.56,8.36,125,'high',NOW()),
('Balcony floor waterproofing','Waterproofing','sqft','MY_PG',6.44,11.04,8.74,105,'high',NOW()),
('Balcony floor waterproofing','Waterproofing','sqft','SG',12.00,20.00,16.00,145,'high',NOW()),

('Water tank / planter box waterproofing','Waterproofing','sqft','MY_KL',8.00,15.00,11.50,128,'high',NOW()),
('Water tank / planter box waterproofing','Waterproofing','sqft','MY_JB',7.04,13.20,10.12,98,'high',NOW()),
('Water tank / planter box waterproofing','Waterproofing','sqft','MY_PG',7.36,13.80,10.58,82,'high',NOW()),
('Water tank / planter box waterproofing','Waterproofing','sqft','SG',13.00,25.00,19.00,112,'high',NOW()),

-- ═══════════════════════════════════
-- ALUMINIUM
-- ═══════════════════════════════════
('Aluminium casement window S&I','Aluminium','sqft','MY_KL',38.00,65.00,51.50,178,'high',NOW()),
('Aluminium casement window S&I','Aluminium','sqft','MY_JB',33.44,57.20,45.32,135,'high',NOW()),
('Aluminium casement window S&I','Aluminium','sqft','MY_PG',34.96,59.80,47.38,115,'high',NOW()),
('Aluminium casement window S&I','Aluminium','sqft','SG',63.00,110.00,86.50,158,'high',NOW()),

('Aluminium sliding door S&I','Aluminium','sqft','MY_KL',42.00,72.00,57.00,162,'high',NOW()),
('Aluminium sliding door S&I','Aluminium','sqft','MY_JB',36.96,63.36,50.16,122,'high',NOW()),
('Aluminium sliding door S&I','Aluminium','sqft','MY_PG',38.64,66.24,52.44,104,'high',NOW()),
('Aluminium sliding door S&I','Aluminium','sqft','SG',70.00,122.00,96.00,142,'high',NOW()),

('Aluminium bi-fold door S&I','Aluminium','sqft','MY_KL',55.00,90.00,72.50,125,'high',NOW()),
('Aluminium bi-fold door S&I','Aluminium','sqft','MY_JB',48.40,79.20,63.80,95,'high',NOW()),
('Aluminium bi-fold door S&I','Aluminium','sqft','MY_PG',50.60,82.80,66.70,80,'high',NOW()),
('Aluminium bi-fold door S&I','Aluminium','sqft','SG',92.00,152.00,122.00,110,'high',NOW()),

('Aluminium frame partition / screen','Aluminium','sqft','MY_KL',52.00,85.00,68.50,115,'high',NOW()),
('Aluminium frame partition / screen','Aluminium','sqft','MY_JB',45.76,74.80,60.28,88,'high',NOW()),
('Aluminium frame partition / screen','Aluminium','sqft','MY_PG',47.84,78.20,63.02,74,'high',NOW()),
('Aluminium frame partition / screen','Aluminium','sqft','SG',88.00,145.00,116.50,102,'high',NOW()),

-- ═══════════════════════════════════
-- GLASS
-- ═══════════════════════════════════
('Tempered glass shower screen','Glass','sqft','MY_KL',42.00,85.00,63.50,158,'high',NOW()),
('Tempered glass shower screen','Glass','sqft','MY_JB',36.96,74.80,55.88,120,'high',NOW()),
('Tempered glass shower screen','Glass','sqft','MY_PG',38.64,78.20,58.42,102,'high',NOW()),
('Tempered glass shower screen','Glass','sqft','SG',70.00,142.00,106.00,138,'high',NOW()),

('Clear glass partition panel','Glass','sqft','MY_KL',28.00,55.00,41.50,135,'high',NOW()),
('Clear glass partition panel','Glass','sqft','MY_JB',24.64,48.40,36.52,102,'high',NOW()),
('Clear glass partition panel','Glass','sqft','MY_PG',25.76,50.60,38.18,86,'high',NOW()),
('Clear glass partition panel','Glass','sqft','SG',47.00,93.00,70.00,118,'high',NOW()),

('Frosted / sandblasted glass','Glass','sqft','MY_KL',38.00,65.00,51.50,122,'high',NOW()),
('Frosted / sandblasted glass','Glass','sqft','MY_JB',33.44,57.20,45.32,92,'high',NOW()),
('Frosted / sandblasted glass','Glass','sqft','MY_PG',34.96,59.80,47.38,78,'high',NOW()),
('Frosted / sandblasted glass','Glass','sqft','SG',63.00,110.00,86.50,108,'high',NOW()),

('Mirror supply & install','Glass','sqft','MY_KL',25.00,50.00,37.50,145,'high',NOW()),
('Mirror supply & install','Glass','sqft','MY_JB',22.00,44.00,33.00,110,'high',NOW()),
('Mirror supply & install','Glass','sqft','MY_PG',23.00,46.00,34.50,92,'high',NOW()),
('Mirror supply & install','Glass','sqft','SG',42.00,85.00,63.50,128,'high',NOW()),

-- ═══════════════════════════════════
-- FLOORING
-- ═══════════════════════════════════
('Solid timber parquet S&I','Flooring','sqft','MY_KL',9.00,18.00,13.50,165,'high',NOW()),
('Solid timber parquet S&I','Flooring','sqft','MY_JB',7.92,15.84,11.88,125,'high',NOW()),
('Solid timber parquet S&I','Flooring','sqft','MY_PG',8.28,16.56,12.42,105,'high',NOW()),
('Solid timber parquet S&I','Flooring','sqft','SG',15.00,30.00,22.50,145,'high',NOW()),

('Engineered timber flooring S&I','Flooring','sqft','MY_KL',7.00,14.00,10.50,185,'high',NOW()),
('Engineered timber flooring S&I','Flooring','sqft','MY_JB',6.16,12.32,9.24,140,'high',NOW()),
('Engineered timber flooring S&I','Flooring','sqft','MY_PG',6.44,12.88,9.66,118,'high',NOW()),
('Engineered timber flooring S&I','Flooring','sqft','SG',12.00,24.00,18.00,162,'high',NOW()),

('Vinyl plank (LVT) flooring S&I','Flooring','sqft','MY_KL',5.50,10.00,7.75,225,'high',NOW()),
('Vinyl plank (LVT) flooring S&I','Flooring','sqft','MY_JB',4.84,8.80,6.82,170,'high',NOW()),
('Vinyl plank (LVT) flooring S&I','Flooring','sqft','MY_PG',5.06,9.20,7.13,145,'high',NOW()),
('Vinyl plank (LVT) flooring S&I','Flooring','sqft','SG',9.00,17.00,13.00,198,'high',NOW()),

('Timber/PVC skirting board','Flooring','lm','MY_KL',10.00,22.00,16.00,192,'high',NOW()),
('Timber/PVC skirting board','Flooring','lm','MY_JB',8.80,19.36,14.08,145,'high',NOW()),
('Timber/PVC skirting board','Flooring','lm','MY_PG',9.20,20.24,14.72,122,'high',NOW()),
('Timber/PVC skirting board','Flooring','lm','SG',17.00,37.00,27.00,168,'high',NOW()),

-- ═══════════════════════════════════
-- AIR CONDITIONING
-- ═══════════════════════════════════
('1.0HP inverter split unit S&I','Air Conditioning','unit','MY_KL',1600.00,2700.00,2150.00,195,'high',NOW()),
('1.0HP inverter split unit S&I','Air Conditioning','unit','MY_JB',1408.00,2376.00,1892.00,148,'high',NOW()),
('1.0HP inverter split unit S&I','Air Conditioning','unit','MY_PG',1472.00,2484.00,1978.00,125,'high',NOW()),
('1.0HP inverter split unit S&I','Air Conditioning','unit','SG',2700.00,4500.00,3600.00,172,'high',NOW()),

('1.5HP inverter split unit S&I','Air Conditioning','unit','MY_KL',1900.00,3200.00,2550.00,215,'high',NOW()),
('1.5HP inverter split unit S&I','Air Conditioning','unit','MY_JB',1672.00,2816.00,2244.00,162,'high',NOW()),
('1.5HP inverter split unit S&I','Air Conditioning','unit','MY_PG',1748.00,2944.00,2346.00,138,'high',NOW()),
('1.5HP inverter split unit S&I','Air Conditioning','unit','SG',3200.00,5500.00,4350.00,188,'high',NOW()),

('2.0HP inverter split unit S&I','Air Conditioning','unit','MY_KL',2400.00,4000.00,3200.00,185,'high',NOW()),
('2.0HP inverter split unit S&I','Air Conditioning','unit','MY_JB',2112.00,3520.00,2816.00,140,'high',NOW()),
('2.0HP inverter split unit S&I','Air Conditioning','unit','MY_PG',2208.00,3680.00,2944.00,118,'high',NOW()),
('2.0HP inverter split unit S&I','Air Conditioning','unit','SG',4000.00,6800.00,5400.00,162,'high',NOW()),

('Refrigerant piping (insulated)','Air Conditioning','m','MY_KL',55.00,110.00,82.50,175,'high',NOW()),
('Refrigerant piping (insulated)','Air Conditioning','m','MY_JB',48.40,96.80,72.60,132,'high',NOW()),
('Refrigerant piping (insulated)','Air Conditioning','m','MY_PG',50.60,101.20,75.90,112,'high',NOW()),
('Refrigerant piping (insulated)','Air Conditioning','m','SG',92.00,185.00,138.50,155,'high',NOW()),

('Trunking / conduit cover','Air Conditioning','m','MY_KL',12.00,25.00,18.50,145,'high',NOW()),
('Trunking / conduit cover','Air Conditioning','m','MY_JB',10.56,22.00,16.28,110,'high',NOW()),
('Trunking / conduit cover','Air Conditioning','m','MY_PG',11.04,23.00,17.02,92,'high',NOW()),
('Trunking / conduit cover','Air Conditioning','m','SG',20.00,42.00,31.00,128,'high',NOW()),

-- ═══════════════════════════════════
-- METAL WORK
-- ═══════════════════════════════════
('Mild steel railing (powder coated)','Metal Work','lm','MY_KL',160.00,320.00,240.00,145,'high',NOW()),
('Mild steel railing (powder coated)','Metal Work','lm','MY_JB',140.80,281.60,211.20,110,'high',NOW()),
('Mild steel railing (powder coated)','Metal Work','lm','MY_PG',147.20,294.40,220.80,92,'high',NOW()),
('Mild steel railing (powder coated)','Metal Work','lm','SG',270.00,540.00,405.00,128,'high',NOW()),

('Stainless steel SS304 railing','Metal Work','lm','MY_KL',220.00,420.00,320.00,132,'high',NOW()),
('Stainless steel SS304 railing','Metal Work','lm','MY_JB',193.60,369.60,281.60,100,'high',NOW()),
('Stainless steel SS304 railing','Metal Work','lm','MY_PG',202.40,386.40,294.40,85,'high',NOW()),
('Stainless steel SS304 railing','Metal Work','lm','SG',370.00,710.00,540.00,115,'high',NOW()),

('Metal gate single leaf','Metal Work','unit','MY_KL',600.00,1300.00,950.00,115,'high',NOW()),
('Metal gate single leaf','Metal Work','unit','MY_JB',528.00,1144.00,836.00,88,'high',NOW()),
('Metal gate single leaf','Metal Work','unit','MY_PG',552.00,1196.00,874.00,74,'high',NOW()),
('Metal gate single leaf','Metal Work','unit','SG',1010.00,2200.00,1605.00,102,'high',NOW()),

-- ═══════════════════════════════════
-- CLEANING
-- ═══════════════════════════════════
('Post-renovation cleaning','Cleaning','sqft','MY_KL',0.60,1.60,1.10,265,'high',NOW()),
('Post-renovation cleaning','Cleaning','sqft','MY_JB',0.53,1.41,0.97,200,'high',NOW()),
('Post-renovation cleaning','Cleaning','sqft','MY_PG',0.55,1.47,1.01,170,'high',NOW()),
('Post-renovation cleaning','Cleaning','sqft','SG',1.00,2.70,1.85,232,'high',NOW()),

('Window & glass cleaning','Cleaning','window','MY_KL',15.00,35.00,25.00,195,'high',NOW()),
('Window & glass cleaning','Cleaning','window','MY_JB',13.20,30.80,22.00,148,'high',NOW()),
('Window & glass cleaning','Cleaning','window','MY_PG',13.80,32.20,23.00,125,'high',NOW()),
('Window & glass cleaning','Cleaning','window','SG',25.00,58.00,41.50,172,'high',NOW()),

('Chemical wash (floor tiles)','Cleaning','sqft','MY_KL',0.80,1.80,1.30,178,'high',NOW()),
('Chemical wash (floor tiles)','Cleaning','sqft','MY_JB',0.70,1.58,1.14,135,'high',NOW()),
('Chemical wash (floor tiles)','Cleaning','sqft','MY_PG',0.74,1.66,1.20,115,'high',NOW()),
('Chemical wash (floor tiles)','Cleaning','sqft','SG',1.35,3.00,2.18,158,'high',NOW())

ON CONFLICT (item_name, category, unit, region) DO UPDATE SET
  min_price    = EXCLUDED.min_price,
  max_price    = EXCLUDED.max_price,
  avg_price    = EXCLUDED.avg_price,
  sample_count = EXCLUDED.sample_count,
  confidence   = EXCLUDED.confidence,
  updated_at   = NOW();
