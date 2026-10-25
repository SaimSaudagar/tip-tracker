/**
 * Shift dates are local calendar days stored as "YYYY-MM-DD" strings.
 * They never pass through UTC, so a late shift can't slide onto the wrong day.
 */

export type ISODate = string;
/** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DateRange = { start: ISODate; end: ISODate };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parses to local noon, which keeps day arithmetic clear of daylight-saving edges. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekRange(iso: ISODate, weekStart: Weekday): DateRange {
  const offset = (fromISODate(iso).getDay() - weekStart + 7) % 7;
  const start = addDays(iso, -offset);
  return { start, end: addDays(start, 6) };
}

export function monthRange(iso: ISODate): DateRange {
  const d = fromISODate(iso);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  return { start: `${iso.slice(0, 7)}-01`, end: toISODate(last) };
}

export function yearRange(iso: ISODate): DateRange {
  const year = iso.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** ISO date strings sort the same way as the dates they represent. */
export function isInRange(iso: ISODate, range: DateRange): boolean {
  return iso >= range.start && iso <= range.end;
}

/** "Today", "Yesterday", "Tue, Oct 20", or "Wed, Dec 31, 2025" outside the current year. */
export function formatDayLabel(iso: ISODate, today: ISODate): string {
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  const d = fromISODate(iso);
  const label = `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  return iso.slice(0, 4) === today.slice(0, 4) ? label : `${label}, ${d.getFullYear()}`;
}

/** "Oct 26 – Nov 1" for a week, with the year added when the range isn't in the current year. */
export function formatRange(range: DateRange, today: ISODate): string {
  const s = fromISODate(range.start);
  const e = fromISODate(range.end);
  const startLabel = `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}`;
  const endLabel =
    s.getMonth() === e.getMonth() ? String(e.getDate()) : `${MONTH_NAMES[e.getMonth()]} ${e.getDate()}`;
  const year = range.end.slice(0, 4) === today.slice(0, 4) ? '' : `, ${e.getFullYear()}`;
  return `${startLabel} – ${endLabel}${year}`;
}

export function formatMonthYear(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
