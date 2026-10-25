/**
 * Monthly employer tip reports and the year-end summary, modeled on the IRS
 * daily tip record (Publication 1244). These are records, not tax advice.
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
  months: { label: string; netTipsCents: number }[];
};

export function buildYearSummary(shifts: ReportShift[], yearIso: ISODate): YearSummary {
  const range = yearRange(yearIso);
  const inYear = shifts.filter((s) => isInRange(s.date, range));
  const totals = emptyTotals();
  const months = MONTHS.map((m) => ({ label: m.slice(0, 3), netTipsCents: 0 }));
  for (const s of inYear) {
    addShift(totals, s);
    months[fromISODate(s.date).getMonth()].netTipsCents += computeShift(s).netTipsCents;
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

const STYLE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; margin: 32px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 6px; }
  p { margin: 4px 0; }
  .muted { color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: right; padding: 5px 6px; border-bottom: 1px solid #ddd; }
  th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left; }
  tfoot td { font-weight: bold; border-top: 2px solid #111; }
  th.names, td.names { text-align: left; font-size: 10px; }
  .note { margin-top: 24px; font-size: 10px; color: #555; }
`;

const page = (title: string, body: string, preparedOn: ISODate) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head>
<body>${body}
<p class="note">Prepared with Tip Tracker on ${escapeHtml(preparedOn)}. Service charges and auto-gratuities are listed
separately because they are not voluntary tips. These are your records, not tax advice. See IRS.gov (Topic 761, Tips)
for reporting rules.</p>
</body></html>`;

export function monthlyReportHtml(report: MonthlyReport, preparedOn: ISODate): string {
  const sections = report.jobs.map((job) => {
    const rows = job.rows
      .map(
        (r) => `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.positionName)}</td>
        <td>${formatMoney(r.cashTipsCents)}</td><td>${formatMoney(r.cardTipsCents)}</td>
        <td>${formatMoney(r.tipInCents)}</td><td>${formatMoney(r.tipOutCents)}</td>
        <td class="names">${escapeHtml(describeTipOuts(r.tipOuts ?? []))}</td><td>${formatMoney(r.netTipsCents)}</td></tr>`,
      )
      .join('');
    const t = job.totals;
    return `<h2>${escapeHtml(job.jobName)}</h2>
      <p class="muted">${
        job.mustReport
          ? `Net tips of ${formatMoney(t.netTipsCents)}: report to this employer by ${escapeHtml(report.dueDate)}.`
          : `Under $20 this month: no report to this employer is required, but tips are still income.`
      }</p>
      <table>
        <thead><tr><th>Date</th><th>Position</th><th>Cash tips</th><th>Card tips</th><th>From coworkers</th><th>Paid out</th><th class="names">Paid out to</th><th>Net tips</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>Total</td><td>${t.shiftCount} shift${t.shiftCount === 1 ? '' : 's'}</td>
          <td>${formatMoney(t.cashCents)}</td><td>${formatMoney(t.cardCents)}</td><td>${formatMoney(t.tipInCents)}</td>
          <td>${formatMoney(t.tipOutCents)}</td><td></td><td>${formatMoney(t.netTipsCents)}</td></tr></tfoot>
      </table>
      ${t.serviceChargeCents > 0 ? `<p class="muted">Service charges (not tips): ${formatMoney(t.serviceChargeCents)}</p>` : ''}`;
  });
  return page(
    `Tip report – ${report.label}`,
    `<h1>Tip report – ${escapeHtml(report.label)}</h1>
     <p class="muted">Employee’s daily record of tips. Due to employer by ${escapeHtml(report.dueDate)} (the 10th, or the next business day).</p>
     ${sections.join('') || '<p>No shifts logged this month.</p>'}`,
    preparedOn,
  );
}

export function yearSummaryHtml(summary: YearSummary, preparedOn: ISODate): string {
  const line = (label: string, t: TipTotals) => `<tr><td>${escapeHtml(label)}</td><td>${t.shiftCount}</td>
    <td>${formatDuration(t.minutesWorked)}</td><td>${formatMoney(t.cashCents + t.cardCents + t.tipInCents)}</td>
    <td>${formatMoney(t.tipOutCents)}</td><td>${formatMoney(t.netTipsCents)}</td><td>${formatMoney(t.serviceChargeCents)}</td>
    <td>${formatMoney(t.wagesCents)}</td></tr>`;
  const months = summary.months
    .map((m) => `<tr><td>${m.label}</td><td></td><td></td><td></td><td></td><td>${formatMoney(m.netTipsCents)}</td><td></td><td></td></tr>`)
    .join('');
  return page(
    `Tip summary – ${summary.year}`,
    `<h1>Tip summary – ${escapeHtml(summary.year)}</h1>
     <p class="muted">Voluntary tips you kept (net tips) are shown apart from service charges, which don’t count as tips
     for the federal “no tax on tips” deduction (2025–2028).</p>
     <table>
       <thead><tr><th>Job</th><th>Shifts</th><th>Hours</th><th>Tips received</th><th>Paid out</th><th>Net tips</th><th>Service charges</th><th>Wages</th></tr></thead>
       <tbody>${summary.jobs.map((j) => line(j.jobName, j)).join('')}</tbody>
       <tfoot>${line('All jobs', summary.totals)}</tfoot>
     </table>
     <h2>Net tips by month</h2>
     <table><thead><tr><th>Month</th><th></th><th></th><th></th><th></th><th>Net tips</th><th></th><th></th></tr></thead><tbody>${months}</tbody></table>`,
    preparedOn,
  );
}
