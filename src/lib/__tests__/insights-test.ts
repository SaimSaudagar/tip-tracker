import { celebrationFor } from '@/lib/celebration';
import { buildWeekBars, dashboardLoadRange, goalProgress, taxSeasonYear } from '@/lib/dashboard';
import { formatClock, minutesBetween, parseClockTime, periodForStart } from '@/lib/duration';
import { buildInsights, formatChange, insightsLoadRange, percentChange, type InsightShift } from '@/lib/insights';
import { comparePaycheck } from '@/lib/paychecks';

let nextId = 1;
const shift = (date: string, overrides: Partial<InsightShift> = {}): InsightShift => ({
  id: nextId++,
  date,
  period: null,
  salesCents: null,
  covers: null,
  positionName: 'Server',
  minutesWorked: 300,
  hourlyWageCents: 0,
  cashTipsCents: 10000,
  cardTipsCents: 0,
  tipInCents: 0,
  tipOutCents: 0,
  serviceChargeCents: 0,
  ...overrides,
});

// Mon Oct 26, 2026
const today = '2026-10-26';

describe('clock times', () => {
  it.each([
    ['5pm', '17:00'],
    ['5:30 pm', '17:30'],
    ['5:30PM', '17:30'],
    ['12am', '00:00'],
    ['12pm', '12:00'],
    ['9a', '09:00'],
    ['17:30', '17:30'],
    ['1730', '17:30'],
    ['0:15', '00:15'],
    ['11.30 p.m.', '23:30'],
  ])('reads %p as %p', (input, time) => {
    expect(parseClockTime(input)).toBe(time);
  });

  it.each(['', '25:00', '13pm', '5:75', 'later'])('rejects %p', (input) => {
    expect(parseClockTime(input)).toBeNull();
  });

  it('formats and classifies times', () => {
    expect(formatClock('17:30')).toBe('5:30 PM');
    expect(formatClock('00:00')).toBe('12 AM');
    expect(periodForStart('11:00')).toBe('am');
    expect(periodForStart('14:59')).toBe('am');
    expect(periodForStart('15:00')).toBe('pm');
    expect(minutesBetween(parseClockTime('4:30pm')!, parseClockTime('11pm')!, 30)).toBe(360);
  });
});

