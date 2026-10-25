/**
 * Plans local notifications as one-off dates rather than repeating triggers,
 * so a day that already has a shift logged gets no reminder. The plan is
 * rebuilt whenever shifts or reminder settings change.
 */
import { addDays, fromISODate, toISODate, type ISODate, type Weekday } from '@/lib/dates';

export type ReminderSettings = {
  enabled: boolean;
  /** "HH:MM", 24-hour local time. Times before 05:00 fire the morning after the shift. */
  time: string;
  /** Weekdays you work (0 = Sunday). */
  days: Weekday[];
  /** Monthly employer tip report reminder (a Pro feature). */
  reportReminder: boolean;
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

export function planReminders({
  now,
  settings,
  loggedDates,
  horizonDays = 14,
}: {
  now: Date;
  settings: ReminderSettings;
  loggedDates: Set<ISODate>;
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

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
