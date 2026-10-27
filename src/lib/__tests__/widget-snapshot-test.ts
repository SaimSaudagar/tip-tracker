import { buildWidgetSnapshot } from '@/lib/widget-snapshot';

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

// Mon Oct 26, 2026; weeks start Sunday, so this week is Oct 25 – 31.
const today = '2026-10-26';

describe('buildWidgetSnapshot', () => {
  it('sums only this week', () => {
    const snapshot = buildWidgetSnapshot(
      [shift('2026-10-25', 20000), shift('2026-10-26', 15000), shift('2026-10-24', 99900)],
      today,
      0,
      100000,
    );
    expect(snapshot).toEqual({
      weekLabel: 'Oct 25 – 31',
      weekEnd: '2026-10-31',
      tips: '$350.00',
      earned: '$375.56', // + 12 hours × $2.13
      hours: '12h',
      hourly: '$31.30/hr',
      shifts: 2,
      goalPercent: 38,
    });
  });

  it('shows an empty week and no goal plainly', () => {
    expect(buildWidgetSnapshot([], today, 1, null)).toMatchObject({
      tips: '$0.00',
      hourly: '—',
      shifts: 0,
      goalPercent: -1,
      weekEnd: '2026-11-01',
    });
  });
});
