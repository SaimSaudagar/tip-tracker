/**
 * Compares a paycheck with the shifts logged in its pay period. Employers usually
 * pay wages, card tips and service charges through payroll; cash tips are already
 * in hand. Gross pay is what to compare: net is after taxes and deductions.
 */
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';

export type PaycheckComparison = {
  shiftCount: number;
  minutesWorked: number;
  wagesCents: number;
  cardTipsCents: number;
  serviceChargeCents: number;
  /** Wages + card tips + service charges logged for the period. */
  expectedCents: number;
  /** Gross minus expected, when gross was entered. Positive means paid more than logged. */
  differenceCents: number | null;
};

export function comparePaycheck(grossCents: number | null, shifts: ShiftAmounts[]): PaycheckComparison {
  let wagesCents = 0;
  let cardTipsCents = 0;
  let serviceChargeCents = 0;
  let minutesWorked = 0;
  for (const s of shifts) {
    wagesCents += computeShift(s).wagesCents;
    cardTipsCents += s.cardTipsCents;
    serviceChargeCents += s.serviceChargeCents;
    minutesWorked += s.minutesWorked;
  }
  const expectedCents = wagesCents + cardTipsCents + serviceChargeCents;
  return {
    shiftCount: shifts.length,
    minutesWorked,
    wagesCents,
    cardTipsCents,
    serviceChargeCents,
    expectedCents,
    differenceCents: grossCents === null ? null : grossCents - expectedCents,
  };
}

/** Within a dollar either way counts as matching; payroll rounds differently. */
export const PAYCHECK_TOLERANCE_CENTS = 100;
