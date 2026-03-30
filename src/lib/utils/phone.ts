/**
 * Normalize a phone number to international format.
 * Handles MY (+60), SG (+65), ID (+62) prefixes.
 *
 * @param raw - The raw phone input (e.g. "0176543210", "176543210", "+60176543210")
 * @param countryCode - The country code prefix (e.g. "+60", "+65", "+62"). Defaults to "+60".
 * @returns Normalized phone like "+60176543210"
 */
export function normalizePhone(raw: string, countryCode: string = '+60'): string {
  // Strip spaces, dashes, parentheses
  let cleaned = raw.replace(/[\s\-()]/g, '');

  // If already has full international prefix, use as-is
  if (cleaned.startsWith('+60') || cleaned.startsWith('+65') || cleaned.startsWith('+62')) {
    return cleaned;
  }

  // Strip leading country code digits without + (e.g. "60176..." → "176...")
  const codeDigits = countryCode.replace('+', '');
  if (cleaned.startsWith(codeDigits)) {
    cleaned = cleaned.slice(codeDigits.length);
  }

  // Strip leading 0 (e.g. "0176..." → "176...")
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return `${countryCode}${cleaned}`;
}

/**
 * Generate a synthetic email for a worker based on their phone number.
 * Used for Supabase Auth (workers don't have real emails).
 */
export function phoneToSyntheticEmail(normalizedPhone: string): string {
  // Remove the + prefix, keep digits only
  const digits = normalizedPhone.replace('+', '');
  return `w${digits}@worker.renosmart.app`;
}

/**
 * Build flexible search patterns for phone matching.
 * Used by designer workers page to search workers by phone.
 */
export function buildPhoneSearchPatterns(raw: string): string[] {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  const patterns: string[] = [cleaned];

  if (cleaned.startsWith('0')) {
    patterns.push(`+6${cleaned}`);     // 0176... → +60176...
    patterns.push(cleaned.slice(1));   // 0176... → 176...
  }
  if (cleaned.startsWith('60')) {
    patterns.push(`+${cleaned}`);            // 60176... → +60176...
    patterns.push(`0${cleaned.slice(2)}`);   // 60176... → 0176...
  }
  if (cleaned.startsWith('+60')) {
    patterns.push(`0${cleaned.slice(3)}`);   // +60176... → 0176...
    patterns.push(cleaned.slice(1));         // +60176... → 60176...
  }

  return patterns;
}
