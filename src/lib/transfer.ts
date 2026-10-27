/**
 * CSV export of shifts, and import from this app's export or other tip apps'
 * spreadsheets. Everything here is pure so it can be tested without a device.
 */
import { toCsv } from '@/lib/csv';
import type { ISODate } from '@/lib/dates';
import { minutesBetween, minutesToInput, parseClockTime, parseDuration } from '@/lib/duration';
import { centsToInput, parseCount, parseMoney } from '@/lib/money';
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';
import { describeTipOuts, type TipOutEntry } from '@/lib/tipouts';

type Period = 'am' | 'pm';

export type ExportShift = ShiftAmounts & {
  date: ISODate;
  jobName: string;
  positionName: string;
  period?: Period | null;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
  salesCents: number | null;
  covers?: number | null;
  notes: string | null;
  tipOuts?: TipOutEntry[];
};

export const EXPORT_HEADERS = [
  'Date',
  'Job',
  'Position',
  'Shift',
  'Start',
  'End',
  'Break (min)',
  'Hours',
  'Hourly wage',
  'Cash tips',
  'Card tips',
  'Tips from coworkers',
  'Tip-out',
  'Service charges',
  'Sales',
  'Covers',
  'Net tips',
  'Wages',
  'Total earned',
  'Notes',
  'Tipped out to',
] as const;

const money = (cents: number) => (cents === 0 ? '0' : centsToInput(cents));
const PERIOD_NAMES: Record<Period, string> = { am: 'Lunch', pm: 'Dinner' };

export function shiftsToCsv(shifts: ExportShift[]): string {
  const rows = shifts.map((s) => {
    const t = computeShift(s);
    return [
      s.date,
      s.jobName,
      s.positionName,
      s.period ? PERIOD_NAMES[s.period] : '',
      s.startTime ?? '',
      s.endTime ?? '',
      s.breakMinutes ? String(s.breakMinutes) : '',
      minutesToInput(s.minutesWorked) || '0',
      money(s.hourlyWageCents),
      money(s.cashTipsCents),
      money(s.cardTipsCents),
      money(s.tipInCents),
      money(s.tipOutCents),
      money(s.serviceChargeCents),
      s.salesCents === null ? '' : money(s.salesCents),
      s.covers == null ? '' : String(s.covers),
      money(t.netTipsCents),
      money(t.wagesCents),
      money(t.totalCents),
      s.notes ?? '',
      describeTipOuts(s.tipOuts ?? []),
    ];
  });
  return toCsv([[...EXPORT_HEADERS], ...rows]);
}

/** Fields an imported column can fill. `tips` is for apps that only record one tip total. */
export const IMPORT_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'cash', label: 'Cash tips' },
  { key: 'card', label: 'Card tips' },
  { key: 'tips', label: 'Total tips (one column)' },
  { key: 'hours', label: 'Hours' },
  { key: 'start', label: 'Start time' },
  { key: 'end', label: 'End time' },
  { key: 'break', label: 'Break' },
  { key: 'period', label: 'Lunch or dinner' },
  { key: 'wage', label: 'Hourly wage' },
  { key: 'wagesEarned', label: 'Wages earned (shift total)' },
  { key: 'tipIn', label: 'Tips from coworkers' },
  { key: 'tipOut', label: 'Tip-out' },
  { key: 'serviceCharge', label: 'Service charges' },
  { key: 'sales', label: 'Sales' },
  { key: 'covers', label: 'Covers (guests)' },
  { key: 'job', label: 'Job' },
  { key: 'position', label: 'Position' },
  { key: 'notes', label: 'Notes' },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]['key'];
/** Which column index feeds each field; null means not imported. */
export type ImportMapping = Record<ImportField, number | null>;

