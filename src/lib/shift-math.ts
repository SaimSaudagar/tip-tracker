import { percentOf } from '@/lib/money';
import { isInRange, type DateRange, type ISODate } from '@/lib/dates';

/** How a position's tip-out is worked out. `fixed` values are cents; percentages are basis points. */
export type TipOutRule = 'none' | 'fixed' | 'pct_tips' | 'pct_sales';

export type ShiftAmounts = {
  minutesWorked: number;
  hourlyWageCents: number;
  cashTipsCents: number;
  cardTipsCents: number;
  /** Tips received from coworkers (tip shares or pools). */
  tipInCents: number;
  /** Tips paid out to coworkers (bussers, bar, hosts). */
  tipOutCents: number;
  /** Auto-gratuity and service charges. Kept apart from tips because they aren't voluntary tips. */
  serviceChargeCents: number;
  /** Extra pay for overtime hours on top of the regular wage (see src/lib/overtime.ts). */
  overtimePremiumCents?: number;
};

export type ShiftTotals = {
  wagesCents: number;
  netTipsCents: number;
  totalCents: number;
  /** Everything earned divided by hours worked, or null when no hours were logged. */
  realHourlyCents: number | null;
};

export type PeriodSummary = ShiftTotals & {
  shiftCount: number;
  minutesWorked: number;
  serviceChargeCents: number;
};

export function calcTipOut(
  rule: TipOutRule,
  value: number,
  { cashTipsCents, cardTipsCents, salesCents }: { cashTipsCents: number; cardTipsCents: number; salesCents: number | null },
): number {
  switch (rule) {
    case 'fixed':
      return value;
    case 'pct_tips':
      return percentOf(cashTipsCents + cardTipsCents, value);
    case 'pct_sales':
      return percentOf(salesCents ?? 0, value);
    default:
      return 0;
  }
}

export function computeShift(s: ShiftAmounts): ShiftTotals {
  const wagesCents = Math.round((s.minutesWorked * s.hourlyWageCents) / 60) + (s.overtimePremiumCents ?? 0);
  const netTipsCents = s.cashTipsCents + s.cardTipsCents + s.tipInCents - s.tipOutCents;
  const totalCents = wagesCents + netTipsCents + s.serviceChargeCents;
  const realHourlyCents = s.minutesWorked > 0 ? Math.round((totalCents * 60) / s.minutesWorked) : null;
  return { wagesCents, netTipsCents, totalCents, realHourlyCents };
}

/**
 * Totals for a set of shifts. Real hourly only counts shifts with hours logged,
 * so a tips-only entry can't inflate the hourly rate.
 */
export function summarize(shifts: ShiftAmounts[]): PeriodSummary {
  let minutesWorked = 0;
  let wagesCents = 0;
  let netTipsCents = 0;
  let serviceChargeCents = 0;
  let totalCents = 0;
  let timedTotalCents = 0;

  for (const shift of shifts) {
    const t = computeShift(shift);
    minutesWorked += shift.minutesWorked;
    wagesCents += t.wagesCents;
    netTipsCents += t.netTipsCents;
    serviceChargeCents += shift.serviceChargeCents;
    totalCents += t.totalCents;
    if (shift.minutesWorked > 0) timedTotalCents += t.totalCents;
  }

  return {
    shiftCount: shifts.length,
    minutesWorked,
    wagesCents,
    netTipsCents,
    serviceChargeCents,
    totalCents,
    realHourlyCents: minutesWorked > 0 ? Math.round((timedTotalCents * 60) / minutesWorked) : null,
  };
}

export function summarizeRange<T extends ShiftAmounts & { date: ISODate }>(shifts: T[], range: DateRange) {
  return summarize(shifts.filter((s) => isInRange(s.date, range)));
}
