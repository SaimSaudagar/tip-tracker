import { parseCsv, toCsv } from '@/lib/csv';
import {
  EXPORT_HEADERS,
  buildImportDrafts,
  guessMapping,
  parseFlexibleDate,
  parseImportTime,
  shiftsToCsv,
  splitHeader,
  type ExportShift,
} from '@/lib/transfer';

describe('csv', () => {
  it('parses quotes, escaped quotes, commas and newlines inside fields', () => {
    const text = 'a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n\r\n1,,3';
    expect(parseCsv(text)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'say "hi"', 'line1\nline2'],
      ['1', '', '3'],
    ]);
  });

  it('strips an Excel byte-order mark and handles a missing final newline', () => {
    expect(parseCsv('﻿Date,Tips\n2026-10-25,40')).toEqual([
      ['Date', 'Tips'],
      ['2026-10-25', '40'],
    ]);
  });

  it('round-trips awkward values', () => {
    const rows = [['plain', 'with,comma', 'with "quote"', ' padded ', 'multi\nline', '']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

const exportShift = (overrides: Partial<ExportShift> = {}): ExportShift => ({
  date: '2026-10-25',
  jobName: 'Olive & Vine',
  positionName: 'Server',
  period: 'pm',
  startTime: '17:00',
  endTime: '23:30',
  breakMinutes: 0,
  minutesWorked: 390,
  hourlyWageCents: 213,
  cashTipsCents: 8000,
  cardTipsCents: 12050,
  tipInCents: 0,
  tipOutCents: 1500,
  serviceChargeCents: 2500,
  salesCents: 95000,
  covers: 18,
  notes: 'Patio, "big" party',
  ...overrides,
});

describe('export', () => {
  it('writes a header and computed totals', () => {
    const [header, row] = parseCsv(shiftsToCsv([exportShift()]));
    expect(header).toEqual([...EXPORT_HEADERS]);
    expect(row).toEqual([
      '2026-10-25',
      'Olive & Vine',
      'Server',
      'Dinner',
      '17:00',
      '23:30',
      '',
      '6.5',
      '2.13',
      '80',
      '120.50',
      '0',
      '15',
      '25',
      '950',
      '18',
      '185.50', // 80 + 120.50 - 15
      '13.85', // 6.5h × $2.13, rounded
      '224.35',
      'Patio, "big" party',
      '',
    ]);
  });

  it('lists who tips were paid out to', () => {
    const [, row] = parseCsv(
      shiftsToCsv([
        exportShift({
          tipOuts: [
            { name: 'Maria', amountCents: 1000 },
            { name: 'Bar', amountCents: 500 },
          ],
        }),
      ]),
    );
    expect(row[row.length - 1]).toBe('Maria $10.00, Bar $5.00');
  });

  it('round-trips through import', () => {
    const shifts = [
      exportShift(),
      exportShift({
        date: '2026-10-26',
        salesCents: null,
        covers: null,
        notes: null,
        minutesWorked: 0,
        period: null,
        startTime: null,
        endTime: null,
      }),
    ];
    const [header, ...rows] = parseCsv(shiftsToCsv(shifts));
    const { drafts, skipped } = buildImportDrafts(rows, guessMapping(header));
    expect(skipped).toEqual([]);
    expect(drafts).toEqual(
      shifts.map((s) => ({
        date: s.date,
        minutesWorked: s.minutesWorked,
        hourlyWageCents: s.hourlyWageCents,
        cashTipsCents: s.cashTipsCents,
        cardTipsCents: s.cardTipsCents,
        tipInCents: s.tipInCents,
        tipOutCents: s.tipOutCents,
        serviceChargeCents: s.serviceChargeCents,
        period: s.period,
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        salesCents: s.salesCents,
        covers: s.covers,
        jobName: s.jobName,
        positionName: s.positionName,
        notes: s.notes,
      })),
    );
  });
});

describe('import', () => {
  it('maps common headers from other tip apps', () => {
    const mapping = guessMapping(['Date', 'Hours Worked', 'Cash Tips', 'Credit Tips', 'Tip Out', 'Total Sales', 'Notes']);
    expect(mapping).toMatchObject({ date: 0, hours: 1, cash: 2, card: 3, tipOut: 4, sales: 5, notes: 6, tips: null });
  });

  it('uses a single tips column as cash when there is no cash/card split', () => {
    const mapping = guessMapping(['Day', 'Tips', 'Hours']);
    expect(mapping).toMatchObject({ date: 0, tips: 1, hours: 2, cash: null, card: null });
    const { drafts } = buildImportDrafts([['10/25/2026', '$142.75', '5:30']], mapping);
    expect(drafts[0]).toMatchObject({ date: '2026-10-25', cashTipsCents: 14275, cardTipsCents: 0, minutesWorked: 330 });
  });

  it('reads negative or bracketed tip-outs as positive amounts', () => {
    const mapping = guessMapping(['Date', 'Cash', 'Tip out']);
    const { drafts } = buildImportDrafts(
      [
        ['2026-10-01', '50', '-10'],
        ['2026-10-02', '50', '(7.50)'],
      ],
      mapping,
    );
    expect(drafts.map((d) => d.tipOutCents)).toEqual([1000, 750]);
  });

  it('skips unreadable rows and says why', () => {
    const mapping = guessMapping(['Date', 'Cash', 'Hours']);
    const { drafts, skipped } = buildImportDrafts(
      [
        ['2026-10-01', '40', '5'],
        ['not a date', '40', '5'],
        ['2026-10-03', 'forty', '5'],
        ['2026-10-04', '40', '30'],
      ],
      mapping,
    );
    expect(drafts).toHaveLength(1);
    expect(skipped).toEqual([
      { line: 3, reason: 'Unreadable date "not a date"' },
      { line: 4, reason: 'Unreadable cash tips "forty"' },
      { line: 5, reason: 'Unreadable hours "30"' },
    ]);
  });

  it.each([
    ['2026-10-25', '2026-10-25'],
    ['2026-10-25T18:30:00', '2026-10-25'],
    ['10/25/2026', '2026-10-25'],
    ['10/25/26', '2026-10-25'],
    ['1-5-2026', '2026-01-05'],
    ['Oct 25, 2026', '2026-10-25'],
    ['October 25 2026', '2026-10-25'],
    ['Sun, Oct 25, 2026', '2026-10-25'],
    ['25 Oct 2026', '2026-10-25'],
  ])('reads date %p', (input, iso) => {
    expect(parseFlexibleDate(input)).toBe(iso);
  });

  it.each(['13/25/2026', '2/30/2026', 'tomorrow', '', '2026-13-01'])('rejects date %p', (input) => {
    expect(parseFlexibleDate(input)).toBeNull();
  });

  it.each([
    ['10/25/2026 5:00 PM', '2026-10-25'],
    ['2026-10-25 17:00', '2026-10-25'],
    ['Oct 25, 2026, 5 pm', '2026-10-25'],
  ])('reads the date out of date-and-time %p', (input, iso) => {
    expect(parseFlexibleDate(input)).toBe(iso);
  });
});

describe('import from other apps and spreadsheets', () => {
  it.each([
    ['5:00 PM', '17:00'],
    ['5pm', '17:00'],
    ['11:30 a.m.', '11:30'],
    ['17:00', '17:00'],
    ['23:45:00', '23:45'],
    ['10/25/2026 5:15 PM', '17:15'],
    ['2026-10-25T17:00:00', '17:00'],
    ['2026-10-25T17:00:00Z', '17:00'],
  ])('reads time %p', (input, time) => {
    expect(parseImportTime(input)).toBe(time);
  });

  it.each(['', '17', '10/25/2020', '25:00', 'soon'])('rejects time %p', (input) => {
    expect(parseImportTime(input)).toBeNull();
  });

  it('maps other common header names', () => {
    expect(
      guessMapping(['Date', 'Location', 'Total Hours', 'Base Pay', 'CC Tips', 'Non-cash tips', 'Tips Out', 'Shift']),
    ).toMatchObject({ date: 0, job: 1, hours: 2, wagesEarned: 3, card: 4, tipOut: 6, period: 7, wage: null });
    expect(guessMapping(['Clock In', 'Clock Out', 'Cash'])).toMatchObject({ start: 0, end: 1, date: 0, cash: 2 });
  });

  it('works out hours from start and end times, across midnight and minus the break', () => {
    const mapping = guessMapping(['Date', 'Time in', 'Time out', 'Break', 'Cash tips']);
    const { drafts, skipped } = buildImportDrafts(
      [
        ['10/24/2026', '6:00 PM', '1:30 AM', '30', '210'],
        ['10/25/2026', '11:00', '15:00', '', '90'],
      ],
      mapping,
    );
    expect(skipped).toEqual([]);
    expect(drafts.map((d) => [d.startTime, d.endTime, d.breakMinutes, d.minutesWorked])).toEqual([
      ['18:00', '01:30', 30, 420],
      ['11:00', '15:00', 0, 240],
    ]);
  });

  it('takes the date from a date-and-time start column and the rate from wages paid', () => {
    const mapping = guessMapping(['Start', 'End', 'Wages', 'Tips']);
    const { drafts } = buildImportDrafts([['2026-10-25T17:00:00', '2026-10-25T23:00:00', '12.78', '$180.00']], mapping);
    expect(drafts[0]).toMatchObject({ date: '2026-10-25', minutesWorked: 360, hourlyWageCents: 213, cashTipsCents: 18000 });
  });

  it('reads a semicolon file with decimal commas, a title line and a totals row', () => {
    const text = [
      'My tips export',
      '',
      'Date;Hours;Cash tips;Card tips;Tip-out;Shift',
      '10/23/2026;6,5;80,00;1.120,50;15;Dinner',
      '10/24/2026;4;45,5;0;0;Lunch',
      'Total;10,5;125,50;1.120,50;15;',
    ].join('\n');
    const { headers, rows, firstLine } = splitHeader(parseCsv(text));
    expect(headers[0]).toBe('Date');
    const { drafts, skipped } = buildImportDrafts(rows, guessMapping(headers), firstLine);
    expect(skipped).toEqual([]);
    expect(drafts.map((d) => [d.minutesWorked, d.cashTipsCents, d.cardTipsCents, d.tipOutCents, d.period])).toEqual([
      [390, 8000, 112050, 1500, 'pm'],
      [240, 4550, 0, 0, 'am'],
    ]);
  });

  it('reads tab-separated files', () => {
    expect(parseCsv('Date\tCash\n10/25/2026\t40\n')).toEqual([
      ['Date', 'Cash'],
      ['10/25/2026', '40'],
    ]);
  });

  it('says which time could not be read', () => {
    const { skipped } = buildImportDrafts([['10/25/2026', 'noon-ish', '9pm']], guessMapping(['Date', 'Start', 'End']));
    expect(skipped).toEqual([{ line: 2, reason: 'Unreadable start time "noon-ish"' }]);
  });
});
