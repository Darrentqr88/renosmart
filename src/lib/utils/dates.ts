// MY/SG Public Holidays 2025-2026
export const MY_HOLIDAYS = new Set([
  // 2025
  '2025-01-01', // New Year
  '2025-01-29', // CNY Day 1
  '2025-01-30', // CNY Day 2
  '2025-03-30', // Hari Raya Aidilfitri Day 1
  '2025-03-31', // Hari Raya Aidilfitri Day 2
  '2025-04-14', // Agong Birthday (Tentative)
  '2025-05-01', // Labour Day
  '2025-05-12', // Wesak Day
  '2025-06-06', // Hari Raya Aidiladha
  '2025-08-31', // National Day (Merdeka)
  '2025-09-16', // Malaysia Day
  '2025-10-20', // Deepavali
  '2025-12-25', // Christmas
  // 2026
  '2026-01-01', // New Year
  '2026-02-17', // CNY Day 1
  '2026-02-18', // CNY Day 2
  '2026-03-20', // Hari Raya Aidilfitri Day 1
  '2026-03-21', // Hari Raya Aidilfitri Day 2
  '2026-05-01', // Labour Day
  '2026-05-31', // Wesak Day
  '2026-08-31', // National Day
  '2026-09-16', // Malaysia Day
  '2026-12-25', // Christmas
]);

export const SG_HOLIDAYS = new Set([
  '2025-01-01',
  '2025-01-29', '2025-01-30',
  '2025-03-30', '2025-03-31',
  '2025-04-18', // Good Friday
  '2025-05-01',
  '2025-05-12',
  '2025-06-06',
  '2025-08-09', // National Day SG
  '2025-10-20',
  '2025-12-25',
]);

export function isWorkday(date: Date, region: 'MY' | 'SG' = 'MY'): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const dateStr = date.toISOString().split('T')[0];
  return region === 'MY' ? !MY_HOLIDAYS.has(dateStr) : !SG_HOLIDAYS.has(dateStr);
}
