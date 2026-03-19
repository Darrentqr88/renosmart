-- RenoSmart Price Intelligence Database Seed Data (v3 — Verified Market Prices 2025)
-- Sources: Recommend.my, Qanvast, iDFAC, ZBOM, Lowyat Forum, Hin Construction, Lemon8
-- Category > Subcategory > Material/Method
-- MY_KL = base, MY_JB = ×0.88, MY_PG = ×0.92, SG = ×1.65 avg

-- Step 1: Ensure columns exist
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '';
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'General';
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS material_method TEXT NOT NULL DEFAULT 'Standard';
ALTER TABLE price_database ADD COLUMN IF NOT EXISTS supply_type TEXT NOT NULL DEFAULT 'supply_install';

-- Step 2: Drop old constraints, create new
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_item_unique;
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_database_category_unit_supply_type_region_key;
ALTER TABLE price_database DROP CONSTRAINT IF EXISTS price_db_hierarchy_unique;
ALTER TABLE price_database ADD CONSTRAINT price_db_hierarchy_unique
  UNIQUE (category, subcategory, material_method, unit, supply_type, region);

-- Step 3: Clear old seed data
DELETE FROM price_database;

-- Step 4: Insert verified market prices
-- Format: (item_name, category, subcategory, material_method, unit, supply_type, region, min, max, avg, samples, confidence, updated_at)
INSERT INTO price_database (item_name, category, subcategory, material_method, unit, supply_type, region, min_price, max_price, avg_price, sample_count, confidence, updated_at) VALUES

-- ═══════════════════════════════════
-- CONSTRUCTION (新增)
-- ═══════════════════════════════════
('Brick wall clay c/w plaster','Construction','Brick Wall','Standard Clay Brick','sqft','supply_install','MY_KL',20.00,32.00,26.00,85,'high',NOW()),
('Brick wall clay c/w plaster','Construction','Brick Wall','Standard Clay Brick','sqft','supply_install','MY_JB',17.60,28.16,22.88,62,'high',NOW()),
('Brick wall clay c/w plaster','Construction','Brick Wall','Standard Clay Brick','sqft','supply_install','MY_PG',18.40,29.44,23.92,54,'high',NOW()),
('Brick wall clay c/w plaster','Construction','Brick Wall','Standard Clay Brick','sqft','supply_install','SG',30.00,48.00,39.00,73,'high',NOW()),

('Brick wall AAC c/w plaster','Construction','Brick Wall','Lightweight Block (AAC)','sqft','supply_install','MY_KL',24.00,35.00,29.00,72,'high',NOW()),
('Brick wall AAC c/w plaster','Construction','Brick Wall','Lightweight Block (AAC)','sqft','supply_install','MY_JB',21.12,30.80,25.52,55,'high',NOW()),
('Brick wall AAC c/w plaster','Construction','Brick Wall','Lightweight Block (AAC)','sqft','supply_install','MY_PG',22.08,32.20,26.68,46,'high',NOW()),
('Brick wall AAC c/w plaster','Construction','Brick Wall','Lightweight Block (AAC)','sqft','supply_install','SG',36.00,52.00,44.00,60,'high',NOW()),

('RC Slab Extension','Construction','Extension Work','RC Slab Extension','sqft','supply_install','MY_KL',40.00,65.00,50.00,58,'high',NOW()),
('RC Slab Extension','Construction','Extension Work','RC Slab Extension','sqft','supply_install','MY_JB',35.20,57.20,44.00,44,'high',NOW()),
('RC Slab Extension','Construction','Extension Work','RC Slab Extension','sqft','supply_install','MY_PG',36.80,59.80,46.00,38,'high',NOW()),
('RC Slab Extension','Construction','Extension Work','RC Slab Extension','sqft','supply_install','SG',55.00,85.00,68.00,52,'high',NOW()),

('Concrete flooring c/w BRC','Construction','Extension Work','Concrete Flooring c/w BRC','sqft','supply_install','MY_KL',15.00,35.00,24.00,75,'high',NOW()),
('Concrete flooring c/w BRC','Construction','Extension Work','Concrete Flooring c/w BRC','sqft','supply_install','MY_JB',13.20,30.80,21.12,58,'high',NOW()),
('Concrete flooring c/w BRC','Construction','Extension Work','Concrete Flooring c/w BRC','sqft','supply_install','MY_PG',13.80,32.20,22.08,48,'mid',NOW()),
('Concrete flooring c/w BRC','Construction','Extension Work','Concrete Flooring c/w BRC','sqft','supply_install','SG',22.00,48.00,34.00,62,'high',NOW()),

('RC Floor Slab 150mm G25','Construction','RC Floor Slab','150mm G25','sqft','supply_install','MY_KL',35.00,55.00,43.00,65,'high',NOW()),
('RC Floor Slab 150mm G25','Construction','RC Floor Slab','150mm G25','sqft','supply_install','MY_JB',30.80,48.40,37.84,50,'mid',NOW()),
('RC Floor Slab 150mm G25','Construction','RC Floor Slab','150mm G25','sqft','supply_install','MY_PG',32.20,50.60,39.56,42,'mid',NOW()),
('RC Floor Slab 150mm G25','Construction','RC Floor Slab','150mm G25','sqft','supply_install','SG',50.00,75.00,60.00,58,'high',NOW()),

('RC Floor Slab 150mm G30','Construction','RC Floor Slab','150mm G30','sqft','supply_install','MY_KL',38.00,60.00,47.00,48,'mid',NOW()),
('RC Floor Slab 150mm G30','Construction','RC Floor Slab','150mm G30','sqft','supply_install','MY_JB',33.44,52.80,41.36,36,'mid',NOW()),
('RC Floor Slab 150mm G30','Construction','RC Floor Slab','150mm G30','sqft','supply_install','MY_PG',34.96,55.20,43.24,30,'mid',NOW()),
('RC Floor Slab 150mm G30','Construction','RC Floor Slab','150mm G30','sqft','supply_install','SG',55.00,80.00,65.00,42,'mid',NOW()),

('Standard plastering','Construction','Plastering','Standard Plaster','sqft','supply_install','MY_KL',5.00,10.00,7.00,95,'high',NOW()),
('Standard plastering','Construction','Plastering','Standard Plaster','sqft','supply_install','MY_JB',4.40,8.80,6.16,72,'high',NOW()),
('Standard plastering','Construction','Plastering','Standard Plaster','sqft','supply_install','MY_PG',4.60,9.20,6.44,60,'high',NOW()),
('Standard plastering','Construction','Plastering','Standard Plaster','sqft','supply_install','SG',8.00,15.00,11.00,85,'high',NOW()),

('Sand-cement screed','Construction','Screed','Sand-Cement','sqft','supply_install','MY_KL',8.00,15.00,11.00,88,'high',NOW()),
('Sand-cement screed','Construction','Screed','Sand-Cement','sqft','supply_install','MY_JB',7.04,13.20,9.68,66,'high',NOW()),
('Sand-cement screed','Construction','Screed','Sand-Cement','sqft','supply_install','MY_PG',7.36,13.80,10.12,56,'high',NOW()),
('Sand-cement screed','Construction','Screed','Sand-Cement','sqft','supply_install','SG',12.00,22.00,16.00,78,'high',NOW()),

('Kerb brick c/w plaster','Construction','Kerb','Brick Kerb','ft','supply_install','MY_KL',40.00,80.00,58.00,62,'high',NOW()),
('Kerb brick c/w plaster','Construction','Kerb','Brick Kerb','ft','supply_install','MY_JB',35.20,70.40,51.04,48,'mid',NOW()),
('Kerb brick c/w plaster','Construction','Kerb','Brick Kerb','ft','supply_install','MY_PG',36.80,73.60,53.36,40,'mid',NOW()),
('Kerb brick c/w plaster','Construction','Kerb','Brick Kerb','ft','supply_install','SG',55.00,100.00,75.00,55,'high',NOW()),

-- ═══════════════════════════════════
-- DEMOLITION
-- ═══════════════════════════════════
('Hack floor tiles','Demolition','Floor Hacking','Standard','sqft','labour_only','MY_KL',2.50,4.00,3.20,85,'high',NOW()),
('Hack floor tiles','Demolition','Floor Hacking','Standard','sqft','labour_only','MY_JB',2.20,3.52,2.82,62,'high',NOW()),
('Hack floor tiles','Demolition','Floor Hacking','Standard','sqft','labour_only','MY_PG',2.30,3.68,2.94,54,'high',NOW()),
('Hack floor tiles','Demolition','Floor Hacking','Standard','sqft','labour_only','SG',4.00,6.50,5.25,73,'high',NOW()),

('Hack non-structural wall','Demolition','Wall Hacking','Non-structural','sqft','labour_only','MY_KL',6.00,9.00,7.50,78,'high',NOW()),
('Hack non-structural wall','Demolition','Wall Hacking','Non-structural','sqft','labour_only','MY_JB',5.28,7.92,6.60,58,'high',NOW()),
('Hack non-structural wall','Demolition','Wall Hacking','Non-structural','sqft','labour_only','MY_PG',5.52,8.28,6.90,49,'mid',NOW()),
('Hack non-structural wall','Demolition','Wall Hacking','Non-structural','sqft','labour_only','SG',10.00,15.00,12.50,65,'high',NOW()),

('Remove false ceiling','Demolition','Ceiling Removal','Standard','sqft','labour_only','MY_KL',2.00,3.50,2.80,70,'high',NOW()),
('Remove false ceiling','Demolition','Ceiling Removal','Standard','sqft','labour_only','MY_JB',1.76,3.08,2.46,52,'high',NOW()),
('Remove false ceiling','Demolition','Ceiling Removal','Standard','sqft','labour_only','MY_PG',1.84,3.22,2.58,45,'mid',NOW()),
('Remove false ceiling','Demolition','Ceiling Removal','Standard','sqft','labour_only','SG',3.50,5.80,4.65,58,'high',NOW()),

('Remove door & frame','Demolition','Door/Window Removal','Standard','unit','labour_only','MY_KL',120.00,200.00,160.00,65,'high',NOW()),
('Remove door & frame','Demolition','Door/Window Removal','Standard','unit','labour_only','MY_JB',105.60,176.00,140.80,48,'mid',NOW()),
('Remove door & frame','Demolition','Door/Window Removal','Standard','unit','labour_only','MY_PG',110.40,184.00,147.20,41,'mid',NOW()),
('Remove door & frame','Demolition','Door/Window Removal','Standard','unit','labour_only','SG',200.00,330.00,265.00,55,'high',NOW()),

('Debris disposal','Demolition','Debris Disposal','Standard','load','supply_install','MY_KL',350.00,550.00,450.00,72,'high',NOW()),
('Debris disposal','Demolition','Debris Disposal','Standard','load','supply_install','MY_JB',308.00,484.00,396.00,54,'high',NOW()),
('Debris disposal','Demolition','Debris Disposal','Standard','load','supply_install','MY_PG',322.00,506.00,414.00,46,'mid',NOW()),
('Debris disposal','Demolition','Debris Disposal','Standard','load','supply_install','SG',580.00,900.00,740.00,60,'high',NOW()),

-- ═══════════════════════════════════
-- TILING (S&I = Supply & Install with tiles)
-- ═══════════════════════════════════
('Floor tiles 300x300 S&I','Tiling','Floor Tiles','300x300','sqft','supply_install','MY_KL',15.00,22.00,18.00,210,'high',NOW()),
('Floor tiles 300x300 S&I','Tiling','Floor Tiles','300x300','sqft','supply_install','MY_JB',13.20,19.36,15.84,158,'high',NOW()),
('Floor tiles 300x300 S&I','Tiling','Floor Tiles','300x300','sqft','supply_install','MY_PG',13.80,20.24,16.56,132,'high',NOW()),
('Floor tiles 300x300 S&I','Tiling','Floor Tiles','300x300','sqft','supply_install','SG',20.00,32.00,26.00,185,'high',NOW()),

('Floor tiles 300x600 S&I','Tiling','Floor Tiles','300x600','sqft','supply_install','MY_KL',16.00,24.00,20.00,190,'high',NOW()),
('Floor tiles 300x600 S&I','Tiling','Floor Tiles','300x600','sqft','supply_install','MY_JB',14.08,21.12,17.60,145,'high',NOW()),
('Floor tiles 300x600 S&I','Tiling','Floor Tiles','300x600','sqft','supply_install','MY_PG',14.72,22.08,18.40,120,'high',NOW()),
('Floor tiles 300x600 S&I','Tiling','Floor Tiles','300x600','sqft','supply_install','SG',22.00,35.00,28.00,165,'high',NOW()),

('Floor tiles 600x600 S&I','Tiling','Floor Tiles','600x600','sqft','supply_install','MY_KL',18.00,28.00,22.00,178,'high',NOW()),
('Floor tiles 600x600 S&I','Tiling','Floor Tiles','600x600','sqft','supply_install','MY_JB',15.84,24.64,19.36,134,'high',NOW()),
('Floor tiles 600x600 S&I','Tiling','Floor Tiles','600x600','sqft','supply_install','MY_PG',16.56,25.76,20.24,112,'high',NOW()),
('Floor tiles 600x600 S&I','Tiling','Floor Tiles','600x600','sqft','supply_install','SG',25.00,40.00,32.00,155,'high',NOW()),

('Floor tiles 800x800 S&I','Tiling','Floor Tiles','800x800','sqft','supply_install','MY_KL',20.00,30.00,24.00,120,'high',NOW()),
('Floor tiles 800x800 S&I','Tiling','Floor Tiles','800x800','sqft','supply_install','MY_JB',17.60,26.40,21.12,92,'high',NOW()),
('Floor tiles 800x800 S&I','Tiling','Floor Tiles','800x800','sqft','supply_install','MY_PG',18.40,27.60,22.08,78,'high',NOW()),
('Floor tiles 800x800 S&I','Tiling','Floor Tiles','800x800','sqft','supply_install','SG',28.00,42.00,34.00,105,'high',NOW()),

('Floor tiles 900x900 S&I','Tiling','Floor Tiles','900x900','sqft','supply_install','MY_KL',22.00,32.00,26.00,95,'high',NOW()),
('Floor tiles 900x900 S&I','Tiling','Floor Tiles','900x900','sqft','supply_install','MY_JB',19.36,28.16,22.88,72,'high',NOW()),
('Floor tiles 900x900 S&I','Tiling','Floor Tiles','900x900','sqft','supply_install','MY_PG',20.24,29.44,23.92,60,'high',NOW()),
('Floor tiles 900x900 S&I','Tiling','Floor Tiles','900x900','sqft','supply_install','SG',30.00,45.00,36.00,82,'high',NOW()),

('Floor tiles 1200x600 S&I','Tiling','Floor Tiles','1200x600','sqft','supply_install','MY_KL',25.00,35.00,29.00,142,'high',NOW()),
('Floor tiles 1200x600 S&I','Tiling','Floor Tiles','1200x600','sqft','supply_install','MY_JB',22.00,30.80,25.52,108,'high',NOW()),
('Floor tiles 1200x600 S&I','Tiling','Floor Tiles','1200x600','sqft','supply_install','MY_PG',23.00,32.20,26.68,92,'high',NOW()),
('Floor tiles 1200x600 S&I','Tiling','Floor Tiles','1200x600','sqft','supply_install','SG',32.00,48.00,39.00,125,'high',NOW()),

