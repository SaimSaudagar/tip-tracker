/**
 * Plans local notifications as one-off dates rather than repeating triggers,
 * so a day that already has a shift logged gets no reminder. The plan is
 * rebuilt whenever shifts or reminder settings change.
 */
import { addDays, fromISODate, toISODate, type DateRange, type ISODate, type Weekday } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import type { PeriodSummary } from '@/lib/shift-math';

export type ReminderSettings = {
  enabled: boolean;
  /** "HH:MM", 24-hour local time. Times before 05:00 fire the morning after the shift. */
  time: string;
  /** Weekdays you work (0 = Sunday). */
  days: Weekday[];
  /** Monthly employer tip report reminder (a Pro feature). */
  reportReminder: boolean;
  /** The morning after each week ends: what it paid. */
  weeklyRecap: boolean;
};

export type PlannedNotification = {
  id: string;
  fireAt: Date;
  title: string;
  body: string;
  /** Route to open when the notification is tapped. */
  url: string;
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  time: '23:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  reportReminder: false,
  weeklyRecap: false,
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EARLY_MORNING_CUTOFF = 5; // a 1 AM reminder belongs to the night before

export function parseTime(time: string): { hour: number; minute: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null;
}

/** "11 PM", "12 AM", "1:30 AM". */
export function formatTime(time: string): string {
  const t = parseTime(time);
  if (!t) return time;
  const suffix = t.hour < 12 ? 'AM' : 'PM';
  const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
  return t.minute === 0 ? `${h} ${suffix}` : `${h}:${String(t.minute).padStart(2, '0')} ${suffix}`;
}

function at(iso: ISODate, hour: number, minute: number): Date {
  const d = fromISODate(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
}

/** The 10th of the month after `monthIso`, moved to Monday when it lands on a weekend. */
export function employerReportDueDate(monthIso: ISODate): ISODate {
  const d = fromISODate(monthIso);
  let due = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 10, 12));
  const weekday = fromISODate(due).getDay();
  if (weekday === 6) due = addDays(due, 2);
  if (weekday === 0) due = addDays(due, 1);
  return due;
}

export function formatShortDate(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Free-trial length per plan id: 14 days on the yearly plan, a month on the one-time exit offer. */
const TRIAL_DAYS: Record<string, number> = { annual: 14, annual_month_trial: 30 };

/** The last day of a trial started on `startedOn`, or null for plans without one. */
export function trialEndDate(startedOn: ISODate, planId: string): ISODate | null {
  const days = TRIAL_DAYS[planId];
  return days ? addDays(startedOn, days) : null;
}

/** How many days before a free trial ends the app reminds you, as the paywall promises. */
export const TRIAL_REMINDER_DAYS = 2;

/** When the weekly recap arrives: this hour on the first day of the next week. */
export const RECAP_HOUR = 11;

/** The recap for the week in `week`, or null when nothing was logged (a "$0 week" message helps nobody). */
export function weeklyRecap(week: { range: DateRange; summary: PeriodSummary }): Omit<PlannedNotification, 'fireAt'> | null {
  const s = week.summary;
  if (s.shiftCount === 0) return null;
  const hourly = s.realHourlyCents === null ? '' : ` · ${formatMoney(s.realHourlyCents)}/hr real hourly`;
  return {
    id: `recap-${week.range.start}`,
    title: `Your week: ${formatMoney(s.netTipsCents)} in tips`,
    body: `${formatMoney(s.totalCents)} earned in ${formatDuration(s.minutesWorked)}${hourly}, over ${s.shiftCount} shift${s.shiftCount === 1 ? '' : 's'}.`,
    url: '/',
  };
}

export function planReminders({
  now,
  settings,
  loggedDates,
  trialEndsOn = null,
  week = null,
  horizonDays = 14,
}: {
  now: Date;
  settings: ReminderSettings;
  loggedDates: Set<ISODate>;
  /** Last day of a free trial, when one is running. Its reminder doesn't depend on the settings. */
  trialEndsOn?: ISODate | null;
  /** This week so far, for the weekly recap. It's re-planned as shifts are logged, so it ends up complete. */
  week?: { range: DateRange; summary: PeriodSummary } | null;
  horizonDays?: number;
}): PlannedNotification[] {
  const plans: PlannedNotification[] = [];
  const time = parseTime(settings.time);
  const today = toISODate(now);

  if (settings.enabled && time) {
    const earlyMorning = time.hour < EARLY_MORNING_CUTOFF;
    // Start a day back so tonight's after-midnight reminder for yesterday's shift is included.
    for (let i = earlyMorning ? -1 : 0; i < horizonDays; i++) {
      const shiftDay = addDays(today, i);
      if (!settings.days.includes(fromISODate(shiftDay).getDay() as Weekday)) continue;
      if (loggedDates.has(shiftDay)) continue;
      const fireAt = at(earlyMorning ? addDays(shiftDay, 1) : shiftDay, time.hour, time.minute);
      if (fireAt <= now) continue;
      plans.push({
        id: `shift-${shiftDay}`,
        fireAt,
        title: 'How were tips tonight?',
        body: 'Log your shift. It takes about five seconds.',
        url: `/log-shift?date=${shiftDay}`,
      });
    }
  }

  if (settings.reportReminder) {
    // Remind on the 8th about last month's report, for this month and next.
    for (let offset = 0; offset < 2; offset++) {
      const fire = new Date(now.getFullYear(), now.getMonth() + offset, 8, 10, 0);
      if (fire <= now) continue;
      const reportMonth = toISODate(new Date(fire.getFullYear(), fire.getMonth() - 1, 1, 12));
      const due = employerReportDueDate(reportMonth);
      const monthName = MONTHS[fromISODate(reportMonth).getMonth()];
      plans.push({
        id: `report-${reportMonth.slice(0, 7)}`,
        fireAt: fire,
        title: `Your ${monthName} tip report is ready`,
        body: `Tips of $20 or more a month must be reported to your employer by ${formatShortDate(due)}.`,
        url: `/reports?month=${reportMonth}`,
      });
    }
  }

  if (settings.weeklyRecap && week) {
    const recap = weeklyRecap(week);
    const fireAt = at(addDays(week.range.end, 1), RECAP_HOUR, 0);
    if (recap && fireAt > now) plans.push({ ...recap, fireAt });
  }

  if (trialEndsOn) {
    const fireAt = at(addDays(trialEndsOn, -TRIAL_REMINDER_DAYS), 10, 0);
    if (fireAt > now) {
      plans.push({
        id: `trial-${trialEndsOn}`,
        fireAt,
        title: `Your free trial ends ${formatShortDate(trialEndsOn)}`,
        body: 'Pro renews automatically after that. To stop it, cancel in your App Store or Google Play subscriptions before then.',
        url: '/settings',
      });
    }
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
