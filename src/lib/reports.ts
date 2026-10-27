/**
 * Monthly employer tip reports and the year-end summary, following the tip-reporting
 * rules in IRS Publication 531 (the old daily record form, Publication 1244 with Form
 * 4070, was retired in 2024). These are records, not tax advice.
 */
import { fromISODate, monthRange, yearRange, isInRange, type ISODate } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { employerReportDueDate } from '@/lib/reminders-plan';
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';
import { describeTipOuts, type TipOutEntry } from '@/lib/tipouts';

export type ReportShift = ShiftAmounts & {
  date: ISODate;
  jobName: string;
  positionName: string;
  /** Who tips were paid out to, when recorded. */
  tipOuts?: TipOutEntry[];
};

export type TipTotals = {
  cashCents: number;
  cardCents: number;
  tipInCents: number;
  tipOutCents: number;
  netTipsCents: number;
  serviceChargeCents: number;
  wagesCents: number;
  minutesWorked: number;
  shiftCount: number;
};

/** IRS: employees who receive $20 or more in tips in a month from one job must report them to that employer. */
export const EMPLOYER_REPORT_THRESHOLD_CENTS = 2000;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const emptyTotals = (): TipTotals => ({
  cashCents: 0,
  cardCents: 0,
  tipInCents: 0,
  tipOutCents: 0,
  netTipsCents: 0,
  serviceChargeCents: 0,
  wagesCents: 0,
  minutesWorked: 0,
  shiftCount: 0,
});

function addShift(t: TipTotals, s: ShiftAmounts) {
  const computed = computeShift(s);
  t.cashCents += s.cashTipsCents;
  t.cardCents += s.cardTipsCents;
  t.tipInCents += s.tipInCents;
  t.tipOutCents += s.tipOutCents;
  t.netTipsCents += computed.netTipsCents;
  t.serviceChargeCents += s.serviceChargeCents;
  t.wagesCents += computed.wagesCents;
  t.minutesWorked += s.minutesWorked;
  t.shiftCount += 1;
}

function groupByJob<T extends ReportShift>(shifts: T[]): Map<string, T[]> {
  const jobs = new Map<string, T[]>();
  for (const s of shifts) jobs.set(s.jobName, [...(jobs.get(s.jobName) ?? []), s]);
  return jobs;
}

