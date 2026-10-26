/**
 * Patterns in a server's shifts: which days and which half of the day pay best,
 * how weeks are trending, and how this month compares with last month.
 */
import {
  addDays,
  fromISODate,
  isInRange,
  monthRange,
  weekRange,
  type DateRange,
  type ISODate,
  type Weekday,
} from '@/lib/dates';
import { computeShift, summarize, type PeriodSummary, type ShiftAmounts } from '@/lib/shift-math';

export type InsightShift = ShiftAmounts & {
  id: number;
  date: ISODate;
  period: 'am' | 'pm' | null;
  salesCents: number | null;
  positionName: string;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A day or half-day needs this many shifts before it's called "best". */
export const MIN_SHIFTS_FOR_RANKING = 2;

export type WeekdayStat = { weekday: Weekday; label: string; summary: PeriodSummary };
export type WeekPoint = { range: DateRange; summary: PeriodSummary };
export type ShiftHighlight = { id: number; date: ISODate; positionName: string; realHourlyCents: number; netTipsCents: number };

export type Insights = {
  shiftCount: number;
  byWeekday: WeekdayStat[];
  bestWeekday: { weekday: Weekday; name: string; realHourlyCents: number } | null;
  byPeriod: { am: PeriodSummary; pm: PeriodSummary; untagged: number };
  bestShifts: ShiftHighlight[];
  weeklyTrend: WeekPoint[];
  tipRateOfSales: { bps: number; shifts: number } | null;
  monthToDate: { thisMonth: PeriodSummary; lastMonth: PeriodSummary; dayOfMonth: number };
};

/** The date range to load so every insight has its data. */
export function insightsLoadRange(today: ISODate, weekStart: Weekday, weeks = 12): DateRange {
  const firstWeek = weekRange(addDays(today, -7 * (weeks - 1)), weekStart).start;
  const lastMonthStart = monthRange(addDays(monthRange(today).start, -1)).start;
  return { start: firstWeek < lastMonthStart ? firstWeek : lastMonthStart, end: today };
}

export function buildInsights(shifts: InsightShift[], today: ISODate, weekStart: Weekday, weeks = 12): Insights {
  const byWeekday: WeekdayStat[] = Array.from({ length: 7 }, (_, i) => {
    const weekday = ((weekStart + i) % 7) as Weekday;
    return {
      weekday,
      label: DAY_LABELS[weekday],
      summary: summarize(shifts.filter((s) => fromISODate(s.date).getDay() === weekday)),
    };
  });

  const ranked = byWeekday
    .filter((d) => d.summary.shiftCount >= MIN_SHIFTS_FOR_RANKING && d.summary.realHourlyCents !== null)
    .sort((a, b) => b.summary.realHourlyCents! - a.summary.realHourlyCents!);
  const bestWeekday = ranked.length >= 2
    ? { weekday: ranked[0].weekday, name: DAY_NAMES[ranked[0].weekday], realHourlyCents: ranked[0].summary.realHourlyCents! }
    : null;

  const bestShifts = shifts
    .map((s) => ({ s, t: computeShift(s) }))
    .filter(({ t }) => t.realHourlyCents !== null)
    .sort((a, b) => b.t.realHourlyCents! - a.t.realHourlyCents! || b.t.netTipsCents - a.t.netTipsCents)
    .slice(0, 3)
    .map(({ s, t }) => ({
      id: s.id,
      date: s.date,
      positionName: s.positionName,
      realHourlyCents: t.realHourlyCents!,
      netTipsCents: t.netTipsCents,
    }));

  const thisWeek = weekRange(today, weekStart);
  const weeklyTrend: WeekPoint[] = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek.start, -7 * (weeks - 1 - i));
    const range = { start, end: addDays(start, 6) };
    return { range, summary: summarize(shifts.filter((s) => isInRange(s.date, range))) };
  });

  const withSales = shifts.filter((s) => s.salesCents !== null && s.salesCents > 0);
  const salesTotal = withSales.reduce((sum, s) => sum + s.salesCents!, 0);
  const tipsTotal = withSales.reduce((sum, s) => sum + s.cashTipsCents + s.cardTipsCents, 0);
  const tipRateOfSales = withSales.length > 0 ? { bps: Math.round((tipsTotal * 10_000) / salesTotal), shifts: withSales.length } : null;

  // Compare the same number of days so early-month numbers aren't unfairly small.
  const dayOfMonth = fromISODate(today).getDate();
  const thisMonth = monthRange(today);
  const lastMonth = monthRange(addDays(thisMonth.start, -1));
  const lastMonthCutoff = addDays(lastMonth.start, dayOfMonth - 1);
  const monthToDate = {
    thisMonth: summarize(shifts.filter((s) => isInRange(s.date, { start: thisMonth.start, end: today }))),
    lastMonth: summarize(
      shifts.filter((s) => isInRange(s.date, { start: lastMonth.start, end: lastMonthCutoff < lastMonth.end ? lastMonthCutoff : lastMonth.end })),
    ),
    dayOfMonth,
  };

  return {
    shiftCount: shifts.length,
    byWeekday,
    bestWeekday,
    byPeriod: {
      am: summarize(shifts.filter((s) => s.period === 'am')),
      pm: summarize(shifts.filter((s) => s.period === 'pm')),
      untagged: shifts.filter((s) => s.period === null).length,
    },
    bestShifts,
    weeklyTrend,
    tipRateOfSales,
    monthToDate,
  };
}

/** "▲ 13%" or "▼ 4%": a change in basis points, rounded to a whole percent. */
export function formatChange(bps: number): string {
  return `${bps >= 0 ? '▲' : '▼'} ${Math.round(Math.abs(bps) / 100)}%`;
}

/** Change from `before` to `after` as basis points (12.5% = 1250), or null without a baseline. */
export function percentChange(before: number, after: number): number | null {
  if (before <= 0) return null;
  return Math.round(((after - before) * 10_000) / before);
}
