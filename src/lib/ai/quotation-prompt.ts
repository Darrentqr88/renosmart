export function buildQuotationPrompt(textForAI: string, outputLang: string, dbPriceRef?: string): string {
  const priceSection = dbPriceRef
    ? `Market price reference (MY/SG 2025-2026, verified market data):\n${dbPriceRef}`
    : `Market price reference (baseline): Tiling S&I RM15-35/sqft | Tiling Labour incl. cement & sand RM12-18/sqft (pure labour only RM6-10/sqft) | Electrical pt RM80-180 | Painting RM2.5-5/sqft | Carpentry RM350-1800/ft | Plumbing RM300-800/unit | Table Top: Postform RM80-150/ft, Quartz std RM180-350/ft, Quartz premium RM350-600/ft, Marble local RM300-600/ft, Marble imported RM500-1200/ft, Sintered stone China RM250-400/ft, Sintered stone (Dekton/Neolith) RM500-900/ft, Solid Surface RM250-500/ft, Labour Only RM50-120/ft | Feature Wall / Bed Headboard / Wall Panel S&I RM70-150/sqft | Partition / Drywall S&I RM40-90/sqft`;

  return `You are a senior Quantity Surveyor (QS) AI for Malaysia and Singapore renovation projects.
Audit the quotation below — parse ALL items AND catch problems. Return ONLY valid JSON. No markdown.
Output language: ${outputLang}
${priceSection}
Quotation:
\`\`\`
${textForAI}
\`\`\`

RULES:
1. CLIENT vs CONTRACTOR: "client" = property OWNER paying (To:/Attn:/Bill To:/业主:). The issuing company is the contractor — do NOT put in client.
2. Section totals → subtotals array only. Never as items.
3. Copy item names VERBATIM. Never translate English names to Chinese or vice versa.
4. warn/flag items: add "note" ≤20 chars describing the price issue. status="ok" → note MUST be "" (empty). Never add qualitative comments like "higher end" or "within range" as a note.
5. Items: include ALL line items in ORIGINAL document order. Do NOT sort. Do NOT skip. Include "page" (1-based integer from "--- Page N ---" markers).
6. status: "ok"=price normal | "warn"=20-50% above or >30% below | "flag"=>50% above | "nodata"=no reference found
7. supplyType detection:
   "supply_install" = "Supply and Install"/"S&I"/"Supply to "/"包工包料"/"连安装"/no supply mention (default)
   "labour_only"    = "Labour Only"/"工人费"/"人工"/"安装费 only"/"不含材料"
   "supply_only"    = "Supply Only"/"Material Only"/"供料"/"不含安装"
   DEFAULT: if no supply type is mentioned, assume "supply_install"
8. projectType: "condo"|"apartment"|"landed_terrace"|"landed_semid"|"landed_bungalow"|"shop_lot"|"commercial"|"mall"|"factory". Default "landed_terrace".
   HARD RULE — condo/apartment classification:
   ONLY classify as condo/apartment if the address or quotation body EXPLICITLY and LITERALLY contains one or more of these exact keywords:
   "Unit", "Blok", "Block", "Kondominium", "Condominium", "Residensi", "Residence", "Apartment", "Pangsapuri", "Parcel No", "Lot No Strata", or an explicit floor/level number referring to a unit (e.g. "Level 5, Block A").
   NEVER classify as condo/apartment based on: balconies, multiple floors, staircases, high ceilings, extension works, or any "could be" / "suggests" reasoning. Landed houses (terrace/semid/bungalow) routinely have all of these.
   If you are even slightly uncertain → output "landed_terrace". The cost of a wrong condo flag is far higher than missing it.
   CONSEQUENCE: If projectType is NOT "condo" or "apartment", do NOT add "JMB/MC management approval" or "renovation notice submission" to missingCritical under any circumstances.
9. projectSqft: estimate from floor plan references, item quantities, or address context.
10. QS AUDIT — Malaysia / Singapore Professional QS Audit:
    MISSING ITEMS — systematic trigger-based checklist. For each trigger, scan ALL items in the quotation first. Only flag as missing if genuinely absent (not covered under a different name or section).
    SCAN RULES — when checking if an item exists, match by MEANING not exact wording:
    - Waterproofing = "water proofing" / "waterproofing" / "water proof" / "WP membrane" / "torch-on" / "kalis air" — ANY of these counts as waterproofing present. Do NOT flag missing if ANY such item appears anywhere in the quotation, even under Tiling or other sections.
    - Debris disposal = "disposal" / "rubbish removal" / "skip bin" / "waste removal" / "remove debris" — counts as disposal present.
    - If an item is present but only for SOME areas (e.g. 2nd floor balcony only, not bathrooms), flag the SPECIFIC missing areas, not the whole category.

    [BATHROOM / WET AREA SCOPE] — triggered if: bathroom renovation, wet area tiling, sanitary fittings, shower, WC, basin present:
    ✦ Waterproofing → CRITICAL (except landed GF bathrooms — not required there)
    ✦ Water heater → CRITICAL if no water heater anywhere in quotation
    ✦ Hacking of existing tiles → warning if replacing tiles but no hacking quoted
    ✦ Debris disposal → warning if hacking present but no disposal
    ✦ Floor trap / floor grating → warning if bathroom tiling but no floor trap

    [KITCHEN SCOPE] — triggered if: kitchen cabinet, kitchen tiling, kitchen top, wet kitchen present:
    ✦ Kitchen table top / countertop → CRITICAL if kitchen cabinets quoted but no countertop
    ✦ Kitchen sink + tap → warning if kitchen cabinet but no sink
    ✦ Waterproofing (wet kitchen) → CRITICAL for condo/upper floor; not required landed GF
    ✦ Water heater → warning if kitchen scope but no water heater anywhere
    ✦ Hacking → warning if new tiling but no hacking item

    [ELECTRICAL SCOPE] — triggered if: lighting points, sockets, wiring, DB, fan points present:
    ✦ DB box upgrade → warning if >15 new electrical points but no DB upgrade quoted
    ✦ Lighting fittings → info if points quoted but no fittings supply (check if labour-only intended)
    ✦ Testing & commissioning → info if large electrical scope (>20 points)

    [PLUMBING SCOPE] — triggered if: basin, WC, shower, pipe, drainage present:
    ✦ Waterproofing → CRITICAL (condo/upper floor); not required landed GF
    ✦ Water heater → warning if bathroom scope but no water heater
    ✦ Floor trap → warning if wet area but no floor trap

    [TILING SCOPE] — triggered if: floor/wall tiles present:
    ✦ Hacking of existing tiles → warning if no hacking item (assume existing tiles need removal)
    ✦ Waterproofing → CRITICAL for wet areas condo/upper floor
    ✦ Debris disposal → warning if hacking present but no disposal item

    [CARPENTRY SCOPE] — triggered if: wardrobe, cabinet, kitchen cabinet, TV console present:
    ✦ Nothing critical — carpentry is typically self-contained

    [FULL RENOVATION / WHOLE UNIT] — triggered if: multiple trades across whole unit:
    ✦ Site prelims / preliminary works → warning if no site management / hoarding / protection item
    ✦ Post-renovation cleaning → warning if no cleaning item
    ✦ M&E roughin (1st fix wiring + piping) → CRITICAL if electrical + plumbing present but no roughin/first-fix items

    [DEMOLITION / HACKING SCOPE] — triggered if: any hacking or demolition item present:
    ✦ Debris disposal / lorry skip bin → warning if not quoted
    ✦ Re-plastering / patching → info if walls hacked but no plastering item

    [EXTENSION / STRUCTURAL SCOPE] — triggered if: RC slab, new slab, extension, beam, column, structural work present:
    ✦ Plan submission & City Council approval (MBPJ/DBKL/local authority) → CRITICAL
    ✦ Structural engineer PE endorsement → CRITICAL

    [CONDO / APARTMENT PROJECT] — any renovation:
    ✦ Renovation notice & JMB/MC management approval + deposit → CRITICAL

    WATERPROOFING RULES (summary):
    - Landed GF wet areas: NOT required. Do NOT flag.
    - Landed upper floors (1F+): REQUIRED for bathrooms, balcony, laundry.
    - Condo/apartment ALL floors: REQUIRED for all wet areas.
    - RC roof / Balcony / Extension / water feature: ALWAYS required.
    WATERPROOFING ANTI-ASSUMPTION RULE (HARD):
    - NEVER flag waterproofing for areas where the quotation does NOT include explicit wet area work (bathroom tiling, plumbing, sanitary fittings, shower, WC, basin, floor trap, waterproofing scope).
    - Do NOT assume or infer that a room is a wet area. Only flag waterproofing for areas where wet area scope is EXPLICITLY quoted in the quotation.
    - "Assumed Wet Area" is NEVER acceptable as a reason. The wet area work MUST be present in the quotation text.
    - If a room (bedroom, hall, living room, study) has NO wet area items quoted, do NOT flag waterproofing for it — even if it might have an en-suite bathroom.
    PRICE: flag >50% above; warn 20-50% above or >30% below.
    Cite: "Market RM X-Y/unit, Quoted RM Z/unit". Match unit types. Consider supplyType + material grade.
    IMPORTANT: For tiles priced per pcs, apply Rule 16 derivation BEFORE comparing to sqft reference. For split supply+labour, combine both before comparing to S&I reference. Never flag a correctly-split supply_only+labour_only pair as anomaly unless their COMBINED price is out of range.
    CALC ERROR: qty × unitPrice ≠ total by >1% → flag critical. If calculation IS correct → NO alert. Never create a "Calculation Error" alert that says "Calculation is correct" — that is contradictory. Only create a Calculation Error alert when there is a genuine discrepancy.
    COORDINATION: tiling + no waterproofing (condo/upper floor) → critical.
    ALERTS — strict rules:
    - level="critical"/"warning": ONLY for items with status="warn" or "flag", calculation errors, missing critical scope, coordination failures. NEVER for status="ok" items.
    - level="info": ONLY for non-price SUGGESTIONS — practical tips relevant to THIS quotation's scope. NEVER for price observations. NEVER create "Pricing Anomaly" alerts at info level — price issues belong ONLY in the per-item status/note fields and in warning/critical level alerts.
      GOOD info alert examples (use these as reference, generate ONLY those applicable to the actual scope):
      • "Carpentry Lead Time" — "Factory production typically 4-6 weeks. Confirm order date to avoid schedule delay."
      • "Tile Size Not Specified" — "Items 3, 7: tile size affects labour cost and wastage. Confirm with supplier."
      • "Large Format Tile" — "600x1200mm tiles require leveling system + experienced tiler. Budget for 10% wastage."
      • "Electrical Coordination" — "DB upgrade should be completed before ceiling works. Coordinate sequence."
      • "Paint Colour Selection" — "Confirm paint colour code before ordering. Custom tinting adds 2-3 days lead time."
      • "Waterproofing Curing" — "Allow 7-14 days curing before tiling. Factor into schedule."
      • "AC Piping Roughin" — "AC copper piping must be installed before ceiling closes. Coordinate with AC contractor."
      • "Site Protection" — "Existing flooring/fixtures not being replaced should be protected during works."
      • "Material Delivery" — "Confirm site access for large items (cabinets, tiles). Condo may require booking goods lift."
      • "Warranty Terms" — "No warranty terms stated. Recommend confirming defect liability period with contractor."
      Each info alert must be specific to items/scope found in THIS quotation. Do NOT generate generic tips unrelated to the actual work scope. Max 8 info alerts.
    - ABSOLUTE RULE: If price is within range → NO ALERT AT ALL. Do NOT create any alert mentioning "within range", "reasonable", "in range", "on the higher end but within", or any phrase implying the price is acceptable. Silence = ok.
    - "Price Anomaly" alerts ONLY for genuine outliers (status="flag" or status="warn"). If status="ok" → NO Price Anomaly alert ever.
    - GROUPING RULE: If multiple items share the SAME issue type (e.g. several items all have ambiguous 'sq' unit, or several wallpaper items all exceed market price), create ONE alert with a combined desc listing all affected items (e.g. "Items 1, 2, 3: ..."). Do NOT create separate alerts for each item with the same issue.
    - No hardcoded max count. Generate only genuinely needed alerts. Each desc ≤200 chars.
11. paymentTerms: extract if present, else [].
12. subcategory + materialMethod per item:
    Tiling:        "Floor Tiles"+"600x600" | "Floor Tiles"+"300x300" | "Wall Tiles"+"300x600" | "Mosaic"+"Feature" | "Marble"+"Floor" | "Marble"+"Wall" | "Granite"+"Floor" | "Natural Stone"+"Floor" | "Artificial Stone"+"Floor"
    Carpentry:     "Kitchen Cabinet"+"Laminated" | "Wardrobe"+"Sliding Door" | "Vanity Cabinet"+"Laminated" | "TV Console"+"Laminated"
    Tabletop:      "Kitchen Table Top"+"Quartz Surface" | "Bathroom Table Top"+"Solid Surface" | "Bar Table Top"+"Sintered Stone" | "Kitchen Table Top"+"Sintered Stone China" | "Kitchen Table Top"+"Marble" | "Kitchen Table Top"+"Postform"
    Plumbing:      "Basin"+"Mixer Tap" | "WC"+"Wall Hung" | "WC"+"Floor Mount" | "Rain Shower"+"Set" | "Water Heater"+"Instant"
    Electrical:    "Power Point"+"13A" | "Lighting Point"+"Standard" | "DB Box"+"18-way" | "Ceiling Fan"+"Point"
    Painting:      "Interior Wall"+"2-Coat" | "Skim Coat"+"+ Paint" | "Exterior"+"Weather Shield"
    False Ceiling: "Flat Plasterboard"+"Standard" | "L-Box"+"Cove Light" | "Design Ceiling"+"Premium"
    Flooring:      "SPC Vinyl"+"Click Lock" | "Timber Engineered"+"Standard" | "Laminated Floor"+"Standard"
    Glass:         "Shower Screen"+"10mm Tempered" | "Fix Panel"+"Tempered" | "Mirror"+"Standard"
    Aluminium:     "Casement Window"+"Standard" | "Sliding Door"+"Standard" | "Folding Door"+"Standard"
    AC:            "Split Unit"+"1.5HP" | "Split Unit"+"2.5HP" | "Cassette Unit"+"Standard"
    Demolition:    "Hacking Floor"+"Standard" | "Hacking Wall"+"Standard"
    Waterproofing: "Bathroom"+"Cementitious" | "Flat Roof"+"Torch-On" | "Balcony"+"Standard"
    Construction:  "Brick Wall"+"With Plastering" | "RC Slab"+"150mm G25" | "Screed"+"Re-leveling" | "Extension"+"RC Slab" | "Construct"+"Standard" | "Conceal"+"Window"
    Landscape:     "Artificial Turf"+"Roll" | "Carpet Grass"+"Natural" | "Planting"+"Standard" | "Landscape"+"General"
    CCTV & Alarm:  "CCTV Camera"+"Indoor" | "CCTV Camera"+"Outdoor" | "Alarm System"+"Standard" | "Access Control"+"Standard"
    Metal Work:    "Mild Steel Gate"+"Powder Coated" | "Metal Railing"+"Standard" | "Metal Grille"+"Standard" | "Steel Door"+"Standard" | "Roofing"+"Polycarbonate" | "Roofing"+"Zinc" | "Roofing"+"PU Metal" | "Roofing"+"Aluminium Panel" | "Roofing"+"Composite"
    Cleaning:      "Post-renovation Cleaning"+"Standard" | "Deep Cleaning"+"Standard"
    Curtain:       "Curtain"+"Day Night" | "Curtain Track"+"Standard" | "Roller Blind"+"Standard" | "Sheer Curtain"+"Standard"
    NOTE: Vanity/basin cabinet = Carpentry. Table top/tabletop = Tabletop (not Carpentry).
13. estMinPrice + estMaxPrice: designer-to-homeowner quote price in MY/SG. NOT contractor cost. Match item's unit + supplyType + material grade. Never leave as 0.
    CRITICAL — match supplyType strictly:
    • Item says "Supply To Build-up / Supply and Install / S&I" → use S&I reference price (e.g. brick wall S&I = RM 20-40/sqft, NOT labour-only RM 12-20/sqft)
    • Item says "Labour Only / Install Only" → use labour-only reference price
    • Never use labour-only range for a supply_install item or vice versa — this causes false price anomalies.
14. missingCritical: List critical absent items. Each: item, reason, estimatedCost (use price reference + projectSqft), urgency.
    PROJECT TYPE DETECTION — derive from address + quotation scope:
    - "Jalan"/"Lorong" + residential context, no "Lot/Industrial" → landed house
    - "Unit"/"Blok"/"Kondominium"/"Residensi"/floor number in address → condo/apartment
    - "Lot"/"Industrial"/"Kilang"/"Warehouse" → factory/warehouse
    - "Shoplot"/"Kedai"/"Ground Floor" commercial → shop lot
    - "Mall"/"Retail Podium"/"Shopping Complex" → mall/retail
    CRITICAL MISSING by project type:
    • Landed house: upper floor (1F+) bathrooms → waterproofing CRITICAL; GF wet area → NOT required
    • Condo/Apartment: ALL wet areas → waterproofing CRITICAL; also flag "Submit renovation notice & obtain JMB/MC management approval + renovation deposit before works commence" as CRITICAL
    • Factory/Warehouse: fire-rated partition CRITICAL if office scope present; 3-phase DB if machinery; roof drainage if roof works
    • Shop lot: grease trap + fire suppression if F&B kitchen; DB upgrade to commercial spec
    • Mall/Retail: fire-rated ceiling, emergency lighting, hoarding/barricade
    SCOPE-TRIGGERED MISSING (apply regardless of project type):
    • Hack/Demolition items present → flag "Clear debris & lorry skip bin disposal" as warning if not quoted
    • Extension / New RC slab / RC beam present → flag "Plan submission & approval from City Council (MBPJ/DBKL/local authority) required BEFORE works commence" as CRITICAL
    • Condo/Apartment ONLY — and ONLY if projectType was set to "condo" or "apartment" per Rule 8 above (explicit keyword required) → flag "Submit renovation notice & obtain JMB/MC management approval" as CRITICAL. If projectType is landed/shop/commercial/factory → SKIP this item entirely, do not add it.

    OPEN-ENDED QS JUDGMENT — beyond the triggers above, apply your professional QS knowledge:
    After checking all the triggers, review the FULL quotation scope holistically. Ask: "What would a real senior QS flag as missing or incomplete given this specific project?" Consider:
    • Coordination gaps (e.g. carpentry installed before painting — sequence risk)
    • Safety/compliance items implied by scope but not quoted (e.g. earthing/bonding if DB upgrade; fire-rated door if structural opening created)
    • Omitted preliminaries for the project scale (e.g. no site manager fee for large project)
    • Items commonly forgotten in MY/SG renovations specific to this scope
    Flag additional missing items if genuinely applicable. Do not invent items that aren't relevant to the actual scope.
    HARD CONSTRAINT: NEVER use open-ended judgment to add waterproofing items. Waterproofing missing items are ONLY governed by the trigger-based rules above. If the trigger conditions (wet area work explicitly present) are not met, waterproofing MUST NOT appear in missingCritical regardless of QS judgment.
15. Unit normalization: "lot"/"set" with qty>1 → derive per-unit. Lump-sum → qty=1, unitPrice=total, unitPriceDerived=true.
16. TILE UNIT DERIVATION — when tiles are priced per pcs/pc/piece, convert to per-sqft for accurate price audit:
    Tile size → sqft per piece (approx):
      300×300 mm  = 1 sqft/pcs   | 300×600 mm  = 2 sqft/pcs
      600×600 mm  = 4 sqft/pcs   | 800×800 mm  = 7 sqft/pcs
      900×900 mm  = 9 sqft/pcs   | 600×1200 mm = 8 sqft/pcs
      1200×600 mm = 8 sqft/pcs   | 1200×1200 mm = 15 sqft/pcs
    Formula: sqft_per_tile ≈ (W_mm × H_mm) / 92903
    → derived_unit_price_sqft = tile_price_per_pcs / sqft_per_tile
    → set unitPriceDerived=true, convert qty to sqft, recalculate unitPrice in /sqft
    Per m²: divide by 10.764 to get per-sqft equivalent.
    SPLIT SUPPLY + LABOUR: when a quotation has SEPARATE tile material (per pcs/m²) + labour (per sqft) as two line items:
    → combined_sqft = material_per_pcs / sqft_per_tile + labour_per_sqft
    → compare combined_sqft to S&I reference price for status/flag decision
    → label material item supplyType="supply_only", labour item supplyType="labour_only"
    → cite in note: e.g. "Material RM3.75/sqft + Labour RM15/sqft = RM18.75/sqft total"
    LABOUR NOTE: "Labour Only" in MY/SG tiling trade typically INCLUDES cement, sand & grout (not pure workmanship). Market rate = RM12-18/sqft. Pure workmanship-only (owner supplies cement & sand) = RM6-10/sqft. When a quotation says "Labour" for tiling, assume RM12-18/sqft unless explicitly stated otherwise.
    Example: Tile 600×600 at RM15/pcs → RM3.75/sqft material + RM15/sqft labour (incl. cement & sand) = RM18.75/sqft S&I (ok vs RM15-28/sqft reference)

17. CARPENTRY DIMENSION DERIVATION — for cabinet/wardrobe/carpentry items with a SIZE column:
    Pattern: item has a size in ft (e.g. "4.5ft", "13.5ft", "7ft") in the size/length column,
    qty=1 (one lot of that specific size), and a lump total price.
    → qty = numeric ft value, unit = "ft", unitPrice = total ÷ ft_value, unitPriceDerived = true

    Examples:
    • Tall Cabinet 4.5ft, qty=1, total=RM2,790 → qty=4.5, unit=ft, unitPrice=620.00 ✓
    • Base Cabinet 13.5ft, qty=1, total=RM5,670 → qty=13.5, unit=ft, unitPrice=420.00 ✓
    • Wall Hung Cabinet 13.5ft, qty=1, total=RM6,750 → qty=13.5, unit=ft, unitPrice=500.00 ✓
    • Wardrobe 8ft, qty=1, total=RM6,400 → qty=8, unit=ft, unitPrice=800.00 ✓

    Applies to: cabinets, wardrobes, TV consoles, shelving, shoe cabinets, table tops with ft dimensions.
    Trigger: item is carpentry/tabletop category AND original qty ≤ 1 AND a ft/mm/inch size value exists in the row.
    Do NOT apply if qty > 1 (e.g. 3 units × 2ft = treat as 3 pcs).

    MM → FT CONVERSION — dimensions in quotation notes/descriptions may be in mm or inches:
    • mm → ft: divide by 304.8 (exact) or 300 (trade approximation). 300mm ≈ 1ft.
    • inches → ft: divide by 12. 12" = 1ft.
    • "(4100mmL × 800mmH)" → length = 4100 ÷ 300 ≈ 13.5ft ✓
    • "(1300mmL × 2100mmH)" → length = 1300 ÷ 300 ≈ 4.3ft → size column shows 4.5ft → use 4.5ft ✓
    • "(600mmL × 2700mmH)" → length = 600 ÷ 300 = 2ft ✓
    Cross-check: if both size column (ft) and description (mm) exist, use the ft column value; mm is for verification.

IMPORTANT: Output missing/missingCritical/alerts BEFORE items array to ensure they are not truncated.

JSON structure:
{"projectType":"landed_terrace","projectSqft":1200,"client":{"company":"","address":"","attention":"","tel":"","email":null,"projectRef":"","projectName":""},"score":{"total":75,"completeness":70,"price":80,"logic":85,"risk":50},"summary":"one-line summary","missing":["item1","item2"],"missingCritical":[{"item":"Post-renovation cleaning","reason":"Full renovation scope but no cleaning item quoted","estimatedCost":"RM 800–1,500","urgency":"warning"}],"alerts":[{"level":"critical","title":"Title","desc":"Short desc under 150 chars"},{"level":"warning","title":"Title","desc":"desc"},{"level":"info","title":"Title","desc":"desc"}],"items":[{"no":"1","section":"Section","name":"Item name verbatim","unit":"sqft","qty":100,"unitPrice":2.5,"total":250,"unitPriceDerived":false,"supplyType":"supply_install","status":"ok","note":"","subcategory":"Floor Tiles","materialMethod":"600x600","estMinPrice":5.0,"estMaxPrice":12.0,"page":1}],"subtotals":[{"label":"Section Total","amount":1000}],"totalAmount":50000,"paymentTerms":[]}`;
}

