import { computeOvertime, estimateOvertimeRate, type JobOvertime, type OvertimeShift } from '@/lib/overtime';
import { computeShift } from '@/lib/shift-math';

let nextId = 1;
const shift = (date: string, hours: number, overrides: Partial<OvertimeShift> = {}): OvertimeShift => ({
  id: nextId++,
  jobId: 1,
  date,
  startTime: null,
  minutesWorked: hours * 60,
  hourlyWageCents: 1500,
  ...overrides,
});
const rules = (rule: JobOvertime['rule'], rateCents: number | null = null) => new Map([[1, { rule, rateCents }]]);

// Week of Sun Oct 18 – Sat Oct 24, 2026 (weeks start Sunday).
const week = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'];

describe('estimateOvertimeRate', () => {
  it('is time and a half at or above the federal minimum wage', () => {
    expect(estimateOvertimeRate(1500)).toBe(2250);
    expect(estimateOvertimeRate(725)).toBe(1088);
  });

  it('takes the tip credit off 1.5× minimum wage for tipped wages', () => {
    expect(estimateOvertimeRate(213)).toBe(576); // $10.88 − $5.12
    expect(estimateOvertimeRate(500)).toBe(863); // $10.88 − $2.25
  });
});

describe('weekly overtime', () => {
  it('starts after 40 hours, in the order the shifts were worked', () => {
    const shifts = week.map((d) => shift(d, 8)); // 48 hours
    const overtime = computeOvertime(shifts, rules('weekly'), 0);
    expect([...overtime.keys()]).toEqual([shifts[5].id]);
    // 8 hours at $22.50 − $15.00
    expect(overtime.get(shifts[5].id)).toEqual({ minutes: 480, premiumCents: 6000 });
  });

  it('splits the shift that crosses 40 hours', () => {
    const shifts = [shift(week[0], 38), shift(week[1], 5)];
    expect(computeOvertime(shifts, rules('weekly'), 0).get(shifts[1].id)).toEqual({ minutes: 180, premiumCents: 2250 });
  });

  it('orders shifts on the same day by start time', () => {
    const late = shift(week[1], 6, { startTime: '17:00' });
    const early = shift(week[1], 6, { startTime: '10:00' });
    const overtime = computeOvertime([shift(week[0], 30), late, early], rules('weekly'), 0);
    expect(overtime.get(early.id)).toBeUndefined();
    expect(overtime.get(late.id)?.minutes).toBe(120);
  });

  it('resets each week, following the chosen week start', () => {
    const sunday = shift('2026-10-25', 8);
    const shifts = [...week.map((d) => shift(d, 7)), sunday]; // 42 + 8
    expect(computeOvertime(shifts, rules('weekly'), 0).get(sunday.id)).toBeUndefined(); // new week from Sunday
    // Weeks from Monday: Oct 19–23 (35 hours) and Sunday Oct 25 share a week; Oct 18 belongs to the one before.
    expect(computeOvertime(shifts, rules('weekly'), 1).get(sunday.id)?.minutes).toBe(180);
  });

  it('counts each job separately and ignores jobs without a rule', () => {
    const other = week.map((d) => shift(d, 8, { jobId: 2 }));
    const overtime = computeOvertime([...week.map((d) => shift(d, 4)), ...other], rules('weekly'), 0);
    expect(overtime.size).toBe(0);
  });

  it('uses the paystub rate when there is one', () => {
    const shifts = [shift(week[0], 40), shift(week[1], 2, { hourlyWageCents: 213 })];
    expect(computeOvertime(shifts, rules('weekly', 650), 0).get(shifts[1].id)).toEqual({
      minutes: 120,
      premiumCents: 874, // 2 hours × ($6.50 − $2.13)
    });
  });

  it('estimates tipped overtime and skips shifts with no wage to base it on', () => {
    const tipped = [shift(week[0], 40, { hourlyWageCents: 213 }), shift(week[1], 1, { hourlyWageCents: 213 })];
    expect(computeOvertime(tipped, rules('weekly'), 0).get(tipped[1].id)?.premiumCents).toBe(363); // $5.76 − $2.13
    const unpaid = [shift(week[0], 40, { hourlyWageCents: 0 }), shift(week[1], 1, { hourlyWageCents: 0 })];
    expect(computeOvertime(unpaid, rules('weekly'), 0).get(unpaid[1].id)).toEqual({ minutes: 60, premiumCents: 0 });
  });
});

describe('daily overtime', () => {
  it('pays overtime after 8 hours in a day, even in a short week', () => {
    const long = shift(week[0], 10);
    expect(computeOvertime([long], rules('daily'), 0).get(long.id)?.minutes).toBe(120);
    expect(computeOvertime([long], rules('weekly'), 0).get(long.id)).toBeUndefined();
  });

  it('adds up doubles worked on the same day', () => {
    const lunch = shift(week[0], 5, { startTime: '10:00' });
    const dinner = shift(week[0], 5, { startTime: '17:00' });
    const overtime = computeOvertime([lunch, dinner], rules('daily'), 0);
    expect(overtime.get(lunch.id)).toBeUndefined();
    expect(overtime.get(dinner.id)?.minutes).toBe(120);
  });

  it('does not count daily overtime hours again toward the weekly 40', () => {
    // Five 10-hour days: 10 hours of daily overtime, 40 regular hours, no weekly overtime yet.
    const days = week.slice(0, 5).map((d) => shift(d, 10));
    const sixth = shift(week[5], 4);
    const overtime = computeOvertime([...days, sixth], rules('daily'), 0);
    expect(days.map((s) => overtime.get(s.id)?.minutes)).toEqual([120, 120, 120, 120, 120]);
    expect(overtime.get(sixth.id)?.minutes).toBe(240); // past 40 regular hours
  });
});

describe('wages with overtime', () => {
  it('adds the premium to a shift’s wages and real hourly', () => {
    const base = { minutesWorked: 600, hourlyWageCents: 1500, cashTipsCents: 0, cardTipsCents: 0, tipInCents: 0, tipOutCents: 0, serviceChargeCents: 0 };
    expect(computeShift(base).wagesCents).toBe(15000);
    expect(computeShift({ ...base, overtimePremiumCents: 1500 }).wagesCents).toBe(16500);
    expect(computeShift({ ...base, overtimePremiumCents: 1500 }).realHourlyCents).toBe(1650);
  });
});
