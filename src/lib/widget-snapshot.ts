/**
 * What the home-screen widgets show: this week's tips and real hourly, formatted once
 * here so the iOS (SwiftUI) and Android widgets display the same strings.
 */
import { goalProgress } from '@/lib/dashboard';
import { formatRange, weekRange, type ISODate, type Weekday } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { summarizeRange, type ShiftAmounts } from '@/lib/shift-math';

export type WidgetSnapshot = {
  /** e.g. "Oct 25 – 31". */
  weekLabel: string;
  /** Last day of the week shown, so a widget can tell when it's out of date. */
  weekEnd: ISODate;
  tips: string;
  earned: string;
  hours: string;
  hourly: string;
  shifts: number;
  /** 0–100, or -1 without a weekly goal (plain numbers travel to native code more simply than null). */
  goalPercent: number;
};

export function buildWidgetSnapshot<T extends ShiftAmounts & { date: ISODate }>(
  shifts: T[],
  today: ISODate,
  weekStart: Weekday,
  goalCents: number | null,
): WidgetSnapshot {
  const week = weekRange(today, weekStart);
  const s = summarizeRange(shifts, week);
  const progress = goalProgress(s.totalCents, goalCents);
  return {
    weekLabel: formatRange(week, today),
    weekEnd: week.end,
    tips: formatMoney(s.netTipsCents),
    earned: formatMoney(s.totalCents),
    hours: formatDuration(s.minutesWorked),
    hourly: s.realHourlyCents === null ? '—' : `${formatMoney(s.realHourlyCents)}/hr`,
    shifts: s.shiftCount,
    goalPercent: progress === null ? -1 : Math.round(progress * 100),
  };
}