export function monthLabel(monthIso: ISODate): string {
  const d = fromISODate(monthIso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ---- Monthly employer report ----

export type JobMonthReport = {
  jobName: string;
  rows: (ReportShift & { netTipsCents: number })[];
  totals: TipTotals;
  mustReport: boolean;
};

export type MonthlyReport = {
  month: ISODate;
  label: string;
  dueDate: ISODate;
  jobs: JobMonthReport[];
};

export function buildMonthlyReport(shifts: ReportShift[], monthIso: ISODate): MonthlyReport {
  const range = monthRange(monthIso);
  const inMonth = shifts.filter((s) => isInRange(s.date, range)).sort((a, b) => a.date.localeCompare(b.date));
  const jobs = [...groupByJob(inMonth)].map(([jobName, list]): JobMonthReport => {
    const totals = emptyTotals();
    list.forEach((s) => addShift(totals, s));
    return {
      jobName,
      rows: list.map((s) => ({ ...s, netTipsCents: computeShift(s).netTipsCents })),
      totals,
      mustReport: totals.netTipsCents >= EMPLOYER_REPORT_THRESHOLD_CENTS,
    };
  });
  return { month: range.start, label: monthLabel(range.start), dueDate: employerReportDueDate(range.start), jobs };
}

// ---- Year-end summary ----

export type YearSummary = {
  year: string;
  jobs: (TipTotals & { jobName: string })[];
  totals: TipTotals;
  months: (TipTotals & { label: string })[];
};

export function buildYearSummary(shifts: ReportShift[], yearIso: ISODate): YearSummary {
  const range = yearRange(yearIso);
  const inYear = shifts.filter((s) => isInRange(s.date, range));
  const totals = emptyTotals();
  const months = MONTHS.map((m) => ({ label: m, ...emptyTotals() }));
  for (const s of inYear) {
    addShift(totals, s);
    addShift(months[fromISODate(s.date).getMonth()], s);
  }
  const jobs = [...groupByJob(inYear)].map(([jobName, list]) => {
    const t = emptyTotals();
    list.forEach((s) => addShift(t, s));
    return { jobName, ...t };
  });
  return { year: range.start.slice(0, 4), jobs, totals, months };
}

// ---- Printable HTML ----

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "November 10, 2026" */
export function formatLongDate(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Thu, Oct 1" */
const rowDate = (iso: ISODate) => {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};

const STYLE = `
  @page { margin: 0.6in; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; margin: 0; font-size: 11px; }
  section + section { break-before: page; page-break-before: always; }
  .brand { color: #0B7A4B; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
  h1 { font-size: 20px; margin: 2px 0 2px; }
  h2 { font-size: 14px; margin: 22px 0 4px; }
  p { margin: 3px 0; }
  .muted { color: #555; }
  .facts { margin: 10px 0 4px; border-collapse: collapse; width: auto; }
  .facts td { text-align: left; border: none; padding: 1px 16px 1px 0; }
  .facts td:first-child { color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: right; padding: 4px 5px; border-bottom: 1px solid #ddd; white-space: nowrap; }
  th { font-size: 10px; color: #444; font-weight: 600; border-bottom: 1px solid #999; }
  .left { text-align: left; }
  .wrap { white-space: normal; font-size: 9.5px; }
  tfoot td { font-weight: 700; border-top: 2px solid #111; border-bottom: none; }
  .empty td { color: #999; }
  .sign { margin-top: 28px; border-collapse: collapse; width: 100%; }
  .sign td { border: none; border-top: 1px solid #111; padding: 3px 0 0; text-align: left; font-size: 10px; color: #444; width: 33%; }
  .sign td + td { padding-left: 24px; }
  .note { margin-top: 18px; font-size: 9.5px; color: #555; }
`;

const NOTE = `<p class="note">Prepared with Tipbook. Service charges and auto-gratuities are listed separately because
they are not voluntary tips. These are your records, not tax advice. See IRS.gov (Topic 761, Tips) for reporting rules.</p>`;

const htmlDocument = (title: string, sections: string[]) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body>${sections.map((s) => `<section>${s}${NOTE}</section>`).join('')}</body></html>`;

/**
 * The monthly tip report, one page per job, so each employer gets only its own page. Pass
 * `jobName` to include just that job (the Reports screen shares one employer at a time).
 */
export function monthlyReportHtml(report: MonthlyReport, preparedOn: ISODate, { jobName }: { jobName?: string } = {}): string {
  const jobs = jobName === undefined ? report.jobs : report.jobs.filter((j) => j.jobName === jobName);
  const start = fromISODate(report.month);
  const period = `${MONTHS[start.getMonth()]} 1–${Number(monthRange(report.month).end.slice(8))}, ${start.getFullYear()}`;
  const sections = jobs.map((job) => {
    const rows = job.rows
      .map(
        (r) => `<tr><td class="left">${rowDate(r.date)}</td><td class="left">${escapeHtml(r.positionName)}</td>
        <td>${formatMoney(r.cashTipsCents)}</td><td>${formatMoney(r.cardTipsCents)}</td>
        <td>${formatMoney(r.tipInCents)}</td><td>${formatMoney(r.tipOutCents)}</td>
        <td class="left wrap">${escapeHtml(describeTipOuts(r.tipOuts ?? []))}</td><td>${formatMoney(r.netTipsCents)}</td></tr>`,
      )
      .join('');
    const t = job.totals;
    return `<div class="brand">Tipbook</div>
      <h1>Employee’s tip report – ${escapeHtml(report.label)}</h1>
      <p class="muted">Daily record of tips received and paid out, for the employer named below.</p>
      <table class="facts">
        <tr><td>Employer</td><td><b>${escapeHtml(job.jobName)}</b></td></tr>
        <tr><td>Period</td><td>${escapeHtml(period)}</td></tr>
        <tr><td>Net tips</td><td><b>${formatMoney(t.netTipsCents)}</b></td></tr>
        <tr><td>Prepared</td><td>${formatLongDate(preparedOn)}</td></tr>
        <tr><td>${job.mustReport ? 'Due to employer' : 'Report'}</td><td>${
          job.mustReport
            ? `by ${formatLongDate(report.dueDate)}`
            : 'Not required: under $20 in tips this month from this employer (tips are still income)'
        }</td></tr>
      </table>
      <table>
        <thead><tr><th class="left">Date</th><th class="left">Position</th><th>Cash tips</th><th>Card tips</th><th>From coworkers</th><th>Paid out</th><th class="left">Paid out to</th><th>Net tips</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td class="left">Total</td><td class="left">${t.shiftCount} shift${t.shiftCount === 1 ? '' : 's'}</td>
          <td>${formatMoney(t.cashCents)}</td><td>${formatMoney(t.cardCents)}</td><td>${formatMoney(t.tipInCents)}</td>
          <td>${formatMoney(t.tipOutCents)}</td><td></td><td>${formatMoney(t.netTipsCents)}</td></tr></tfoot>
      </table>
      ${t.serviceChargeCents > 0 ? `<p class="muted">Service charges and auto-gratuities (not tips): ${formatMoney(t.serviceChargeCents)}</p>` : ''}
      <table class="sign"><tr><td>Employee name</td><td>Signature</td><td>Date</td></tr></table>`;
  });
  return htmlDocument(
    `Tip report – ${report.label}`,
    sections.length > 0
      ? sections
      : [`<div class="brand">Tipbook</div><h1>Employee’s tip report – ${escapeHtml(report.label)}</h1><p>No shifts logged this month.</p>`],
  );
}

export function yearSummaryHtml(summary: YearSummary, preparedOn: ISODate): string {
  const cells = (t: TipTotals) => `<td>${formatDuration(t.minutesWorked)}</td>
    <td>${formatMoney(t.cashCents)}</td><td>${formatMoney(t.cardCents)}</td><td>${formatMoney(t.tipInCents)}</td>
    <td>${formatMoney(t.tipOutCents)}</td><td><b>${formatMoney(t.netTipsCents)}</b></td>
    <td>${formatMoney(t.serviceChargeCents)}</td><td>${formatMoney(t.wagesCents)}</td>`;
  const head = (first: string) =>
    `<thead><tr><th class="left">${first}</th><th>Hours</th><th>Cash tips</th><th>Card tips</th><th>From coworkers</th><th>Paid out</th><th>Net tips</th><th>Service charges</th><th>Wages</th></tr></thead>`;
  const months = summary.months
    .map((m) =>
      m.shiftCount === 0
        ? `<tr class="empty"><td class="left">${m.label}</td><td colspan="8" class="left">No shifts</td></tr>`
        : `<tr><td class="left">${m.label}</td>${cells(m)}</tr>`,
    )
    .join('');
  const body = `<div class="brand">Tipbook</div>
     <h1>Tip summary – ${escapeHtml(summary.year)}</h1>
     <p class="muted">Prepared ${escapeHtml(formatLongDate(preparedOn))}. ${summary.totals.shiftCount} shifts, ${formatDuration(summary.totals.minutesWorked)} worked.</p>
     <table class="facts">
       <tr><td>Net tips (tips you kept)</td><td><b>${formatMoney(summary.totals.netTipsCents)}</b></td></tr>
       <tr><td>Service charges (not tips)</td><td>${formatMoney(summary.totals.serviceChargeCents)}</td></tr>
       <tr><td>Wages</td><td>${formatMoney(summary.totals.wagesCents)}</td></tr>
     </table>
     <p class="muted">Net tips are kept apart from service charges, which don’t count as tips for the federal
     “no tax on tips” deduction (2025–2028). Tips you reported to your employer are usually included on your W-2;
     tips you didn’t report go on IRS Form 4137.</p>
     <h2>By job</h2>
     <table>${head('Job')}
       <tbody>${summary.jobs.map((j) => `<tr><td class="left">${escapeHtml(j.jobName)}</td>${cells(j)}</tr>`).join('')}</tbody>
       <tfoot><tr><td class="left">All jobs</td>${cells(summary.totals)}</tr></tfoot>
     </table>
     <h2>By month</h2>
     <table>${head('Month')}<tbody>${months}</tbody></table>`;
  return htmlDocument(`Tip summary – ${summary.year}`, [body]);
}