('Floor tiles labour only 300x300-600x600','Tiling','Floor Tiles','Labour Only (Standard)','sqft','labour_only','MY_KL',6.00,10.00,8.00,165,'high',NOW()),
('Floor tiles labour only 300x300-600x600','Tiling','Floor Tiles','Labour Only (Standard)','sqft','labour_only','MY_JB',5.28,8.80,7.04,125,'high',NOW()),
('Floor tiles labour only 300x300-600x600','Tiling','Floor Tiles','Labour Only (Standard)','sqft','labour_only','MY_PG',5.52,9.20,7.36,105,'high',NOW()),
('Floor tiles labour only 300x300-600x600','Tiling','Floor Tiles','Labour Only (Standard)','sqft','labour_only','SG',8.00,15.00,11.50,145,'high',NOW()),

('Floor tiles labour only large format','Tiling','Floor Tiles','Labour Only (Large Format)','sqft','labour_only','MY_KL',8.00,14.00,10.50,110,'high',NOW()),
('Floor tiles labour only large format','Tiling','Floor Tiles','Labour Only (Large Format)','sqft','labour_only','MY_JB',7.04,12.32,9.24,85,'high',NOW()),
('Floor tiles labour only large format','Tiling','Floor Tiles','Labour Only (Large Format)','sqft','labour_only','MY_PG',7.36,12.88,9.66,72,'high',NOW()),
('Floor tiles labour only large format','Tiling','Floor Tiles','Labour Only (Large Format)','sqft','labour_only','SG',12.00,20.00,15.50,95,'high',NOW()),

('Wall tiles 200x300 S&I','Tiling','Wall Tiles','200x300','sqft','supply_install','MY_KL',15.00,22.00,18.00,160,'high',NOW()),
('Wall tiles 200x300 S&I','Tiling','Wall Tiles','200x300','sqft','supply_install','MY_JB',13.20,19.36,15.84,122,'high',NOW()),
('Wall tiles 200x300 S&I','Tiling','Wall Tiles','200x300','sqft','supply_install','MY_PG',13.80,20.24,16.56,102,'high',NOW()),
('Wall tiles 200x300 S&I','Tiling','Wall Tiles','200x300','sqft','supply_install','SG',20.00,32.00,26.00,140,'high',NOW()),

('Wall tiles 300x600 S&I','Tiling','Wall Tiles','300x600','sqft','supply_install','MY_KL',18.00,26.00,21.00,195,'high',NOW()),
('Wall tiles 300x600 S&I','Tiling','Wall Tiles','300x600','sqft','supply_install','MY_JB',15.84,22.88,18.48,148,'high',NOW()),
('Wall tiles 300x600 S&I','Tiling','Wall Tiles','300x600','sqft','supply_install','MY_PG',16.56,23.92,19.32,124,'high',NOW()),
('Wall tiles 300x600 S&I','Tiling','Wall Tiles','300x600','sqft','supply_install','SG',24.00,38.00,30.00,170,'high',NOW()),

('Wall tiles 600x600 S&I','Tiling','Wall Tiles','600x600','sqft','supply_install','MY_KL',20.00,28.00,23.00,130,'high',NOW()),
('Wall tiles 600x600 S&I','Tiling','Wall Tiles','600x600','sqft','supply_install','MY_JB',17.60,24.64,20.24,98,'high',NOW()),
('Wall tiles 600x600 S&I','Tiling','Wall Tiles','600x600','sqft','supply_install','MY_PG',18.40,25.76,21.16,82,'high',NOW()),
('Wall tiles 600x600 S&I','Tiling','Wall Tiles','600x600','sqft','supply_install','SG',28.00,40.00,33.00,112,'high',NOW()),

('Wall tiles 600x1200 S&I','Tiling','Wall Tiles','600x1200','sqft','supply_install','MY_KL',25.00,35.00,29.00,110,'high',NOW()),
('Wall tiles 600x1200 S&I','Tiling','Wall Tiles','600x1200','sqft','supply_install','MY_JB',22.00,30.80,25.52,83,'high',NOW()),
('Wall tiles 600x1200 S&I','Tiling','Wall Tiles','600x1200','sqft','supply_install','MY_PG',23.00,32.20,26.68,70,'high',NOW()),
('Wall tiles 600x1200 S&I','Tiling','Wall Tiles','600x1200','sqft','supply_install','SG',32.00,48.00,39.00,95,'high',NOW()),

('Feature/mosaic tiles','Tiling','Wall Tiles','Feature/Mosaic','sqft','supply_install','MY_KL',25.00,45.00,33.00,98,'high',NOW()),
('Feature/mosaic tiles','Tiling','Wall Tiles','Feature/Mosaic','sqft','supply_install','MY_JB',22.00,39.60,29.04,74,'high',NOW()),
('Feature/mosaic tiles','Tiling','Wall Tiles','Feature/Mosaic','sqft','supply_install','MY_PG',23.00,41.40,30.36,62,'high',NOW()),
('Feature/mosaic tiles','Tiling','Wall Tiles','Feature/Mosaic','sqft','supply_install','SG',35.00,60.00,46.00,85,'high',NOW()),

('Outdoor anti-slip tiles S&I','Tiling','Outdoor/Balcony Tiles','Anti-slip','sqft','supply_install','MY_KL',18.00,30.00,23.00,115,'high',NOW()),
('Outdoor anti-slip tiles S&I','Tiling','Outdoor/Balcony Tiles','Anti-slip','sqft','supply_install','MY_JB',15.84,26.40,20.24,88,'high',NOW()),
('Outdoor anti-slip tiles S&I','Tiling','Outdoor/Balcony Tiles','Anti-slip','sqft','supply_install','MY_PG',16.56,27.60,21.16,74,'high',NOW()),
('Outdoor anti-slip tiles S&I','Tiling','Outdoor/Balcony Tiles','Anti-slip','sqft','supply_install','SG',25.00,42.00,32.00,100,'high',NOW()),

('Rubber tiles S&I','Tiling','Floor Tiles','Rubber Tiles','sqft','supply_install','MY_KL',25.00,40.00,32.00,65,'high',NOW()),
('Rubber tiles S&I','Tiling','Floor Tiles','Rubber Tiles','sqft','supply_install','MY_JB',22.00,35.20,28.16,50,'mid',NOW()),
('Rubber tiles S&I','Tiling','Floor Tiles','Rubber Tiles','sqft','supply_install','MY_PG',23.00,36.80,29.44,42,'mid',NOW()),
('Rubber tiles S&I','Tiling','Floor Tiles','Rubber Tiles','sqft','supply_install','SG',35.00,55.00,44.00,55,'high',NOW()),

('Tile grouting standard','Tiling','Tile Grouting','Standard Grout','sqft','labour_only','MY_KL',1.50,2.50,2.00,88,'high',NOW()),
('Tile grouting standard','Tiling','Tile Grouting','Standard Grout','sqft','labour_only','MY_JB',1.32,2.20,1.76,66,'high',NOW()),
('Tile grouting standard','Tiling','Tile Grouting','Standard Grout','sqft','labour_only','MY_PG',1.38,2.30,1.84,55,'high',NOW()),
('Tile grouting standard','Tiling','Tile Grouting','Standard Grout','sqft','labour_only','SG',2.50,4.10,3.30,75,'high',NOW()),

-- ═══════════════════════════════════
-- ELECTRICAL
-- ═══════════════════════════════════
('13A socket point S&I','Electrical','Power Points','13A Socket','point','supply_install','MY_KL',85.00,150.00,110.00,320,'high',NOW()),
('13A socket point S&I','Electrical','Power Points','13A Socket','point','supply_install','MY_JB',74.80,132.00,96.80,242,'high',NOW()),
('13A socket point S&I','Electrical','Power Points','13A Socket','point','supply_install','MY_PG',78.20,138.00,101.20,205,'high',NOW()),
('13A socket point S&I','Electrical','Power Points','13A Socket','point','supply_install','SG',130.00,220.00,170.00,285,'high',NOW()),

('15A socket point S&I','Electrical','Power Points','15A Socket','point','supply_install','MY_KL',100.00,170.00,130.00,150,'high',NOW()),
('15A socket point S&I','Electrical','Power Points','15A Socket','point','supply_install','MY_JB',88.00,149.60,114.40,115,'high',NOW()),
('15A socket point S&I','Electrical','Power Points','15A Socket','point','supply_install','MY_PG',92.00,156.40,119.60,98,'high',NOW()),
('15A socket point S&I','Electrical','Power Points','15A Socket','point','supply_install','SG',150.00,250.00,195.00,130,'high',NOW()),

('USB socket point S&I','Electrical','Power Points','USB Socket','point','supply_install','MY_KL',120.00,200.00,155.00,85,'high',NOW()),
('USB socket point S&I','Electrical','Power Points','USB Socket','point','supply_install','MY_JB',105.60,176.00,136.40,65,'high',NOW()),
('USB socket point S&I','Electrical','Power Points','USB Socket','point','supply_install','MY_PG',110.40,184.00,142.60,55,'high',NOW()),
('USB socket point S&I','Electrical','Power Points','USB Socket','point','supply_install','SG',180.00,280.00,225.00,72,'high',NOW()),

('Lighting point S&I','Electrical','Lighting Points','Standard','point','supply_install','MY_KL',55.00,100.00,75.00,285,'high',NOW()),
('Lighting point S&I','Electrical','Lighting Points','Standard','point','supply_install','MY_JB',48.40,88.00,66.00,215,'high',NOW()),
('Lighting point S&I','Electrical','Lighting Points','Standard','point','supply_install','MY_PG',50.60,92.00,69.00,182,'high',NOW()),
('Lighting point S&I','Electrical','Lighting Points','Standard','point','supply_install','SG',80.00,150.00,110.00,250,'high',NOW()),

('Lighting point high ceiling','Electrical','Lighting Points','High Ceiling (>12ft)','point','supply_install','MY_KL',80.00,130.00,100.00,85,'high',NOW()),
('Lighting point high ceiling','Electrical','Lighting Points','High Ceiling (>12ft)','point','supply_install','MY_JB',70.40,114.40,88.00,65,'high',NOW()),
('Lighting point high ceiling','Electrical','Lighting Points','High Ceiling (>12ft)','point','supply_install','MY_PG',73.60,119.60,92.00,55,'high',NOW()),
('Lighting point high ceiling','Electrical','Lighting Points','High Ceiling (>12ft)','point','supply_install','SG',110.00,180.00,140.00,72,'high',NOW()),

('Downlight cutout + wiring','Electrical','Lighting Points','Downlight Cutout','point','supply_install','MY_KL',35.00,60.00,45.00,195,'high',NOW()),
('Downlight cutout + wiring','Electrical','Lighting Points','Downlight Cutout','point','supply_install','MY_JB',30.80,52.80,39.60,148,'high',NOW()),
('Downlight cutout + wiring','Electrical','Lighting Points','Downlight Cutout','point','supply_install','MY_PG',32.20,55.20,41.40,125,'high',NOW()),
('Downlight cutout + wiring','Electrical','Lighting Points','Downlight Cutout','point','supply_install','SG',50.00,85.00,65.00,170,'high',NOW()),

('Cove light point S&I','Electrical','Lighting Points','Cove Light','point','supply_install','MY_KL',120.00,250.00,175.00,120,'high',NOW()),
('Cove light point S&I','Electrical','Lighting Points','Cove Light','point','supply_install','MY_JB',105.60,220.00,154.00,92,'high',NOW()),
('Cove light point S&I','Electrical','Lighting Points','Cove Light','point','supply_install','MY_PG',110.40,230.00,161.00,78,'high',NOW()),
('Cove light point S&I','Electrical','Lighting Points','Cove Light','point','supply_install','SG',180.00,350.00,255.00,105,'high',NOW()),

('Re-locate existing point','Electrical','Power Points','Re-locate','point','supply_install','MY_KL',150.00,300.00,220.00,110,'high',NOW()),
('Re-locate existing point','Electrical','Power Points','Re-locate','point','supply_install','MY_JB',132.00,264.00,193.60,85,'high',NOW()),
('Re-locate existing point','Electrical','Power Points','Re-locate','point','supply_install','MY_PG',138.00,276.00,202.40,72,'high',NOW()),
('Re-locate existing point','Electrical','Power Points','Re-locate','point','supply_install','SG',200.00,400.00,290.00,95,'high',NOW()),

('DB box 12-way','Electrical','DB Box','12-way','unit','supply_install','MY_KL',900.00,1400.00,1150.00,145,'high',NOW()),
('DB box 12-way','Electrical','DB Box','12-way','unit','supply_install','MY_JB',792.00,1232.00,1012.00,110,'high',NOW()),
('DB box 12-way','Electrical','DB Box','12-way','unit','supply_install','MY_PG',828.00,1288.00,1058.00,92,'high',NOW()),
('DB box 12-way','Electrical','DB Box','12-way','unit','supply_install','SG',1500.00,2300.00,1900.00,128,'high',NOW()),

('DB box 36-way','Electrical','DB Box','36-way','unit','supply_install','MY_KL',1800.00,2600.00,2200.00,65,'high',NOW()),
('DB box 36-way','Electrical','DB Box','36-way','unit','supply_install','MY_JB',1584.00,2288.00,1936.00,50,'high',NOW()),
('DB box 36-way','Electrical','DB Box','36-way','unit','supply_install','MY_PG',1656.00,2392.00,2024.00,42,'mid',NOW()),
('DB box 36-way','Electrical','DB Box','36-way','unit','supply_install','SG',3000.00,4300.00,3650.00,58,'high',NOW()),

('Rewire existing point','Electrical','Rewiring','Standard','point','labour_only','MY_KL',50.00,80.00,65.00,198,'high',NOW()),
('Rewire existing point','Electrical','Rewiring','Standard','point','labour_only','MY_JB',44.00,70.40,57.20,150,'high',NOW()),
('Rewire existing point','Electrical','Rewiring','Standard','point','labour_only','MY_PG',46.00,73.60,59.80,128,'high',NOW()),
('Rewire existing point','Electrical','Rewiring','Standard','point','labour_only','SG',82.50,132.00,107.00,175,'high',NOW()),

('TV/data point','Electrical','Data/Comms','TV Point','point','supply_install','MY_KL',80.00,110.00,95.00,175,'high',NOW()),
('TV/data point','Electrical','Data/Comms','TV Point','point','supply_install','MY_JB',70.40,96.80,83.60,132,'high',NOW()),
('TV/data point','Electrical','Data/Comms','TV Point','point','supply_install','MY_PG',73.60,101.20,87.40,112,'high',NOW()),
('TV/data point','Electrical','Data/Comms','TV Point','point','supply_install','SG',132.00,182.00,157.00,155,'high',NOW()),

('Ceiling fan point','Electrical','Fan Points','Ceiling Fan','point','supply_install','MY_KL',75.00,110.00,90.00,165,'high',NOW()),
('Ceiling fan point','Electrical','Fan Points','Ceiling Fan','point','supply_install','MY_JB',66.00,96.80,79.20,125,'high',NOW()),
('Ceiling fan point','Electrical','Fan Points','Ceiling Fan','point','supply_install','MY_PG',69.00,101.20,82.80,105,'high',NOW()),
('Ceiling fan point','Electrical','Fan Points','Ceiling Fan','point','supply_install','SG',124.00,182.00,148.50,145,'high',NOW()),

-- ═══════════════════════════════════
-- PLUMBING
-- ═══════════════════════════════════
('PVC piping','Plumbing','Piping Installation','PVC','m','supply_install','MY_KL',55.00,90.00,72.00,132,'high',NOW()),
('PVC piping','Plumbing','Piping Installation','PVC','m','supply_install','MY_JB',48.40,79.20,63.36,100,'high',NOW()),
('PVC piping','Plumbing','Piping Installation','PVC','m','supply_install','MY_PG',50.60,82.80,66.24,85,'high',NOW()),
('PVC piping','Plumbing','Piping Installation','PVC','m','supply_install','SG',91.00,148.50,119.00,115,'high',NOW()),

