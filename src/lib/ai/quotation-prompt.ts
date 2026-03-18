export const PRICE_REFERENCE = `
MY/SG Market Price Reference (2024-2025):
- Tiling (floor): RM 5-12/sqft | SG $8-20/sqft
- Tiling (wall): RM 8-15/sqft | SG $10-25/sqft
- Painting: RM 1.50-3.50/sqft | SG $2-5/sqft
- False ceiling (basic gypsum): RM 8-15/sqft | SG $12-20/sqft
- False ceiling (design): RM 15-30/sqft | SG $20-45/sqft
- Carpentry (wardrobe): RM 800-2000/ft-run | SG $1200-3000/ft-run
- Carpentry (kitchen cabinet): RM 600-1500/ft-run | SG $800-2500/ft-run
- Electrical point (light/switch): RM 80-150/pt | SG $120-250/pt
- Plumbing (basin): RM 200-400/unit | SG $300-600/unit
- Plumbing (WC): RM 300-600/unit | SG $500-1000/unit
- Waterproofing: RM 3-8/sqft | SG $5-12/sqft
- Demolition/Hacking: RM 1-4/sqft | SG $2-6/sqft
- Aluminium window: RM 80-200/sqft | SG $120-300/sqft
- Vinyl flooring: RM 4-8/sqft | SG $6-12/sqft
- Timber flooring: RM 8-20/sqft | SG $12-30/sqft
`;

