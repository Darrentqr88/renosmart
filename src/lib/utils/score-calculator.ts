import { createClient } from '@/lib/supabase/client';
import { classifyItem } from './item-classifier';
import type { QuotationAnalysis, PriceComparison, DimensionBreakdown, ScoreBreakdown } from '@/types';

// ============================================
// Expected categories per project type
// ============================================
const EXPECTED_CATEGORIES: Record<string, string[]> = {
  residential: ['Electrical', 'Plumbing', 'Tiling', 'Painting', 'Carpentry'],
  condo:       ['Electrical', 'Plumbing', 'Tiling', 'Painting', 'Carpentry'],
  landed:      ['Electrical', 'Plumbing', 'Tiling', 'Painting', 'Carpentry', 'Waterproofing', 'Roofing', 'Landscape'],
  commercial:  ['Electrical', 'Plumbing', 'Tiling', 'Painting', 'Carpentry', 'Air Conditioning', 'False Ceiling'],
  mall:        ['Electrical', 'Plumbing', 'Tiling', 'Painting', 'Carpentry', 'Air Conditioning', 'False Ceiling', 'Metal Work'],
};

// ============================================
// Unit normalization
// ============================================
function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[\s-]/g, '').replace(/sq\.?ft/, 'sqft').replace(/ft\.?run/, 'ftrun');
}

// ============================================
// Built-in reliable price ranges per region
// Used when no DB data and AI estimates are unreliable for the category/unit.
// Key: "Category|Subcategory|normalizedUnit"  (empty subcategory = wildcard)
// ============================================
const KNOWN_PRICE_RANGES_MY: Record<string, { min: number; max: number }> = {
  // Carpentry cabinets per ft-run — AI often confuses ft-run with per-sqft pricing
  'Carpentry|Kitchen Cabinet|ft':    { min: 400, max: 1200 },
  'Carpentry|Kitchen Cabinet|ftrun': { min: 400, max: 1200 },
  'Carpentry|Wardrobe|ft':           { min: 700, max: 1600 },
  'Carpentry|Wardrobe|ftrun':        { min: 700, max: 1600 },
  'Carpentry|TV Console/Feature|ft': { min: 200, max: 550 },
  'Carpentry|Shoe Cabinet|ft':       { min: 250, max: 600 },
  'Carpentry|Vanity Cabinet|ft':     { min: 350, max: 750 },
  'Carpentry||ft':                   { min: 300, max: 1600 },
  'Carpentry||ftrun':                { min: 300, max: 1600 },
  // Tiling
  'Tiling||sqft':                    { min: 15, max: 35 },
  'Tiling|Floor Tiles|sqft':         { min: 15, max: 35 },
  'Tiling|Wall Tiles|sqft':          { min: 15, max: 35 },
  // Electrical
  'Electrical||pt':                  { min: 80, max: 180 },
  'Electrical||point':               { min: 80, max: 180 },
  'Electrical|Power Points|pt':      { min: 80, max: 180 },
  'Electrical|Lighting Points|pt':   { min: 80, max: 180 },
  // Painting
  'Painting||sqft':                  { min: 2.5, max: 5 },
  'Painting|Interior Wall|sqft':     { min: 2.5, max: 5 },
  // Plumbing
  'Plumbing||unit':                  { min: 300, max: 800 },
  // Partition / Drywall
  'False Ceiling|Partition Wall|sqft': { min: 7, max: 15 },
};

const KNOWN_PRICE_RANGES_SG: Record<string, { min: number; max: number }> = {
  'Carpentry|Kitchen Cabinet|ft':    { min: 150, max: 500 },
  'Carpentry|Kitchen Cabinet|ftrun': { min: 150, max: 500 },
  'Carpentry|Wardrobe|ft':           { min: 280, max: 650 },
  'Carpentry|Wardrobe|ftrun':        { min: 280, max: 650 },
  'Carpentry|TV Console/Feature|ft': { min: 80, max: 250 },
  'Carpentry|Shoe Cabinet|ft':       { min: 100, max: 250 },
  'Carpentry|Vanity Cabinet|ft':     { min: 140, max: 320 },
  'Carpentry||ft':                   { min: 120, max: 650 },
  'Carpentry||ftrun':                { min: 120, max: 650 },
  'Tiling||sqft':                    { min: 9, max: 15 },
  'Tiling|Floor Tiles|sqft':         { min: 9, max: 15 },
  'Tiling|Wall Tiles|sqft':          { min: 9, max: 15 },
  'Electrical||pt':                  { min: 25, max: 50 },
  'Electrical||point':               { min: 25, max: 50 },
  'Electrical|Power Points|pt':      { min: 25, max: 50 },
  'Electrical|Lighting Points|pt':   { min: 25, max: 50 },
  'Painting||sqft':                  { min: 1.5, max: 3 },
  'Painting|Interior Wall|sqft':     { min: 1.5, max: 3 },
  'Plumbing||unit':                  { min: 120, max: 350 },
  'False Ceiling|Partition Wall|sqft': { min: 2.5, max: 5 },
};