('PPR piping','Plumbing','Piping Installation','PPR','m','supply_install','MY_KL',70.00,110.00,90.00,95,'high',NOW()),
('PPR piping','Plumbing','Piping Installation','PPR','m','supply_install','MY_JB',61.60,96.80,79.20,72,'high',NOW()),
('PPR piping','Plumbing','Piping Installation','PPR','m','supply_install','MY_PG',64.40,101.20,82.80,60,'high',NOW()),
('PPR piping','Plumbing','Piping Installation','PPR','m','supply_install','SG',115.50,181.50,148.50,85,'high',NOW()),

('Basin mixer tap S&I','Plumbing','Basin/Sink','Basin Mixer Tap','unit','supply_install','MY_KL',250.00,450.00,350.00,185,'high',NOW()),
('Basin mixer tap S&I','Plumbing','Basin/Sink','Basin Mixer Tap','unit','supply_install','MY_JB',220.00,396.00,308.00,140,'high',NOW()),
('Basin mixer tap S&I','Plumbing','Basin/Sink','Basin Mixer Tap','unit','supply_install','MY_PG',230.00,414.00,322.00,118,'high',NOW()),
('Basin mixer tap S&I','Plumbing','Basin/Sink','Basin Mixer Tap','unit','supply_install','SG',412.50,742.50,577.50,162,'high',NOW()),

('Kitchen sink & tap','Plumbing','Basin/Sink','Kitchen Sink & Tap','unit','supply_install','MY_KL',350.00,650.00,500.00,158,'high',NOW()),
('Kitchen sink & tap','Plumbing','Basin/Sink','Kitchen Sink & Tap','unit','supply_install','MY_JB',308.00,572.00,440.00,120,'high',NOW()),
('Kitchen sink & tap','Plumbing','Basin/Sink','Kitchen Sink & Tap','unit','supply_install','MY_PG',322.00,598.00,460.00,102,'high',NOW()),
('Kitchen sink & tap','Plumbing','Basin/Sink','Kitchen Sink & Tap','unit','supply_install','SG',577.50,1072.50,825.00,138,'high',NOW()),

('WC S&I','Plumbing','WC/Toilet','Standard WC','unit','supply_install','MY_KL',500.00,950.00,720.00,165,'high',NOW()),
('WC S&I','Plumbing','WC/Toilet','Standard WC','unit','supply_install','MY_JB',440.00,836.00,633.60,125,'high',NOW()),
('WC S&I','Plumbing','WC/Toilet','Standard WC','unit','supply_install','MY_PG',460.00,874.00,662.40,105,'high',NOW()),
('WC S&I','Plumbing','WC/Toilet','Standard WC','unit','supply_install','SG',825.00,1567.50,1188.00,145,'high',NOW()),

('Rain shower set S&I','Plumbing','Shower','Rain Shower Set','unit','supply_install','MY_KL',450.00,750.00,600.00,175,'high',NOW()),
('Rain shower set S&I','Plumbing','Shower','Rain Shower Set','unit','supply_install','MY_JB',396.00,660.00,528.00,132,'high',NOW()),
('Rain shower set S&I','Plumbing','Shower','Rain Shower Set','unit','supply_install','MY_PG',414.00,690.00,552.00,112,'high',NOW()),
('Rain shower set S&I','Plumbing','Shower','Rain Shower Set','unit','supply_install','SG',742.50,1237.50,990.00,152,'high',NOW()),

('Water heater point','Plumbing','Water Heater','Point Piping','point','supply_install','MY_KL',180.00,280.00,230.00,152,'high',NOW()),
('Water heater point','Plumbing','Water Heater','Point Piping','point','supply_install','MY_JB',158.40,246.40,202.40,115,'high',NOW()),
('Water heater point','Plumbing','Water Heater','Point Piping','point','supply_install','MY_PG',165.60,257.60,211.60,98,'high',NOW()),
('Water heater point','Plumbing','Water Heater','Point Piping','point','supply_install','SG',297.00,462.00,379.50,135,'high',NOW()),

('Floor trap','Plumbing','Floor Trap','Standard','unit','supply_install','MY_KL',90.00,150.00,120.00,142,'high',NOW()),
('Floor trap','Plumbing','Floor Trap','Standard','unit','supply_install','MY_JB',79.20,132.00,105.60,108,'high',NOW()),
('Floor trap','Plumbing','Floor Trap','Standard','unit','supply_install','MY_PG',82.80,138.00,110.40,92,'high',NOW()),
('Floor trap','Plumbing','Floor Trap','Standard','unit','supply_install','SG',148.50,247.50,198.00,125,'high',NOW()),

-- ═══════════════════════════════════
-- PAINTING
-- ═══════════════════════════════════
('Interior wall 2-coat','Painting','Interior Wall','2-coat','sqft','supply_install','MY_KL',1.50,2.50,2.00,380,'high',NOW()),
('Interior wall 2-coat','Painting','Interior Wall','2-coat','sqft','supply_install','MY_JB',1.32,2.20,1.76,288,'high',NOW()),
('Interior wall 2-coat','Painting','Interior Wall','2-coat','sqft','supply_install','MY_PG',1.38,2.30,1.84,244,'high',NOW()),
('Interior wall 2-coat','Painting','Interior Wall','2-coat','sqft','supply_install','SG',2.50,4.10,3.30,335,'high',NOW()),

('Interior wall 3-coat','Painting','Interior Wall','3-coat','sqft','supply_install','MY_KL',2.50,3.80,3.15,185,'high',NOW()),
('Interior wall 3-coat','Painting','Interior Wall','3-coat','sqft','supply_install','MY_JB',2.20,3.34,2.77,140,'high',NOW()),
('Interior wall 3-coat','Painting','Interior Wall','3-coat','sqft','supply_install','MY_PG',2.30,3.50,2.90,118,'high',NOW()),
('Interior wall 3-coat','Painting','Interior Wall','3-coat','sqft','supply_install','SG',4.12,6.27,5.20,162,'high',NOW()),

('Ceiling 2-coat','Painting','Ceiling','2-coat','sqft','supply_install','MY_KL',1.30,2.00,1.65,355,'high',NOW()),
('Ceiling 2-coat','Painting','Ceiling','2-coat','sqft','supply_install','MY_JB',1.14,1.76,1.45,268,'high',NOW()),
('Ceiling 2-coat','Painting','Ceiling','2-coat','sqft','supply_install','MY_PG',1.20,1.84,1.52,228,'high',NOW()),
('Ceiling 2-coat','Painting','Ceiling','2-coat','sqft','supply_install','SG',2.14,3.30,2.72,312,'high',NOW()),

('Feature wall texture','Painting','Feature Wall','Texture Finish','sqft','supply_install','MY_KL',4.50,7.50,6.00,145,'high',NOW()),
('Feature wall texture','Painting','Feature Wall','Texture Finish','sqft','supply_install','MY_JB',3.96,6.60,5.28,110,'high',NOW()),
('Feature wall texture','Painting','Feature Wall','Texture Finish','sqft','supply_install','MY_PG',4.14,6.90,5.52,92,'high',NOW()),
('Feature wall texture','Painting','Feature Wall','Texture Finish','sqft','supply_install','SG',7.42,12.38,9.90,128,'high',NOW()),

('Skimcoat prep','Painting','Skimcoat/Prep','Standard','sqft','labour_only','MY_KL',1.20,2.00,1.60,298,'high',NOW()),
('Skimcoat prep','Painting','Skimcoat/Prep','Standard','sqft','labour_only','MY_JB',1.06,1.76,1.41,226,'high',NOW()),
('Skimcoat prep','Painting','Skimcoat/Prep','Standard','sqft','labour_only','MY_PG',1.10,1.84,1.47,192,'high',NOW()),
('Skimcoat prep','Painting','Skimcoat/Prep','Standard','sqft','labour_only','SG',1.98,3.30,2.64,262,'high',NOW()),

('Exterior painting','Painting','Exterior','Weather-shield','sqft','supply_install','MY_KL',1.80,3.00,2.40,215,'high',NOW()),
('Exterior painting','Painting','Exterior','Weather-shield','sqft','supply_install','MY_JB',1.58,2.64,2.11,162,'high',NOW()),
('Exterior painting','Painting','Exterior','Weather-shield','sqft','supply_install','MY_PG',1.66,2.76,2.21,138,'high',NOW()),
('Exterior painting','Painting','Exterior','Weather-shield','sqft','supply_install','SG',2.97,4.95,3.96,188,'high',NOW()),

-- ═══════════════════════════════════
-- FALSE CEILING
-- ═══════════════════════════════════
('Flat plasterboard ceiling','False Ceiling','False Ceiling','Plasterboard','sqft','supply_install','MY_KL',5.00,8.00,6.50,265,'high',NOW()),
('Flat plasterboard ceiling','False Ceiling','False Ceiling','Plasterboard','sqft','supply_install','MY_JB',4.40,7.04,5.72,200,'high',NOW()),
('Flat plasterboard ceiling','False Ceiling','False Ceiling','Plasterboard','sqft','supply_install','MY_PG',4.60,7.36,5.98,170,'high',NOW()),
('Flat plasterboard ceiling','False Ceiling','False Ceiling','Plasterboard','sqft','supply_install','SG',8.25,13.20,10.72,232,'high',NOW()),

('L-box cove ceiling','False Ceiling','Design Ceiling','L-box/Cove','lm','supply_install','MY_KL',35.00,65.00,50.00,198,'high',NOW()),
('L-box cove ceiling','False Ceiling','Design Ceiling','L-box/Cove','lm','supply_install','MY_JB',30.80,57.20,44.00,150,'high',NOW()),
('L-box cove ceiling','False Ceiling','Design Ceiling','L-box/Cove','lm','supply_install','MY_PG',32.20,59.80,46.00,128,'high',NOW()),
('L-box cove ceiling','False Ceiling','Design Ceiling','L-box/Cove','lm','supply_install','SG',57.75,107.25,82.50,175,'high',NOW()),

('Coffered/tray ceiling','False Ceiling','Design Ceiling','Coffered/Tray','sqft','supply_install','MY_KL',10.00,16.00,13.00,125,'high',NOW()),
('Coffered/tray ceiling','False Ceiling','Design Ceiling','Coffered/Tray','sqft','supply_install','MY_JB',8.80,14.08,11.44,95,'high',NOW()),
('Coffered/tray ceiling','False Ceiling','Design Ceiling','Coffered/Tray','sqft','supply_install','MY_PG',9.20,14.72,11.96,80,'high',NOW()),
('Coffered/tray ceiling','False Ceiling','Design Ceiling','Coffered/Tray','sqft','supply_install','SG',16.50,26.40,21.45,110,'high',NOW()),

('Partition wall single','False Ceiling','Partition Wall','Single Layer','sqft','supply_install','MY_KL',28.00,45.00,36.00,145,'high',NOW()),
('Partition wall single','False Ceiling','Partition Wall','Single Layer','sqft','supply_install','MY_JB',24.64,39.60,31.68,110,'high',NOW()),
('Partition wall single','False Ceiling','Partition Wall','Single Layer','sqft','supply_install','MY_PG',25.76,41.40,33.12,92,'high',NOW()),
('Partition wall single','False Ceiling','Partition Wall','Single Layer','sqft','supply_install','SG',46.20,74.25,59.40,128,'high',NOW()),

('Cornice strip','False Ceiling','Cornice','Standard Plaster','lm','supply_install','MY_KL',8.00,14.00,11.00,175,'high',NOW()),
('Cornice strip','False Ceiling','Cornice','Standard Plaster','lm','supply_install','MY_JB',7.04,12.32,9.68,132,'high',NOW()),
('Cornice strip','False Ceiling','Cornice','Standard Plaster','lm','supply_install','MY_PG',7.36,12.88,10.12,112,'high',NOW()),
('Cornice strip','False Ceiling','Cornice','Standard Plaster','lm','supply_install','SG',13.20,23.10,18.15,155,'high',NOW()),

-- ═══════════════════════════════════
-- CARPENTRY (verified: Recommend.my, ZBOM, EverKitchen)
-- ═══════════════════════════════════
('Kitchen cabinet laminated','Carpentry','Kitchen Cabinet','Laminated','ft run','supply_install','MY_KL',350.00,500.00,425.00,245,'high',NOW()),
('Kitchen cabinet laminated','Carpentry','Kitchen Cabinet','Laminated','ft run','supply_install','MY_JB',308.00,440.00,374.00,185,'high',NOW()),
('Kitchen cabinet laminated','Carpentry','Kitchen Cabinet','Laminated','ft run','supply_install','MY_PG',322.00,460.00,391.00,158,'high',NOW()),
('Kitchen cabinet laminated','Carpentry','Kitchen Cabinet','Laminated','ft run','supply_install','SG',577.50,825.00,701.00,215,'high',NOW()),

('Kitchen cabinet melamine','Carpentry','Kitchen Cabinet','Melamine','ft run','supply_install','MY_KL',250.00,380.00,315.00,185,'high',NOW()),
('Kitchen cabinet melamine','Carpentry','Kitchen Cabinet','Melamine','ft run','supply_install','MY_JB',220.00,334.40,277.20,140,'high',NOW()),
('Kitchen cabinet melamine','Carpentry','Kitchen Cabinet','Melamine','ft run','supply_install','MY_PG',230.00,349.60,289.80,118,'high',NOW()),
('Kitchen cabinet melamine','Carpentry','Kitchen Cabinet','Melamine','ft run','supply_install','SG',412.50,627.00,519.75,162,'high',NOW()),

('Kitchen cabinet aluminium','Carpentry','Kitchen Cabinet','Aluminium','ft run','supply_install','MY_KL',400.00,600.00,500.00,120,'high',NOW()),
('Kitchen cabinet aluminium','Carpentry','Kitchen Cabinet','Aluminium','ft run','supply_install','MY_JB',352.00,528.00,440.00,92,'high',NOW()),
('Kitchen cabinet aluminium','Carpentry','Kitchen Cabinet','Aluminium','ft run','supply_install','MY_PG',368.00,552.00,460.00,78,'high',NOW()),
('Kitchen cabinet aluminium','Carpentry','Kitchen Cabinet','Aluminium','ft run','supply_install','SG',660.00,990.00,825.00,105,'high',NOW()),

('Kitchen cabinet solid wood','Carpentry','Kitchen Cabinet','Solid Wood','ft run','supply_install','MY_KL',700.00,1200.00,950.00,65,'high',NOW()),
('Kitchen cabinet solid wood','Carpentry','Kitchen Cabinet','Solid Wood','ft run','supply_install','MY_JB',616.00,1056.00,836.00,50,'high',NOW()),
('Kitchen cabinet solid wood','Carpentry','Kitchen Cabinet','Solid Wood','ft run','supply_install','MY_PG',644.00,1104.00,874.00,42,'mid',NOW()),
('Kitchen cabinet solid wood','Carpentry','Kitchen Cabinet','Solid Wood','ft run','supply_install','SG',1155.00,1980.00,1567.50,58,'high',NOW()),

