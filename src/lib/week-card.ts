/**
 * The "share my week" card: this week's numbers, formatted once for the image and for the
 * plain-text version shared where images can't be.
 */
import { buildWeekBars } from '@/lib/dashboard';
import { formatRange, fromISODate, weekRange, type ISODate, type Weekday } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { summarizeRange, type ShiftAmounts } from '@/lib/shift-math';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type WeekCard = {
  range: string;
  tips: string;
  earned: string;
  hours: string;
  /** "$33.90/hr", or null when no hours were logged. */
  hourly: string | null;
  shifts: number;
  /** The day that earned the most, e.g. { day: 'Saturday', amount: '$308' }. */
  bestDay: { day: string; amount: string } | null;
  /** Each day's total earned, 0–1 of the best day, in week order. */
  bars: { label: string; share: number; best: boolean }[];
  text: string;
};

export function buildWeekCard<T extends ShiftAmounts & { date: ISODate }>(
  shifts: T[],
  today: ISODate,
  weekStart: Weekday,
): WeekCard {
  const week = weekRange(today, weekStart);
  const s = summarizeRange(shifts, week);
  const days = buildWeekBars(shifts, today, weekStart);
  const top = days.reduce((best, d) => (d.totalCents > best.totalCents ? d : best), days[0]);
  const bestDay =
    top.totalCents > 0
      ? { day: DAY_NAMES[fromISODate(top.date).getDay()], amount: formatMoney(top.totalCents, { wholeDollars: true }) }
      : null;
  const range = formatRange(week, today);
  const hourly = s.realHourlyCents === null ? null : `${formatMoney(s.realHourlyCents)}/hr`;
  const tips = formatMoney(s.netTipsCents);
  const earned = formatMoney(s.totalCents);
  const hours = formatDuration(s.minutesWorked);

  const text = [
    `My week in tips (${range}): ${tips} in tips, ${earned} earned in ${hours}`,
    hourly ? `, ${hourly} real hourly` : '',
    bestDay ? `. Best day: ${bestDay.day}.` : '.',
    ' Tracked with Tipbook.',
  ].join('');

  return {
    range,
    tips,
    earned,
    hours,
    hourly,
    shifts: s.shiftCount,
    bestDay,
    bars: days.map((d) => ({
      label: d.label,
      share: top.totalCents > 0 ? Math.max(0, d.totalCents) / top.totalCents : 0,
      best: top.totalCents > 0 && d.date === top.date,
    })),
    text,
  };
}
