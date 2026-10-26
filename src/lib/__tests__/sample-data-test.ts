import { fromISODate } from '@/lib/dates';
import { buildSampleShifts } from '@/lib/sample-data';

const today = '2026-10-26';

describe('sample shifts', () => {
  const shifts = buildSampleShifts(today);

  it('covers the past 12 weeks, never today or Tuesdays', () => {
    expect(shifts.length).toBeGreaterThan(45);
    expect(shifts[0].date >= '2026-08-03' && shifts[0].date < '2026-08-10').toBe(true); // 84 days back
    expect(shifts.every((s) => s.date < today)).toBe(true);
    expect(shifts.some((s) => fromISODate(s.date).getDay() === 2)).toBe(false);
  });

  it('adds up like a real shift', () => {
    for (const s of shifts) {
      expect(s.cashTipsCents % 100).toBe(0);
      expect(s.cardTipsCents).toBeGreaterThan(0);
      expect(s.tipOutCents).toBe(s.tipOuts.reduce((sum, t) => sum + t.amountCents, 0));
      expect(Number.isInteger(s.covers) && s.covers > 0).toBe(true);
      expect(s.minutesWorked).toBeGreaterThan(240);
      expect(s.minutesWorked).toBeLessThanOrEqual(420);
    }
  });

  it('has both lunch and dinner shifts', () => {
    expect(new Set(shifts.map((s) => s.period))).toEqual(new Set(['am', 'pm']));
  });

  it('is the same every time for a seed', () => {
    expect(buildSampleShifts(today)).toEqual(shifts);
    expect(buildSampleShifts(today, { seed: 8 })).not.toEqual(shifts);
  });
});
