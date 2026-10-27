/**
 * Plans local notifications as one-off dates rather than repeating triggers,
 * so a day that already has a shift logged gets no reminder. The plan is
 * rebuilt whenever shifts or reminder settings change.
 */
import { byLanguage, t } from '@/i18n';
import { addDays, formatShortDate, fromISODate, toISODate, type DateRange, type ISODate, type Weekday } from '@/lib/dates';
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

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

export { formatShortDate };

const EARLY_MORNING_CUTOFF = 5; // a 1 AM reminder belongs to the night before

export function parseTime(time: string): { hour: number; minute: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null;
}

/** "11 PM", "12 AM", "1:30 AM" ("11 p. m." in Spanish). */
export function formatTime(time: string): string {
  const parsed = parseTime(time);
  if (!parsed) return time;
  const morning = parsed.hour < 12;
  const suffix = byLanguage({ en: morning ? 'AM' : 'PM', es: morning ? 'a. m.' : 'p. m.' });
  const h = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
  return parsed.minute === 0 ? `${h} ${suffix}` : `${h}:${String(parsed.minute).padStart(2, '0')} ${suffix}`;
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
  const hourly = s.realHourlyCents === null ? '' : t(' · {amount}/hr real hourly', { amount: formatMoney(s.realHourlyCents) });
  const shifts = s.shiftCount === 1 ? t('1 shift') : t('{count} shifts', { count: s.shiftCount });
  return {
    id: `recap-${week.range.start}`,
    title: t('Your week: {amount} in tips', { amount: formatMoney(s.netTipsCents) }),
    body: t('{earned} earned in {hours}{hourly}, over {shifts}.', {
      earned: formatMoney(s.totalCents),
      hours: formatDuration(s.minutesWorked),
      hourly,
      shifts,
    }),
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
        title: t('How were tips tonight?'),
        body: t('Log your shift. It takes about five seconds.'),
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
      const monthName = byLanguage(MONTHS)[fromISODate(reportMonth).getMonth()];
      plans.push({
        id: `report-${reportMonth.slice(0, 7)}`,
        fireAt: fire,
        title: t('Your {month} tip report is ready', { month: monthName }),
        body: t('Tips of $20 or more a month must be reported to your employer by {date}.', { date: formatShortDate(due) }),
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
        title: t('Your free trial ends {date}', { date: formatShortDate(trialEndsOn) }),
        body: t('Pro renews automatically after that. To stop it, cancel in your App Store or Google Play subscriptions before then.'),
        url: '/settings',
      });
    }
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
