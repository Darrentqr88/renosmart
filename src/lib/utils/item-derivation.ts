// Deterministic unit derivation for lump-sum quotation items.
//
// Many MY/SG quotations have no qty/unit columns — each row is
// "<code> <description> | <dimension spec> | RM <total>".
// The AI often returns these as qty=1 lump sums (unit "Area"/"L-sum"),
// which makes price comparison impossible → every item ends up "nodata".
//
// This module derives qty + unit + unitPrice in code from the dimension
// text (item.spec / name / unit), so the price audit can compare against
// per-ft / per-sqft market references. LLMs are unreliable at arithmetic;
// this must stay deterministic.

import type { QuotationItem } from '@/types';

const MM_PER_FT = 304.8;
const SQMM_PER_SQFT = 92903;

// Items priced per sqft of face area (L×H) rather than per ft run
const AREA_PRICED_PATTERN = /feature\s*wall|wall\s*panel|divider|partition|platform|backdrop|headboard/i;

// Explicit sqft quantity, e.g. "539 Sqft", "70 sq.ft"
const SQFT_PATTERN = /(\d+(?:\.\d+)?)\s*sq\.?\s*(?:ft|feet)\b/i;

// Length in mm — require the "L" marker or "x Full Height" so tile sizes
// like "300mm x 600mm Tiles" are NOT mistaken for run lengths
const MM_LENGTH_PATTERN = /(\d{3,5}(?:\.\d+)?)\s*mm\s*L\b/i;
const MM_FULL_HEIGHT_PATTERN = /(\d{3,5}(?:\.\d+)?)\s*mm\s*(?:L\s*)?x\s*full\s*height/i;

// Face area L×H both in mm, e.g. "2550mm L x 3000mm H"
const MM_LXH_PATTERN = /(\d{3,5}(?:\.\d+)?)\s*mm\s*L?\s*x\s*(\d{3,5}(?:\.\d+)?)\s*mm\s*H\b/i;

// Set multiplier, e.g. "1500mm L (x2)" — only the explicit (xN) form
const MULTIPLIER_PATTERN = /\(\s*x\s*(\d{1,2})\s*\)/i;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Derive qty/unit/unitPrice for a single lump-sum item from its dimension
 * text. Returns null if no reliable dimension is found.
 */
export function deriveUnitFromDimensions(
  item: Pick<QuotationItem, 'name' | 'unit' | 'total'> & { spec?: string },
): { qty: number; unit: string; unitPrice: number } | null {
  if (!item.total || item.total <= 0) return null;

  const haystack = `${item.spec || ''} ${item.unit || ''} ${item.name || ''}`;
  const multiplier = Math.max(1, Number(haystack.match(MULTIPLIER_PATTERN)?.[1]) || 1);

  // 1. Explicit sqft quantity (awning, flooring, platform...)
  const sqftMatch = haystack.match(SQFT_PATTERN);
  if (sqftMatch) {
    const qty = round1(Number(sqftMatch[1]) * multiplier);
    if (qty >= 1) return { qty, unit: 'sqft', unitPrice: item.total / qty };
  }

  // 2. Face-area priced items (feature wall etc.): L×H mm → sqft
  if (AREA_PRICED_PATTERN.test(haystack)) {
    const lxh = haystack.match(MM_LXH_PATTERN);
    if (lxh) {
      const sqft = (Number(lxh[1]) * Number(lxh[2])) / SQMM_PER_SQFT;
      const qty = round1(sqft * multiplier);
      if (qty >= 1) return { qty, unit: 'sqft', unitPrice: item.total / qty };
    }
  }

  // 3. Linear run length: "6300mm L" / "2100mm x Full Height" → ft
  const mmMatch = haystack.match(MM_LENGTH_PATTERN) || haystack.match(MM_FULL_HEIGHT_PATTERN);
  if (mmMatch) {
    const qty = round1((Number(mmMatch[1]) / MM_PER_FT) * multiplier);
    if (qty >= 0.5) return { qty, unit: 'ft', unitPrice: item.total / qty };
  }

  return null;
}

/**
 * Drop exact revision duplicates. Some PDFs bundle several revisions of the
 * same quotation in one file — the AI then extracts identical rows (same item
 * number, section, name, qty AND total) multiple times, inflating the sum.
 * The full key keeps legitimate repeats (same work in another room has a
 * different section or number; two identical doors have different numbers).
 */
export function dedupeRevisionItems(items: QuotationItem[]): QuotationItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = [item.no, item.section, item.name, item.qty, item.total]
      .map(v => String(v ?? '').trim().toLowerCase()).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Post-process AI-parsed items: derive units for lump sums that carry
 * dimension text. Genuine lump sums (e.g. "According Design", "1 Job")
 * are left untouched — "nodata" is the honest status for those.
 */
export function deriveLumpSumUnits(items: QuotationItem[]): QuotationItem[] {
  return items.map(item => {
    // Only lump sums: qty missing/1 and unitPrice ≈ total (or missing)
    const isLumpSum =
      (!item.qty || item.qty <= 1) &&
      (!item.unitPrice || Math.abs(item.unitPrice - item.total) < 0.01);
    if (!isLumpSum) return item;

    const derived = deriveUnitFromDimensions(item);
    if (!derived) return item;

    return {
      ...item,
      qty: derived.qty,
      unit: derived.unit,
      unitPrice: Math.round(derived.unitPrice * 100) / 100,
      unitPriceDerived: true,
    };
  });
}
