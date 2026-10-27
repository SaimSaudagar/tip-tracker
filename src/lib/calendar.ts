import { addDays, fromISODate, monthRange, weekdayInitial, weekRange, type ISODate, type Weekday } from '@/lib/dates';
import { summarize, type PeriodSummary, type ShiftAmounts } from '@/lib/shift-math';

export type CalendarCell = { date: ISODate; inMonth: boolean };

/** Weeks (rows of 7 days) covering the month that contains `iso`, padded with neighbouring days. */
export function buildMonthGrid(iso: ISODate, weekStart: Weekday): CalendarCell[][] {
  const { start, end } = monthRange(iso);
  const month = iso.slice(0, 7);
  const weeks: CalendarCell[][] = [];
  let day = weekRange(start, weekStart).start;
  while (day <= end) {
    const week: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: day, inMonth: day.slice(0, 7) === month });
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Day-of-week headers in display order, e.g. ["S", "M", …] for Sunday-start weeks. */
export function weekdayInitials(weekStart: Weekday): string[] {
  return Array.from({ length: 7 }, (_, i) => weekdayInitial((weekStart + i) % 7));
}

export function summarizeByDay<T extends ShiftAmounts & { date: ISODate }>(shifts: T[]): Map<ISODate, PeriodSummary> {
  const byDay = new Map<ISODate, T[]>();
  for (const s of shifts) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]);
  return new Map([...byDay].map(([date, list]) => [date, summarize(list)]));
}

/** The first day of the month `offset` months away from the month containing `iso`. */
export function shiftMonth(iso: ISODate, offset: number): ISODate {
  const d = fromISODate(iso);
  const first = new Date(d.getFullYear(), d.getMonth() + offset, 1, 12);
  return `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Compact amount for a calendar cell: "$85", "$1.2k". */
export function formatCellAmount(cents: number): string {
  const dollars = Math.round(cents / 100);
  if (Math.abs(dollars) >= 1000) return `$${(dollars / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${dollars}`;
}