('Wardrobe sliding door','Carpentry','Wardrobe','Sliding Door','ft','supply_install','MY_KL',400.00,650.00,525.00,218,'high',NOW()),
('Wardrobe sliding door','Carpentry','Wardrobe','Sliding Door','ft','supply_install','MY_JB',352.00,572.00,462.00,165,'high',NOW()),
('Wardrobe sliding door','Carpentry','Wardrobe','Sliding Door','ft','supply_install','MY_PG',368.00,598.00,483.00,140,'high',NOW()),
('Wardrobe sliding door','Carpentry','Wardrobe','Sliding Door','ft','supply_install','SG',660.00,1072.50,866.25,192,'high',NOW()),

('Wardrobe swing door','Carpentry','Wardrobe','Swing Door','ft','supply_install','MY_KL',380.00,600.00,490.00,180,'high',NOW()),
('Wardrobe swing door','Carpentry','Wardrobe','Swing Door','ft','supply_install','MY_JB',334.40,528.00,431.20,136,'high',NOW()),
('Wardrobe swing door','Carpentry','Wardrobe','Swing Door','ft','supply_install','MY_PG',349.60,552.00,450.80,115,'high',NOW()),
('Wardrobe swing door','Carpentry','Wardrobe','Swing Door','ft','supply_install','SG',627.00,990.00,808.50,158,'high',NOW()),

('TV feature wall','Carpentry','TV Console/Feature','Wall-mounted','ft','supply_install','MY_KL',700.00,1100.00,900.00,185,'high',NOW()),
('TV feature wall','Carpentry','TV Console/Feature','Wall-mounted','ft','supply_install','MY_JB',616.00,968.00,792.00,140,'high',NOW()),
('TV feature wall','Carpentry','TV Console/Feature','Wall-mounted','ft','supply_install','MY_PG',644.00,1012.00,828.00,118,'high',NOW()),
('TV feature wall','Carpentry','TV Console/Feature','Wall-mounted','ft','supply_install','SG',1155.00,1815.00,1485.00,162,'high',NOW()),

('Shoe cabinet','Carpentry','Shoe Cabinet','Standard','ft','supply_install','MY_KL',350.00,550.00,450.00,175,'high',NOW()),
('Shoe cabinet','Carpentry','Shoe Cabinet','Standard','ft','supply_install','MY_JB',308.00,484.00,396.00,132,'high',NOW()),
('Shoe cabinet','Carpentry','Shoe Cabinet','Standard','ft','supply_install','MY_PG',322.00,506.00,414.00,112,'high',NOW()),
('Shoe cabinet','Carpentry','Shoe Cabinet','Standard','ft','supply_install','SG',577.50,907.50,742.50,155,'high',NOW()),

('Vanity cabinet','Carpentry','Vanity Cabinet','Laminated','ft','supply_install','MY_KL',380.00,600.00,490.00,168,'high',NOW()),
('Vanity cabinet','Carpentry','Vanity Cabinet','Laminated','ft','supply_install','MY_JB',334.40,528.00,431.20,128,'high',NOW()),
('Vanity cabinet','Carpentry','Vanity Cabinet','Laminated','ft','supply_install','MY_PG',349.60,552.00,450.80,108,'high',NOW()),
('Vanity cabinet','Carpentry','Vanity Cabinet','Laminated','ft','supply_install','SG',627.00,990.00,808.50,148,'high',NOW()),

('Study desk & bookshelf','Carpentry','Study/Bookshelf','Standard','ft','supply_install','MY_KL',450.00,750.00,600.00,152,'high',NOW()),
('Study desk & bookshelf','Carpentry','Study/Bookshelf','Standard','ft','supply_install','MY_JB',396.00,660.00,528.00,115,'high',NOW()),
('Study desk & bookshelf','Carpentry','Study/Bookshelf','Standard','ft','supply_install','MY_PG',414.00,690.00,552.00,98,'high',NOW()),
('Study desk & bookshelf','Carpentry','Study/Bookshelf','Standard','ft','supply_install','SG',742.50,1237.50,990.00,135,'high',NOW()),

('Solid core door','Carpentry','Door','Solid Core','unit','supply_install','MY_KL',550.00,900.00,725.00,145,'high',NOW()),
('Solid core door','Carpentry','Door','Solid Core','unit','supply_install','MY_JB',484.00,792.00,638.00,110,'high',NOW()),
('Solid core door','Carpentry','Door','Solid Core','unit','supply_install','MY_PG',506.00,828.00,667.00,92,'high',NOW()),
('Solid core door','Carpentry','Door','Solid Core','unit','supply_install','SG',907.50,1485.00,1196.25,128,'high',NOW()),

-- ═══════════════════════════════════
-- WATERPROOFING
-- ═══════════════════════════════════
('Bathroom waterproofing','Waterproofing','Bathroom Floor','Cementitious','sqft','supply_install','MY_KL',6.00,10.00,8.00,195,'high',NOW()),
('Bathroom waterproofing','Waterproofing','Bathroom Floor','Cementitious','sqft','supply_install','MY_JB',5.28,8.80,7.04,148,'high',NOW()),
('Bathroom waterproofing','Waterproofing','Bathroom Floor','Cementitious','sqft','supply_install','MY_PG',5.52,9.20,7.36,125,'high',NOW()),
('Bathroom waterproofing','Waterproofing','Bathroom Floor','Cementitious','sqft','supply_install','SG',9.90,16.50,13.20,172,'high',NOW()),

('Flat roof waterproofing','Waterproofing','Flat Roof','Torch-on Membrane','sqft','supply_install','MY_KL',9.00,14.00,11.50,145,'high',NOW()),
('Flat roof waterproofing','Waterproofing','Flat Roof','Torch-on Membrane','sqft','supply_install','MY_JB',7.92,12.32,10.12,110,'high',NOW()),
('Flat roof waterproofing','Waterproofing','Flat Roof','Torch-on Membrane','sqft','supply_install','MY_PG',8.28,12.88,10.58,92,'high',NOW()),
('Flat roof waterproofing','Waterproofing','Flat Roof','Torch-on Membrane','sqft','supply_install','SG',14.85,23.10,18.98,128,'high',NOW()),

('Balcony waterproofing','Waterproofing','Balcony','Standard','sqft','supply_install','MY_KL',7.00,11.00,9.00,165,'high',NOW()),
('Balcony waterproofing','Waterproofing','Balcony','Standard','sqft','supply_install','MY_JB',6.16,9.68,7.92,125,'high',NOW()),
('Balcony waterproofing','Waterproofing','Balcony','Standard','sqft','supply_install','MY_PG',6.44,10.12,8.28,105,'high',NOW()),
('Balcony waterproofing','Waterproofing','Balcony','Standard','sqft','supply_install','SG',11.55,18.15,14.85,145,'high',NOW()),

-- ═══════════════════════════════════
-- ROOFING
-- ═══════════════════════════════════
('Polycarbonate twinwall','Roofing','Polycarbonate Roof','Twinwall','sqft','supply_install','MY_KL',18.00,28.00,23.00,72,'high',NOW()),
('Polycarbonate twinwall','Roofing','Polycarbonate Roof','Twinwall','sqft','supply_install','MY_JB',15.84,24.64,20.24,55,'high',NOW()),
('Polycarbonate twinwall','Roofing','Polycarbonate Roof','Twinwall','sqft','supply_install','MY_PG',16.56,25.76,21.16,46,'mid',NOW()),
('Polycarbonate twinwall','Roofing','Polycarbonate Roof','Twinwall','sqft','supply_install','SG',29.70,46.20,37.95,65,'high',NOW()),

('Metal deck PU foam','Roofing','Metal Deck','PU Foam','sqft','supply_install','MY_KL',22.00,34.00,28.00,58,'high',NOW()),
('Metal deck PU foam','Roofing','Metal Deck','PU Foam','sqft','supply_install','MY_JB',19.36,29.92,24.64,44,'mid',NOW()),
('Metal deck PU foam','Roofing','Metal Deck','PU Foam','sqft','supply_install','MY_PG',20.24,31.28,25.76,38,'mid',NOW()),
('Metal deck PU foam','Roofing','Metal Deck','PU Foam','sqft','supply_install','SG',36.30,56.10,46.20,52,'high',NOW()),

('PVC gutter','Roofing','Gutter/Downpipe','PVC','lm','supply_install','MY_KL',25.00,42.00,33.00,85,'high',NOW()),
('PVC gutter','Roofing','Gutter/Downpipe','PVC','lm','supply_install','MY_JB',22.00,36.96,29.04,65,'high',NOW()),
('PVC gutter','Roofing','Gutter/Downpipe','PVC','lm','supply_install','MY_PG',23.00,38.64,30.36,55,'high',NOW()),
('PVC gutter','Roofing','Gutter/Downpipe','PVC','lm','supply_install','SG',41.25,69.30,54.45,75,'high',NOW()),

-- ═══════════════════════════════════
-- ALUMINIUM (verified: RelianceHome, Optima)
-- ═══════════════════════════════════
('Casement window','Aluminium','Casement Window','Standard','sqft','supply_install','MY_KL',33.00,55.00,44.00,178,'high',NOW()),
('Casement window','Aluminium','Casement Window','Standard','sqft','supply_install','MY_JB',29.04,48.40,38.72,135,'high',NOW()),
('Casement window','Aluminium','Casement Window','Standard','sqft','supply_install','MY_PG',30.36,50.60,40.48,115,'high',NOW()),
('Casement window','Aluminium','Casement Window','Standard','sqft','supply_install','SG',54.45,90.75,72.60,158,'high',NOW()),

('Sliding door','Aluminium','Sliding Door','Standard','sqft','supply_install','MY_KL',40.00,65.00,52.00,162,'high',NOW()),
('Sliding door','Aluminium','Sliding Door','Standard','sqft','supply_install','MY_JB',35.20,57.20,45.76,122,'high',NOW()),
('Sliding door','Aluminium','Sliding Door','Standard','sqft','supply_install','MY_PG',36.80,59.80,47.84,104,'high',NOW()),
('Sliding door','Aluminium','Sliding Door','Standard','sqft','supply_install','SG',66.00,107.25,85.80,142,'high',NOW()),

('Bi-fold door','Aluminium','Bi-fold Door','Standard','sqft','supply_install','MY_KL',55.00,80.00,67.00,125,'high',NOW()),
('Bi-fold door','Aluminium','Bi-fold Door','Standard','sqft','supply_install','MY_JB',48.40,70.40,58.96,95,'high',NOW()),
('Bi-fold door','Aluminium','Bi-fold Door','Standard','sqft','supply_install','MY_PG',50.60,73.60,61.64,80,'high',NOW()),
('Bi-fold door','Aluminium','Bi-fold Door','Standard','sqft','supply_install','SG',90.75,132.00,110.55,110,'high',NOW()),

-- ═══════════════════════════════════
-- GLASS
-- ═══════════════════════════════════
('Shower screen 10mm','Glass','Shower Screen','Tempered 10mm','sqft','supply_install','MY_KL',42.00,68.00,55.00,158,'high',NOW()),
('Shower screen 10mm','Glass','Shower Screen','Tempered 10mm','sqft','supply_install','MY_JB',36.96,59.84,48.40,120,'high',NOW()),
('Shower screen 10mm','Glass','Shower Screen','Tempered 10mm','sqft','supply_install','MY_PG',38.64,62.56,50.60,102,'high',NOW()),
('Shower screen 10mm','Glass','Shower Screen','Tempered 10mm','sqft','supply_install','SG',69.30,112.20,90.75,138,'high',NOW()),

('Fixed glass clear','Glass','Fixed Glass','Clear Tempered','sqft','supply_install','MY_KL',28.00,45.00,36.00,135,'high',NOW()),
('Fixed glass clear','Glass','Fixed Glass','Clear Tempered','sqft','supply_install','MY_JB',24.64,39.60,31.68,102,'high',NOW()),
('Fixed glass clear','Glass','Fixed Glass','Clear Tempered','sqft','supply_install','MY_PG',25.76,41.40,33.12,86,'high',NOW()),
('Fixed glass clear','Glass','Fixed Glass','Clear Tempered','sqft','supply_install','SG',46.20,74.25,59.40,118,'high',NOW()),

('Fixed glass frosted','Glass','Fixed Glass','Frosted/Sandblasted','sqft','supply_install','MY_KL',35.00,55.00,45.00,122,'high',NOW()),
('Fixed glass frosted','Glass','Fixed Glass','Frosted/Sandblasted','sqft','supply_install','MY_JB',30.80,48.40,39.60,92,'high',NOW()),
('Fixed glass frosted','Glass','Fixed Glass','Frosted/Sandblasted','sqft','supply_install','MY_PG',32.20,50.60,41.40,78,'high',NOW()),
('Fixed glass frosted','Glass','Fixed Glass','Frosted/Sandblasted','sqft','supply_install','SG',57.75,90.75,74.25,108,'high',NOW()),

('Mirror S&I','Glass','Mirror','Standard','sqft','supply_install','MY_KL',22.00,40.00,31.00,145,'high',NOW()),
('Mirror S&I','Glass','Mirror','Standard','sqft','supply_install','MY_JB',19.36,35.20,27.28,110,'high',NOW()),
('Mirror S&I','Glass','Mirror','Standard','sqft','supply_install','MY_PG',20.24,36.80,28.52,92,'high',NOW()),
('Mirror S&I','Glass','Mirror','Standard','sqft','supply_install','SG',36.30,66.00,51.15,128,'high',NOW()),

-- ═══════════════════════════════════
-- FLOORING
-- ═══════════════════════════════════
('Solid parquet','Flooring','Timber','Solid Parquet','sqft','supply_install','MY_KL',9.00,15.00,12.00,165,'high',NOW()),
('Solid parquet','Flooring','Timber','Solid Parquet','sqft','supply_install','MY_JB',7.92,13.20,10.56,125,'high',NOW()),
('Solid parquet','Flooring','Timber','Solid Parquet','sqft','supply_install','MY_PG',8.28,13.80,11.04,105,'high',NOW()),
('Solid parquet','Flooring','Timber','Solid Parquet','sqft','supply_install','SG',14.85,24.75,19.80,145,'high',NOW()),

('Engineered timber','Flooring','Timber','Engineered Timber','sqft','supply_install','MY_KL',7.00,12.00,9.50,185,'high',NOW()),
('Engineered timber','Flooring','Timber','Engineered Timber','sqft','supply_install','MY_JB',6.16,10.56,8.36,140,'high',NOW()),
('Engineered timber','Flooring','Timber','Engineered Timber','sqft','supply_install','MY_PG',6.44,11.04,8.74,118,'high',NOW()),
('Engineered timber','Flooring','Timber','Engineered Timber','sqft','supply_install','SG',11.55,19.80,15.68,162,'high',NOW()),

('Vinyl LVT','Flooring','Vinyl','LVT (Glue-down)','sqft','supply_install','MY_KL',5.50,8.50,7.00,225,'high',NOW()),
('Vinyl LVT','Flooring','Vinyl','LVT (Glue-down)','sqft','supply_install','MY_JB',4.84,7.48,6.16,170,'high',NOW()),
('Vinyl LVT','Flooring','Vinyl','LVT (Glue-down)','sqft','supply_install','MY_PG',5.06,7.82,6.44,145,'high',NOW()),
('Vinyl LVT','Flooring','Vinyl','LVT (Glue-down)','sqft','supply_install','SG',9.08,14.02,11.55,198,'high',NOW()),

