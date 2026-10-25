import { parseCsv, toCsv } from '@/lib/csv';
import {
  EXPORT_HEADERS,
  buildImportDrafts,
  guessMapping,
  parseFlexibleDate,
  shiftsToCsv,
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
  minutesWorked: 390,
  hourlyWageCents: 213,
  cashTipsCents: 8000,
  cardTipsCents: 12050,
  tipInCents: 0,
  tipOutCents: 1500,
  serviceChargeCents: 2500,
  salesCents: 95000,
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
      '6.5',
      '2.13',
      '80',
      '120.50',
      '0',
      '15',
      '25',
      '950',
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
    const shifts = [exportShift(), exportShift({ date: '2026-10-26', salesCents: null, notes: null, minutesWorked: 0 })];
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
        salesCents: s.salesCents,
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
});
