/** The message shown after a shift is saved: a real highlight when there is one, otherwise a plain confirmation. */
import { formatMoney } from '@/lib/money';
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';
import { fromISODate, type ISODate } from '@/lib/dates';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type Celebration = { title: string; detail: string; celebrate: boolean };

type Saved = ShiftAmounts & { id: number; date: ISODate };

/**
 * @param saved the shift just saved
 * @param monthShifts every shift this month, including `saved`
 * @param weekTotalBefore/After total earned this week before and after saving
 * @param goalCents weekly goal (total earned), if set
 */
export function celebrationFor({
  saved,
  monthShifts,
  weekTotalBefore,
  weekTotalAfter,
  goalCents,
}: {
  saved: Saved;
  monthShifts: Saved[];
  weekTotalBefore: number;
  weekTotalAfter: number;
  goalCents: number | null;
}): Celebration {
  const t = computeShift(saved);
  const hourly = t.realHourlyCents !== null ? ` · ${formatMoney(t.realHourlyCents)}/hr` : '';
  const plain = { title: 'Shift saved', detail: `${formatMoney(t.netTipsCents)} in tips${hourly}`, celebrate: false };

  if (goalCents !== null && weekTotalBefore < goalCents && weekTotalAfter >= goalCents) {
    return { title: 'Weekly goal reached', detail: `${formatMoney(weekTotalAfter)} earned this week`, celebrate: true };
  }

  const others = monthShifts.filter((s) => s.id !== saved.id);

  const weekday = fromISODate(saved.date).getDay();
  const sameDay = others.filter((s) => fromISODate(s.date).getDay() === weekday);
  if (sameDay.length >= 1 && t.netTipsCents > 0 && sameDay.every((s) => computeShift(s).netTipsCents < t.netTipsCents)) {
    return {
      title: `Best ${DAY_NAMES[weekday]} this month`,
      detail: `${formatMoney(t.netTipsCents)} in tips${hourly}`,
      celebrate: true,
    };
  }

  const timed = others.filter((s) => s.minutesWorked > 0);
  if (
    t.realHourlyCents !== null &&
    timed.length >= 2 &&
    timed.every((s) => (computeShift(s).realHourlyCents ?? 0) < t.realHourlyCents!)
  ) {
    return { title: 'Best hourly this month', detail: `${formatMoney(t.realHourlyCents)}/hr real hourly`, celebrate: true };
  }

  return plain;
}
