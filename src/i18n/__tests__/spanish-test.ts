import { applyLanguagePreference, byLanguage, getLanguage, parseLanguagePreference, t } from '@/i18n';
import { formatDayLabel, formatMonthLong, formatMonthYear, formatRange, weekdayName, weekdayPlural } from '@/lib/dates';
import { formatClock, spokenDuration } from '@/lib/duration';
import { formatHourly } from '@/lib/money';
import { buildPlan } from '@/lib/plans';
import { formatTime, weeklyRecap } from '@/lib/reminders-plan';
import { buildMonthlyReport, monthlyReportHtml } from '@/lib/reports';
import { summarize } from '@/lib/shift-math';
import { describeTipPool, splitTipPool } from '@/lib/tip-pool';
import { buildImportDrafts, guessMapping, shiftsToCsv } from '@/lib/transfer';
import { buildWeekCard } from '@/lib/week-card';

const today = '2026-10-27'; // a Tuesday; weeks start Sunday, so this week is Oct 25 – 31

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

beforeEach(() => applyLanguagePreference('es'));
afterEach(() => applyLanguagePreference('en'));

describe('switching language', () => {
  it('reads the saved choice, defaulting to the phone’s language', () => {
    expect(parseLanguagePreference('es')).toBe('es');
    expect(parseLanguagePreference('en')).toBe('en');
    expect(parseLanguagePreference(undefined)).toBe('system');
    expect(parseLanguagePreference('fr')).toBe('system');
  });

  it('translates, fills placeholders, and falls back to the English', () => {
    expect(getLanguage()).toBe('es');
    expect(t('Save shift')).toBe('Guardar turno');
    expect(t('Imported {count} shifts', { count: 12 })).toBe('Se importaron 12 turnos');
    expect(t('Text nobody translated')).toBe('Text nobody translated');
    expect(byLanguage({ en: 'a', es: 'b' })).toBe('b');
    applyLanguagePreference('en');
    expect(t('Save shift')).toBe('Save shift');
    expect(t('Imported {count} shifts', { count: 12 })).toBe('Imported 12 shifts');
  });

  it('follows the phone when set to automatic (English in tests)', () => {
    applyLanguagePreference('system');
    expect(getLanguage()).toBe('en');
  });
});

describe('Spanish formats', () => {
  it('writes dates day first, in lowercase', () => {
    expect(formatDayLabel(today, today)).toBe('Hoy');
    expect(formatDayLabel('2026-10-26', today)).toBe('Ayer');
    expect(formatDayLabel('2026-10-20', today)).toBe('mar 20 oct');
    expect(formatDayLabel('2025-12-31', today)).toBe('mié 31 dic 2025');
    expect(formatRange({ start: '2026-10-25', end: '2026-10-31' }, today)).toBe('25 – 31 oct');
    expect(formatRange({ start: '2026-10-26', end: '2026-11-01' }, today)).toBe('26 oct – 1 nov');
    expect(formatRange({ start: '2026-12-27', end: '2027-01-02' }, today)).toBe('27 dic – 2 ene 2027');
    expect(formatMonthLong('2026-10-01')).toBe('octubre de 2026');
    expect(formatMonthYear('2026-10-01')).toBe('oct 2026');
    expect(weekdayName(5)).toBe('viernes');
    expect(weekdayPlural(5)).toBe('Los viernes');
  });

  it('writes times, durations and rates', () => {
    expect(formatTime('21:00')).toBe('9 p. m.');
    expect(formatTime('01:30')).toBe('1:30 a. m.');
    expect(formatClock('16:30')).toBe('4:30 p. m.');
    expect(spokenDuration(390)).toBe('6 horas 30 minutos');
    expect(spokenDuration(61)).toBe('1 hora 1 minuto');
    expect(formatHourly(3546)).toBe('$35.46/h');
  });
});

describe('Spanish text built in code', () => {
  it('describes the plans', () => {
    expect(buildPlan('annual')).toEqual({
      id: 'annual',
      title: 'Anual',
      price: '$24.99/año',
      detail: '14 días gratis, luego $2.08/mes',
      terms:
        'No pagas nada ahora. Te avisaremos 2 días antes de que termine tu prueba. Luego $24.99 al año, con renovación hasta que la canceles en Ajustes.',
      cta: 'Empezar mis 14 días gratis',
      badge: 'Mejor precio',
    });
  });

  it('writes the weekly recap', () => {
    const recap = weeklyRecap({ range: { start: '2026-10-25', end: '2026-10-31' }, summary: summarize([shift(today, 20000)]) });
    expect(recap).toMatchObject({
      title: 'Tu semana: $200.00 en propinas',
      body: '$212.78 ganados en 6h · $35.46/h de pago real, en 1 turno.',
    });
  });

  it('writes the week card', () => {
    const card = buildWeekCard(
      [shift('2026-10-24', 99900), shift('2026-10-25', 15000), shift('2026-10-26', 30000)],
      today,
      0,
    );
    expect(card).toMatchObject({ range: '25 – 31 oct', hourly: '$39.63/h', bestDay: { day: 'lunes', amount: '$313' } });
    expect(card.bars.map((b) => b.label)).toEqual(['D', 'L', 'M', 'X', 'J', 'V', 'S']);
    expect(card.text).toBe(
      'Mi semana en propinas (25 – 31 oct): $450.00 en propinas, $475.56 ganados en 12h, $39.63/h de pago real. Mejor día: lunes. Registrado con Tipbook.',
    );
  });

  it('explains import rows it can’t read', () => {
    const mapping = guessMapping(['Date', 'Cash tips']);
    const { skipped } = buildImportDrafts([['not a date', '5'], ['10/20/2026', 'forty']], mapping);
    expect(skipped).toEqual([
      { line: 2, reason: 'No se pudo leer fecha: "not a date"' },
      { line: 3, reason: 'No se pudo leer propinas en efectivo: "forty"' },
    ]);
  });

  it('describes a tip pool', () => {
    const shares = splitTipPool(30000, [{ name: 'Ana', minutes: 300 }, { name: 'Luis', minutes: 300 }], 'equal')!;
    expect(describeTipPool(30000, shares, 'equal').split('\n')[0]).toBe('Fondo de propinas de $300.00, dividido en partes iguales:');
  });
});

describe('what stays in English', () => {
  it('keeps employer reports in English, the language employers and the IRS expect', () => {
    const report = buildMonthlyReport(
      [{ ...shift('2026-10-05', 5000), jobName: 'Olive & Vine', positionName: 'Server' }],
      '2026-10-26',
    );
    expect(report.label).toBe('October 2026');
    const html = monthlyReportHtml(report, '2026-10-26');
    expect(html).toContain('Employee’s tip report');
    expect(html).toContain('October 1–31, 2026');
    expect(html).toContain('Mon, Oct 5');
    expect(html).not.toMatch(/\b(propinas?|octubre|lun)\b/i);
  });

  it('keeps CSV column names in English so other apps can read them', () => {
    const csv = shiftsToCsv([]);
    expect(csv.split('\n')[0]).toMatch(/^Date,Job,Position,Shift,/);
  });
});
