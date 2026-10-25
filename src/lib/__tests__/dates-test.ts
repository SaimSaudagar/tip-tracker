import {
  addDays,
  formatDayLabel,
  formatMonthYear,
  formatRange,
  isInRange,
  monthRange,
  toISODate,
  weekRange,
  yearRange,
} from '@/lib/dates';

describe('day arithmetic', () => {
  it('formats local dates without going through UTC', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  it.each([
    ['2026-03-07', 1, '2026-03-08'], // US daylight saving starts Mar 8, 2026
    ['2026-03-08', 1, '2026-03-09'],
    ['2026-11-01', -1, '2026-10-31'], // and ends Nov 1, 2026
    ['2026-12-31', 1, '2027-01-01'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-01-01', -1, '2025-12-31'],
  ])('%s + %i day(s) = %s', (iso, days, expected) => {
    expect(addDays(iso, days)).toBe(expected);
  });
});

describe('ranges', () => {
  // Oct 25, 2026 is a Sunday.
  it('starts weeks on Sunday', () => {
    expect(weekRange('2026-10-25', 0)).toEqual({ start: '2026-10-25', end: '2026-10-31' });
    expect(weekRange('2026-10-31', 0)).toEqual({ start: '2026-10-25', end: '2026-10-31' });
  });

  it('starts weeks on Monday', () => {
    expect(weekRange('2026-10-25', 1)).toEqual({ start: '2026-10-19', end: '2026-10-25' });
    expect(weekRange('2026-10-26', 1)).toEqual({ start: '2026-10-26', end: '2026-11-01' });
  });

  it('builds months, including February in a leap year', () => {
    expect(monthRange('2026-02-14')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthRange('2028-02-03')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
    expect(monthRange('2026-12-31')).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });

  it('builds years and checks membership', () => {
    const year = yearRange('2026-06-15');
    expect(year).toEqual({ start: '2026-01-01', end: '2026-12-31' });
    expect(isInRange('2026-01-01', year)).toBe(true);
    expect(isInRange('2025-12-31', year)).toBe(false);
  });
});

describe('labels', () => {
  const today = '2026-10-26';

  it.each([
    ['2026-10-26', 'Today'],
    ['2026-10-25', 'Yesterday'],
    ['2026-10-20', 'Tue, Oct 20'],
    ['2025-12-31', 'Wed, Dec 31, 2025'],
  ])('labels %s as %p', (iso, label) => {
    expect(formatDayLabel(iso, today)).toBe(label);
  });

  it('labels ranges and months', () => {
    expect(formatRange({ start: '2026-10-26', end: '2026-11-01' }, today)).toBe('Oct 26 – Nov 1');
    expect(formatRange({ start: '2026-10-01', end: '2026-10-31' }, today)).toBe('Oct 1 – 31');
    expect(formatRange({ start: '2025-12-28', end: '2026-01-03' }, '2027-02-01')).toBe('Dec 28 – Jan 3, 2026');
    expect(formatMonthYear('2026-10-26')).toBe('Oct 2026');
  });
});
