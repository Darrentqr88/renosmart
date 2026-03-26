export function buildQuotationPrompt(textForAI: string, outputLang: string, dbPriceRef?: string): string {
  const priceSection = dbPriceRef
    ? `Market price reference (MY/SG 2025-2026, verified market data):\n${dbPriceRef}`
    : `Market price reference (baseline): Tiling S&I RM15-35/sqft | Electrical pt RM80-180 | Painting RM2.5-5/sqft | Carpentry RM350-1800/ft | Plumbing RM300-800/unit`;

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
4. warn/flag items: add "note" ≤20 chars describing the price issue. Empty string if ok.
5. Items: include ALL line items in ORIGINAL document order. Do NOT sort. Do NOT skip. Include "page" (1-based integer from "--- Page N ---" markers).
6. status: "ok"=price normal | "warn"=20-50% above or >30% below | "flag"=>50% above | "nodata"=no reference found
7. supplyType detection:
   "supply_install" = "Supply and Install"/"S&I"/"Supply to "/"包工包料"/"连安装"/no supply mention (default)
   "labour_only"    = "Labour Only"/"工人费"/"人工"/"安装费 only"/"不含材料"
   "supply_only"    = "Supply Only"/"Material Only"/"供料"/"不含安装"
   DEFAULT: if no supply type is mentioned, assume "supply_install"
8. projectType: "condo"|"apartment"|"landed_terrace"|"landed_semid"|"landed_bungalow"|"shop_lot"|"commercial"|"mall"|"factory". Default "landed_terrace".
9. projectSqft: estimate from floor plan references, item quantities, or address context.
10. QS AUDIT — Malaysia / Singapore Professional QS Audit:
    MISSING ITEMS: The examples below are not exhaustive — use professional QS judgement to identify any serious missing scope in the quotation.
    Common critical missing: waterproofing (wet areas), DB upgrade, water heater, site prelims/management fee, cleaning, M&E first fix (roughin wiring/piping).
    CONSTRUCTION MISSING (flag if renovation scope implies but not quoted):
    - Demolition/hacking (if floors/walls replaced but no hacking item)
    - Debris disposal / lorry skip bin
    - Structural support / beam / column (if load-bearing wall removal mentioned)
    - Protective hoarding (commercial/mall projects)
    WATERPROOFING:
    - Landed GF wet areas: NOT required. Do NOT flag.
    - Landed upper floors (1F+): REQUIRED for bathrooms, balcony, laundry.
    - Condo/apartment ALL floors: REQUIRED for all wet areas.
    - RC slab roof / Balcony / Extension / water feature: ALWAYS required.
    PRICE: flag >50% above; warn 20-50% above or >30% below.
    Cite: "Market RM X-Y/unit, Quoted RM Z/unit". Match unit types. Consider supplyType + material grade.
    CALC ERROR: qty × unitPrice ≠ total by >1% → flag critical.
    COORDINATION: tiling + no waterproofing (condo/upper floor) → critical.
    ALERTS: max 8 critical + 6 warning + 4 info. Each desc ≤150 chars.
11. paymentTerms: extract if present, else [].
12. subcategory + materialMethod per item:
    Tiling:        "Floor Tiles"+"600x600" | "Floor Tiles"+"300x300" | "Wall Tiles"+"300x600" | "Mosaic"+"Feature" | "Marble"+"Floor" | "Marble"+"Wall" | "Granite"+"Floor" | "Natural Stone"+"Floor" | "Artificial Stone"+"Floor"
    Carpentry:     "Kitchen Cabinet"+"Laminated" | "Wardrobe"+"Sliding Door" | "Vanity Cabinet"+"Laminated" | "TV Console"+"Laminated"
    Tabletop:      "Kitchen Countertop"+"Quartz Surface" | "Bathroom Countertop"+"Solid Surface" | "Bar Countertop"+"Sintered Stone"
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
    NOTE: Vanity/basin cabinet = Carpentry. Countertop/tabletop = Tabletop (not Carpentry).
13. estMinPrice + estMaxPrice: designer-to-homeowner quote price in MY/SG. NOT contractor cost. Match item's unit + supplyType + material grade. Never leave as 0.
14. missingCritical: ≤6 critical absent items. Each: item, reason, estimatedCost (use price reference + projectSqft), urgency.
15. Unit normalization: "lot"/"set" with qty>1 → derive per-unit. Lump-sum → qty=1, unitPrice=total, unitPriceDerived=true.

IMPORTANT: Output missing/missingCritical/alerts BEFORE items array to ensure they are not truncated.

JSON structure:
{"projectType":"landed_terrace","projectSqft":1200,"client":{"company":"","address":"","attention":"","tel":"","email":null,"projectRef":"","projectName":""},"score":{"total":75,"completeness":70,"price":80,"logic":85,"risk":50},"summary":"one-line summary","missing":["item1","item2"],"missingCritical":[{"item":"Waterproofing (3 bathrooms)","reason":"Wet areas present but no waterproofing","estimatedCost":"RM 3,500–6,000","urgency":"critical"}],"alerts":[{"level":"critical","title":"Title","desc":"Short desc under 150 chars"},{"level":"warning","title":"Title","desc":"desc"},{"level":"info","title":"Title","desc":"desc"}],"items":[{"no":"1","section":"Section","name":"Item name verbatim","unit":"sqft","qty":100,"unitPrice":2.5,"total":250,"unitPriceDerived":false,"supplyType":"supply_install","status":"ok","note":"","subcategory":"Floor Tiles","materialMethod":"600x600","estMinPrice":5.0,"estMaxPrice":12.0,"page":1}],"subtotals":[{"label":"Section Total","amount":1000}],"totalAmount":50000,"paymentTerms":[]}`;
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

Standard keys: demolition|masonry|tiling|electrical|plumbing|painting|carpentry|falseCeiling|waterproofing|flooring|aluminium|aircon|glass|metalwork|stone|tabletop

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
- falseCeiling=ceil(ceilingSqft/100/2) min2 max8 (2-person crew)
- waterproofing=ceil(wetAreaSqft/70/2) min2 max5
- flooring=ceil(floorSqft/70/2) min2 max8
- aluminium=ceil(sqft/300/2) min2
- aircon=ceil(units/2) min1
- carpentry: SEPARATE mfg and install:
    • ft = total linear ft of all carpentry items
    • itemCount = count of distinct carpentry items (cabinets, wardrobes, etc.)
    • Output BOTH: ft and itemCount fields in tradeScope.carpentry
    (mfg days = max(10, itemCount×3) capped at 42; install = max(3, ceil(ft/8/3)) 3-person team)

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
): string {
  const currency = region === 'SG' ? 'SGD' : 'RM';
  const itemList = items
    .slice(0, 12)
    .map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`)
    .join('\n');

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
  },
): string {
  const currency = region === 'SG' ? 'SGD' : 'RM';
  const projectType = options?.projectType || 'residential';
  const unmatchedItems = options?.unmatchedItems || [];

  const tradeBlocks = trades
    .map(t => {
      const itemList = t.items
        .slice(0, 10)
        .map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`)
        .join('\n');
      return `【${t.trade}】\n${itemList}`;
    })
    .join('\n\n');

  const unmatchedBlock = unmatchedItems.length > 0
    ? `\n\n【未分类项目 — 请将每项归入正确工种】\n` +
      unmatchedItems
        .slice(0, 20)
        .map(i => `- ${i.name}: ${i.qty} ${i.unit} × ${currency} ${i.unitPrice} = ${currency} ${i.total}`)
        .join('\n')
    : '';

  const isCommercial = ['commercial', 'mall', 'shop_lot', 'factory'].includes(projectType);
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
