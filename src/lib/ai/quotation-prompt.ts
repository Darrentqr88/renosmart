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
  return `You are a professional renovation quotation audit AI for Malaysia and Singapore (RenoSmart).

Analyze the quotation below. Return ONLY valid JSON. No markdown, no extra text.
Output language: ${outputLang}

Quotation:
\`\`\`
${textForAI}
\`\`\`

RULES:
1. Extract CLIENT info (company, address, attention, tel, email, projectRef) — NOT work items
2. Section totals → subtotals array, NOT items
3. Copy item name VERBATIM from source. DO NOT translate English names.
4. For warn/flag items: add "note" field (max 25 chars) explaining the price issue
5. Items max 20 (highest value first if >20)
6. status: "ok"|"warn"|"flag"|"nodata"

MY/SG Price Reference:
${PRICE_REFERENCE}

7. Detect supplyType per item: "supply_install" | "labour_only" | "supply_only"
8. Detect projectType: "residential" | "condo" | "landed" | "commercial" | "mall"
9. Estimate projectSqft from context clues (room sizes, areas mentioned)

Return JSON:
{
  "projectType": "residential",
  "projectSqft": 1200,
  "client": {"company":"","address":"","attention":"","tel":"","email":null,"projectRef":"","projectName":""},
  "score": {"total":75,"completeness":70,"price":80,"logic":85,"risk":50},
  "summary": "one-line summary",
  "items": [{"no":"1","section":"Section","name":"EXACT name from source","unit":"sqft","qty":100,"unitPrice":2.5,"total":250,"unitPriceDerived":false,"supplyType":"supply_install","status":"ok","note":""}],
  "subtotals": [{"label":"Section Total","amount":1000}],
  "totalAmount": 50000,
  "missing": ["Missing item 1"],
  "alerts": [{"level":"critical","title":"Title","desc":"Description (max 40 chars)"}]
}`;
}
