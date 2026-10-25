import {
  bpsToInput,
  centsToInput,
  formatMoney,
  formatPercent,
  parseMoney,
  parsePercent,
  percentOf,
} from '@/lib/money';

describe('parseMoney', () => {
  it.each([
    ['', 0],
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['.5', 50],
    ['5.', 500],
    ['0.99', 99],
    ['$1,234.56', 123456],
    [' 7 ', 700],
    ['9999999.99', 999999999],
  ])('parses %p as %p cents', (input, cents) => {
    expect(parseMoney(input)).toBe(cents);
  });

  it.each(['12.345', 'abc', '-5', '.', '1.2.3', '10000000', '5e3'])('rejects %p', (input) => {
    expect(parseMoney(input)).toBeNull();
  });
});

describe('formatMoney', () => {
  it.each([
    [0, '$0.00'],
    [99, '$0.99'],
    [1250, '$12.50'],
    [123456, '$1,234.56'],
    [-250, '-$2.50'],
    [1_000_000_000, '$10,000,000.00'],
  ])('formats %p as %p', (cents, text) => {
    expect(formatMoney(cents)).toBe(text);
  });

  it('rounds to whole dollars when asked', () => {
    expect(formatMoney(123456, { wholeDollars: true })).toBe('$1,235');
    expect(formatMoney(-149, { wholeDollars: true })).toBe('-$1');
  });
});

describe('centsToInput', () => {
  it('produces text that parses back to the same cents', () => {
    for (const cents of [0, 1, 9, 10, 99, 100, 1250, 1205, 123456, 999999999]) {
      expect(parseMoney(centsToInput(cents))).toBe(cents);
    }
  });

  it('leaves zero empty and drops ".00"', () => {
    expect(centsToInput(0)).toBe('');
    expect(centsToInput(1200)).toBe('12');
    expect(centsToInput(1250)).toBe('12.50');
  });
});

describe('percentages', () => {
  it.each([
    ['', 0],
    ['3', 300],
    ['2.5', 250],
    ['2.55%', 255],
    ['100', 10000],
  ])('parses %p as %p basis points', (input, bps) => {
    expect(parsePercent(input)).toBe(bps);
  });

  it.each(['101', '2.555', 'x', '.'])('rejects %p', (input) => {
    expect(parsePercent(input)).toBeNull();
  });

  it('round-trips basis points through input text', () => {
    for (const bps of [0, 5, 50, 205, 250, 255, 300, 10000]) {
      expect(parsePercent(bpsToInput(bps))).toBe(bps);
    }
    expect(formatPercent(250)).toBe('2.5%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('takes a percentage of cents, rounded to the nearest cent', () => {
    expect(percentOf(20000, 300)).toBe(600);
    expect(percentOf(3333, 250)).toBe(83); // 83.325
    expect(percentOf(3335, 300)).toBe(100); // 100.05
    expect(percentOf(150, 5000)).toBe(75);
    expect(percentOf(0, 300)).toBe(0);
  });
});
