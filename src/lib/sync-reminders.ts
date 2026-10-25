import type { SQLiteDatabase } from 'expo-sqlite';

import { listLoggedDates } from '@/db/repo';
import { getReminderSettings } from '@/db/settings';
import { addDays, todayISO } from '@/lib/dates';
import { replaceScheduledNotifications } from '@/lib/notify';
import { planReminders } from '@/lib/reminders-plan';

/** Re-plans every reminder from current settings and logged shifts. Safe to call often. */
export async function syncReminders(db: SQLiteDatabase, { isPro }: { isPro: boolean }): Promise<number> {
  const settings = await getReminderSettings(db);
  const now = new Date();
  const today = todayISO(now);
  const loggedDates = await listLoggedDates(db, addDays(today, -1), addDays(today, 15));
  const plans = planReminders({
    now,
    settings: { ...settings, reportReminder: settings.reportReminder && isPro },
    loggedDates,
  });
  return replaceScheduledNotifications(plans);
}