describe('insights', () => {
  const shifts = [
    // Fridays: $300 in 6h = $50/hr
    shift('2026-10-23', { minutesWorked: 360, cashTipsCents: 30000, period: 'pm', salesCents: 150000 }),
    shift('2026-10-16', { minutesWorked: 360, cashTipsCents: 30000, period: 'pm', salesCents: 150000 }),
    // Tuesdays: $100 in 5h = $20/hr
    shift('2026-10-20', { cashTipsCents: 10000, period: 'am' }),
    shift('2026-10-13', { cashTipsCents: 10000, period: 'am' }),
    // a single Sunday at $200 in 4h (not enough to rank a day)
    shift('2026-10-25', { minutesWorked: 240, cashTipsCents: 20000 }),
    // last month
    shift('2026-09-15', { cashTipsCents: 5000 }),
  ];
  const insights = buildInsights(shifts, today, 0);

  it('ranks weekdays by real hourly, needing at least two shifts', () => {
    expect(insights.bestWeekday).toEqual({ weekday: 5, name: 'Friday', realHourlyCents: 5000 });
    expect(insights.byWeekday.map((d) => d.label)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(insights.byWeekday[5].summary.shiftCount).toBe(2);
  });

  it('compares lunch and dinner', () => {
    expect(insights.byPeriod.pm.realHourlyCents).toBe(5000);
    expect(insights.byPeriod.am.realHourlyCents).toBe(2000);
    expect(insights.byPeriod.untagged).toBe(2);
  });

  it('lists the best shifts by real hourly', () => {
    expect(insights.bestShifts.map((s) => s.realHourlyCents)).toEqual([5000, 5000, 5000]);
    expect(insights.bestShifts[2].date).toBe('2026-10-25'); // $200 / 4h = $50/hr, fewer tips than the Fridays
  });

  it('builds a 12-week trend ending this week', () => {
    expect(insights.weeklyTrend).toHaveLength(12);
    expect(insights.weeklyTrend[11].range).toEqual({ start: '2026-10-25', end: '2026-10-31' });
    expect(insights.weeklyTrend[10].summary.netTipsCents).toBe(40000); // Oct 18–24
  });

  it('works out tips as a share of sales', () => {
    expect(insights.tipRateOfSales).toEqual({ bps: 2000, shifts: 2 }); // $600 / $3,000
  });

  it('works out tips per guest only from shifts with covers', () => {
    expect(insights.tipsPerCover).toBeNull();
    const withCovers = buildInsights(
      [
        shift('2026-10-23', { cashTipsCents: 20000, cardTipsCents: 10000, covers: 40 }),
        shift('2026-10-22', { cashTipsCents: 9000, covers: 20 }),
        shift('2026-10-21', { cashTipsCents: 50000 }),
      ],
      today,
      1,
    );
    expect(withCovers.tipsPerCover).toEqual({ cents: 650, shifts: 2 }); // $390 / 60 guests
  });

  it('compares month-to-date with the same days last month', () => {
    expect(insights.monthToDate.dayOfMonth).toBe(26);
    expect(insights.monthToDate.thisMonth.shiftCount).toBe(5);
    expect(insights.monthToDate.lastMonth.shiftCount).toBe(1);
    expect(percentChange(10000, 12500)).toBe(2500);
    expect(percentChange(0, 500)).toBeNull();
  });

  it('loads enough history', () => {
    expect(insightsLoadRange(today, 0)).toEqual({ start: '2026-08-09', end: today });
  });
});

describe('home week chart and goal', () => {
  it('pairs each day with the same day last week', () => {
    const bars = buildWeekBars(
      [shift('2026-10-26', { cashTipsCents: 12000 }), shift('2026-10-19', { cashTipsCents: 8000 })],
      today,
      1,
    );
    expect(bars.map((b) => b.label).join('')).toBe('MTWTFSS');
    expect(bars[0]).toEqual({ date: '2026-10-26', label: 'M', totalCents: 12000, lastWeekTotalCents: 8000 });
    expect(dashboardLoadRange(today, 1).start).toBe('2026-01-01');
    expect(dashboardLoadRange('2026-01-02', 1).start).toBe('2025-12-22');
  });

  it('caps goal progress between 0 and 1', () => {
    expect(goalProgress(50000, 100000)).toBe(0.5);
    expect(goalProgress(150000, 100000)).toBe(1);
    expect(goalProgress(50000, null)).toBeNull();
  });
});

describe('tax-season card', () => {
  it.each([
    ['2027-01-02', null, '2026'],
    ['2027-04-30', null, '2026'],
    ['2027-05-01', null, null],
    ['2026-10-26', null, null],
    ['2027-02-14', '2026', null],
    ['2027-02-14', '2025', '2026'],
  ])('on %p with %p dismissed offers %p', (day, dismissed, year) => {
    expect(taxSeasonYear(day, dismissed)).toBe(year);
  });
});

describe('save celebration', () => {
  const base = { weekTotalBefore: 0, weekTotalAfter: 0, goalCents: null };

  it('celebrates reaching the weekly goal first', () => {
    const saved = shift('2026-10-26');
    expect(
      celebrationFor({ ...base, saved, monthShifts: [saved], weekTotalBefore: 90000, weekTotalAfter: 110000, goalCents: 100000 }),
    ).toMatchObject({ title: 'Weekly goal reached', celebrate: true });
  });

  it('celebrates the best weekday of the month', () => {
    const earlier = shift('2026-10-19', { cashTipsCents: 9000 });
    const saved = shift('2026-10-26', { cashTipsCents: 15000 });
    expect(celebrationFor({ ...base, saved, monthShifts: [earlier, saved] })).toMatchObject({
      title: 'Best Monday this month',
      celebrate: true,
    });
  });

  it('celebrates the best real hourly of the month', () => {
    const a = shift('2026-10-20', { cashTipsCents: 10000 });
    const b = shift('2026-10-21', { cashTipsCents: 11000 });
    const saved = shift('2026-10-24', { cashTipsCents: 20000, minutesWorked: 300 });
    expect(celebrationFor({ ...base, saved, monthShifts: [a, b, saved] })).toMatchObject({
      title: 'Best hourly this month',
    });
  });

  it('otherwise just confirms the save', () => {
    const better = shift('2026-10-19', { cashTipsCents: 50000 });
    const saved = shift('2026-10-26', { cashTipsCents: 10000 });
    expect(celebrationFor({ ...base, saved, monthShifts: [better, saved] })).toEqual({
      title: 'Shift saved',
      detail: '$100.00 in tips · $20.00/hr',
      celebrate: false,
    });
  });
});

describe('paycheck comparison', () => {
  const shifts = [
    shift('2026-10-13', { hourlyWageCents: 213, minutesWorked: 360, cardTipsCents: 15000, serviceChargeCents: 2000 }),
    shift('2026-10-14', { hourlyWageCents: 213, minutesWorked: 300, cardTipsCents: 9000 }),
  ];

  it('adds up what payroll should include', () => {
    const c = comparePaycheck(38000, shifts);
    expect(c).toMatchObject({
      shiftCount: 2,
      minutesWorked: 660,
      wagesCents: 1278 + 1065, // 6h and 5h at $2.13
      cardTipsCents: 24000,
      serviceChargeCents: 2000,
    });
    expect(c.expectedCents).toBe(28343);
    expect(c.differenceCents).toBe(38000 - 28343);
  });

  it('has no difference without a gross amount', () => {
    expect(comparePaycheck(null, shifts).differenceCents).toBeNull();
  });
});

describe('formatChange', () => {
  it('rounds to a whole percent with an arrow', () => {
    expect(formatChange(1249)).toBe('▲ 12%');
    expect(formatChange(0)).toBe('▲ 0%');
    expect(formatChange(-5913)).toBe('▼ 59%');
  });
});
