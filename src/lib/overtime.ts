/**
 * Overtime pay, set per job. Rules differ by state, so instead of a table of state
 * laws each job picks a rule and, ideally, the overtime rate printed on its paystub:
 *
 * - `weekly`: hours over 40 in a workweek (federal law; applies everywhere).
 * - `daily`: hours over 8 in a day, plus hours over 40 in the week that weren't already
 *   daily overtime (California-style; Alaska and Nevada are similar). Double time isn't counted.
 *
 * Shifts store their regular wage, so overtime is added as a premium on top:
 * overtime minutes × (overtime rate − the shift's wage).
 */
import { weekRange, type ISODate, type Weekday } from '@/lib/dates';

export type OvertimeRule = 'none' | 'weekly' | 'daily';
export type JobOvertime = { rule: OvertimeRule; /** From the paystub; null means estimate it. */ rateCents: number | null };

export const NO_OVERTIME: JobOvertime = { rule: 'none', rateCents: null };

export const WEEKLY_LIMIT_MINUTES = 40 * 60;
export const DAILY_LIMIT_MINUTES = 8 * 60;
const FEDERAL_MINIMUM_WAGE_CENTS = 725;

/**
 * The federal overtime rate for a wage, used when the paystub rate isn't entered:
 * 1.5× the wage, or for a tipped wage below the federal minimum, 1.5× the minimum
 * wage less the tip credit (so $2.13 an hour earns $5.76 an hour in overtime).
 */
export function estimateOvertimeRate(hourlyWageCents: number): number {
  const timeAndAHalf = (cents: number) => Math.round((cents * 3) / 2);
  if (hourlyWageCents >= FEDERAL_MINIMUM_WAGE_CENTS) return timeAndAHalf(hourlyWageCents);
  const tipCredit = FEDERAL_MINIMUM_WAGE_CENTS - hourlyWageCents;
  return timeAndAHalf(FEDERAL_MINIMUM_WAGE_CENTS) - tipCredit;
}

export type OvertimeShift = {
  id: number;
  jobId: number;
  date: ISODate;
  startTime: string | null;
  minutesWorked: number;
  hourlyWageCents: number;
};

export type ShiftOvertime = { minutes: number; premiumCents: number };

/**
 * Overtime for every shift that has some, keyed by shift id. Pass all of each job's
 * shifts for every week involved: a week's earlier shifts decide when overtime starts.
 * Within a week, shifts count in date and start-time order.
 */
export function computeOvertime(
  shifts: OvertimeShift[],
  rules: Map<number, JobOvertime>,
  weekStart: Weekday,
): Map<number, ShiftOvertime> {
  const result = new Map<number, ShiftOvertime>();
  const groups = new Map<string, OvertimeShift[]>();
  for (const s of shifts) {
    if ((rules.get(s.jobId)?.rule ?? 'none') === 'none') continue;
    const key = `${s.jobId}|${weekRange(s.date, weekStart).start}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  for (const group of groups.values()) {
    const { rule, rateCents } = rules.get(group[0].jobId)!;
    const ordered = [...group].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? '') || a.id - b.id,
    );
    const minutesByDay = new Map<ISODate, number>();
    let regularThisWeek = 0;

    for (const s of ordered) {
      let dailyOvertime = 0;
      if (rule === 'daily') {
        const before = minutesByDay.get(s.date) ?? 0;
        dailyOvertime = clamp(before + s.minutesWorked - DAILY_LIMIT_MINUTES, 0, s.minutesWorked);
        minutesByDay.set(s.date, before + s.minutesWorked);
      }
      const regular = s.minutesWorked - dailyOvertime;
      const weeklyOvertime = clamp(regularThisWeek + regular - WEEKLY_LIMIT_MINUTES, 0, regular);
      regularThisWeek += regular - weeklyOvertime;

      const minutes = dailyOvertime + weeklyOvertime;
      if (minutes === 0) continue;
      // Without a paystub rate or a wage there's nothing to base overtime pay on.
      const rate = rateCents ?? (s.hourlyWageCents > 0 ? estimateOvertimeRate(s.hourlyWageCents) : null);
      const premiumCents = rate === null ? 0 : Math.max(0, Math.round((minutes * (rate - s.hourlyWageCents)) / 60));
      result.set(s.id, { minutes, premiumCents });
    }
  }
  return result;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