// Header words that identify each field, checked in order (first match wins per column).
// They cover the names tip apps and spreadsheets commonly use; anything else is matched by hand.
const FIELD_PATTERNS: [ImportField, RegExp][] = [
  ['date', /^(date|day|shift date|work date|date worked)$/],
  ['start', /^(start|start time|starts|clock.?in|clocked in|time in|in time|begin)$/],
  ['end', /^(end|end time|ends|clock.?out|clocked out|time out|out time|finish)$/],
  ['break', /^(breaks?|break time|break minutes|break \(min\)|unpaid break)$/],
  ['period', /^(shift|shift type|meal period|period|am\/pm)$/],
  ['tipOut', /tips?.?out|tipped out|tips? paid|paid out|payout/],
  ['tipIn', /tips?.?in\b|coworker|tip share|from (staff|team)|pool|tips? received/],
  ['serviceCharge', /service|auto.?grat|gratuity/],
  ['card', /non.?cash/],
  ['cash', /cash/],
  ['card', /card|credit|charged? tips|\bcc\b|electronic/],
  ['wagesEarned', /^(wages|wages earned|wage earned|earned wages|wage total|base pay|pay)$/],
  ['wage', /wage|rate|per hour|hourly pay/],
  ['hours', /^hours?\b|hours|hrs|time worked|duration/],
  ['sales', /sales/],
  ['covers', /covers|guests|^heads$/],
  ['tips', /^(tips?|total tips|tip total|tips earned|amount|gross tips|tip amount|tips made)$/],
  ['job', /^(job|employer|restaurant|workplace|company|location|venue|business)$/],
  ['position', /^(position|role|job title)$/],
  ['notes', /note|comment|memo/],
];

export function guessMapping(headers: string[]): ImportMapping {
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, null])) as ImportMapping;
  headers.forEach((raw, index) => {
    const header = raw.trim().toLowerCase();
    if (/^(net tips|total earned|total|net)$/.test(header)) return; // derived columns
    const match = FIELD_PATTERNS.find(([field, pattern]) => mapping[field] === null && pattern.test(header));
    if (match) mapping[match[0]] = index;
  });
  if (mapping.cash !== null || mapping.card !== null) mapping.tips = null;
  // Files that stamp each shift with a start date and time often have no separate date column.
  if (mapping.date === null && mapping.start !== null) mapping.date = mapping.start;
  return mapping;
}

/**
 * Splits parsed rows into the header and the shifts. Some exports put a title or a summary
 * above the header, so the header is the first of the top rows that has a date column.
 */
export function splitHeader(rows: string[][]): { headers: string[]; rows: string[][]; firstLine: number } {
  const index = Math.max(0, rows.slice(0, 10).findIndex((row) => guessMapping(row).date !== null));
  return { headers: rows[index] ?? [], rows: rows.slice(index + 1), firstLine: index + 2 };
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function validDate(y: number, m: number, d: number): ISODate | null {
  if (y < 100) y += 2000;
  const date = new Date(y, m - 1, d, 12);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Accepts 2026-10-25, 10/25/2026, 10/25/26, 10-25-2026, "Oct 25, 2026" and "25 Oct 2026" (US month-first). */
export function parseFlexibleDate(input: string): ISODate | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+/, '') // drop a leading weekday
    .replace(/(,?\s+|t)\d{1,2}:\d{2}.*$/, '') // and a trailing time
    .replace(/,?\s+\d{1,2}\s*[ap]\.?m\.?$/, '');
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) return validDate(+m[3], +m[1], +m[2]);
  m = /^([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(s);
  if (m && MONTHS.includes(m[1])) return validDate(+m[3], MONTHS.indexOf(m[1]) + 1, +m[2]);
  m = /^(\d{1,2})\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})$/.exec(s);
  if (m && MONTHS.includes(m[2])) return validDate(+m[3], MONTHS.indexOf(m[2]) + 1, +m[1]);
  return null;
}

export type ImportDraft = ShiftAmounts & {
  date: ISODate;
  jobName: string | null;
  positionName: string | null;
  period: Period | null;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  salesCents: number | null;
  covers: number | null;
  notes: string | null;
};

export type ImportResult = { drafts: ImportDraft[]; skipped: { line: number; reason: string }[] };

/** A totals or averages row under the shifts, which isn't a shift. */
const SUMMARY_ROW = /^(totals?|grand total|sum|averages?)\b/i;

