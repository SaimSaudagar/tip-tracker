/**
 * Shift dates are local calendar days stored as "YYYY-MM-DD" strings.
 * They never pass through UTC, so a late shift can't slide onto the wrong day.
 */
import { byLanguage, t } from '@/i18n';

export type ISODate = string;
/** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DateRange = { start: ISODate; end: ISODate };

const NAMES = {
  en: {
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  es: {
    days: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  },
};

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

const LONG_DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
};
const PLURAL_DAYS = {
  en: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'],
  es: ['Los domingos', 'Los lunes', 'Los martes', 'Los miércoles', 'Los jueves', 'Los viernes', 'Los sábados'],
};
const INITIALS = { en: 'SMTWTFS', es: 'DLMXJVS' };

/** A weekday's full name, 0 = Sunday: "Friday" ("viernes"). */
export const weekdayName = (weekday: number): string => byLanguage(LONG_DAYS)[weekday];
/** "Fridays" ("Los viernes"). */
export const weekdayPlural = (weekday: number): string => byLanguage(PLURAL_DAYS)[weekday];
/** "Fri" ("vie"). */
export const weekdayShortName = (weekday: number): string => byLanguage(NAMES).days[weekday];
/** "F" ("V"); Spanish uses X for miércoles. */
export const weekdayInitial = (weekday: number): string => byLanguage(INITIALS)[weekday];

/** Short weekday name for a date: "Tue" ("mar" in Spanish). */
export function formatWeekday(iso: ISODate): string {
  return byLanguage(NAMES).days[fromISODate(iso).getDay()];
}

/** "Oct 20" ("20 oct" in Spanish). */
export function formatShortDate(iso: ISODate): string {
  const d = fromISODate(iso);
  const month = byLanguage(NAMES).months[d.getMonth()];
  return byLanguage({ en: `${month} ${d.getDate()}`, es: `${d.getDate()} ${month}` });
}

/** "Today", "Yesterday", "Tue, Oct 20", or "Wed, Dec 31, 2025" outside the current year ("mar 20 oct" in Spanish). */
export function formatDayLabel(iso: ISODate, today: ISODate): string {
  if (iso === today) return t('Today');
  if (iso === addDays(today, -1)) return t('Yesterday');
  const year = iso.slice(0, 4) === today.slice(0, 4) ? '' : iso.slice(0, 4);
  const weekday = formatWeekday(iso);
  const date = formatShortDate(iso);
  return byLanguage({
    en: `${weekday}, ${date}${year ? `, ${year}` : ''}`,
    es: `${weekday} ${date}${year ? ` ${year}` : ''}`,
  });
}

/** "Oct 26 – Nov 1" for a week ("26 oct – 1 nov"), with the year added when the range isn't in the current year. */
export function formatRange(range: DateRange, today: ISODate): string {
  const s = fromISODate(range.start);
  const e = fromISODate(range.end);
  const sameMonth = s.getMonth() === e.getMonth();
  const year = range.end.slice(0, 4) === today.slice(0, 4) ? '' : String(e.getFullYear());
  return byLanguage({
    en: `${formatShortDate(range.start)} – ${sameMonth ? e.getDate() : formatShortDate(range.end)}${year ? `, ${year}` : ''}`,
    es: `${sameMonth ? s.getDate() : formatShortDate(range.start)} – ${formatShortDate(range.end)}${year ? ` ${year}` : ''}`,
  });
}

const LONG_MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

/** "October 2026" ("octubre de 2026" in Spanish). */
export function formatMonthLong(iso: ISODate): string {
  const d = fromISODate(iso);
  const month = byLanguage(LONG_MONTHS)[d.getMonth()];
  return byLanguage({ en: `${month} ${d.getFullYear()}`, es: `${month} de ${d.getFullYear()}` });
}

/** "Oct 2026" ("oct 2026" in Spanish). */
export function formatMonthYear(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${byLanguage(NAMES).months[d.getMonth()]} ${d.getFullYear()}`;
}