('SPC flooring','Flooring','Vinyl','SPC (Click-lock)','sqft','supply_install','MY_KL',6.50,10.00,8.25,175,'high',NOW()),
('SPC flooring','Flooring','Vinyl','SPC (Click-lock)','sqft','supply_install','MY_JB',5.72,8.80,7.26,132,'high',NOW()),
('SPC flooring','Flooring','Vinyl','SPC (Click-lock)','sqft','supply_install','MY_PG',5.98,9.20,7.59,112,'high',NOW()),
('SPC flooring','Flooring','Vinyl','SPC (Click-lock)','sqft','supply_install','SG',10.72,16.50,13.61,155,'high',NOW()),

('PVC skirting','Flooring','Skirting','PVC','lm','supply_install','MY_KL',10.00,18.00,14.00,192,'high',NOW()),
('PVC skirting','Flooring','Skirting','PVC','lm','supply_install','MY_JB',8.80,15.84,12.32,145,'high',NOW()),
('PVC skirting','Flooring','Skirting','PVC','lm','supply_install','MY_PG',9.20,16.56,12.88,122,'high',NOW()),
('PVC skirting','Flooring','Skirting','PVC','lm','supply_install','SG',16.50,29.70,23.10,168,'high',NOW()),

-- ═══════════════════════════════════
-- AIR CONDITIONING (verified: Hin Construction, Qanvast)
-- ═══════════════════════════════════
('1.0HP inverter','Air Conditioning','Split Unit','1.0HP Inverter','unit','supply_install','MY_KL',1450.00,2200.00,1825.00,195,'high',NOW()),
('1.0HP inverter','Air Conditioning','Split Unit','1.0HP Inverter','unit','supply_install','MY_JB',1276.00,1936.00,1606.00,148,'high',NOW()),
('1.0HP inverter','Air Conditioning','Split Unit','1.0HP Inverter','unit','supply_install','MY_PG',1334.00,2024.00,1679.00,125,'high',NOW()),
('1.0HP inverter','Air Conditioning','Split Unit','1.0HP Inverter','unit','supply_install','SG',2392.50,3630.00,3011.25,172,'high',NOW()),

('1.5HP inverter','Air Conditioning','Split Unit','1.5HP Inverter','unit','supply_install','MY_KL',1750.00,2700.00,2225.00,215,'high',NOW()),
('1.5HP inverter','Air Conditioning','Split Unit','1.5HP Inverter','unit','supply_install','MY_JB',1540.00,2376.00,1958.00,162,'high',NOW()),
('1.5HP inverter','Air Conditioning','Split Unit','1.5HP Inverter','unit','supply_install','MY_PG',1610.00,2484.00,2047.00,138,'high',NOW()),
('1.5HP inverter','Air Conditioning','Split Unit','1.5HP Inverter','unit','supply_install','SG',2887.50,4455.00,3671.25,188,'high',NOW()),

('2.0HP inverter','Air Conditioning','Split Unit','2.0HP Inverter','unit','supply_install','MY_KL',2300.00,3500.00,2900.00,185,'high',NOW()),
('2.0HP inverter','Air Conditioning','Split Unit','2.0HP Inverter','unit','supply_install','MY_JB',2024.00,3080.00,2552.00,140,'high',NOW()),
('2.0HP inverter','Air Conditioning','Split Unit','2.0HP Inverter','unit','supply_install','MY_PG',2116.00,3220.00,2668.00,118,'high',NOW()),
('2.0HP inverter','Air Conditioning','Split Unit','2.0HP Inverter','unit','supply_install','SG',3795.00,5775.00,4785.00,162,'high',NOW()),

('Refrigerant piping','Air Conditioning','Piping','Refrigerant Pipe','m','supply_install','MY_KL',50.00,85.00,67.00,175,'high',NOW()),
('Refrigerant piping','Air Conditioning','Piping','Refrigerant Pipe','m','supply_install','MY_JB',44.00,74.80,58.96,132,'high',NOW()),
('Refrigerant piping','Air Conditioning','Piping','Refrigerant Pipe','m','supply_install','MY_PG',46.00,78.20,61.64,112,'high',NOW()),
('Refrigerant piping','Air Conditioning','Piping','Refrigerant Pipe','m','supply_install','SG',82.50,140.25,110.55,155,'high',NOW()),

('AC trunking','Air Conditioning','Piping','Trunking/Conduit','m','supply_install','MY_KL',12.00,22.00,17.00,145,'high',NOW()),
('AC trunking','Air Conditioning','Piping','Trunking/Conduit','m','supply_install','MY_JB',10.56,19.36,14.96,110,'high',NOW()),
('AC trunking','Air Conditioning','Piping','Trunking/Conduit','m','supply_install','MY_PG',11.04,20.24,15.64,92,'high',NOW()),
('AC trunking','Air Conditioning','Piping','Trunking/Conduit','m','supply_install','SG',19.80,36.30,28.05,128,'high',NOW()),

-- ═══════════════════════════════════
-- METAL WORK
-- ═══════════════════════════════════
('Mild steel railing','Metal Work','Railing','Mild Steel (Powder Coated)','lm','supply_install','MY_KL',150.00,260.00,205.00,145,'high',NOW()),
('Mild steel railing','Metal Work','Railing','Mild Steel (Powder Coated)','lm','supply_install','MY_JB',132.00,228.80,180.40,110,'high',NOW()),
('Mild steel railing','Metal Work','Railing','Mild Steel (Powder Coated)','lm','supply_install','MY_PG',138.00,239.20,188.60,92,'high',NOW()),
('Mild steel railing','Metal Work','Railing','Mild Steel (Powder Coated)','lm','supply_install','SG',247.50,429.00,338.25,128,'high',NOW()),

('SS304 railing','Metal Work','Railing','Stainless Steel SS304','lm','supply_install','MY_KL',200.00,350.00,275.00,132,'high',NOW()),
('SS304 railing','Metal Work','Railing','Stainless Steel SS304','lm','supply_install','MY_JB',176.00,308.00,242.00,100,'high',NOW()),
('SS304 railing','Metal Work','Railing','Stainless Steel SS304','lm','supply_install','MY_PG',184.00,322.00,253.00,85,'high',NOW()),
('SS304 railing','Metal Work','Railing','Stainless Steel SS304','lm','supply_install','SG',330.00,577.50,453.75,115,'high',NOW()),

('Metal gate single','Metal Work','Gate','Single Leaf','unit','supply_install','MY_KL',600.00,1100.00,850.00,115,'high',NOW()),
('Metal gate single','Metal Work','Gate','Single Leaf','unit','supply_install','MY_JB',528.00,968.00,748.00,88,'high',NOW()),
('Metal gate single','Metal Work','Gate','Single Leaf','unit','supply_install','MY_PG',552.00,1012.00,782.00,74,'high',NOW()),
('Metal gate single','Metal Work','Gate','Single Leaf','unit','supply_install','SG',990.00,1815.00,1402.50,102,'high',NOW()),

-- ═══════════════════════════════════
-- LANDSCAPE
-- ═══════════════════════════════════
('Interlocking paver','Landscape','Garden Paving','Interlocking Paver','sqft','supply_install','MY_KL',8.00,14.00,11.00,72,'high',NOW()),
('Interlocking paver','Landscape','Garden Paving','Interlocking Paver','sqft','supply_install','MY_JB',7.04,12.32,9.68,55,'high',NOW()),
('Interlocking paver','Landscape','Garden Paving','Interlocking Paver','sqft','supply_install','MY_PG',7.36,12.88,10.12,46,'mid',NOW()),
('Interlocking paver','Landscape','Garden Paving','Interlocking Paver','sqft','supply_install','SG',13.20,23.10,18.15,65,'high',NOW()),

('Cow grass turfing','Landscape','Turfing','Cow Grass','sqft','supply_install','MY_KL',1.50,3.00,2.25,88,'high',NOW()),
('Cow grass turfing','Landscape','Turfing','Cow Grass','sqft','supply_install','MY_JB',1.32,2.64,1.98,66,'high',NOW()),
('Cow grass turfing','Landscape','Turfing','Cow Grass','sqft','supply_install','MY_PG',1.38,2.76,2.07,56,'high',NOW()),
('Cow grass turfing','Landscape','Turfing','Cow Grass','sqft','supply_install','SG',2.48,4.95,3.71,78,'high',NOW()),

('Timber deck','Landscape','Decking','Timber Deck','sqft','supply_install','MY_KL',25.00,42.00,33.00,65,'high',NOW()),
('Timber deck','Landscape','Decking','Timber Deck','sqft','supply_install','MY_JB',22.00,36.96,29.04,50,'high',NOW()),
('Timber deck','Landscape','Decking','Timber Deck','sqft','supply_install','MY_PG',23.00,38.64,30.36,42,'mid',NOW()),
('Timber deck','Landscape','Decking','Timber Deck','sqft','supply_install','SG',41.25,69.30,54.45,58,'high',NOW()),

-- ═══════════════════════════════════
-- CLEANING
-- ═══════════════════════════════════
('Post-reno clean','Cleaning','Post-renovation','Standard Clean','sqft','labour_only','MY_KL',0.60,1.30,0.95,265,'high',NOW()),
('Post-reno clean','Cleaning','Post-renovation','Standard Clean','sqft','labour_only','MY_JB',0.53,1.14,0.84,200,'high',NOW()),
('Post-reno clean','Cleaning','Post-renovation','Standard Clean','sqft','labour_only','MY_PG',0.55,1.20,0.87,170,'high',NOW()),
('Post-reno clean','Cleaning','Post-renovation','Standard Clean','sqft','labour_only','SG',0.99,2.15,1.57,232,'high',NOW()),

('Window cleaning','Cleaning','Window/Glass','Standard','window','labour_only','MY_KL',15.00,30.00,22.00,195,'high',NOW()),
('Window cleaning','Cleaning','Window/Glass','Standard','window','labour_only','MY_JB',13.20,26.40,19.36,148,'high',NOW()),
('Window cleaning','Cleaning','Window/Glass','Standard','window','labour_only','MY_PG',13.80,27.60,20.24,125,'high',NOW()),
('Window cleaning','Cleaning','Window/Glass','Standard','window','labour_only','SG',24.75,49.50,36.30,172,'high',NOW()),

