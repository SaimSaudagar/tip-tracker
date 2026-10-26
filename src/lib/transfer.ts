/**
 * CSV export of shifts, and import from this app's export or other tip apps'
 * spreadsheets. Everything here is pure so it can be tested without a device.
 */
import { toCsv } from '@/lib/csv';
import type { ISODate } from '@/lib/dates';
import { minutesToInput, parseDuration } from '@/lib/duration';
import { centsToInput, parseCount, parseMoney } from '@/lib/money';
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';
import { describeTipOuts, type TipOutEntry } from '@/lib/tipouts';

export type ExportShift = ShiftAmounts & {
  date: ISODate;
  jobName: string;
  positionName: string;
  salesCents: number | null;
  covers?: number | null;
  notes: string | null;
  tipOuts?: TipOutEntry[];
};

export const EXPORT_HEADERS = [
  'Date',
  'Job',
  'Position',
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

export function shiftsToCsv(shifts: ExportShift[]): string {
  const rows = shifts.map((s) => {
    const t = computeShift(s);
    return [
      s.date,
      s.jobName,
      s.positionName,
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
  { key: 'wage', label: 'Hourly wage' },
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
const FIELD_PATTERNS: [ImportField, RegExp][] = [
  ['date', /^(date|day|shift date|work date)$/],
  ['tipOut', /tip.?out|tips? paid|paid out|payout/],
  ['tipIn', /tip.?in|coworker|tip share|from (staff|team)|pool/],
  ['serviceCharge', /service|auto.?grat|gratuity/],
  ['cash', /cash/],
  ['card', /card|credit|charged/],
  ['wage', /wage|rate|per hour|hourly pay/],
  ['hours', /^hours?|hrs|time worked|duration/],
  ['sales', /sales/],
  ['covers', /covers|guests|^heads$/],
  ['tips', /^(tips?|total tips|tip total|tips earned|amount)$/],
  ['job', /^(job|employer|restaurant|workplace|company)$/],
  ['position', /^(position|role|job title)$/],
  ['notes', /note|comment|memo/],
];

export function guessMapping(headers: string[]): ImportMapping {
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, null])) as ImportMapping;
  headers.forEach((raw, index) => {
    const header = raw.trim().toLowerCase();
    if (/^(net tips|wages|total earned|total|net)$/.test(header)) return; // derived columns
    const match = FIELD_PATTERNS.find(([field, pattern]) => mapping[field] === null && pattern.test(header));
    if (match) mapping[match[0]] = index;
  });
  if (mapping.cash !== null || mapping.card !== null) mapping.tips = null;
  return mapping;
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
    .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+/, ''); // drop a leading weekday
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
  salesCents: number | null;
  covers: number | null;
  notes: string | null;
};

export type ImportResult = { drafts: ImportDraft[]; skipped: { line: number; reason: string }[] };

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
    const amount = (field: ImportField) => parseMoney(cell(field).replace(/^\((.*)\)$/, '$1').replace(/^-/, ''));

    const date = parseFlexibleDate(cell('date'));
    if (!date) {
      skipped.push({ line, reason: `Unreadable date "${cell('date')}"` });
      return;
    }

    const minutes = parseDuration(cell('hours'));
    const covers = parseCount(cell('covers'));
    const values = {
      cash: amount('cash'),
      card: amount('card'),
      tips: amount('tips'),
      wage: amount('wage'),
      tipIn: amount('tipIn'),
      tipOut: amount('tipOut'),
      serviceCharge: amount('serviceCharge'),
      sales: amount('sales'),
    };
    const bad = Object.entries(values).find(([, v]) => v === null);
    if (bad || minutes === null || covers === null) {
      const field = bad ? bad[0] : minutes === null ? 'hours' : 'covers';
      const label = IMPORT_FIELDS.find((f) => f.key === field)?.label ?? field;
      skipped.push({ line, reason: `Unreadable ${label.toLowerCase()} "${cell(field as ImportField)}"` });
      return;
    }

    drafts.push({
      date,
      minutesWorked: minutes,
      hourlyWageCents: values.wage!,
      // A single "tips" column is treated as cash unless cash or card columns exist.
      cashTipsCents: mapping.cash !== null || mapping.card !== null ? values.cash! : values.tips!,
      cardTipsCents: values.card!,
      tipInCents: values.tipIn!,
      tipOutCents: values.tipOut!,
      serviceChargeCents: values.serviceCharge!,
      salesCents: cell('sales') === '' ? null : values.sales,
      covers: cell('covers') === '' ? null : covers,
      jobName: cell('job') || null,
      positionName: cell('position') || null,
      notes: cell('notes') || null,
    });
  });

  return { drafts, skipped };
}