/** "12,50" and "1.234,50" use a decimal comma (files from semicolon-separated spreadsheets do). */
function decimalPoint(value: string): string {
  return /^\$?(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(value) ? value.replace(/\./g, '').replace(',', '.') : value;
}

/**
 * Reads a start or end cell: "5:00 PM", "5pm", "17:00", "17:00:00", or a date and time such as
 * "10/25/2026 5:00 PM" or "2026-10-25T17:00:00". Returns "HH:MM", or null when it can't be read.
 */
export function parseImportTime(input: string): string | null {
  const m = /(?:^|[\sT])(\d{1,2})(?::(\d{2}))?(?::\d{2}(?:\.\d+)?)?\s*(?:([ap])\.?m?\.?)?\s*(?:z|[+-]\d{2}:?\d{2})?$/i.exec(
    input.trim(),
  );
  if (!m || (m[2] === undefined && m[3] === undefined)) return null; // a bare number isn't a time
  return parseClockTime(`${m[1]}${m[2] ? `:${m[2]}` : ''}${m[3] ? `${m[3]}m` : ''}`);
}

/** Whole numbers are minutes ("30"); "0:30" and "0.5" are hours, as typed elsewhere in the app. */
function parseBreak(input: string): number | null {
  const s = input.replace(/\s*(minutes|mins?|m)$/i, '');
  if (/^\d+$/.test(s)) return Number(s) <= 240 ? Number(s) : null;
  return parseDuration(s);
}

function parsePeriod(input: string): Period | null {
  const s = input.toLowerCase().replace(/\./g, '');
  if (/\b(am|lunch|brunch|breakfast|morning|day)/.test(s)) return 'am';
  if (/\b(pm|dinner|night|evening|late|close)/.test(s)) return 'pm';
  return null;
}

/** Turns data rows (header row excluded) into shift drafts, skipping rows that can't be read. */
export function buildImportDrafts(rows: string[][], mapping: ImportMapping, firstLine = 2): ImportResult {
  const drafts: ImportDraft[] = [];
  const skipped: ImportResult['skipped'] = [];

  rows.forEach((row, i) => {
    const line = firstLine + i;
    const cell = (field: ImportField) => {
      const index = mapping[field];
      return index === null ? '' : (row[index] ?? '').trim();
    };
    // Some apps write negatives or parentheses for tip-outs; only the size matters here.
    const amount = (field: ImportField) =>
      parseMoney(decimalPoint(cell(field).replace(/^\((.*)\)$/, '$1').replace(/^-/, '')));
    const unreadable = (field: ImportField) => {
      const label = IMPORT_FIELDS.find((f) => f.key === field)?.label ?? field;
      skipped.push({ line, reason: `Unreadable ${label.toLowerCase()} "${cell(field)}"` });
    };

    if (SUMMARY_ROW.test(cell('date'))) return;
    const date = parseFlexibleDate(cell('date'));
    if (!date) {
      skipped.push({ line, reason: `Unreadable date "${cell('date')}"` });
      return;
    }

    const values = {
      cash: amount('cash'),
      card: amount('card'),
      tips: amount('tips'),
      wage: amount('wage'),
      wagesEarned: amount('wagesEarned'),
      tipIn: amount('tipIn'),
      tipOut: amount('tipOut'),
      serviceCharge: amount('serviceCharge'),
      sales: amount('sales'),
    };
    const badAmount = (Object.keys(values) as (keyof typeof values)[]).find((field) => values[field] === null);
    if (badAmount) return unreadable(badAmount);

    const startTime = cell('start') === '' ? null : parseImportTime(cell('start'));
    if (startTime === null && cell('start') !== '') return unreadable('start');
    const endTime = cell('end') === '' ? null : parseImportTime(cell('end'));
    if (endTime === null && cell('end') !== '') return unreadable('end');
    const breakMinutes = parseBreak(decimalPoint(cell('break')));
    if (breakMinutes === null) return unreadable('break');

    // Hours win when both are given; otherwise they come from the start and end times.
    const minutes =
      cell('hours') === '' && startTime && endTime
        ? minutesBetween(startTime, endTime, breakMinutes)
        : parseDuration(decimalPoint(cell('hours')));
    if (minutes === null) return unreadable('hours');
    const covers = parseCount(cell('covers'));
    if (covers === null) return unreadable('covers');

    // Some apps export the wages paid for the shift rather than the hourly rate.
    const wageCents =
      mapping.wage === null && mapping.wagesEarned !== null && minutes > 0
        ? Math.round((values.wagesEarned! * 60) / minutes)
        : values.wage!;

    drafts.push({
      date,
      minutesWorked: minutes,
      hourlyWageCents: wageCents,
      // A single "tips" column is treated as cash unless cash or card columns exist.
      cashTipsCents: mapping.cash !== null || mapping.card !== null ? values.cash! : values.tips!,
      cardTipsCents: values.card!,
      tipInCents: values.tipIn!,
      tipOutCents: values.tipOut!,
      serviceChargeCents: values.serviceCharge!,
      period: parsePeriod(cell('period')),
      startTime,
      endTime,
      breakMinutes: startTime && endTime ? breakMinutes : 0,
      salesCents: cell('sales') === '' ? null : values.sales,
      covers: cell('covers') === '' ? null : covers,
      jobName: cell('job') || null,
      positionName: cell('position') || null,
      notes: cell('notes') || null,
    });
  });

  return { drafts, skipped };
}
