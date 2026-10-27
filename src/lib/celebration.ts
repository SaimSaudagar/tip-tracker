/** The message shown after a shift is saved: a real highlight when there is one, otherwise a plain confirmation. */
import { t } from '@/i18n';
import { fromISODate, weekdayName, type ISODate } from '@/lib/dates';
import { formatHourly, formatMoney } from '@/lib/money';
import { computeShift, type ShiftAmounts } from '@/lib/shift-math';

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
  const totals = computeShift(saved);
  const hourly = totals.realHourlyCents !== null ? ` · ${formatHourly(totals.realHourlyCents)}` : '';
  const tipsLine = t('{amount} in tips', { amount: formatMoney(totals.netTipsCents) }) + hourly;
  const plain = { title: t('Shift saved'), detail: tipsLine, celebrate: false };

  if (goalCents !== null && weekTotalBefore < goalCents && weekTotalAfter >= goalCents) {
    return {
      title: t('Weekly goal reached'),
      detail: t('{amount} earned this week', { amount: formatMoney(weekTotalAfter) }),
      celebrate: true,
    };
  }

  const others = monthShifts.filter((s) => s.id !== saved.id);

  const weekday = fromISODate(saved.date).getDay();
  const sameDay = others.filter((s) => fromISODate(s.date).getDay() === weekday);
  if (
    sameDay.length >= 1 &&
    totals.netTipsCents > 0 &&
    sameDay.every((s) => computeShift(s).netTipsCents < totals.netTipsCents)
  ) {
    return { title: t('Best {day} this month', { day: weekdayName(weekday) }), detail: tipsLine, celebrate: true };
  }

  const timed = others.filter((s) => s.minutesWorked > 0);
  if (
    totals.realHourlyCents !== null &&
    timed.length >= 2 &&
    timed.every((s) => (computeShift(s).realHourlyCents ?? 0) < totals.realHourlyCents!)
  ) {
    return {
      title: t('Best hourly this month'),
      detail: t('{amount} real hourly', { amount: formatHourly(totals.realHourlyCents) }),
      celebrate: true,
    };
  }

  return plain;
}
