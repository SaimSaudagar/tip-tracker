import { buildMonthGrid, formatCellAmount, shiftMonth, summarizeByDay, weekdayInitials } from '@/lib/calendar';

describe('buildMonthGrid', () => {
  it('pads October 2026 to full Sunday-start weeks', () => {
    const grid = buildMonthGrid('2026-10-26', 0);
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toEqual({ date: '2026-09-27', inMonth: false });
    expect(grid[0][4]).toEqual({ date: '2026-10-01', inMonth: true });
    expect(grid[4][6]).toEqual({ date: '2026-10-31', inMonth: true });
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });

  it('respects Monday-start weeks', () => {
    const grid = buildMonthGrid('2026-10-01', 1);
    expect(grid[0][0].date).toBe('2026-09-28');
    expect(grid[grid.length - 1][6].date).toBe('2026-11-01');
  });

  it('handles a 6-week month', () => {
    // Aug 2026 starts on a Saturday and has 31 days.
    expect(buildMonthGrid('2026-08-15', 0)).toHaveLength(6);
  });

  it('orders weekday headers from the week start', () => {
    expect(weekdayInitials(0).join('')).toBe('SMTWTFS');
    expect(weekdayInitials(1).join('')).toBe('MTWTFSS');
  });
});

describe('calendar helpers', () => {
  it('moves between months across year boundaries', () => {
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-03-31', 0)).toBe('2026-03-01');
  });

  it('sums shifts per day', () => {
    const base = { minutesWorked: 0, hourlyWageCents: 0, cardTipsCents: 0, tipInCents: 0, tipOutCents: 0, serviceChargeCents: 0 };
    const byDay = summarizeByDay([
      { ...base, date: '2026-10-25', cashTipsCents: 5000 },
      { ...base, date: '2026-10-25', cashTipsCents: 2500 },
      { ...base, date: '2026-10-26', cashTipsCents: 1000 },
    ]);
    expect(byDay.get('2026-10-25')?.netTipsCents).toBe(7500);
    expect(byDay.get('2026-10-25')?.shiftCount).toBe(2);
    expect(byDay.get('2026-10-26')?.netTipsCents).toBe(1000);
    expect(byDay.has('2026-10-27')).toBe(false);
  });

  it('formats compact cell amounts', () => {
    expect(formatCellAmount(8549)).toBe('$85');
    expect(formatCellAmount(123456)).toBe('$1.2k');
    expect(formatCellAmount(200000)).toBe('$2k');
    expect(formatCellAmount(-500)).toBe('$-5');
  });
});