/**
 * Builds a focused prompt to generate ganttParams from parsed items.
 * Called as a separate (parallel) AI call for speed.
 */
export function buildGanttParamsPrompt(items: { name: string; section: string; unit: string; qty: number; supplyType: string }[], projectType: string, projectSqft: number, outputLang: string): string {
  const itemList = items.map((i, idx) => `${idx + 1}. [${i.section}] ${i.name} | ${i.qty} ${i.unit} | ${i.supplyType}`).join('\n');

  return `You are a professional construction planner for MY/SG renovation. Generate ganttParams from these quotation items.
Output language: ${outputLang}. Return ONLY valid JSON.

Project: ${projectType}, ~${projectSqft} sqft
Items:
${itemList}

STEP 1 — Identify ALL work categories (detectedCategories).
STEP 2 — Map to standard tradeScope keys OR customPhases.
STEP 3 — Calculate days from ACTUAL quantities + material types.
STEP 4 — Generate subTasks per trade (break down into specific work items with individual durations).
STEP 5 — Identify risks and lead times per trade.

Standard keys: demolition|masonry|tiling|electrical|plumbing|painting|wallpaper|carpentry|falseCeiling|waterproofing|flooring|aluminium|aircon|glass|metalwork|stone|tabletop

IMPORTANT trade classification rules:
- wallpaper key: ANY item with "wall paper", "wallpaper", "wall paper laminate", "wallcovering", "vinyl wallpaper", "壁纸", "墙纸" in name/section → MUST use wallpaper key, NOT carpentry
- carpentry key: cabinets, wardrobes, built-in furniture, solid plywood panels, feature walls (wood/plywood), TV consoles
- If a section contains BOTH wall panel (carpentry) and wall paper laminate (wallpaper), output BOTH keys separately

Non-standard → customPhases with: name, name_zh, trade, estimatedDays, insertAfter (phase ID), subTasks, risks.

Day rules (assume multi-worker crews):
- demolition=ceil(sqft/120/3) min2 (3-person crew)
- masonry: DETECT sub-types from items:
    • Bricklaying/Wall = ceil(sqft/80/4) days (4-person crew)
    • RC Slab/Floor = +4 days (concrete pour + cure, 3-person crew)
    • RC Roofing/Footing/Beam/Column = +4 days per element type
    • Extension (扩建) = +10 days (structural + cure, 4-person crew)
    • Screed/Re-level = ceil(sqft/120/3) days
    → Sum all sub-types, min 3 days
- tiling: ADJUST by tile type:
    • Standard 600×600/300×600 = ceil(sqft/80/3) min3
    • Large format (800×800+) = ×1.3 (slower cutting/laying)
    • Mosaic/small tile (≤100×100) = ×2.0 (much slower)
    • Natural stone/marble = ×1.5 (careful handling)
- electrical=ceil(pts/5) min3; pts = count of power/light/fan/data points in items
- plumbing=ceil(units/2) min2; units = count of basins/wc/showers/taps
- painting=ceil(sqft/150/2) min4 (2-person crew)
- wallpaper=ceil(rooms/1) min1 max5; rooms = count of rooms/areas getting wallpaper (wall paper laminate, wallcovering — includes SC/LO/KW laminate product codes)
- falseCeiling=ceil(ceilingSqft/100/2) min2 max8 (2-person crew)
- waterproofing=ceil(wetAreaSqft/70/2) min2 max5
- flooring=ceil(floorSqft/70/2) min2 max8
- aluminium=ceil(sqft/300/2) min2
- aircon=ceil(units/2) min1
- carpentry: SEPARATE mfg and install:
    • ft = total linear ft of all carpentry items
    • itemCount = count of distinct carpentry items (cabinets, wardrobes, etc.)
    • Output BOTH: ft and itemCount fields in tradeScope.carpentry
    (mfg days CAPPED by itemCount: ≤3 items→max 15d, ≤6→max 18d, ≤10→max 21d, >10→max 25d; install = max(3, ceil(ft/8/3)) 3-person team)

subTasks per trade: break down into specific work items from the quotation. Each subTask has:
  - name: specific work (e.g. "Kitchen floor tiling 600×600 (120sqft)")
  - name_zh: Chinese name
  - days: estimated duration for THIS sub-task
  - note: material-specific tip if any (e.g. "large format — use leveling system")
Sum of subTask days should ≈ estimatedDays. If no natural breakdown, use 1-2 subTasks.

risks per trade (max 2): identify trade-specific risks from the quotation content.
  - level: "high"|"medium"|"low"
  - text: concise risk description (e.g. "Imported marble — 4-6 week lead time, confirm stock before ordering")
  - text_zh: Chinese translation

leadTimeDays: material procurement lead time BEFORE work can start (0 if standard materials available locally).
  - Imported/custom materials: 14-42 days
  - Factory-made items (carpentry, custom doors): included in mfg phase, set to 0
  - Standard local materials: 0-3 days

leadTimeNote: why lead time is needed (e.g. "Custom aluminum sliding door — factory production 3 weeks")

materialNotes: list of key materials that must be confirmed/ordered (max 3). E.g. ["Confirm tile selection — 600×600 homogeneous","Order basin & mixer tap — check stock"]

taskName: describe ACTUAL scope (e.g. "Kitchen Floor + 3 Bathrooms Wall Tiling (950sqft)" NOT "Tiling Works"). Include floor prefix if multi-floor.

JSON:
{"sqft":${projectSqft},"projectType":"${projectType}","hasDemolition":true,"detectedCategories":["Demolition","Tiling"],"tradeScope":{"demolition":{"sqft":200,"estimatedDays":4,"taskName":"GF Full Hacking (200sqft)","taskName_zh":"底层全拆除","subTasks":[{"name":"Floor hacking (120sqft)","name_zh":"地面拆除","days":2,"note":""},{"name":"Wall hacking (80sqft)","name_zh":"墙面拆除","days":2,"note":"Check for concealed pipes"}],"risks":[{"level":"medium","text":"Check for asbestos in old ceiling panels","text_zh":"检查旧天花板是否含石棉"}],"leadTimeDays":0,"materialNotes":["Arrange skip bin for debris disposal"]},"tiling":{"sqft":950,"estimatedDays":8,"taskName":"Kitchen Floor + 3 Bathrooms Wall Tiling (950sqft)","taskName_zh":"厨房地砖+3间浴室墙砖","subTasks":[{"name":"Kitchen floor 600×600 (120sqft)","name_zh":"厨房地砖","days":2,"note":""},{"name":"Bathroom 1 wall+floor (280sqft)","name_zh":"浴室1墙地砖","days":2,"note":""},{"name":"Bathroom 2+3 (550sqft)","name_zh":"浴室2+3","days":4,"note":"mosaic feature wall — slower"}],"risks":[{"level":"low","text":"Confirm tile batch consistency across 3 bathrooms","text_zh":"确认3间浴室瓷砖批次一致"}],"leadTimeDays":7,"leadTimeNote":"Mosaic tiles — confirm stock, may need 1 week order","materialNotes":["Confirm mosaic tile selection","Order adhesive + grout matching mosaic color"]},"carpentry":{"ft":45,"itemCount":6,"estimatedDays":28,"taskName":"Kitchen Cabinet + 2 Wardrobes + TV Console","taskName_zh":"厨柜+2衣柜+电视柜","subTasks":[{"name":"Kitchen top+bottom cabinet (18ft)","name_zh":"厨房上下柜","days":3,"note":""},{"name":"Master wardrobe sliding (10ft)","name_zh":"主卧衣柜","days":2,"note":""},{"name":"Bedroom 2 wardrobe (8ft)","name_zh":"卧室2衣柜","days":1,"note":""},{"name":"TV console + shoe cabinet (9ft)","name_zh":"电视柜+鞋柜","days":2,"note":""}],"risks":[{"level":"high","text":"Confirm factory slot — CNY period may cause 2-week delay","text_zh":"确认工厂排期—农历新年期间可能延迟2周"}],"leadTimeDays":0,"leadTimeNote":"","materialNotes":["Confirm laminate color + handle selection","Measure after painting phase 1"]}},"customPhases":[]}`;
}

