/**
 * Development only: realistic shifts for trying every screen (and taking store
 * screenshots) without typing weeks of data. Deterministic for a given seed.
 */
import { msg, t } from '@/i18n';
import { addDays, fromISODate, type ISODate } from '@/lib/dates';
import { percentOf } from '@/lib/money';
import type { TipOutEntry } from '@/lib/tipouts';

export type SampleShift = {
  date: ISODate;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  minutesWorked: number;
  period: 'am' | 'pm';
  cashTipsCents: number;
  cardTipsCents: number;
  tipInCents: number;
  tipOutCents: number;
  serviceChargeCents: number;
  salesCents: number;
  covers: number;
  notes: string | null;
  tipOuts: TipOutEntry[];
};

/** A small seeded generator (mulberry32), so the sample data is the same every time. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// In the app's language, so screenshots and demo clips in Spanish show Spanish notes and names.
const NOTES = [
  msg('Big party on the patio'),
  msg('Slow night'),
  msg('Double'),
  msg('Rain, quiet'),
  msg('Birthday table tipped big'),
];

/** Shifts for the `days` before `today`: dinners most nights, lunch on Mondays, Tuesdays off. */
export function buildSampleShifts(today: ISODate, { days = 84, seed = 7 } = {}): SampleShift[] {
  const rand = random(seed);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const shifts: SampleShift[] = [];

  for (let i = days; i >= 1; i--) {
    const date = addDays(today, -i);
    const weekday = fromISODate(date).getDay();
    if (weekday === 2 || rand() < 0.15) continue; // Tuesdays off, plus the odd night off
    const lunch = weekday === 1;
    const weekend = weekday === 5 || weekday === 6;

    const breakMinutes = lunch ? 0 : rand() < 0.5 ? 30 : 0;
    const endMinutes = lunch ? 15 * 60 : Math.round(between(22 * 60, 23.5 * 60) / 15) * 15;
    const startMinutes = lunch ? 10 * 60 + 30 : 16 * 60 + 30;
    const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    const salesCents = Math.round(between(lunch ? 45_000 : 90_000, lunch ? 80_000 : 160_000) * (weekend ? 1.3 : 1));
    const tipsCents = percentOf(salesCents, Math.round(between(1700, 2200)));
    const cashTipsCents = Math.round((tipsCents * between(0.2, 0.35)) / 100) * 100; // cash comes in whole dollars
    const busser = percentOf(salesCents, 200);
    const bar = lunch ? 0 : percentOf(salesCents, 100);

    shifts.push({
      date,
      startTime: clock(startMinutes),
      endTime: clock(endMinutes),
      breakMinutes,
      minutesWorked: endMinutes - startMinutes - breakMinutes,
      period: lunch ? 'am' : 'pm',
      cashTipsCents,
      cardTipsCents: tipsCents - cashTipsCents,
      tipInCents: 0,
      tipOutCents: busser + bar,
      serviceChargeCents: weekend && rand() < 0.3 ? Math.round(between(3_000, 6_000)) : 0,
      salesCents,
      covers: Math.max(1, Math.round(salesCents / between(4_500, 6_000))),
      notes: rand() < 0.12 ? t(NOTES[Math.floor(rand() * NOTES.length)]) : null,
      tipOuts: [
        { name: t('Busser'), amountCents: busser },
        ...(bar > 0 ? [{ name: t('Bar'), amountCents: bar }] : []),
      ],
    });
  }
  return shifts;
}
