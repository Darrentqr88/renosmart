// MY/SG Public Holidays 2025-2026 — name maps for tooltip display
// Merged from renovation-platform-demo.html with additional holidays
export const MY_HOLIDAY_NAMES: Map<string, string> = new Map([
  // 2025
  ['2025-01-01', "New Year's Day 元旦"],
  ['2025-01-29', 'Chinese New Year 春节 Day 1'],
  ['2025-01-30', 'Chinese New Year 春节 Day 2'],
  ['2025-02-01', 'Federal Territory Day'],
  ['2025-03-31', 'Nuzul Al-Quran 可兰经降世'],
  ['2025-04-01', 'Hari Raya Aidilfitri Day 1'],
  ['2025-04-02', 'Hari Raya Aidilfitri Day 2'],
  ['2025-04-03', 'Hari Raya Aidilfitri (replacement)'],
  ['2025-05-01', 'Labour Day 劳动节'],
  ['2025-05-12', 'Wesak Day 卫塞节'],
  ['2025-06-02', "Agong's Birthday 最高元首诞辰"],
  ['2025-06-07', 'Hari Raya Haji 哈芝节'],
  ['2025-07-07', 'Aidiladha'],
  ['2025-07-27', 'Awal Muharram 回历新年'],
  ['2025-08-31', 'National Day 独立日'],
  ['2025-09-16', 'Malaysia Day 马来西亚日'],
  ['2025-10-06', 'Maulidur Rasul 先知诞辰'],
  ['2025-10-20', 'Deepavali 屠妖节'],
  ['2025-12-25', 'Christmas Day 圣诞节'],
  // 2026
  ['2026-01-01', "New Year's Day 元旦"],
  ['2026-01-17', 'Chinese New Year 春节 Day 1'],
  ['2026-01-18', 'Chinese New Year 春节 Day 2'],
  ['2026-01-19', 'Chinese New Year 春节 (replacement)'],
  ['2026-02-01', 'Federal Territory Day'],
  ['2026-03-20', 'Nuzul Al-Quran 可兰经降世'],
  ['2026-03-21', 'Hari Raya Aidilfitri Day 1'],
  ['2026-03-22', 'Hari Raya Aidilfitri Day 2'],
  ['2026-05-01', 'Labour Day 劳动节'],
  ['2026-05-27', 'Hari Raya Haji 哈芝节'],
  ['2026-05-31', 'Wesak Day 卫塞节'],
  ['2026-06-01', "Agong's Birthday 最高元首诞辰"],
  ['2026-06-17', 'Aidiladha'],
  ['2026-07-16', 'Awal Muharram 回历新年'],
  ['2026-08-31', 'National Day 独立日'],
  ['2026-09-16', 'Malaysia Day 马来西亚日'],
  ['2026-09-25', 'Maulidur Rasul 先知诞辰'],
  ['2026-11-08', 'Deepavali 屠妖节'],
  ['2026-12-25', 'Christmas Day 圣诞节'],
]);

export const SG_HOLIDAY_NAMES: Map<string, string> = new Map([
  // 2025
  ['2025-01-01', "New Year's Day"],
  ['2025-01-29', 'Chinese New Year Day 1'],
  ['2025-01-30', 'Chinese New Year Day 2'],
  ['2025-04-01', 'Hari Raya Puasa Day 1'],
  ['2025-04-02', 'Hari Raya Puasa Day 2'],
  ['2025-04-18', 'Good Friday'],
  ['2025-05-01', 'Labour Day'],
  ['2025-05-12', 'Vesak Day'],
  ['2025-06-07', 'Hari Raya Haji'],
  ['2025-08-09', 'National Day'],
  ['2025-10-20', 'Deepavali'],
  ['2025-12-25', 'Christmas Day'],
  // 2026
  ['2026-01-01', "New Year's Day"],
  ['2026-01-17', 'Chinese New Year Day 1'],
  ['2026-01-18', 'Chinese New Year Day 2'],
  ['2026-03-21', 'Hari Raya Puasa'],
  ['2026-04-03', 'Good Friday'],
  ['2026-05-01', 'Labour Day'],
  ['2026-05-31', 'Vesak Day'],
  ['2026-06-17', 'Hari Raya Haji'],
  ['2026-08-09', 'National Day'],
  ['2026-11-08', 'Deepavali'],
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
 * dayOverrides allow manual per-day override (true=work, false=holiday).
 */
export function isWorkday(
  date: Date,
  region: 'MY' | 'SG' = 'MY',
  workOnSaturday = false,
  workOnSunday = false,
  dayOverrides?: Record<string, boolean>,
): boolean {
  const dateStr = date.toISOString().split('T')[0];
  // User manual override takes priority
  if (dayOverrides && dateStr in dayOverrides) return dayOverrides[dateStr];
  const day = date.getDay();
  if (day === 6 && !workOnSaturday) return false;
  if (day === 0 && !workOnSunday) return false;
  return region === 'MY' ? !MY_HOLIDAYS.has(dateStr) : !SG_HOLIDAYS.has(dateStr);
}
