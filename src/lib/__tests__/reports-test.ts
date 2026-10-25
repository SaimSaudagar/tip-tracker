import { freeLimitViolation, shouldAskForReview } from '@/lib/pro';
import { buildMonthlyReport, buildYearSummary, monthlyReportHtml, yearSummaryHtml, type ReportShift } from '@/lib/reports';

const shift = (overrides: Partial<ReportShift>): ReportShift => ({
  date: '2026-10-05',
  jobName: 'Olive & Vine',
  positionName: 'Server',
  minutesWorked: 300,
  hourlyWageCents: 213,
  cashTipsCents: 0,
  cardTipsCents: 0,
  tipInCents: 0,
  tipOutCents: 0,
  serviceChargeCents: 0,
  ...overrides,
});

const shifts: ReportShift[] = [
  shift({ date: '2026-10-05', cashTipsCents: 5000, cardTipsCents: 7000, tipOutCents: 360 }),
  shift({ date: '2026-10-02', cardTipsCents: 9000, tipInCents: 1000, serviceChargeCents: 4000 }),
  shift({ date: '2026-10-09', jobName: 'Lakeside Club', positionName: 'Bartender', cashTipsCents: 1500 }),
  shift({ date: '2026-09-30', cashTipsCents: 9999 }), // previous month
  shift({ date: '2025-12-31', cashTipsCents: 7777 }), // previous year
];

describe('monthly employer report', () => {
  const report = buildMonthlyReport(shifts, '2026-10-26');

  it('groups the month by job, in date order', () => {
    expect(report.label).toBe('October 2026');
    expect(report.dueDate).toBe('2026-11-10');
    expect(report.jobs.map((j) => j.jobName)).toEqual(['Olive & Vine', 'Lakeside Club']);
    expect(report.jobs[0].rows.map((r) => r.date)).toEqual(['2026-10-02', '2026-10-05']);
  });

  it('totals tips and keeps service charges apart', () => {
    const t = report.jobs[0].totals;
    expect(t).toMatchObject({
      cashCents: 5000,
      cardCents: 16000,
      tipInCents: 1000,
      tipOutCents: 360,
      netTipsCents: 21640,
      serviceChargeCents: 4000,
      shiftCount: 2,
    });
  });

  it('flags which jobs pass the $20 reporting threshold', () => {
    expect(report.jobs[0].mustReport).toBe(true);
    expect(report.jobs[1].mustReport).toBe(false); // $15
  });

  it('includes who tips were paid out to', () => {
    const html = monthlyReportHtml(
      buildMonthlyReport(
        [shift({ cashTipsCents: 10000, tipOutCents: 1500, tipOuts: [{ name: 'Maria <busser>', amountCents: 1500 }] })],
        '2026-10-01',
      ),
      '2026-10-26',
    );
    expect(html).toContain('Paid out to');
    expect(html).toContain('Maria &lt;busser&gt; $15.00');
  });

  it('renders printable HTML with escaped names', () => {
    const html = monthlyReportHtml(buildMonthlyReport([shift({ jobName: 'Bob <b>&</b> Co', cashTipsCents: 2500 })], '2026-10-01'), '2026-10-26');
    expect(html).toContain('Bob &lt;b&gt;&amp;&lt;/b&gt; Co');
    expect(html).toContain('report to this employer by 2026-11-10');
    expect(html).not.toContain('<b>&</b>');
  });
});

describe('year summary', () => {
  const summary = buildYearSummary(shifts, '2026-10-26');

  it('covers only the calendar year', () => {
    expect(summary.year).toBe('2026');
    expect(summary.totals.shiftCount).toBe(4);
    expect(summary.totals.netTipsCents).toBe(21640 + 1500 + 9999);
    expect(summary.totals.serviceChargeCents).toBe(4000);
  });

  it('breaks totals down by job and month', () => {
    expect(summary.jobs.find((j) => j.jobName === 'Lakeside Club')?.netTipsCents).toBe(1500);
    expect(summary.months[8].netTipsCents).toBe(9999); // September
    expect(summary.months[9].netTipsCents).toBe(23140); // October
    expect(summary.months[0].netTipsCents).toBe(0);
  });

  it('renders HTML', () => {
    const html = yearSummaryHtml(summary, '2026-10-26');
    expect(html).toContain('Tip summary – 2026');
    expect(html).toContain('$331.39'); // all net tips
    expect(html).toContain('no tax on tips');
  });
});

describe('free plan limits', () => {
  const one = [{ id: 1, jobName: 'Olive & Vine' }];

  it('allows a second position at the same job', () => {
    expect(freeLimitViolation(one, { jobName: 'olive & vine ' })).toBeNull();
  });

  it('blocks a second job', () => {
    expect(freeLimitViolation(one, { jobName: 'Lakeside Club' })).toBe('jobs');
  });

  it('allows renaming the only job', () => {
    expect(freeLimitViolation(one, { id: 1, jobName: 'Olive and Vine' })).toBeNull();
  });

  it('blocks a third position', () => {
    const two = [...one, { id: 2, jobName: 'Olive & Vine' }];
    expect(freeLimitViolation(two, { jobName: 'Olive & Vine' })).toBe('positions');
    expect(freeLimitViolation(two, { id: 2, jobName: 'Olive & Vine' })).toBeNull();
  });
});

describe('review prompt timing', () => {
  const base = { shiftCount: 6, thisWeekTipsCents: 30000, lastWeekTipsCents: 25000, lastAskedOn: null, today: '2026-10-26' };

  it('asks after a few shifts in a good week', () => {
    expect(shouldAskForReview(base)).toBe(true);
  });

  it('waits for enough shifts and a good week', () => {
    expect(shouldAskForReview({ ...base, shiftCount: 4 })).toBe(false);
    expect(shouldAskForReview({ ...base, thisWeekTipsCents: 20000 })).toBe(false);
    expect(shouldAskForReview({ ...base, thisWeekTipsCents: 0, lastWeekTipsCents: 0 })).toBe(false);
  });

  it('asks at most every 120 days', () => {
    expect(shouldAskForReview({ ...base, lastAskedOn: '2026-08-01' })).toBe(false);
    expect(shouldAskForReview({ ...base, lastAskedOn: '2026-06-28' })).toBe(true);
  });
});