export function buildQuotationPrompt(textForAI: string, outputLang: string): string {
  return `You are a senior Quantity Surveyor (QS) AI for Malaysia and Singapore renovation projects (RenoSmart).
Audit the quotation below like a professional QS — parse items AND catch problems: missing items, calculation errors, overpriced/underpriced items, scope gaps, coordination risks.

Return ONLY valid JSON. No markdown, no extra text. Keep all string values concise (max 150 chars each).
Output language: ${outputLang}

Quotation:
\`\`\`
${textForAI}
\`\`\`

RULES:
1. CLIENT vs CONTRACTOR: "client" = property OWNER paying (look for "To:", "Attn:", "Bill To:", "Prepared for:"). The issuing company is the contractor — do NOT put in client. Leave client fields empty if unclear.
2. Section totals → subtotals array only (not items).
3. Copy item names VERBATIM. Do NOT translate English names.
4. warn/flag items: add "note" (max 20 chars) on price issue.
5. Items max 15 (highest value first).
6. status: "ok"|"warn"|"flag"|"nodata"

${PRICE_REFERENCE}

7. supplyType per item: "supply_install"|"labour_only"|"supply_only"
8. projectType: "residential"|"condo"|"landed"|"commercial"|"mall"
9. projectSqft: estimate from context (room sizes, tiling/flooring areas).
10. QS AUDIT — alerts (keep each desc under 120 chars):
    CHECK FOR MISSING: waterproofing for wet areas, DB/MCB upgrade, painting primer, door hardware, hot water heater (residential/condo); gate/fence/external painting (landed); M&E drawings/fire suppression (commercial).
    PRICE ANOMALIES: flag >50% above market; warn 20-50% above or >30% below market. Cite: "Market RM X-Y, Quoted RM Z".
    CALC ERRORS: if qty×unitPrice≠total by >1%, flag.
    COORDINATION: tiling without waterproofing → critical; carpentry without touch-up paint → warning.
    levels: "critical"|"warning"|"tip". Max 4 critical + 4 warnings + 2 tips.

11. paymentTerms: extract if present, else [].
12. ganttParams — IMPORTANT: You are a professional construction planner. Read EVERY line item carefully.
    STEP 1 — Identify ALL work categories in this quotation (detectedCategories).
    STEP 2 — Map each category to either a standard tradeScope key OR a customPhase.
    STEP 3 — Calculate realistic working days from ACTUAL quantities.

    Standard tradeScope keys (use these exact keys when the category matches):
      demolition | masonry | tiling | electrical | plumbing | painting | carpentry | falseCeiling | waterproofing | flooring | aluminium | aircon

    Non-standard categories → customPhases (glass, stone/marble, metalwork, CCTV/alarm, landscape, smart home, solar, pool, signage, furniture, curtain, cleaning, etc.)
      For each non-standard category, add to customPhases with:
        - name: specific task from quotation (e.g. "Tempered Glass Partition & Spider Fittings")
        - name_zh: Chinese equivalent
        - trade: category name in English (e.g. "Glass Work")
        - estimatedDays: realistic estimate
        - insertAfter: phase ID where this fits — use "tiling" for glass/stone/marble, "carpentry_install" for furniture/curtain/signage, "painting2" for cleaning, "measurement" for landscape/external

    Day estimation rules:
    - demolition: ceil(hackingSqft / 120) min 2 max 14
    - masonry: ceil(wallSqft / 60) min 3 max 20 (only if new wall items exist)
    - tiling: ceil(totalTileSqft / 80) min 3
    - electrical: ceil(totalPoints / 5) min 3  (points = sockets+switches+lights+fans+DB)
    - plumbing: ceil(totalUnits / 2) min 2  (units = basins+WC+shower+floor trap)
    - carpentry: estimatedDays = max(21, ceil(totalFtRun * 0.7))  (factory min 21 days)
    - painting: ceil((projectSqft * 2.0) / 150) min 4
    - falseCeiling: ceil(ceilingSqft / 100) min 3
    - waterproofing: ceil(wetSqft / 70) min 2
    - flooring (timber/vinyl/SPC): ceil(flooringSqft / 70) min 3
    - aluminium: ceil(aluminiumSqft / 35) min 2
    - aircon: ceil(units / 2) min 1

    taskName: REQUIRED for EVERY trade and customPhase — describe the ACTUAL scope from this quotation:
      - tiling: "Kitchen Floor + 3 Bathrooms Wall Tiling (950sqft)" NOT "Tiling Works"
      - electrical: "DB Upgrade + 52pts Wiring, Switches & Lights" NOT "Electrical Works"
      - carpentry: "Kitchen Cabinet 12ft + Master Wardrobe 10ft" NOT "Carpentry Works"
      - glass (custom): "Tempered Glass Partition + Shower Screen (3 panels)" NOT "Glass Work"
      - landscape (custom): "Garden Paving + Planting (front & rear yard)" NOT "Landscape"
    taskName_zh: Chinese equivalent of taskName.
    riskNotes: brief scheduling risk per trade (max 50 chars).

    detectedCategories: FULL LIST of all trade/work categories found in this quotation (English names).
      Example: ["Demolition","Tiling","Electrical","Plumbing","Painting","Carpentry","Glass Work","Landscape"]
      Include EVERY category, standard AND non-standard. This is the definitive list for Gantt generation.

Return this exact JSON structure:
{"projectType":"residential","projectSqft":1200,"client":{"company":"","address":"","attention":"","tel":"","email":null,"projectRef":"","projectName":""},"score":{"total":75,"completeness":70,"price":80,"logic":85,"risk":50},"summary":"one-line summary","items":[{"no":"1","section":"Section","name":"Item name verbatim","unit":"sqft","qty":100,"unitPrice":2.5,"total":250,"unitPriceDerived":false,"supplyType":"supply_install","status":"ok","note":""}],"subtotals":[{"label":"Section Total","amount":1000}],"totalAmount":50000,"missing":["item1"],"alerts":[{"level":"critical","title":"Title","desc":"Short desc under 120 chars"}],"paymentTerms":[],"ganttParams":{"sqft":1200,"projectType":"residential","hasDemolition":true,"detectedCategories":["Demolition","Tiling","Electrical","Plumbing","Carpentry","Painting","False Ceiling","Waterproofing","Glass Work"],"tradeScope":{"demolition":{"sqft":200,"estimatedDays":4,"taskName":"Demolition & Hacking (200sqft)","taskName_zh":"拆除工程 (200平方尺)"},"tiling":{"sqft":800,"estimatedDays":10,"taskName":"Kitchen Floor + Bathroom Wall Tiling (800sqft)","taskName_zh":"厨房地砖 + 浴室墙砖工程 (800平方尺)"},"electrical":{"points":40,"estimatedDays":8,"taskName":"DB Upgrade + 40pts Wiring & Switches","taskName_zh":"电箱升级 + 40点位布线及开关安装"},"plumbing":{"units":6,"estimatedDays":3,"taskName":"Bathroom Plumbing & Sanitary Ware (6 units)","taskName_zh":"卫浴水管及洁具安装 (6件)"},"carpentry":{"ft":28,"estimatedDays":25,"taskName":"Kitchen Cabinet 10ft + Wardrobe 18ft","taskName_zh":"厨柜10尺 + 衣柜18尺制作安装"},"painting":{"sqft":2400,"estimatedDays":9,"taskName":"Full Unit Painting + Skim Coat (1200sqft)","taskName_zh":"全屋油漆及批灰 (1200平方尺)"},"falseCeiling":{"sqft":400,"estimatedDays":5,"taskName":"Living & Bedroom False Ceiling (400sqft)","taskName_zh":"客厅及房间吊顶 (400平方尺)"},"waterproofing":{"sqft":100,"estimatedDays":2,"taskName":"Bathroom Waterproofing (100sqft)","taskName_zh":"浴室防水工程 (100平方尺)"}},"customPhases":[{"name":"Tempered Glass Partition & Shower Screen","name_zh":"钢化玻璃隔断及淋浴房","trade":"Glass Work","estimatedDays":4,"insertAfter":"tiling"}],"riskNotes":{"carpentry":"Confirm factory slot 6wks ahead"}}}`;
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