/**
 * Builds a focused prompt to generate AI prep hints for a specific trade.
 * Called on-demand when user opens a task detail panel.
 */
export function buildTradeHintPrompt(
  trade: string,
  items: { name: string; qty: number; unit: string; unitPrice: number; total: number }[],
  region: 'MY' | 'SG',
  outputLang: string = 'EN',
): string {
  const currency = region === 'SG' ? 'SGD' : 'RM';
  const itemList = items
    .slice(0, 12)
    .map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`)
    .join('\n');

  if (outputLang === 'ZH') {
    return `你是专业的工程设计师，负责审核报价单内容并为施工人员提供事前准备工作提示和注意事项。

工种：${trade}
地区：${region === 'SG' ? 'Singapore' : 'Malaysia'}

报价单中该工种的实际项目：
${itemList}

根据以上实际报价内容，生成具体、可执行的准备事项。请结合实际数量和材料规格给出建议。

只返回JSON，格式如下：
{
  "prepItems": ["3-5条具体准备事项，必须基于上方实际报价内容，包含数量/材料/品牌等细节"],
  "warnings": ["1-3条风险提醒或注意事项"],
  "quotationNotes": "一句话总结该工种报价内容（含金额）"
}`;
  }

  return `You are a professional construction project manager. Review the quotation items below and provide pre-construction preparation tips and warnings.
Output language: English

Trade: ${trade}
Region: ${region === 'SG' ? 'Singapore' : 'Malaysia'}

Actual quotation items for this trade:
${itemList}

Based on the actual items above, generate specific, actionable preparation items. Include actual quantities and material specs.

Return ONLY valid JSON:
{
  "prepItems": ["3-5 specific preparation items based on actual quotation content above, include quantities/materials/brand details"],
  "warnings": ["1-3 risk warnings or important notes"],
  "quotationNotes": "One-line summary of this trade's quotation scope (include amount)"
}`;
}

/**
 * Builds a batch prompt to generate AI prep hints for ALL trades at once.
 * Called once after Gantt generation, instead of per-panel.
 * Also accepts unmatched items (classifyItemTrade returned null) for AI to classify.
 */
export function buildBatchTradeHintPrompt(
  trades: { trade: string; items: { name: string; qty: number; unit: string; unitPrice: number; total: number }[] }[],
  region: 'MY' | 'SG',
  options?: {
    projectType?: string;
    unmatchedItems?: { name: string; qty: number; unit: string; unitPrice: number; total: number }[];
    outputLang?: string;
  },
): string {
  const currency = region === 'SG' ? 'SGD' : 'RM';
  const projectType = options?.projectType || 'residential';
  const unmatchedItems = options?.unmatchedItems || [];
  const outputLang = options?.outputLang || 'EN';

  const tradeBlocks = trades
    .map(t => {
      const itemList = t.items
        .slice(0, 10)
        .map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`)
        .join('\n');
      return `【${t.trade}】\n${itemList}`;
    })
    .join('\n\n');

  const isCommercial = ['commercial', 'mall', 'shop_lot', 'factory'].includes(projectType);

  if (outputLang === 'ZH') {
    const unmatchedBlock = unmatchedItems.length > 0
      ? `\n\n【未分类项目 — 请将每项归入正确工种】\n` +
        unmatchedItems.slice(0, 20).map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`).join('\n')
      : '';

    const projectTypeNote = isCommercial
      ? `项目类型：商业/商场 — 注意是否需要夜班施工（商场通常要求凌晨施工），以及是否需要工程管理局许可证（JKR/CIDB）。`
      : `项目类型：${projectType}`;

    return `你是专业的工程设计师，负责审核报价单内容并为施工团队提供施工前准备提示。
地区：${region === 'SG' ? 'Singapore' : 'Malaysia'}
${projectTypeNote}

以下是报价单中各工种的实际项目：

${tradeBlocks}${unmatchedBlock}

要求：
1. 为每个工种生成 **最多5条** 针对本次报价内容的关键准备事项（prepItems），必须结合实际项目名称、数量、材料规格，不能泛泛而谈。
2. prepItems 按三类结构生成（总数不超过5条）：
   a) 按工程类型注意事项（如公寓楼层限制、商业夜班要求，最多1条）
   b) 工作内容关键注意事项（施工技术要点，最多2条）
   c) 工前材料准备注意事项（需确认备妥的材料/品牌/规格/数量，最多2条）
