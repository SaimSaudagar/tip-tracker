import { formatDuration, minutesBetween, minutesToInput, parseDuration, spokenDuration } from '@/lib/duration';

describe('parseDuration', () => {
  it.each([
    ['', 0],
    ['6', 360],
    ['6.5', 390],
    ['6.25', 375],
    ['.5', 30],
    ['6:30', 390],
    ['0:45', 45],
    ['24', 1440],
  ])('parses %p as %p minutes', (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes);
  });

  it.each(['25', '24.5', '6:75', 'abc', '.', '6.555', '-2'])('rejects %p', (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe('minutesToInput', () => {
  it('round-trips every minute of a day', () => {
    for (let minutes = 0; minutes <= 1440; minutes++) {
      expect(parseDuration(minutesToInput(minutes))).toBe(minutes);
    }
  });

  it('writes short decimal hours', () => {
    expect(minutesToInput(0)).toBe('');
    expect(minutesToInput(360)).toBe('6');
    expect(minutesToInput(390)).toBe('6.5');
    expect(minutesToInput(380)).toBe('6.33');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0h'],
    [45, '45m'],
    [360, '6h'],
    [390, '6h 30m'],
    [1505, '25h 5m'],
  ])('formats %p minutes as %p', (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe('spokenDuration', () => {
  it.each([
    [0, '0 hours'],
    [1, '1 minute'],
    [45, '45 minutes'],
    [60, '1 hour'],
    [390, '6 hours 30 minutes'],
    [61, '1 hour 1 minute'],
  ])('reads %p minutes as %p', (minutes, text) => {
    expect(spokenDuration(minutes)).toBe(text);
  });
});

describe('minutesBetween', () => {
  it('handles a normal shift with a break', () => {
    expect(minutesBetween('16:00', '23:30', 30)).toBe(420);
  });

  it('handles a shift that runs past midnight', () => {
    expect(minutesBetween('18:00', '02:15')).toBe(495);
  });

  it('rejects bad times', () => {
    expect(minutesBetween('25:00', '02:00')).toBeNull();
    expect(minutesBetween('9am', '17:00')).toBeNull();
  });

  it('never goes negative', () => {
    expect(minutesBetween('10:00', '10:30', 60)).toBe(0);
  });
});
