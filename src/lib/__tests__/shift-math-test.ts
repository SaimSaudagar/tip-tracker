import { buildDashboardPeriods, dashboardLoadRange } from '@/lib/dashboard';
import { calcTipOut, computeShift, summarize, type ShiftAmounts } from '@/lib/shift-math';

const shift = (overrides: Partial<ShiftAmounts> = {}): ShiftAmounts => ({
  minutesWorked: 0,
  hourlyWageCents: 0,
  cashTipsCents: 0,
  cardTipsCents: 0,
  tipInCents: 0,
  tipOutCents: 0,
  serviceChargeCents: 0,
  ...overrides,
});

describe('computeShift', () => {
  it('adds wages and tips, then subtracts tip-out', () => {
    const totals = computeShift(
      shift({
        minutesWorked: 390, // 6.5 hours
        hourlyWageCents: 213, // $2.13 federal tipped minimum
        cashTipsCents: 8000,
        cardTipsCents: 12000,
        tipOutCents: 1500,
      }),
    );
    expect(totals.wagesCents).toBe(1385); // 6.5 × $2.13 = $13.845, rounded
    expect(totals.netTipsCents).toBe(18500);
    expect(totals.totalCents).toBe(19885);
    expect(totals.realHourlyCents).toBe(3059); // $198.85 / 6.5h = $30.59
  });

  it('counts tips from coworkers and service charges toward the total', () => {
    const totals = computeShift(
      shift({ minutesWorked: 300, cashTipsCents: 5000, tipInCents: 2000, serviceChargeCents: 3000 }),
    );
    expect(totals.netTipsCents).toBe(7000);
    expect(totals.totalCents).toBe(10000);
    expect(totals.realHourlyCents).toBe(2000);
  });

  it('has no hourly rate when no hours were logged', () => {
    expect(computeShift(shift({ cashTipsCents: 4000 })).realHourlyCents).toBeNull();
  });

  it('allows a tip-out bigger than the tips', () => {
    expect(computeShift(shift({ cashTipsCents: 1000, tipOutCents: 1500 })).netTipsCents).toBe(-500);
  });
});

describe('calcTipOut', () => {
  const amounts = { cashTipsCents: 8000, cardTipsCents: 12000, salesCents: 150000 };

  it('applies each rule', () => {
    expect(calcTipOut('none', 999, amounts)).toBe(0);
    expect(calcTipOut('fixed', 1500, amounts)).toBe(1500);
    expect(calcTipOut('pct_tips', 300, amounts)).toBe(600); // 3% of $200
    expect(calcTipOut('pct_sales', 200, amounts)).toBe(3000); // 2% of $1,500
  });

  it('treats missing sales as zero', () => {
    expect(calcTipOut('pct_sales', 200, { ...amounts, salesCents: null })).toBe(0);
  });
});

describe('summarize', () => {
  it('returns zeros for no shifts', () => {
    expect(summarize([])).toEqual({
      shiftCount: 0,
      minutesWorked: 0,
      wagesCents: 0,
      netTipsCents: 0,
      serviceChargeCents: 0,
      totalCents: 0,
      realHourlyCents: null,
    });
  });

  it('keeps tips-only entries out of the hourly rate', () => {
    const summary = summarize([
      shift({ minutesWorked: 300, hourlyWageCents: 1000, cashTipsCents: 5000 }), // $100 over 5h
      shift({ minutesWorked: 300, cardTipsCents: 10000 }), // $100 over 5h
      shift({ cashTipsCents: 6000 }), // tips with no hours
    ]);
    expect(summary.shiftCount).toBe(3);
    expect(summary.minutesWorked).toBe(600);
    expect(summary.netTipsCents).toBe(21000);
    expect(summary.totalCents).toBe(26000);
    expect(summary.realHourlyCents).toBe(2000); // $200 / 10h, not $260 / 10h
  });

  it('sums rounded per-shift wages so totals match the rows on screen', () => {
    const summary = summarize([
      shift({ minutesWorked: 1, hourlyWageCents: 50 }), // 0.83¢ -> 1¢
      shift({ minutesWorked: 1, hourlyWageCents: 50 }),
    ]);
    expect(summary.wagesCents).toBe(2);
  });
});

describe('dashboard periods', () => {
  const dated = (date: string, cashTipsCents: number) => ({ ...shift({ cashTipsCents }), date });

  it('loads last week too, even when it started last year', () => {
    // Fri Jan 1, 2027; with Sunday weeks this week began Sun Dec 27, 2026 and last week on Dec 20.
    expect(dashboardLoadRange('2027-01-01', 0)).toEqual({ start: '2026-12-20', end: '2027-12-31' });
  });

  it('splits shifts into week, month and year', () => {
    const shifts = [
      dated('2026-12-28', 1000), // this week, last month, last year
      dated('2027-01-01', 2000), // this week, month and year
      dated('2026-11-15', 4000), // outside everything
    ];
    const periods = buildDashboardPeriods(shifts, '2027-01-01', 0);
    expect(periods.week.range).toEqual({ start: '2026-12-27', end: '2027-01-02' });
    expect(periods.week.summary.netTipsCents).toBe(3000);
    expect(periods.month.summary.netTipsCents).toBe(2000);
    expect(periods.year.summary.netTipsCents).toBe(2000);
  });
});
