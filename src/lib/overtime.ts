/**
 * Overtime pay, set per job. Rules differ by state, so instead of a table of state
 * laws each job picks a rule and, ideally, the overtime rate printed on its paystub:
 *
 * - `weekly`: hours over 40 in a workweek (federal law; applies everywhere).
 * - `daily`: hours over 8 in a day, plus hours over 40 in the week that weren't already
 *   daily overtime (as in Alaska and Nevada).
 * - `daily` with `doubleTime` (California): also double time after 12 hours in a day, and
 *   when every day of the workweek is worked, the 7th day's first 8 hours are overtime and
 *   the rest double time.
 *
 * Shifts store their regular wage, so overtime is added as a premium on top:
 * overtime minutes × (overtime rate − the shift's wage), and the same for double time.
 */
import { weekRange, type ISODate, type Weekday } from '@/lib/dates';

export type OvertimeRule = 'none' | 'weekly' | 'daily';
export type JobOvertime = {
  rule: OvertimeRule;
  /** From the paystub; null means estimate it. */
  rateCents: number | null;
  /** California's double time and seventh-day rule, on top of the `daily` rule. */
  doubleTime: boolean;
};

export const NO_OVERTIME: JobOvertime = { rule: 'none', rateCents: null, doubleTime: false };

export const WEEKLY_LIMIT_MINUTES = 40 * 60;
export const DAILY_LIMIT_MINUTES = 8 * 60;
export const DOUBLE_TIME_LIMIT_MINUTES = 12 * 60;
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

/**
 * The double-time rate. California, the state with double time, has no tip credit, so its
 * overtime rate is 1.5× the regular rate and double time is 4/3 of it. Without a paystub
 * rate it's estimated like overtime: 2× the wage, less any tip credit.
 */
export function estimateDoubleTimeRate(hourlyWageCents: number, overtimeRateCents: number | null): number {
  if (overtimeRateCents !== null) return Math.round((overtimeRateCents * 4) / 3);
  if (hourlyWageCents >= FEDERAL_MINIMUM_WAGE_CENTS) return hourlyWageCents * 2;
  return FEDERAL_MINIMUM_WAGE_CENTS * 2 - (FEDERAL_MINIMUM_WAGE_CENTS - hourlyWageCents);
}

export type OvertimeShift = {
  id: number;
  jobId: number;
  date: ISODate;
  startTime: string | null;
  minutesWorked: number;
  hourlyWageCents: number;
};

/** `minutes` counts every minute paid extra; `doubleTimeMinutes` is the part of them at double time. */
export type ShiftOvertime = { minutes: number; doubleTimeMinutes: number; premiumCents: number };

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
    const { rule, rateCents, doubleTime: californiaRules } = rules.get(group[0].jobId)!;
    const doubleTime = rule === 'daily' && californiaRules;
    const ordered = [...group].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? '') || a.id - b.id,
    );
    const minutesByDay = new Map<ISODate, number>();
    // The seventh-day rule: only when every day of the workweek has time worked.
    const seventhDay =
      doubleTime && new Set(group.filter((s) => s.minutesWorked > 0).map((s) => s.date)).size === 7
        ? weekRange(group[0].date, weekStart).end
        : null;
    let regularThisWeek = 0;

    for (const s of ordered) {
      let dailyOvertime = 0;
      let doubleTimeMinutes = 0;
      if (rule === 'daily') {
        const before = minutesByDay.get(s.date) ?? 0;
        const after = before + s.minutesWorked;
        minutesByDay.set(s.date, after);
        // This shift's minutes past a daily limit, after the day's earlier shifts.
        const past = (limit: number) => clamp(after - Math.max(limit, before), 0, s.minutesWorked);
        if (s.date === seventhDay) {
          doubleTimeMinutes = past(DAILY_LIMIT_MINUTES);
          dailyOvertime = s.minutesWorked - doubleTimeMinutes;
        } else {
          doubleTimeMinutes = doubleTime ? past(DOUBLE_TIME_LIMIT_MINUTES) : 0;
          dailyOvertime = past(DAILY_LIMIT_MINUTES) - doubleTimeMinutes;
        }
      }
      const regular = s.minutesWorked - dailyOvertime - doubleTimeMinutes;
      const weeklyOvertime = clamp(regularThisWeek + regular - WEEKLY_LIMIT_MINUTES, 0, regular);
      regularThisWeek += regular - weeklyOvertime;

      const overtimeMinutes = dailyOvertime + weeklyOvertime;
      if (overtimeMinutes + doubleTimeMinutes === 0) continue;
      // Without a paystub rate or a wage there's nothing to base overtime pay on.
      const rate = rateCents ?? (s.hourlyWageCents > 0 ? estimateOvertimeRate(s.hourlyWageCents) : null);
      const doubleRate = rate === null ? null : estimateDoubleTimeRate(s.hourlyWageCents, rateCents);
      const extra = (minutes: number, r: number | null) =>
        r === null ? 0 : Math.max(0, (minutes * (r - s.hourlyWageCents)) / 60);
      result.set(s.id, {
        minutes: overtimeMinutes + doubleTimeMinutes,
        doubleTimeMinutes,
        premiumCents: Math.round(extra(overtimeMinutes, rate) + extra(doubleTimeMinutes, doubleRate)),
      });
    }
  }
  return result;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
