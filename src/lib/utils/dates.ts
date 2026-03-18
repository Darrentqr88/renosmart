// MY/SG Public Holidays 2025-2026 — name maps for tooltip display
export const MY_HOLIDAY_NAMES: Map<string, string> = new Map([
  ['2025-01-01', "New Year's Day 元旦"],
  ['2025-01-29', 'Chinese New Year 春节 Day 1'],
  ['2025-01-30', 'Chinese New Year 春节 Day 2'],
  ['2025-03-30', 'Hari Raya Aidilfitri Day 1'],
  ['2025-03-31', 'Hari Raya Aidilfitri Day 2'],
  ['2025-04-14', "Yang di-Pertuan Agong's Birthday"],
  ['2025-05-01', 'Labour Day 劳动节'],
  ['2025-05-12', 'Wesak Day 卫塞节'],
  ['2025-06-06', 'Hari Raya Aidiladha'],
  ['2025-08-31', 'National Day 独立日'],
  ['2025-09-16', 'Malaysia Day 马来西亚日'],
  ['2025-10-20', 'Deepavali 屠妖节'],
  ['2025-12-25', 'Christmas Day 圣诞节'],
  ['2026-01-01', "New Year's Day 元旦"],
  ['2026-02-17', 'Chinese New Year 春节 Day 1'],
  ['2026-02-18', 'Chinese New Year 春节 Day 2'],
  ['2026-03-20', 'Hari Raya Aidilfitri Day 1'],
  ['2026-03-21', 'Hari Raya Aidilfitri Day 2'],
  ['2026-05-01', 'Labour Day 劳动节'],
  ['2026-05-31', 'Wesak Day 卫塞节'],
  ['2026-08-31', 'National Day 独立日'],
  ['2026-09-16', 'Malaysia Day 马来西亚日'],
  ['2026-12-25', 'Christmas Day 圣诞节'],
]);

export const SG_HOLIDAY_NAMES: Map<string, string> = new Map([
  ['2025-01-01', "New Year's Day"],
  ['2025-01-29', 'Chinese New Year Day 1'],
  ['2025-01-30', 'Chinese New Year Day 2'],
  ['2025-03-30', 'Hari Raya Puasa Day 1'],
  ['2025-03-31', 'Hari Raya Puasa Day 2'],
  ['2025-04-18', 'Good Friday'],
  ['2025-05-01', 'Labour Day'],
  ['2025-05-12', 'Vesak Day'],
  ['2025-06-06', 'Hari Raya Haji'],
  ['2025-08-09', 'National Day'],
  ['2025-10-20', 'Deepavali'],
  ['2025-12-25', 'Christmas Day'],
  ['2026-01-01', "New Year's Day"],
  ['2026-01-28', 'Chinese New Year Day 1'],
  ['2026-01-29', 'Chinese New Year Day 2'],
  ['2026-03-20', 'Hari Raya Puasa Day 1'],
  ['2026-03-21', 'Hari Raya Puasa Day 2'],
  ['2026-05-01', 'Labour Day'],
  ['2026-08-09', 'National Day'],
  ['2026-12-25', 'Christmas Day'],
]);

// Derived Sets (for fast O(1) lookup)
export const MY_HOLIDAYS = new Set(MY_HOLIDAY_NAMES.keys());
export const SG_HOLIDAYS = new Set(SG_HOLIDAY_NAMES.keys());

/** Returns the holiday name if the date is a public holiday, else null */
export function getHolidayName(dateStr: string, region: 'MY' | 'SG' = 'MY'): string | null {
  return (region === 'MY' ? MY_HOLIDAY_NAMES : SG_HOLIDAY_NAMES).get(dateStr) ?? null;
}

/**
 * Returns true if the date is a normal working day.
 * workOnSaturday / workOnSunday override weekend treatment.
 */
export function isWorkday(
  date: Date,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
): boolean {
  const day = date.getDay();
  if (day === 6 && !workOnSaturday) return false;
  if (day === 0 && !workOnSunday) return false;
  const dateStr = date.toISOString().split('T')[0];
  return region === 'MY' ? !MY_HOLIDAYS.has(dateStr) : !SG_HOLIDAYS.has(dateStr);
}