function getKnownRange(category: string, subcategory: string, unit: string, region: string): { min: number; max: number } | null {
  const ranges = region === 'SG' ? KNOWN_PRICE_RANGES_SG : KNOWN_PRICE_RANGES_MY;
  return ranges[`${category}|${subcategory}|${unit}`]
    ?? ranges[`${category}||${unit}`]
    ?? null;
}

// ============================================
// Price score calculation for a single item
// ============================================
interface PriceDbEntry {
  category: string;
  subcategory: string;
  material_method: string;
  unit: string;
  supply_type: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  sample_count: number;
}

function scoreItemAgainstRange(
  unitPrice: number,
  min: number,
  max: number,
  isAiEstimate: boolean,
): { contribution: number; verdict: PriceComparison['verdict'] } {
  const dampening = isAiEstimate ? 0.8 : 1.0;

  if (unitPrice >= min && unitPrice <= max) {
    return { contribution: (isAiEstimate ? 0.9 : 1.0) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'ok' };
  }

  if (unitPrice > max) {
    // Above market max — warn (not flag) since higher price may reflect premium material/scope
    // Only flag if > 80% above max (extreme outlier)
    const overPct = (unitPrice - max) / max;
    if (overPct <= 0.3) {
      return { contribution: (isAiEstimate ? 0.6 : 0.7) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'warn_high' };
    } else if (overPct <= 0.8) {
      return { contribution: (isAiEstimate ? 0.4 : 0.5) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'warn_high' };
    } else {
      return { contribution: 0.2, verdict: isAiEstimate ? 'ai_estimated' : 'flag_high' };
    }
  }

  // Below min — more concerning (may indicate missing scope or quality issues)
  const underPct = (min - unitPrice) / min;
  if (underPct > 0.5) {
    return { contribution: (isAiEstimate ? 0.15 : 0.2) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'flag_low' };
  }
  if (underPct > 0.3) {
    return { contribution: (isAiEstimate ? 0.3 : 0.4) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'warn_high' };
  }
  return { contribution: (isAiEstimate ? 0.7 : 0.8) * dampening, verdict: isAiEstimate ? 'ai_estimated' : 'ok' };
}

