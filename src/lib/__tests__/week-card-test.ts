import { buildWeekCard } from '@/lib/week-card';

const shift = (date: string, cashTipsCents: number, minutesWorked = 360) => ({
  date,
  minutesWorked,
  hourlyWageCents: 213,
  cashTipsCents,
  cardTipsCents: 0,
  tipInCents: 0,
  tipOutCents: 0,
  serviceChargeCents: 0,
});

// Tue Oct 27, 2026; weeks start Sunday, so this week is Oct 25 – 31.
const today = '2026-10-27';

describe('buildWeekCard', () => {
  it('sums this week only and names the best day', () => {
    const card = buildWeekCard(
      [shift('2026-10-24', 99900), shift('2026-10-25', 15000), shift('2026-10-26', 30000)],
      today,
      0,
    );
    expect(card).toMatchObject({
      range: 'Oct 25 – 31',
      tips: '$450.00',
      earned: '$475.56', // + 12 hours × $2.13
      hours: '12h',
      hourly: '$39.63/hr',
      shifts: 2,
      bestDay: { day: 'Monday', amount: '$313' },
    });
    expect(card.bars.map((b) => b.label)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    expect(card.bars[1]).toEqual({ label: 'M', share: 1, best: true });
    expect(card.bars[0].share).toBeCloseTo(16278 / 31278);
    expect(card.text).toBe(
      'My week in tips (Oct 25 – 31): $450.00 in tips, $475.56 earned in 12h, $39.63/hr real hourly. Best day: Monday. Tracked with Tipbook.',
    );
  });

  it('handles an empty week and tips-only shifts', () => {
    expect(buildWeekCard([], today, 1)).toMatchObject({ tips: '$0.00', hourly: null, shifts: 0, bestDay: null });
    expect(buildWeekCard([], today, 1).bars.every((b) => b.share === 0 && !b.best)).toBe(true);
    const tipsOnly = buildWeekCard([shift('2026-10-27', 5000, 0)], today, 0);
    expect(tipsOnly.hourly).toBeNull();
    expect(tipsOnly.text).toBe('My week in tips (Oct 25 – 31): $50.00 in tips, $50.00 earned in 0h. Best day: Tuesday. Tracked with Tipbook.');
  });
});