3. warnings：1-2条风险提醒（质量风险/常见漏项）
4. quotationNotes：一句话总结该工种报价内容（含金额范围）${unmatchedItems.length > 0 ? `
5. unmatchedClassifications：将未分类项目逐一归入正确工种（仅返回工种名，与trades中的工种名一致）` : ''}

只返回JSON，不加任何说明文字：
{
  "trades": {
    "工种名称": {
      "prepItems": ["最多5条具体准备事项"],
      "warnings": ["1-2条风险提醒"],
      "quotationNotes": "一句话总结"
    }
  }${unmatchedItems.length > 0 ? `,
  "unmatchedClassifications": {
    "项目名称": "归属工种名（与trades中一致）"
  }` : ''}
}`;
  }

  // English prompt
  const unmatchedBlock = unmatchedItems.length > 0
    ? `\n\n【Unclassified Items — assign each to the correct trade】\n` +
      unmatchedItems.slice(0, 20).map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`).join('\n')
    : '';

  const projectTypeNote = isCommercial
    ? `Project type: Commercial — note if night shift work is required (malls often require after-hours work), and whether JKR/CIDB permits are needed.`
    : `Project type: ${projectType}`;

  return `You are a professional construction project manager. Review the quotation items and provide pre-construction preparation tips for the work crew.
Output language: English
Region: ${region === 'SG' ? 'Singapore' : 'Malaysia'}
${projectTypeNote}

Quotation items by trade:

${tradeBlocks}${unmatchedBlock}

Requirements:
1. For each trade, generate **up to 5** key preparation items (prepItems) specific to this quotation. Must reference actual item names, quantities, and material specs.
2. Structure prepItems in 3 categories (total max 5):
   a) Project-type considerations (e.g. condo floor restrictions, commercial night work, max 1)
   b) Key work content notes (construction technical points, max 2)
   c) Pre-work material preparation (materials/brands/specs/quantities to confirm, max 2)
3. warnings: 1-2 risk warnings (quality risks / common omissions)
4. quotationNotes: One-line summary of this trade's quotation scope (include amount range)${unmatchedItems.length > 0 ? `
5. unmatchedClassifications: Assign each unclassified item to the correct trade (return trade name only, matching trades above)` : ''}

Return ONLY valid JSON:
{
  "trades": {
    "Trade Name": {
      "prepItems": ["Up to 5 specific preparation items"],
      "warnings": ["1-2 risk warnings"],
      "quotationNotes": "One-line summary"
    }
  }${unmatchedItems.length > 0 ? `,
  "unmatchedClassifications": {
    "Item name": "Trade name (matching trades above)"
  }` : ''}
}`;
}

