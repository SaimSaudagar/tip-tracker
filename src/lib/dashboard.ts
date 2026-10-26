import {
  addDays,
  monthRange,
  weekRange,
  yearRange,
  type DateRange,
  type ISODate,
  type Weekday,
} from '@/lib/dates';
import { summarizeRange, type PeriodSummary, type ShiftAmounts } from '@/lib/shift-math';

export type Period = { range: DateRange; summary: PeriodSummary };
export type DashboardPeriods = { week: Period; month: Period; year: Period };

/** The date range to load so that last week, this week, month and year are all covered. */
export function dashboardLoadRange(today: ISODate, weekStart: Weekday): DateRange {
  const ranges = [weekRange(addDays(today, -7), weekStart), weekRange(today, weekStart), monthRange(today), yearRange(today)];
  return {
    start: ranges.reduce((min, r) => (r.start < min ? r.start : min), ranges[0].start),
    end: ranges.reduce((max, r) => (r.end > max ? r.end : max), ranges[0].end),
  };
}

export type DayBar = { date: ISODate; label: string; totalCents: number; lastWeekTotalCents: number };

const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Total earned per day this week, next to the same weekday last week. */
export function buildWeekBars<T extends ShiftAmounts & { date: ISODate }>(
  shifts: T[],
  today: ISODate,
  weekStart: Weekday,
): DayBar[] {
  const week = weekRange(today, weekStart);
  const totalOn = (date: ISODate) => summarizeRange(shifts, { start: date, end: date }).totalCents;
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(week.start, i);
    return {
      date,
      label: INITIALS[(weekStart + i) % 7],
      totalCents: totalOn(date),
      lastWeekTotalCents: totalOn(addDays(date, -7)),
    };
  });
}

/**
 * During tax season (January to April), the year whose tip summary Home offers,
 * unless the user has dismissed that year's card. Otherwise null.
 */
export function taxSeasonYear(today: ISODate, dismissedYear: string | null): string | null {
  const month = Number(today.slice(5, 7));
  if (month > 4) return null;
  const year = String(Number(today.slice(0, 4)) - 1);
  return year === dismissedYear ? null : year;
}

/** Share of the weekly goal reached, 0–1, or null without a goal. */
export function goalProgress(totalCents: number, goalCents: number | null): number | null {
  if (goalCents === null || goalCents <= 0) return null;
  return Math.max(0, Math.min(1, totalCents / goalCents));
}

export function buildDashboardPeriods<T extends ShiftAmounts & { date: ISODate }>(
  shifts: T[],
  today: ISODate,
  weekStart: Weekday,
): DashboardPeriods {
  const period = (range: DateRange): Period => ({ range, summary: summarizeRange(shifts, range) });
  return {
    week: period(weekRange(today, weekStart)),
    month: period(monthRange(today)),
    year: period(yearRange(today)),
  };
}