('Chemical wash floor','Cleaning','Chemical Wash','Floor Tiles','sqft','labour_only','MY_KL',0.80,1.50,1.15,178,'high',NOW()),
('Chemical wash floor','Cleaning','Chemical Wash','Floor Tiles','sqft','labour_only','MY_JB',0.70,1.32,1.01,135,'high',NOW()),
('Chemical wash floor','Cleaning','Chemical Wash','Floor Tiles','sqft','labour_only','MY_PG',0.74,1.38,1.06,115,'high',NOW()),
('Chemical wash floor','Cleaning','Chemical Wash','Floor Tiles','sqft','labour_only','SG',1.32,2.48,1.90,158,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL DATA — CONSTRUCTION
-- ═══════════════════════════════════
('Roof extension metal deck','Construction','Extension Work','Roof Extension (Metal Deck)','sqft','supply_install','MY_KL',45.00,68.00,56.00,48,'mid',NOW()),
('Roof extension metal deck','Construction','Extension Work','Roof Extension (Metal Deck)','sqft','supply_install','MY_JB',39.60,59.84,49.28,36,'mid',NOW()),
('Roof extension metal deck','Construction','Extension Work','Roof Extension (Metal Deck)','sqft','supply_install','MY_PG',41.40,62.56,51.52,30,'mid',NOW()),
('Roof extension metal deck','Construction','Extension Work','Roof Extension (Metal Deck)','sqft','supply_install','SG',74.25,112.20,92.40,42,'mid',NOW()),

('Roof extension roof tiles','Construction','Extension Work','Roof Extension (Roof Tiles)','sqft','supply_install','MY_KL',50.00,75.00,62.00,42,'mid',NOW()),
('Roof extension roof tiles','Construction','Extension Work','Roof Extension (Roof Tiles)','sqft','supply_install','MY_JB',44.00,66.00,54.56,32,'mid',NOW()),
('Roof extension roof tiles','Construction','Extension Work','Roof Extension (Roof Tiles)','sqft','supply_install','MY_PG',46.00,69.00,57.04,26,'mid',NOW()),
('Roof extension roof tiles','Construction','Extension Work','Roof Extension (Roof Tiles)','sqft','supply_install','SG',82.50,123.75,102.30,38,'mid',NOW()),

('RC Floor Slab 200mm G30','Construction','RC Floor Slab','200mm G30','sqft','supply_install','MY_KL',38.00,50.00,44.00,35,'mid',NOW()),
('RC Floor Slab 200mm G30','Construction','RC Floor Slab','200mm G30','sqft','supply_install','MY_JB',33.44,44.00,38.72,26,'mid',NOW()),
('RC Floor Slab 200mm G30','Construction','RC Floor Slab','200mm G30','sqft','supply_install','MY_PG',34.96,46.00,40.48,22,'mid',NOW()),
('RC Floor Slab 200mm G30','Construction','RC Floor Slab','200mm G30','sqft','supply_install','SG',62.70,82.50,72.60,32,'mid',NOW()),

('Skim coat plastering','Construction','Plastering','Skim Coat','sqft','supply_install','MY_KL',2.00,3.50,2.75,78,'high',NOW()),
('Skim coat plastering','Construction','Plastering','Skim Coat','sqft','supply_install','MY_JB',1.76,3.08,2.42,60,'high',NOW()),
('Skim coat plastering','Construction','Plastering','Skim Coat','sqft','supply_install','MY_PG',1.84,3.22,2.53,50,'high',NOW()),
('Skim coat plastering','Construction','Plastering','Skim Coat','sqft','supply_install','SG',3.30,5.78,4.54,70,'high',NOW()),

('Self-levelling screed','Construction','Screed','Self-Levelling','sqft','supply_install','MY_KL',5.00,8.00,6.50,55,'high',NOW()),
('Self-levelling screed','Construction','Screed','Self-Levelling','sqft','supply_install','MY_JB',4.40,7.04,5.72,42,'mid',NOW()),
('Self-levelling screed','Construction','Screed','Self-Levelling','sqft','supply_install','MY_PG',4.60,7.36,5.98,35,'mid',NOW()),
('Self-levelling screed','Construction','Screed','Self-Levelling','sqft','supply_install','SG',8.25,13.20,10.73,48,'mid',NOW()),

('RC staircase','Construction','Staircase','RC Staircase','unit','supply_install','MY_KL',8000.00,15000.00,11500.00,28,'mid',NOW()),
('RC staircase','Construction','Staircase','RC Staircase','unit','supply_install','MY_JB',7040.00,13200.00,10120.00,21,'mid',NOW()),
('RC staircase','Construction','Staircase','RC Staircase','unit','supply_install','MY_PG',7360.00,13800.00,10580.00,18,'mid',NOW()),
('RC staircase','Construction','Staircase','RC Staircase','unit','supply_install','SG',13200.00,24750.00,18975.00,25,'mid',NOW()),

('Mild steel staircase','Construction','Staircase','Mild Steel Staircase','unit','supply_install','MY_KL',5000.00,10000.00,7500.00,35,'mid',NOW()),
('Mild steel staircase','Construction','Staircase','Mild Steel Staircase','unit','supply_install','MY_JB',4400.00,8800.00,6600.00,26,'mid',NOW()),
('Mild steel staircase','Construction','Staircase','Mild Steel Staircase','unit','supply_install','MY_PG',4600.00,9200.00,6900.00,22,'mid',NOW()),
('Mild steel staircase','Construction','Staircase','Mild Steel Staircase','unit','supply_install','SG',8250.00,16500.00,12375.00,30,'mid',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — DEMOLITION
-- ═══════════════════════════════════
('Hack structural wall','Demolition','Wall Hacking','Structural (with permit)','sqft','labour_only','MY_KL',10.00,16.00,13.00,45,'mid',NOW()),
('Hack structural wall','Demolition','Wall Hacking','Structural (with permit)','sqft','labour_only','MY_JB',8.80,14.08,11.44,34,'mid',NOW()),
('Hack structural wall','Demolition','Wall Hacking','Structural (with permit)','sqft','labour_only','MY_PG',9.20,14.72,11.96,28,'mid',NOW()),
('Hack structural wall','Demolition','Wall Hacking','Structural (with permit)','sqft','labour_only','SG',16.50,26.40,21.45,40,'mid',NOW()),

-- (Old duplicate tiling entries removed — correct prices are in main TILING section above)

('Epoxy grout','Tiling','Tile Grouting','Epoxy Grout','sqft','supply_install','MY_KL',3.50,5.50,4.50,55,'high',NOW()),
('Epoxy grout','Tiling','Tile Grouting','Epoxy Grout','sqft','supply_install','MY_JB',3.08,4.84,3.96,42,'mid',NOW()),
('Epoxy grout','Tiling','Tile Grouting','Epoxy Grout','sqft','supply_install','MY_PG',3.22,5.06,4.14,35,'mid',NOW()),
('Epoxy grout','Tiling','Tile Grouting','Epoxy Grout','sqft','supply_install','SG',5.78,9.08,7.43,48,'mid',NOW()),

('Floor tiles 1200x600 labour','Tiling','Floor Tiles','1200x600','sqft','labour_only','MY_KL',6.00,9.00,7.50,85,'high',NOW()),
('Floor tiles 1200x600 labour','Tiling','Floor Tiles','1200x600','sqft','labour_only','MY_JB',5.28,7.92,6.60,65,'high',NOW()),
('Floor tiles 1200x600 labour','Tiling','Floor Tiles','1200x600','sqft','labour_only','MY_PG',5.52,8.28,6.90,55,'high',NOW()),
('Floor tiles 1200x600 labour','Tiling','Floor Tiles','1200x600','sqft','labour_only','SG',9.90,14.85,12.38,75,'high',NOW()),

-- (Old duplicate electrical entries removed — correct prices in main ELECTRICAL section above)

('Cove light wiring','Electrical','Lighting Points','Cove Light Wiring','point','supply_install','MY_KL',65.00,95.00,80.00,120,'high',NOW()),
('Cove light wiring','Electrical','Lighting Points','Cove Light Wiring','point','supply_install','MY_JB',57.20,83.60,70.40,92,'high',NOW()),
('Cove light wiring','Electrical','Lighting Points','Cove Light Wiring','point','supply_install','MY_PG',59.80,87.40,73.60,78,'high',NOW()),
('Cove light wiring','Electrical','Lighting Points','Cove Light Wiring','point','supply_install','SG',107.25,156.75,132.00,105,'high',NOW()),

('DB box 18-way','Electrical','DB Box','18-way','unit','supply_install','MY_KL',1200.00,1800.00,1500.00,110,'high',NOW()),
('DB box 18-way','Electrical','DB Box','18-way','unit','supply_install','MY_JB',1056.00,1584.00,1320.00,85,'high',NOW()),
('DB box 18-way','Electrical','DB Box','18-way','unit','supply_install','MY_PG',1104.00,1656.00,1380.00,72,'high',NOW()),
('DB box 18-way','Electrical','DB Box','18-way','unit','supply_install','SG',1980.00,2970.00,2475.00,98,'high',NOW()),

('DB box 48-way','Electrical','DB Box','48-way','unit','supply_install','MY_KL',2500.00,3500.00,3000.00,38,'mid',NOW()),
('DB box 48-way','Electrical','DB Box','48-way','unit','supply_install','MY_JB',2200.00,3080.00,2640.00,28,'mid',NOW()),
('DB box 48-way','Electrical','DB Box','48-way','unit','supply_install','MY_PG',2300.00,3220.00,2760.00,24,'mid',NOW()),
('DB box 48-way','Electrical','DB Box','48-way','unit','supply_install','SG',4125.00,5775.00,4950.00,34,'mid',NOW()),

('Data point','Electrical','Data/Comms','Data Point','point','supply_install','MY_KL',85.00,120.00,102.00,132,'high',NOW()),
('Data point','Electrical','Data/Comms','Data Point','point','supply_install','MY_JB',74.80,105.60,89.76,100,'high',NOW()),
('Data point','Electrical','Data/Comms','Data Point','point','supply_install','MY_PG',78.20,110.40,93.84,85,'high',NOW()),
('Data point','Electrical','Data/Comms','Data Point','point','supply_install','SG',140.25,198.00,168.30,118,'high',NOW()),

('Exhaust fan point','Electrical','Fan Points','Exhaust Fan','point','supply_install','MY_KL',65.00,95.00,80.00,110,'high',NOW()),
('Exhaust fan point','Electrical','Fan Points','Exhaust Fan','point','supply_install','MY_JB',57.20,83.60,70.40,85,'high',NOW()),
('Exhaust fan point','Electrical','Fan Points','Exhaust Fan','point','supply_install','MY_PG',59.80,87.40,73.60,72,'high',NOW()),
('Exhaust fan point','Electrical','Fan Points','Exhaust Fan','point','supply_install','SG',107.25,156.75,132.00,98,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — PLUMBING
-- ═══════════════════════════════════
('Copper piping','Plumbing','Piping Installation','Copper','m','supply_install','MY_KL',95.00,150.00,122.00,65,'high',NOW()),
('Copper piping','Plumbing','Piping Installation','Copper','m','supply_install','MY_JB',83.60,132.00,107.36,50,'high',NOW()),
('Copper piping','Plumbing','Piping Installation','Copper','m','supply_install','MY_PG',87.40,138.00,112.24,42,'mid',NOW()),
('Copper piping','Plumbing','Piping Installation','Copper','m','supply_install','SG',156.75,247.50,201.30,58,'high',NOW()),

('Wall-hung WC S&I','Plumbing','WC/Toilet','Wall-hung WC','unit','supply_install','MY_KL',1200.00,2200.00,1700.00,75,'high',NOW()),
('Wall-hung WC S&I','Plumbing','WC/Toilet','Wall-hung WC','unit','supply_install','MY_JB',1056.00,1936.00,1496.00,58,'high',NOW()),
('Wall-hung WC S&I','Plumbing','WC/Toilet','Wall-hung WC','unit','supply_install','MY_PG',1104.00,2024.00,1564.00,48,'mid',NOW()),
('Wall-hung WC S&I','Plumbing','WC/Toilet','Wall-hung WC','unit','supply_install','SG',1980.00,3630.00,2805.00,68,'high',NOW()),

('Instant water heater S&I','Plumbing','Water Heater','Instant Heater S&I','unit','supply_install','MY_KL',350.00,650.00,500.00,135,'high',NOW()),
('Instant water heater S&I','Plumbing','Water Heater','Instant Heater S&I','unit','supply_install','MY_JB',308.00,572.00,440.00,102,'high',NOW()),
('Instant water heater S&I','Plumbing','Water Heater','Instant Heater S&I','unit','supply_install','MY_PG',322.00,598.00,460.00,86,'high',NOW()),
('Instant water heater S&I','Plumbing','Water Heater','Instant Heater S&I','unit','supply_install','SG',577.50,1072.50,825.00,118,'high',NOW()),

('Storage water heater S&I','Plumbing','Water Heater','Storage Heater S&I','unit','supply_install','MY_KL',800.00,1500.00,1150.00,85,'high',NOW()),
('Storage water heater S&I','Plumbing','Water Heater','Storage Heater S&I','unit','supply_install','MY_JB',704.00,1320.00,1012.00,65,'high',NOW()),
('Storage water heater S&I','Plumbing','Water Heater','Storage Heater S&I','unit','supply_install','MY_PG',736.00,1380.00,1058.00,55,'high',NOW()),
('Storage water heater S&I','Plumbing','Water Heater','Storage Heater S&I','unit','supply_install','SG',1320.00,2475.00,1897.50,75,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — PAINTING
-- ═══════════════════════════════════
('Ceiling skim coat & paint','Painting','Ceiling','Skim Coat & Paint','sqft','supply_install','MY_KL',2.50,4.00,3.25,155,'high',NOW()),
('Ceiling skim coat & paint','Painting','Ceiling','Skim Coat & Paint','sqft','supply_install','MY_JB',2.20,3.52,2.86,118,'high',NOW()),
('Ceiling skim coat & paint','Painting','Ceiling','Skim Coat & Paint','sqft','supply_install','MY_PG',2.30,3.68,2.99,100,'high',NOW()),
('Ceiling skim coat & paint','Painting','Ceiling','Skim Coat & Paint','sqft','supply_install','SG',4.13,6.60,5.36,138,'high',NOW()),

('Feature wall limewash','Painting','Feature Wall','Limewash','sqft','supply_install','MY_KL',6.00,10.00,8.00,55,'high',NOW()),
('Feature wall limewash','Painting','Feature Wall','Limewash','sqft','supply_install','MY_JB',5.28,8.80,7.04,42,'mid',NOW()),
('Feature wall limewash','Painting','Feature Wall','Limewash','sqft','supply_install','MY_PG',5.52,9.20,7.36,35,'mid',NOW()),
('Feature wall limewash','Painting','Feature Wall','Limewash','sqft','supply_install','SG',9.90,16.50,13.20,48,'mid',NOW()),

('Wood lacquer finish','Painting','Wood/Metal','Lacquer','sqft','supply_install','MY_KL',3.50,6.00,4.75,72,'high',NOW()),
('Wood lacquer finish','Painting','Wood/Metal','Lacquer','sqft','supply_install','MY_JB',3.08,5.28,4.18,55,'high',NOW()),
('Wood lacquer finish','Painting','Wood/Metal','Lacquer','sqft','supply_install','MY_PG',3.22,5.52,4.37,46,'mid',NOW()),
('Wood lacquer finish','Painting','Wood/Metal','Lacquer','sqft','supply_install','SG',5.78,9.90,7.84,65,'high',NOW()),

('Metal spray paint','Painting','Wood/Metal','Spray Paint','sqft','supply_install','MY_KL',4.00,7.00,5.50,58,'high',NOW()),
('Metal spray paint','Painting','Wood/Metal','Spray Paint','sqft','supply_install','MY_JB',3.52,6.16,4.84,44,'mid',NOW()),
('Metal spray paint','Painting','Wood/Metal','Spray Paint','sqft','supply_install','MY_PG',3.68,6.44,5.06,38,'mid',NOW()),
('Metal spray paint','Painting','Wood/Metal','Spray Paint','sqft','supply_install','SG',6.60,11.55,9.08,52,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — FALSE CEILING
-- ═══════════════════════════════════
('Calcium silicate ceiling','False Ceiling','False Ceiling','Calcium Silicate','sqft','supply_install','MY_KL',7.00,11.00,9.00,98,'high',NOW()),
('Calcium silicate ceiling','False Ceiling','False Ceiling','Calcium Silicate','sqft','supply_install','MY_JB',6.16,9.68,7.92,74,'high',NOW()),
('Calcium silicate ceiling','False Ceiling','False Ceiling','Calcium Silicate','sqft','supply_install','MY_PG',6.44,10.12,8.28,62,'high',NOW()),
('Calcium silicate ceiling','False Ceiling','False Ceiling','Calcium Silicate','sqft','supply_install','SG',11.55,18.15,14.85,88,'high',NOW()),

('Drop ceiling design','False Ceiling','Design Ceiling','Drop Ceiling','sqft','supply_install','MY_KL',12.00,18.00,15.00,72,'high',NOW()),
('Drop ceiling design','False Ceiling','Design Ceiling','Drop Ceiling','sqft','supply_install','MY_JB',10.56,15.84,13.20,55,'high',NOW()),
('Drop ceiling design','False Ceiling','Design Ceiling','Drop Ceiling','sqft','supply_install','MY_PG',11.04,16.56,13.80,46,'mid',NOW()),
('Drop ceiling design','False Ceiling','Design Ceiling','Drop Ceiling','sqft','supply_install','SG',19.80,29.70,24.75,65,'high',NOW()),

('Partition double layer','False Ceiling','Partition Wall','Double Layer','sqft','supply_install','MY_KL',40.00,60.00,50.00,85,'high',NOW()),
('Partition double layer','False Ceiling','Partition Wall','Double Layer','sqft','supply_install','MY_JB',35.20,52.80,44.00,65,'high',NOW()),
('Partition double layer','False Ceiling','Partition Wall','Double Layer','sqft','supply_install','MY_PG',36.80,55.20,46.00,55,'high',NOW()),
('Partition double layer','False Ceiling','Partition Wall','Double Layer','sqft','supply_install','SG',66.00,99.00,82.50,75,'high',NOW()),

('Partition fire-rated','False Ceiling','Partition Wall','Fire-rated','sqft','supply_install','MY_KL',55.00,80.00,67.00,48,'mid',NOW()),
('Partition fire-rated','False Ceiling','Partition Wall','Fire-rated','sqft','supply_install','MY_JB',48.40,70.40,58.96,36,'mid',NOW()),
('Partition fire-rated','False Ceiling','Partition Wall','Fire-rated','sqft','supply_install','MY_PG',50.60,73.60,61.64,30,'mid',NOW()),
('Partition fire-rated','False Ceiling','Partition Wall','Fire-rated','sqft','supply_install','SG',90.75,132.00,110.55,42,'mid',NOW()),

('PU cornice','False Ceiling','Cornice','PU Cornice','lm','supply_install','MY_KL',12.00,20.00,16.00,95,'high',NOW()),
('PU cornice','False Ceiling','Cornice','PU Cornice','lm','supply_install','MY_JB',10.56,17.60,14.08,72,'high',NOW()),
('PU cornice','False Ceiling','Cornice','PU Cornice','lm','supply_install','MY_PG',11.04,18.40,14.72,60,'high',NOW()),
('PU cornice','False Ceiling','Cornice','PU Cornice','lm','supply_install','SG',19.80,33.00,26.40,85,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — CARPENTRY
-- ═══════════════════════════════════
('Wardrobe walk-in','Carpentry','Wardrobe','Walk-in','ft','supply_install','MY_KL',500.00,850.00,675.00,85,'high',NOW()),
('Wardrobe walk-in','Carpentry','Wardrobe','Walk-in','ft','supply_install','MY_JB',440.00,748.00,594.00,65,'high',NOW()),
('Wardrobe walk-in','Carpentry','Wardrobe','Walk-in','ft','supply_install','MY_PG',460.00,782.00,621.00,55,'high',NOW()),
('Wardrobe walk-in','Carpentry','Wardrobe','Walk-in','ft','supply_install','SG',825.00,1402.50,1113.75,75,'high',NOW()),

('Wardrobe glass door','Carpentry','Wardrobe','Glass Door','ft','supply_install','MY_KL',550.00,900.00,725.00,55,'high',NOW()),
('Wardrobe glass door','Carpentry','Wardrobe','Glass Door','ft','supply_install','MY_JB',484.00,792.00,638.00,42,'mid',NOW()),
('Wardrobe glass door','Carpentry','Wardrobe','Glass Door','ft','supply_install','MY_PG',506.00,828.00,667.00,35,'mid',NOW()),
('Wardrobe glass door','Carpentry','Wardrobe','Glass Door','ft','supply_install','SG',907.50,1485.00,1196.25,48,'mid',NOW()),

('TV console floor-standing','Carpentry','TV Console/Feature','Floor-standing','ft','supply_install','MY_KL',500.00,800.00,650.00,115,'high',NOW()),
('TV console floor-standing','Carpentry','TV Console/Feature','Floor-standing','ft','supply_install','MY_JB',440.00,704.00,572.00,88,'high',NOW()),
('TV console floor-standing','Carpentry','TV Console/Feature','Floor-standing','ft','supply_install','MY_PG',460.00,736.00,598.00,74,'high',NOW()),
('TV console floor-standing','Carpentry','TV Console/Feature','Floor-standing','ft','supply_install','SG',825.00,1320.00,1072.50,102,'high',NOW()),

('Shoe cabinet full-height','Carpentry','Shoe Cabinet','Full-height','ft','supply_install','MY_KL',450.00,700.00,575.00,85,'high',NOW()),
('Shoe cabinet full-height','Carpentry','Shoe Cabinet','Full-height','ft','supply_install','MY_JB',396.00,616.00,506.00,65,'high',NOW()),
('Shoe cabinet full-height','Carpentry','Shoe Cabinet','Full-height','ft','supply_install','MY_PG',414.00,644.00,529.00,55,'high',NOW()),
('Shoe cabinet full-height','Carpentry','Shoe Cabinet','Full-height','ft','supply_install','SG',742.50,1155.00,948.75,75,'high',NOW()),

('Vanity solid surface top','Carpentry','Vanity Cabinet','Solid Surface Top','ft','supply_install','MY_KL',500.00,800.00,650.00,78,'high',NOW()),
('Vanity solid surface top','Carpentry','Vanity Cabinet','Solid Surface Top','ft','supply_install','MY_JB',440.00,704.00,572.00,60,'high',NOW()),
('Vanity solid surface top','Carpentry','Vanity Cabinet','Solid Surface Top','ft','supply_install','MY_PG',460.00,736.00,598.00,50,'high',NOW()),
('Vanity solid surface top','Carpentry','Vanity Cabinet','Solid Surface Top','ft','supply_install','SG',825.00,1320.00,1072.50,68,'high',NOW()),

('Hollow core door','Carpentry','Door','Hollow Core','unit','supply_install','MY_KL',350.00,550.00,450.00,165,'high',NOW()),
('Hollow core door','Carpentry','Door','Hollow Core','unit','supply_install','MY_JB',308.00,484.00,396.00,125,'high',NOW()),
('Hollow core door','Carpentry','Door','Hollow Core','unit','supply_install','MY_PG',322.00,506.00,414.00,105,'high',NOW()),
('Hollow core door','Carpentry','Door','Hollow Core','unit','supply_install','SG',577.50,907.50,742.50,145,'high',NOW()),

('Barn door','Carpentry','Door','Barn Door','unit','supply_install','MY_KL',800.00,1400.00,1100.00,55,'high',NOW()),
('Barn door','Carpentry','Door','Barn Door','unit','supply_install','MY_JB',704.00,1232.00,968.00,42,'mid',NOW()),
('Barn door','Carpentry','Door','Barn Door','unit','supply_install','MY_PG',736.00,1288.00,1012.00,35,'mid',NOW()),
('Barn door','Carpentry','Door','Barn Door','unit','supply_install','SG',1320.00,2310.00,1815.00,48,'mid',NOW()),

('Sliding door carpentry','Carpentry','Door','Sliding','unit','supply_install','MY_KL',700.00,1200.00,950.00,72,'high',NOW()),
('Sliding door carpentry','Carpentry','Door','Sliding','unit','supply_install','MY_JB',616.00,1056.00,836.00,55,'high',NOW()),
('Sliding door carpentry','Carpentry','Door','Sliding','unit','supply_install','MY_PG',644.00,1104.00,874.00,46,'mid',NOW()),
('Sliding door carpentry','Carpentry','Door','Sliding','unit','supply_install','SG',1155.00,1980.00,1567.50,65,'high',NOW()),

('Door frame timber','Carpentry','Door Frame','Timber Frame','unit','supply_install','MY_KL',180.00,300.00,240.00,145,'high',NOW()),
('Door frame timber','Carpentry','Door Frame','Timber Frame','unit','supply_install','MY_JB',158.40,264.00,211.20,110,'high',NOW()),
('Door frame timber','Carpentry','Door Frame','Timber Frame','unit','supply_install','MY_PG',165.60,276.00,220.80,92,'high',NOW()),
('Door frame timber','Carpentry','Door Frame','Timber Frame','unit','supply_install','SG',297.00,495.00,396.00,128,'high',NOW()),

('Door frame aluminium','Carpentry','Door Frame','Aluminium Frame','unit','supply_install','MY_KL',250.00,400.00,325.00,85,'high',NOW()),
('Door frame aluminium','Carpentry','Door Frame','Aluminium Frame','unit','supply_install','MY_JB',220.00,352.00,286.00,65,'high',NOW()),
('Door frame aluminium','Carpentry','Door Frame','Aluminium Frame','unit','supply_install','MY_PG',230.00,368.00,299.00,55,'high',NOW()),
('Door frame aluminium','Carpentry','Door Frame','Aluminium Frame','unit','supply_install','SG',412.50,660.00,536.25,75,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — WATERPROOFING
-- ═══════════════════════════════════
('Bathroom membrane','Waterproofing','Bathroom Floor','Membrane','sqft','supply_install','MY_KL',8.00,13.00,10.50,95,'high',NOW()),
('Bathroom membrane','Waterproofing','Bathroom Floor','Membrane','sqft','supply_install','MY_JB',7.04,11.44,9.24,72,'high',NOW()),
('Bathroom membrane','Waterproofing','Bathroom Floor','Membrane','sqft','supply_install','MY_PG',7.36,11.96,9.66,60,'high',NOW()),
('Bathroom membrane','Waterproofing','Bathroom Floor','Membrane','sqft','supply_install','SG',13.20,21.45,17.33,85,'high',NOW()),

('Flat roof liquid membrane','Waterproofing','Flat Roof','Liquid Membrane','sqft','supply_install','MY_KL',7.00,11.00,9.00,72,'high',NOW()),
('Flat roof liquid membrane','Waterproofing','Flat Roof','Liquid Membrane','sqft','supply_install','MY_JB',6.16,9.68,7.92,55,'high',NOW()),
('Flat roof liquid membrane','Waterproofing','Flat Roof','Liquid Membrane','sqft','supply_install','MY_PG',6.44,10.12,8.28,46,'mid',NOW()),
('Flat roof liquid membrane','Waterproofing','Flat Roof','Liquid Membrane','sqft','supply_install','SG',11.55,18.15,14.85,65,'high',NOW()),

('Planter box waterproofing','Waterproofing','Planter Box','Standard','sqft','supply_install','MY_KL',8.00,13.00,10.50,55,'high',NOW()),
('Planter box waterproofing','Waterproofing','Planter Box','Standard','sqft','supply_install','MY_JB',7.04,11.44,9.24,42,'mid',NOW()),
('Planter box waterproofing','Waterproofing','Planter Box','Standard','sqft','supply_install','MY_PG',7.36,11.96,9.66,35,'mid',NOW()),
('Planter box waterproofing','Waterproofing','Planter Box','Standard','sqft','supply_install','SG',13.20,21.45,17.33,48,'mid',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — ROOFING
-- ═══════════════════════════════════
('Glass roofing tempered','Roofing','Glass Roofing','Tempered Glass','sqft','supply_install','MY_KL',45.00,75.00,60.00,35,'mid',NOW()),
('Glass roofing tempered','Roofing','Glass Roofing','Tempered Glass','sqft','supply_install','MY_JB',39.60,66.00,52.80,26,'mid',NOW()),
('Glass roofing tempered','Roofing','Glass Roofing','Tempered Glass','sqft','supply_install','MY_PG',41.40,69.00,55.20,22,'mid',NOW()),
('Glass roofing tempered','Roofing','Glass Roofing','Tempered Glass','sqft','supply_install','SG',74.25,123.75,99.00,30,'mid',NOW()),

('Glass roofing laminated','Roofing','Glass Roofing','Laminated Glass','sqft','supply_install','MY_KL',55.00,90.00,72.00,28,'mid',NOW()),
('Glass roofing laminated','Roofing','Glass Roofing','Laminated Glass','sqft','supply_install','MY_JB',48.40,79.20,63.36,21,'mid',NOW()),
('Glass roofing laminated','Roofing','Glass Roofing','Laminated Glass','sqft','supply_install','MY_PG',50.60,82.80,66.24,18,'mid',NOW()),
('Glass roofing laminated','Roofing','Glass Roofing','Laminated Glass','sqft','supply_install','SG',90.75,148.50,118.80,24,'mid',NOW()),

('Polycarbonate solid sheet','Roofing','Polycarbonate Roof','Solid Sheet','sqft','supply_install','MY_KL',22.00,35.00,28.00,48,'mid',NOW()),
('Polycarbonate solid sheet','Roofing','Polycarbonate Roof','Solid Sheet','sqft','supply_install','MY_JB',19.36,30.80,24.64,36,'mid',NOW()),
('Polycarbonate solid sheet','Roofing','Polycarbonate Roof','Solid Sheet','sqft','supply_install','MY_PG',20.24,32.20,25.76,30,'mid',NOW()),
('Polycarbonate solid sheet','Roofing','Polycarbonate Roof','Solid Sheet','sqft','supply_install','SG',36.30,57.75,46.20,42,'mid',NOW()),

('Metal deck PU metal','Roofing','Metal Deck','PU Metal','sqft','supply_install','MY_KL',20.00,30.00,25.00,42,'mid',NOW()),
('Metal deck PU metal','Roofing','Metal Deck','PU Metal','sqft','supply_install','MY_JB',17.60,26.40,22.00,32,'mid',NOW()),
('Metal deck PU metal','Roofing','Metal Deck','PU Metal','sqft','supply_install','MY_PG',18.40,27.60,23.00,26,'mid',NOW()),
('Metal deck PU metal','Roofing','Metal Deck','PU Metal','sqft','supply_install','SG',33.00,49.50,41.25,38,'mid',NOW()),

('Metal deck PU foil','Roofing','Metal Deck','PU Foil','sqft','supply_install','MY_KL',18.00,26.00,22.00,38,'mid',NOW()),
('Metal deck PU foil','Roofing','Metal Deck','PU Foil','sqft','supply_install','MY_JB',15.84,22.88,19.36,28,'mid',NOW()),
('Metal deck PU foil','Roofing','Metal Deck','PU Foil','sqft','supply_install','MY_PG',16.56,23.92,20.24,24,'mid',NOW()),
('Metal deck PU foil','Roofing','Metal Deck','PU Foil','sqft','supply_install','SG',29.70,42.90,36.30,34,'mid',NOW()),

('Clay roof tile','Roofing','Roof Tiles','Clay Tile','sqft','supply_install','MY_KL',8.00,14.00,11.00,65,'high',NOW()),
('Clay roof tile','Roofing','Roof Tiles','Clay Tile','sqft','supply_install','MY_JB',7.04,12.32,9.68,50,'high',NOW()),
('Clay roof tile','Roofing','Roof Tiles','Clay Tile','sqft','supply_install','MY_PG',7.36,12.88,10.12,42,'mid',NOW()),
('Clay roof tile','Roofing','Roof Tiles','Clay Tile','sqft','supply_install','SG',13.20,23.10,18.15,58,'high',NOW()),

('Concrete roof tile','Roofing','Roof Tiles','Concrete Tile','sqft','supply_install','MY_KL',6.00,10.00,8.00,72,'high',NOW()),
('Concrete roof tile','Roofing','Roof Tiles','Concrete Tile','sqft','supply_install','MY_JB',5.28,8.80,7.04,55,'high',NOW()),
('Concrete roof tile','Roofing','Roof Tiles','Concrete Tile','sqft','supply_install','MY_PG',5.52,9.20,7.36,46,'mid',NOW()),
('Concrete roof tile','Roofing','Roof Tiles','Concrete Tile','sqft','supply_install','SG',9.90,16.50,13.20,65,'high',NOW()),

('Aluminium gutter','Roofing','Gutter/Downpipe','Aluminium','lm','supply_install','MY_KL',35.00,55.00,45.00,58,'high',NOW()),
('Aluminium gutter','Roofing','Gutter/Downpipe','Aluminium','lm','supply_install','MY_JB',30.80,48.40,39.60,44,'mid',NOW()),
('Aluminium gutter','Roofing','Gutter/Downpipe','Aluminium','lm','supply_install','MY_PG',32.20,50.60,41.40,38,'mid',NOW()),
('Aluminium gutter','Roofing','Gutter/Downpipe','Aluminium','lm','supply_install','SG',57.75,90.75,74.25,52,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — ALUMINIUM
-- ═══════════════════════════════════
('Casement window acoustic','Aluminium','Casement Window','Soundproof (Acoustic)','sqft','supply_install','MY_KL',55.00,85.00,70.00,65,'high',NOW()),
('Casement window acoustic','Aluminium','Casement Window','Soundproof (Acoustic)','sqft','supply_install','MY_JB',48.40,74.80,61.60,50,'high',NOW()),
('Casement window acoustic','Aluminium','Casement Window','Soundproof (Acoustic)','sqft','supply_install','MY_PG',50.60,78.20,64.40,42,'mid',NOW()),
('Casement window acoustic','Aluminium','Casement Window','Soundproof (Acoustic)','sqft','supply_install','SG',90.75,140.25,115.50,58,'high',NOW()),

('Sliding window standard','Aluminium','Sliding Window','Standard','sqft','supply_install','MY_KL',30.00,48.00,39.00,155,'high',NOW()),
('Sliding window standard','Aluminium','Sliding Window','Standard','sqft','supply_install','MY_JB',26.40,42.24,34.32,118,'high',NOW()),
('Sliding window standard','Aluminium','Sliding Window','Standard','sqft','supply_install','MY_PG',27.60,44.16,35.88,100,'high',NOW()),
('Sliding window standard','Aluminium','Sliding Window','Standard','sqft','supply_install','SG',49.50,79.20,64.35,138,'high',NOW()),

('Sliding door slim-frame','Aluminium','Sliding Door','Slim-frame','sqft','supply_install','MY_KL',60.00,95.00,77.00,55,'high',NOW()),
('Sliding door slim-frame','Aluminium','Sliding Door','Slim-frame','sqft','supply_install','MY_JB',52.80,83.60,67.76,42,'mid',NOW()),
('Sliding door slim-frame','Aluminium','Sliding Door','Slim-frame','sqft','supply_install','MY_PG',55.20,87.40,70.84,35,'mid',NOW()),
('Sliding door slim-frame','Aluminium','Sliding Door','Slim-frame','sqft','supply_install','SG',99.00,156.75,127.05,48,'mid',NOW()),

('Louvre window','Aluminium','Louvre Window','Standard','sqft','supply_install','MY_KL',28.00,45.00,36.00,85,'high',NOW()),
('Louvre window','Aluminium','Louvre Window','Standard','sqft','supply_install','MY_JB',24.64,39.60,31.68,65,'high',NOW()),
('Louvre window','Aluminium','Louvre Window','Standard','sqft','supply_install','MY_PG',25.76,41.40,33.12,55,'high',NOW()),
('Louvre window','Aluminium','Louvre Window','Standard','sqft','supply_install','SG',46.20,74.25,59.40,75,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — GLASS
-- ═══════════════════════════════════
('Shower screen 12mm','Glass','Shower Screen','Tempered 12mm','sqft','supply_install','MY_KL',55.00,85.00,70.00,95,'high',NOW()),
('Shower screen 12mm','Glass','Shower Screen','Tempered 12mm','sqft','supply_install','MY_JB',48.40,74.80,61.60,72,'high',NOW()),
('Shower screen 12mm','Glass','Shower Screen','Tempered 12mm','sqft','supply_install','MY_PG',50.60,78.20,64.40,60,'high',NOW()),
('Shower screen 12mm','Glass','Shower Screen','Tempered 12mm','sqft','supply_install','SG',90.75,140.25,115.50,85,'high',NOW()),

('Fluted glass partition','Glass','Fixed Glass','Fluted','sqft','supply_install','MY_KL',40.00,65.00,52.00,55,'high',NOW()),
('Fluted glass partition','Glass','Fixed Glass','Fluted','sqft','supply_install','MY_JB',35.20,57.20,45.76,42,'mid',NOW()),
('Fluted glass partition','Glass','Fixed Glass','Fluted','sqft','supply_install','MY_PG',36.80,59.80,47.84,35,'mid',NOW()),
('Fluted glass partition','Glass','Fixed Glass','Fluted','sqft','supply_install','SG',66.00,107.25,85.80,48,'mid',NOW()),

('Anti-fog mirror','Glass','Mirror','Anti-fog (Bathroom)','sqft','supply_install','MY_KL',35.00,55.00,45.00,58,'high',NOW()),
('Anti-fog mirror','Glass','Mirror','Anti-fog (Bathroom)','sqft','supply_install','MY_JB',30.80,48.40,39.60,44,'mid',NOW()),
('Anti-fog mirror','Glass','Mirror','Anti-fog (Bathroom)','sqft','supply_install','MY_PG',32.20,50.60,41.40,38,'mid',NOW()),
('Anti-fog mirror','Glass','Mirror','Anti-fog (Bathroom)','sqft','supply_install','SG',57.75,90.75,74.25,52,'high',NOW()),

('Backsplash tempered painted','Glass','Backsplash','Tempered Painted','sqft','supply_install','MY_KL',30.00,50.00,40.00,72,'high',NOW()),
('Backsplash tempered painted','Glass','Backsplash','Tempered Painted','sqft','supply_install','MY_JB',26.40,44.00,35.20,55,'high',NOW()),
('Backsplash tempered painted','Glass','Backsplash','Tempered Painted','sqft','supply_install','MY_PG',27.60,46.00,36.80,46,'mid',NOW()),
('Backsplash tempered painted','Glass','Backsplash','Tempered Painted','sqft','supply_install','SG',49.50,82.50,66.00,65,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — FLOORING
-- ═══════════════════════════════════
('Laminate flooring standard','Flooring','Laminate','Standard','sqft','supply_install','MY_KL',4.50,7.50,6.00,145,'high',NOW()),
('Laminate flooring standard','Flooring','Laminate','Standard','sqft','supply_install','MY_JB',3.96,6.60,5.28,110,'high',NOW()),
('Laminate flooring standard','Flooring','Laminate','Standard','sqft','supply_install','MY_PG',4.14,6.90,5.52,92,'high',NOW()),
('Laminate flooring standard','Flooring','Laminate','Standard','sqft','supply_install','SG',7.43,12.38,9.90,128,'high',NOW()),

('Laminate AC4/AC5','Flooring','Laminate','AC4/AC5 Grade','sqft','supply_install','MY_KL',6.50,10.00,8.25,85,'high',NOW()),
('Laminate AC4/AC5','Flooring','Laminate','AC4/AC5 Grade','sqft','supply_install','MY_JB',5.72,8.80,7.26,65,'high',NOW()),
('Laminate AC4/AC5','Flooring','Laminate','AC4/AC5 Grade','sqft','supply_install','MY_PG',5.98,9.20,7.59,55,'high',NOW()),
('Laminate AC4/AC5','Flooring','Laminate','AC4/AC5 Grade','sqft','supply_install','SG',10.73,16.50,13.61,75,'high',NOW()),

('Timber skirting','Flooring','Skirting','Timber','lm','supply_install','MY_KL',15.00,25.00,20.00,110,'high',NOW()),
('Timber skirting','Flooring','Skirting','Timber','lm','supply_install','MY_JB',13.20,22.00,17.60,85,'high',NOW()),
('Timber skirting','Flooring','Skirting','Timber','lm','supply_install','MY_PG',13.80,23.00,18.40,72,'high',NOW()),
('Timber skirting','Flooring','Skirting','Timber','lm','supply_install','SG',24.75,41.25,33.00,98,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — AIR CONDITIONING
-- ═══════════════════════════════════
('2.5HP inverter','Air Conditioning','Split Unit','2.5HP Inverter','unit','supply_install','MY_KL',2800.00,4200.00,3500.00,95,'high',NOW()),
('2.5HP inverter','Air Conditioning','Split Unit','2.5HP Inverter','unit','supply_install','MY_JB',2464.00,3696.00,3080.00,72,'high',NOW()),
('2.5HP inverter','Air Conditioning','Split Unit','2.5HP Inverter','unit','supply_install','MY_PG',2576.00,3864.00,3220.00,60,'high',NOW()),
('2.5HP inverter','Air Conditioning','Split Unit','2.5HP Inverter','unit','supply_install','SG',4620.00,6930.00,5775.00,85,'high',NOW()),

('Ceiling cassette AC','Air Conditioning','Ceiling Cassette','Standard','unit','supply_install','MY_KL',3500.00,5500.00,4500.00,48,'mid',NOW()),
('Ceiling cassette AC','Air Conditioning','Ceiling Cassette','Standard','unit','supply_install','MY_JB',3080.00,4840.00,3960.00,36,'mid',NOW()),
('Ceiling cassette AC','Air Conditioning','Ceiling Cassette','Standard','unit','supply_install','MY_PG',3220.00,5060.00,4140.00,30,'mid',NOW()),
('Ceiling cassette AC','Air Conditioning','Ceiling Cassette','Standard','unit','supply_install','SG',5775.00,9075.00,7425.00,42,'mid',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — METAL WORK
-- ═══════════════════════════════════
('Wrought iron railing','Metal Work','Railing','Wrought Iron','lm','supply_install','MY_KL',180.00,320.00,250.00,72,'high',NOW()),
('Wrought iron railing','Metal Work','Railing','Wrought Iron','lm','supply_install','MY_JB',158.40,281.60,220.00,55,'high',NOW()),
('Wrought iron railing','Metal Work','Railing','Wrought Iron','lm','supply_install','MY_PG',165.60,294.40,230.00,46,'mid',NOW()),
('Wrought iron railing','Metal Work','Railing','Wrought Iron','lm','supply_install','SG',297.00,528.00,412.50,65,'high',NOW()),

('Metal gate double leaf','Metal Work','Gate','Double Leaf','unit','supply_install','MY_KL',1200.00,2200.00,1700.00,55,'high',NOW()),
('Metal gate double leaf','Metal Work','Gate','Double Leaf','unit','supply_install','MY_JB',1056.00,1936.00,1496.00,42,'mid',NOW()),
('Metal gate double leaf','Metal Work','Gate','Double Leaf','unit','supply_install','MY_PG',1104.00,2024.00,1564.00,35,'mid',NOW()),
('Metal gate double leaf','Metal Work','Gate','Double Leaf','unit','supply_install','SG',1980.00,3630.00,2805.00,48,'mid',NOW()),

('Auto gate system','Metal Work','Gate','Auto Gate','unit','supply_install','MY_KL',2500.00,4500.00,3500.00,65,'high',NOW()),
('Auto gate system','Metal Work','Gate','Auto Gate','unit','supply_install','MY_JB',2200.00,3960.00,3080.00,50,'high',NOW()),
('Auto gate system','Metal Work','Gate','Auto Gate','unit','supply_install','MY_PG',2300.00,4140.00,3220.00,42,'mid',NOW()),
('Auto gate system','Metal Work','Gate','Auto Gate','unit','supply_install','SG',4125.00,7425.00,5775.00,58,'high',NOW()),

('Window grille','Metal Work','Grille','Window Grille','sqft','supply_install','MY_KL',18.00,30.00,24.00,115,'high',NOW()),
('Window grille','Metal Work','Grille','Window Grille','sqft','supply_install','MY_JB',15.84,26.40,21.12,88,'high',NOW()),
('Window grille','Metal Work','Grille','Window Grille','sqft','supply_install','MY_PG',16.56,27.60,22.08,74,'high',NOW()),
('Window grille','Metal Work','Grille','Window Grille','sqft','supply_install','SG',29.70,49.50,39.60,102,'high',NOW()),

('Polycarbonate awning','Metal Work','Awning','Polycarbonate','sqft','supply_install','MY_KL',25.00,42.00,33.00,72,'high',NOW()),
('Polycarbonate awning','Metal Work','Awning','Polycarbonate','sqft','supply_install','MY_JB',22.00,36.96,29.04,55,'high',NOW()),
('Polycarbonate awning','Metal Work','Awning','Polycarbonate','sqft','supply_install','MY_PG',23.00,38.64,30.36,46,'mid',NOW()),
('Polycarbonate awning','Metal Work','Awning','Polycarbonate','sqft','supply_install','SG',41.25,69.30,54.45,65,'high',NOW()),

('Metal roof awning','Metal Work','Awning','Metal Roof','sqft','supply_install','MY_KL',30.00,50.00,40.00,58,'high',NOW()),
('Metal roof awning','Metal Work','Awning','Metal Roof','sqft','supply_install','MY_JB',26.40,44.00,35.20,44,'mid',NOW()),
('Metal roof awning','Metal Work','Awning','Metal Roof','sqft','supply_install','MY_PG',27.60,46.00,36.80,38,'mid',NOW()),
('Metal roof awning','Metal Work','Awning','Metal Roof','sqft','supply_install','SG',49.50,82.50,66.00,52,'high',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — LANDSCAPE
-- ═══════════════════════════════════
('Natural stone paving','Landscape','Garden Paving','Natural Stone','sqft','supply_install','MY_KL',15.00,28.00,21.00,42,'mid',NOW()),
('Natural stone paving','Landscape','Garden Paving','Natural Stone','sqft','supply_install','MY_JB',13.20,24.64,18.48,32,'mid',NOW()),
('Natural stone paving','Landscape','Garden Paving','Natural Stone','sqft','supply_install','MY_PG',13.80,25.76,19.32,26,'mid',NOW()),
('Natural stone paving','Landscape','Garden Paving','Natural Stone','sqft','supply_install','SG',24.75,46.20,34.65,38,'mid',NOW()),

('Artificial turf','Landscape','Turfing','Artificial Turf','sqft','supply_install','MY_KL',8.00,15.00,11.50,55,'high',NOW()),
('Artificial turf','Landscape','Turfing','Artificial Turf','sqft','supply_install','MY_JB',7.04,13.20,10.12,42,'mid',NOW()),
('Artificial turf','Landscape','Turfing','Artificial Turf','sqft','supply_install','MY_PG',7.36,13.80,10.58,35,'mid',NOW()),
('Artificial turf','Landscape','Turfing','Artificial Turf','sqft','supply_install','SG',13.20,24.75,18.98,48,'mid',NOW()),

('Japanese grass turfing','Landscape','Turfing','Japanese/Pearl Grass','sqft','supply_install','MY_KL',2.50,4.50,3.50,65,'high',NOW()),
('Japanese grass turfing','Landscape','Turfing','Japanese/Pearl Grass','sqft','supply_install','MY_JB',2.20,3.96,3.08,50,'high',NOW()),
('Japanese grass turfing','Landscape','Turfing','Japanese/Pearl Grass','sqft','supply_install','MY_PG',2.30,4.14,3.22,42,'mid',NOW()),
('Japanese grass turfing','Landscape','Turfing','Japanese/Pearl Grass','sqft','supply_install','SG',4.13,7.43,5.78,58,'high',NOW()),

('Composite WPC deck','Landscape','Decking','Composite/WPC Deck','sqft','supply_install','MY_KL',18.00,30.00,24.00,55,'high',NOW()),
('Composite WPC deck','Landscape','Decking','Composite/WPC Deck','sqft','supply_install','MY_JB',15.84,26.40,21.12,42,'mid',NOW()),
('Composite WPC deck','Landscape','Decking','Composite/WPC Deck','sqft','supply_install','MY_PG',16.56,27.60,22.08,35,'mid',NOW()),
('Composite WPC deck','Landscape','Decking','Composite/WPC Deck','sqft','supply_install','SG',29.70,49.50,39.60,48,'mid',NOW()),

('Timber pergola','Landscape','Pergola/Gazebo','Timber','unit','supply_install','MY_KL',3500.00,7000.00,5250.00,35,'mid',NOW()),
('Timber pergola','Landscape','Pergola/Gazebo','Timber','unit','supply_install','MY_JB',3080.00,6160.00,4620.00,26,'mid',NOW()),
('Timber pergola','Landscape','Pergola/Gazebo','Timber','unit','supply_install','MY_PG',3220.00,6440.00,4830.00,22,'mid',NOW()),
('Timber pergola','Landscape','Pergola/Gazebo','Timber','unit','supply_install','SG',5775.00,11550.00,8662.50,30,'mid',NOW()),

('BRC mesh fencing','Landscape','Fencing','BRC Mesh','lm','supply_install','MY_KL',55.00,90.00,72.00,48,'mid',NOW()),
('BRC mesh fencing','Landscape','Fencing','BRC Mesh','lm','supply_install','MY_JB',48.40,79.20,63.36,36,'mid',NOW()),
('BRC mesh fencing','Landscape','Fencing','BRC Mesh','lm','supply_install','MY_PG',50.60,82.80,66.24,30,'mid',NOW()),
('BRC mesh fencing','Landscape','Fencing','BRC Mesh','lm','supply_install','SG',90.75,148.50,118.80,42,'mid',NOW()),

-- ═══════════════════════════════════
-- ADDITIONAL — CLEANING
-- ═══════════════════════════════════
('Deep clean post-reno','Cleaning','Post-renovation','Deep Clean','sqft','labour_only','MY_KL',1.20,2.00,1.60,145,'high',NOW()),
('Deep clean post-reno','Cleaning','Post-renovation','Deep Clean','sqft','labour_only','MY_JB',1.06,1.76,1.41,110,'high',NOW()),
('Deep clean post-reno','Cleaning','Post-renovation','Deep Clean','sqft','labour_only','MY_PG',1.10,1.84,1.47,92,'high',NOW()),
('Deep clean post-reno','Cleaning','Post-renovation','Deep Clean','sqft','labour_only','SG',1.98,3.30,2.64,128,'high',NOW()),

('Chemical wash facade','Cleaning','Chemical Wash','Facade','sqft','labour_only','MY_KL',1.50,2.50,2.00,55,'high',NOW()),
('Chemical wash facade','Cleaning','Chemical Wash','Facade','sqft','labour_only','MY_JB',1.32,2.20,1.76,42,'mid',NOW()),
('Chemical wash facade','Cleaning','Chemical Wash','Facade','sqft','labour_only','MY_PG',1.38,2.30,1.84,35,'mid',NOW()),
('Chemical wash facade','Cleaning','Chemical Wash','Facade','sqft','labour_only','SG',2.48,4.13,3.30,48,'mid',NOW())

ON CONFLICT (category, subcategory, material_method, unit, supply_type, region) DO UPDATE SET
  item_name    = EXCLUDED.item_name,
  min_price    = EXCLUDED.min_price,
  max_price    = EXCLUDED.max_price,
  avg_price    = EXCLUDED.avg_price,
  sample_count = EXCLUDED.sample_count,
  confidence   = EXCLUDED.confidence,
  updated_at   = NOW();
