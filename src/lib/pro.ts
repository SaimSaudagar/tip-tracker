/**
 * What the free plan includes. Logging, history, the calendar, export and import
 * are always free; Pro adds more jobs, automatic tip-outs, year views and reports.
 */
import { addDays, type ISODate } from '@/lib/dates';

export const FREE_JOB_LIMIT = 1;
export const FREE_POSITION_LIMIT = 2;

export type PaywallReason = 'jobs' | 'positions' | 'tipout' | 'year' | 'reports' | 'onboarding' | 'settings';

export type PositionLike = { id: number; jobName: string };

/**
 * Whether saving a position (new when `id` is undefined) would take a free user past
 * the job or position limits. Renaming your only job is fine; adding a second one isn't.
 */
export function freeLimitViolation(
  positions: PositionLike[],
  change: { id?: number; jobName: string },
): 'jobs' | 'positions' | null {
  const after = change.id === undefined
    ? [...positions, { id: -1, jobName: change.jobName }]
    : positions.map((p) => (p.id === change.id ? { ...p, jobName: change.jobName } : p));
  const jobs = new Set(after.map((p) => p.jobName.trim().toLowerCase()));
  if (jobs.size > FREE_JOB_LIMIT) return 'jobs';
  if (after.length > FREE_POSITION_LIMIT) return 'positions';
  return null;
}

/**
 * Asks for an App Store / Play rating only at a good moment: after a few shifts,
 * in a week that's going at least as well as last week, and rarely.
 */
export function shouldAskForReview({
  shiftCount,
  thisWeekTipsCents,
  lastWeekTipsCents,
  lastAskedOn,
  today,
}: {
  shiftCount: number;
  thisWeekTipsCents: number;
  lastWeekTipsCents: number;
  lastAskedOn: ISODate | null;
  today: ISODate;
}): boolean {
  if (shiftCount < 5) return false;
  if (thisWeekTipsCents <= 0 || thisWeekTipsCents < lastWeekTipsCents) return false;
  return lastAskedOn === null || addDays(lastAskedOn, 120) <= today;
}
