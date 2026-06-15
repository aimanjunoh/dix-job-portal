// Public Holidays Configuration
// Used by SLA calculation to exclude holidays from working day counts.
// Update annually or when new holidays are announced.
// Format: YYYY-MM-DD (matches sla_due_date format)

export interface PublicHoliday {
  date: string;
  name: string;
}

export const PUBLIC_HOLIDAYS: PublicHoliday[] = [
  // 2026 Malaysian Public Holidays
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-29', name: 'Chinese New Year (Day 1)' },
  { date: '2026-01-30', name: 'Chinese New Year (Day 2)' },
  { date: '2026-02-01', name: 'Federal Territory Day' },
  { date: '2026-03-31', name: 'Hari Raya Aidilfitri (Day 1)' },
  { date: '2026-04-01', name: 'Hari Raya Aidilfitri (Day 2)' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-05-31', name: 'Hari Raya Haji' },
  { date: '2026-06-07', name: "Yang di-Pertuan Agong's Birthday" },
  { date: '2026-08-31', name: 'National Day' },
  { date: '2026-09-16', name: 'Malaysia Day' },
  { date: '2026-10-20', name: 'Deepavali' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

/**
 * Check if a given date is a public holiday.
 * @param date - The date to check
 * @returns true if the date is a public holiday
 */
export function isHoliday(date: Date): boolean {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  return PUBLIC_HOLIDAYS.some(h => h.date === dateStr);
}
