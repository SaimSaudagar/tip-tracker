import {
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

/** The date range to load so that the week, month and year containing `today` are all covered. */
export function dashboardLoadRange(today: ISODate, weekStart: Weekday): DateRange {
  const ranges = [weekRange(today, weekStart), monthRange(today), yearRange(today)];
  return {
    start: ranges.reduce((min, r) => (r.start < min ? r.start : min), ranges[0].start),
    end: ranges.reduce((max, r) => (r.end > max ? r.end : max), ranges[0].end),
  };
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