/**
 * Fetches price_database for a region and formats as compact text for the AI prompt.
 * Only fetches the base region (e.g. MY_KL) to save tokens.
 * Returns a compact string like:
 *   [Tiling] Floor Tiles 600x600 S&I: RM 18-28/sqft (245 samples)
 */
export async function fetchDbPriceReference(
  supabaseClient: unknown,
  region: string,
): Promise<string> {
  try {
    const sb = supabaseClient as any; // flexible chaining for two different query shapes

    // Layer 1 + Layer 2 queries in parallel
    const [layer1Result, layer2Result] = await Promise.all([
      sb.from('price_database')
        .select('item_name, category, subcategory, material_method, unit, supply_type, min_price, max_price, sample_count')
        .eq('region', region)
        .order('category'),
      sb.from('price_data_points')
        .select('category, subcategory, material_method, unit, supply_type, unit_price')
        .eq('region', region),
    ]);

    const layer1Data: DbPriceRow[] = layer1Result.data || [];
    const layer2Raw: PriceDataPoint[] = layer2Result.data || [];

    const currency = region === 'SG' ? '$' : 'RM';
    const fmtNum = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n % 1 === 0 ? n.toString() : n.toFixed(1);

    // Layer 1: aggregated benchmarks (≥10 samples, high confidence)
    const layer1Keys = new Set<string>();
    const groups = new Map<string, string[]>();

    for (const r of layer1Data) {
      if (r.sample_count < 10) continue;
      const key = `${r.category}|${r.subcategory}|${r.material_method}|${r.unit}|${r.supply_type}`;
      layer1Keys.add(key);
      const cat = r.category;
      if (!groups.has(cat)) groups.set(cat, []);
      const supplyLabel = r.supply_type === 'labour_only' ? ' [Labour]' : '';
      const min = Number(r.min_price);
      const max = Number(r.max_price);
      groups.get(cat)!.push(`${r.item_name}${supplyLabel}: ${currency}${fmtNum(min)}-${fmtNum(max)}/${r.unit}`);
    }

    // Layer 2: raw data points — only for items NOT yet in layer 1
    const earlyMap = new Map<string, { min: number; max: number; count: number; cat: string; name: string; unit: string; supply: string }>();
    for (const pt of layer2Raw) {
      const key = `${pt.category}|${pt.subcategory ?? ''}|${pt.material_method ?? ''}|${pt.unit}|${pt.supply_type}`;
      if (layer1Keys.has(key)) continue;
      const displayName = pt.material_method
        ? `${pt.subcategory || pt.category} ${pt.material_method}`
        : (pt.subcategory || pt.category);
      if (!earlyMap.has(key)) {
        earlyMap.set(key, { min: pt.unit_price, max: pt.unit_price, count: 1, cat: pt.category, name: displayName, unit: pt.unit, supply: pt.supply_type });
      } else {
        const g = earlyMap.get(key)!;
        g.min = Math.min(g.min, pt.unit_price);
        g.max = Math.max(g.max, pt.unit_price);
        g.count++;
      }
    }

    for (const [, g] of earlyMap) {
      if (!groups.has(g.cat)) groups.set(g.cat, []);
      const supplyLabel = g.supply === 'labour_only' ? ' [Labour]' : '';
      groups.get(g.cat)!.push(`${g.name}${supplyLabel} [early ${g.count} samples]: ${currency}${fmtNum(g.min)}-${fmtNum(g.max)}/${g.unit}`);
    }

    if (groups.size === 0) return '';

    const lines: string[] = [];
    for (const [cat, items] of groups) {
      lines.push(`[${cat}]`);
      for (const item of items) lines.push(`- ${item}`);
    }

    return lines.join('\n');
  } catch {
    // On error, return minimal fallback so AI still has basic price context
    return 'Tiling S&I RM15-35/sqft | Electrical pt RM80-180 | Painting RM2.5-5/sqft | Carpentry RM350-1800/ft | Plumbing RM300-800/unit';
  }
}

interface DbPriceRow {
  item_name: string;
  category: string;
  subcategory: string;
  material_method: string;
  unit: string;
  supply_type: string;
  min_price: number;
  max_price: number;
  sample_count: number;
  confidence: string;
}

interface PriceDataPoint {
  category: string;
  subcategory: string | null;
  material_method: string | null;
  unit: string;
  supply_type: string;
  unit_price: number;
}