// ============================================
// Main hybrid scoring function
// ============================================
export async function calculateHybridScores(
  analysis: QuotationAnalysis,
  region: string,
): Promise<ScoreBreakdown> {
  const supabase = createClient();

  // Fetch all price_database entries for this region
  let priceData: PriceDbEntry[] = [];
  try {
    const { data } = await supabase
      .from('price_database')
      .select('category, subcategory, material_method, unit, supply_type, min_price, max_price, avg_price, sample_count')
      .eq('region', region);
    if (data) priceData = data as PriceDbEntry[];
  } catch {
    // DB unavailable — fall back to pure AI scores
  }

  // Build lookup map
  const priceMap = new Map<string, PriceDbEntry>();
  for (const row of priceData) {
    const key = `${row.category}|${row.subcategory}|${row.material_method}|${normalizeUnit(row.unit)}|${row.supply_type}`;
    priceMap.set(key, row);
  }

  // ── Step A: Price Score ──
  const priceComparisons: PriceComparison[] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let dbMatchCount = 0;
  let aiEstimateCount = 0;

  for (let i = 0; i < analysis.items.length; i++) {
    const item = analysis.items[i];
    if (!item.unitPrice || item.unitPrice <= 0) continue;

    const classification = classifyItem(item.name, item.subcategory, item.materialMethod);
    const unit = normalizeUnit(item.unit || 'unit');
    const supplyType = item.supplyType || 'supply_install';
    const weight = item.total || item.unitPrice * item.qty || 1;

    // Try exact match
    let key = `${classification.category}|${classification.subcategory}|${classification.materialMethod}|${unit}|${supplyType}`;
    let dbEntry = priceMap.get(key);

    // Fallback: ignore supplyType
    if (!dbEntry) {
      for (const [k, v] of priceMap.entries()) {
        const parts = k.split('|');
        if (parts[0] === classification.category && parts[1] === classification.subcategory &&
            parts[2] === classification.materialMethod && parts[3] === unit) {
          dbEntry = v;
          break;
        }
      }
    }

    // Fallback: ignore materialMethod too
    if (!dbEntry) {
      for (const [k, v] of priceMap.entries()) {
        const parts = k.split('|');
        if (parts[0] === classification.category && parts[1] === classification.subcategory && parts[3] === unit) {
          dbEntry = v;
          break;
        }
      }
    }

    const comp: PriceComparison = {
      itemIndex: i,
      itemName: item.name,
      quotedPrice: item.unitPrice,
      dbMin: null,
      dbMax: null,
      dbAvg: null,
      aiEstMin: item.estMinPrice ?? null,
      aiEstMax: item.estMaxPrice ?? null,
      deviation: null,
      verdict: 'ok',
      source: 'ai_status',
      sampleCount: 0,
      category: classification.category,
      subcategory: classification.subcategory,
      materialMethod: classification.materialMethod,
    };

    if (dbEntry && dbEntry.sample_count >= 10) {
      // Priority 1: Database data
      comp.dbMin = dbEntry.min_price;
      comp.dbMax = dbEntry.max_price;
      comp.dbAvg = dbEntry.avg_price;
      comp.sampleCount = dbEntry.sample_count;
      comp.source = 'database';
      comp.deviation = dbEntry.avg_price > 0 ? (item.unitPrice - dbEntry.avg_price) / dbEntry.avg_price : null;

      const result = scoreItemAgainstRange(item.unitPrice, dbEntry.min_price, dbEntry.max_price, false);
      comp.verdict = result.verdict;
      weightedSum += result.contribution * weight;
      totalWeight += weight;
      dbMatchCount++;
    } else {
      const known = getKnownRange(classification.category, classification.subcategory, unit, region);
      if (known) {
        // Priority 2: Built-in known range (more reliable than AI estimate for this category/unit)
        comp.source = 'known_range';
        comp.dbMin = known.min;
        comp.dbMax = known.max;
        const knownAvg = (known.min + known.max) / 2;
        comp.deviation = knownAvg > 0 ? (item.unitPrice - knownAvg) / knownAvg : null;

        const result = scoreItemAgainstRange(item.unitPrice, known.min, known.max, false);
        comp.verdict = result.verdict;
        weightedSum += result.contribution * weight;
        totalWeight += weight;
        dbMatchCount++;
      } else if (item.estMinPrice && item.estMaxPrice && item.estMinPrice > 0) {
        // Priority 3: AI estimated range
        comp.source = 'ai_estimate';
        const aiAvg = (item.estMinPrice + item.estMaxPrice) / 2;
        comp.deviation = aiAvg > 0 ? (item.unitPrice - aiAvg) / aiAvg : null;

        const result = scoreItemAgainstRange(item.unitPrice, item.estMinPrice, item.estMaxPrice, true);
        comp.verdict = result.verdict;
        weightedSum += result.contribution * weight;
        totalWeight += weight;
        aiEstimateCount++;
      } else {
        // Priority 4: Use AI item status as proxy
        comp.source = 'ai_status';
        const statusScore = item.status === 'ok' ? 1.0 : item.status === 'warn' ? 0.6 : item.status === 'flag' ? 0.2 : 0.5;
        comp.verdict = item.status === 'flag' ? 'flag_high' : item.status === 'warn' ? 'warn_high' : 'ok';
        weightedSum += statusScore * weight;
        totalWeight += weight;
      }
    }

    priceComparisons.push(comp);
  }

  const dataPriceScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;

  // ── Step B: Completeness Score ──
  const categories = new Set<string>();
  for (const item of analysis.items) {
    const c = classifyItem(item.name, item.subcategory, item.materialMethod);
    if (c.category) categories.add(c.category);
  }
  // Also include categories from ganttParams if available
  if (analysis.ganttParams?.detectedCategories) {
    for (const cat of analysis.ganttParams.detectedCategories) {
      categories.add(cat);
    }
  }

  const projectType = analysis.projectType || 'residential';
  const expected = EXPECTED_CATEGORIES[projectType] || EXPECTED_CATEGORIES.residential;
  const presentCount = expected.filter(cat => categories.has(cat)).length;
  let dataCompletenessScore = Math.round((presentCount / expected.length) * 100);

  // Bonus: tiling + waterproofing
  if (categories.has('Tiling') && categories.has('Waterproofing')) {
    dataCompletenessScore = Math.min(100, dataCompletenessScore + 5);
  }

  const missingCategories = expected.filter(cat => !categories.has(cat));
  const completenessDetail = missingCategories.length === 0
    ? `${presentCount}/${expected.length} core categories present`
    : `${presentCount}/${expected.length} core (missing: ${missingCategories.join(', ')})`;

  // ── Step C: Logic Score ──
  let dataLogicScore = 100;
  const logicIssues: string[] = [];

  if (categories.has('Tiling') && !categories.has('Waterproofing')) {
    dataLogicScore -= 15;
    logicIssues.push('tiling without waterproofing (-15)');
  }
  if (categories.has('Carpentry') && !categories.has('Painting')) {
    dataLogicScore -= 10;
    logicIssues.push('carpentry without painting (-10)');
  }

  // Check electrical points vs DB box
  let totalElecPoints = 0;
  let hasDBBox = false;
  for (const item of analysis.items) {
    const c = classifyItem(item.name, item.subcategory, item.materialMethod);
    if (c.category === 'Electrical') {
      if (c.subcategory === 'DB Box') hasDBBox = true;
      if (c.subcategory === 'Power Points' || c.subcategory === 'Lighting Points') {
        totalElecPoints += item.qty || 0;
      }
    }
  }
  if (totalElecPoints > 20 && !hasDBBox) {
    dataLogicScore -= 10;
    logicIssues.push(`${totalElecPoints} elec pts, no DB box (-10)`);
  }

  // Calc errors
  let calcErrors = 0;
  for (const item of analysis.items) {
    if (item.qty > 0 && item.unitPrice > 0 && item.total > 0) {
      const expected = item.qty * item.unitPrice;
      if (Math.abs(expected - item.total) / item.total > 0.01) {
        calcErrors++;
      }
    }
  }
  if (calcErrors > 0) {
    const deduction = Math.min(25, calcErrors * 5);
    dataLogicScore -= deduction;
    logicIssues.push(`${calcErrors} calc error(s) (-${deduction})`);
  }

  dataLogicScore = Math.max(0, dataLogicScore);
  const logicDetail = logicIssues.length === 0 ? 'No issues found' : logicIssues.join('; ');

  // ── Step D: Risk Score ──
  const criticalCount = analysis.alerts?.filter(a => a.level === 'critical').length || 0;
  const missingCount = analysis.missing?.length || 0;
  const riskItems = criticalCount + missingCount;

  let dataRiskScore: number;
  if (riskItems === 0) dataRiskScore = 95;
  else if (riskItems <= 2) dataRiskScore = 75;
  else if (riskItems <= 5) dataRiskScore = 55;
  else dataRiskScore = 30;

  const riskDetail = `${criticalCount} critical, ${missingCount} missing items`;

  // ── Step E: Blend AI + Data scores ──
  const aiScore = analysis.score;

  function blend(ai: number, data: number): DimensionBreakdown & { blendedScore: number } {
    return {
      aiScore: ai,
      dataScore: data,
      blendedScore: Math.round(ai * 0.4 + data * 0.6),
      detail: '',
    };
  }

  const price: DimensionBreakdown = {
    ...blend(aiScore.price, dataPriceScore),
    detail: `${dbMatchCount} DB + ${aiEstimateCount} AI est / ${priceComparisons.length} items`,
  };

  const completeness: DimensionBreakdown = {
    ...blend(aiScore.completeness, dataCompletenessScore),
    detail: completenessDetail,
  };

  const logic: DimensionBreakdown = {
    ...blend(aiScore.logic, dataLogicScore),
    detail: logicDetail,
  };

  const risk: DimensionBreakdown = {
    ...blend(aiScore.risk, dataRiskScore),
    detail: riskDetail,
  };

  const total = Math.round(
    price.blendedScore * 0.30 +
    completeness.blendedScore * 0.25 +
    logic.blendedScore * 0.20 +
    risk.blendedScore * 0.25,
  );

  return {
    price,
    completeness,
    logic,
    risk,
    total,
    priceComparisons,
    dbMatchCount,
    aiEstimateCount,
    dbMatchTotal: priceComparisons.length,
  };
}
