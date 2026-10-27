import type { SQLiteDatabase } from 'expo-sqlite';

import { getSettings, getWeekStart, listLoggedDates, listShiftsBetween } from '@/db/repo';
import { getReminderSettings } from '@/db/settings';
import { addDays, todayISO, weekRange } from '@/lib/dates';
import { replaceScheduledNotifications } from '@/lib/notify';
import { planReminders } from '@/lib/reminders-plan';
import { summarize } from '@/lib/shift-math';

/** Re-plans every reminder from current settings and logged shifts. Safe to call often. */
export async function syncReminders(db: SQLiteDatabase, { isPro }: { isPro: boolean }): Promise<number> {
  const [settings, all] = await Promise.all([getReminderSettings(db), getSettings(db)]);
  const now = new Date();
  const today = todayISO(now);
  const loggedDates = await listLoggedDates(db, addDays(today, -1), addDays(today, 15));
  const range = weekRange(today, await getWeekStart(db));
  const week = settings.weeklyRecap ? { range, summary: summarize(await listShiftsBetween(db, range.start, range.end)) } : null;
  const plans = planReminders({
    now,
    settings: { ...settings, reportReminder: settings.reportReminder && isPro },
    loggedDates,
    trialEndsOn: isPro && all.trial_ends_at ? all.trial_ends_at : null,
    week,
  });
  return replaceScheduledNotifications(plans);
}
