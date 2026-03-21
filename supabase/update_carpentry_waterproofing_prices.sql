-- ============================================
-- UPDATE: Carpentry & Waterproofing prices
-- Sync with PRICE_REFERENCE (designer retail)
-- Run in Supabase SQL Editor
-- ============================================

-- Kitchen cabinet laminated
UPDATE price_database SET min_price=450, max_price=950, avg_price=700 WHERE item_name='Kitchen cabinet laminated' AND region='MY_KL';
UPDATE price_database SET min_price=396, max_price=836, avg_price=616 WHERE item_name='Kitchen cabinet laminated' AND region='MY_JB';
UPDATE price_database SET min_price=414, max_price=874, avg_price=644 WHERE item_name='Kitchen cabinet laminated' AND region='MY_PG';
UPDATE price_database SET min_price=700, max_price=1400, avg_price=1050 WHERE item_name='Kitchen cabinet laminated' AND region='SG';

-- Kitchen cabinet melamine
UPDATE price_database SET min_price=450, max_price=950, avg_price=700 WHERE item_name='Kitchen cabinet melamine' AND region='MY_KL';
UPDATE price_database SET min_price=396, max_price=836, avg_price=616 WHERE item_name='Kitchen cabinet melamine' AND region='MY_JB';
UPDATE price_database SET min_price=414, max_price=874, avg_price=644 WHERE item_name='Kitchen cabinet melamine' AND region='MY_PG';
UPDATE price_database SET min_price=700, max_price=1400, avg_price=1050 WHERE item_name='Kitchen cabinet melamine' AND region='SG';

-- Kitchen cabinet aluminium
UPDATE price_database SET min_price=400, max_price=900, avg_price=650 WHERE item_name='Kitchen cabinet aluminium' AND region='MY_KL';
UPDATE price_database SET min_price=352, max_price=792, avg_price=572 WHERE item_name='Kitchen cabinet aluminium' AND region='MY_JB';
UPDATE price_database SET min_price=368, max_price=828, avg_price=598 WHERE item_name='Kitchen cabinet aluminium' AND region='MY_PG';
UPDATE price_database SET min_price=600, max_price=1300, avg_price=950 WHERE item_name='Kitchen cabinet aluminium' AND region='SG';

-- Kitchen cabinet solid wood
UPDATE price_database SET min_price=800, max_price=1800, avg_price=1300 WHERE item_name='Kitchen cabinet solid wood' AND region='MY_KL';
UPDATE price_database SET min_price=704, max_price=1584, avg_price=1144 WHERE item_name='Kitchen cabinet solid wood' AND region='MY_JB';
UPDATE price_database SET min_price=736, max_price=1656, avg_price=1196 WHERE item_name='Kitchen cabinet solid wood' AND region='MY_PG';
UPDATE price_database SET min_price=1200, max_price=2500, avg_price=1850 WHERE item_name='Kitchen cabinet solid wood' AND region='SG';

-- Wardrobe swing door
UPDATE price_database SET min_price=700, max_price=1200, avg_price=950 WHERE item_name='Wardrobe swing door' AND region='MY_KL';
UPDATE price_database SET min_price=616, max_price=1056, avg_price=836 WHERE item_name='Wardrobe swing door' AND region='MY_JB';
UPDATE price_database SET min_price=644, max_price=1104, avg_price=874 WHERE item_name='Wardrobe swing door' AND region='MY_PG';
UPDATE price_database SET min_price=1000, max_price=1800, avg_price=1400 WHERE item_name='Wardrobe swing door' AND region='SG';

-- Wardrobe sliding door
UPDATE price_database SET min_price=800, max_price=1400, avg_price=1100 WHERE item_name='Wardrobe sliding door' AND region='MY_KL';
UPDATE price_database SET min_price=704, max_price=1232, avg_price=968 WHERE item_name='Wardrobe sliding door' AND region='MY_JB';
UPDATE price_database SET min_price=736, max_price=1288, avg_price=1012 WHERE item_name='Wardrobe sliding door' AND region='MY_PG';
UPDATE price_database SET min_price=1200, max_price=2000, avg_price=1600 WHERE item_name='Wardrobe sliding door' AND region='SG';

-- Wardrobe walk-in
UPDATE price_database SET min_price=900, max_price=1600, avg_price=1250 WHERE item_name='Wardrobe walk-in' AND region='MY_KL';
UPDATE price_database SET min_price=792, max_price=1408, avg_price=1100 WHERE item_name='Wardrobe walk-in' AND region='MY_JB';
UPDATE price_database SET min_price=828, max_price=1472, avg_price=1150 WHERE item_name='Wardrobe walk-in' AND region='MY_PG';
UPDATE price_database SET min_price=1300, max_price=2300, avg_price=1800 WHERE item_name='Wardrobe walk-in' AND region='SG';

-- Wardrobe glass door
UPDATE price_database SET min_price=1000, max_price=1800, avg_price=1400 WHERE item_name='Wardrobe glass door' AND region='MY_KL';
UPDATE price_database SET min_price=880, max_price=1584, avg_price=1232 WHERE item_name='Wardrobe glass door' AND region='MY_JB';
UPDATE price_database SET min_price=920, max_price=1656, avg_price=1288 WHERE item_name='Wardrobe glass door' AND region='MY_PG';
UPDATE price_database SET min_price=1500, max_price=2700, avg_price=2100 WHERE item_name='Wardrobe glass door' AND region='SG';

-- Shoe cabinet
UPDATE price_database SET min_price=250, max_price=550, avg_price=400 WHERE item_name='Shoe cabinet' AND region='MY_KL';
UPDATE price_database SET min_price=220, max_price=484, avg_price=352 WHERE item_name='Shoe cabinet' AND region='MY_JB';
UPDATE price_database SET min_price=230, max_price=506, avg_price=368 WHERE item_name='Shoe cabinet' AND region='MY_PG';
UPDATE price_database SET min_price=400, max_price=800, avg_price=600 WHERE item_name='Shoe cabinet' AND region='SG';

-- Vanity cabinet
UPDATE price_database SET min_price=350, max_price=700, avg_price=525 WHERE item_name='Vanity cabinet' AND region='MY_KL';
UPDATE price_database SET min_price=308, max_price=616, avg_price=462 WHERE item_name='Vanity cabinet' AND region='MY_JB';
UPDATE price_database SET min_price=322, max_price=644, avg_price=483 WHERE item_name='Vanity cabinet' AND region='MY_PG';
UPDATE price_database SET min_price=500, max_price=1000, avg_price=750 WHERE item_name='Vanity cabinet' AND region='SG';

-- Bathroom waterproofing
UPDATE price_database SET min_price=8, max_price=18, avg_price=13 WHERE item_name='Bathroom waterproofing' AND region='MY_KL';
UPDATE price_database SET min_price=7.04, max_price=15.84, avg_price=11.44 WHERE item_name='Bathroom waterproofing' AND region='MY_JB';
UPDATE price_database SET min_price=7.36, max_price=16.56, avg_price=11.96 WHERE item_name='Bathroom waterproofing' AND region='MY_PG';
UPDATE price_database SET min_price=12, max_price=25, avg_price=18.50 WHERE item_name='Bathroom waterproofing' AND region='SG';
