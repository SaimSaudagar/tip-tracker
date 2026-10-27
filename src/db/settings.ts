/** Typed reads and writes for the key/value settings table. */
import type { SQLiteDatabase } from 'expo-sqlite';

import { getSettings, setSetting } from '@/db/repo';
import type { Weekday } from '@/lib/dates';
import { DEFAULT_REMINDERS, parseTime, type ReminderSettings } from '@/lib/reminders-plan';

export function readReminderSettings(s: Record<string, string>): ReminderSettings {
  const days = (s.reminder_days ?? '0123456')
    .split('')
    .map(Number)
    .filter((d): d is Weekday => Number.isInteger(d) && d >= 0 && d <= 6);
  return {
    enabled: s.reminder_enabled === '1',
    time: s.reminder_time && parseTime(s.reminder_time) ? s.reminder_time : DEFAULT_REMINDERS.time,
    days,
    reportReminder: s.report_reminder === '1',
    weeklyRecap: s.weekly_recap === '1',
  };
}

export async function saveReminderSettings(db: SQLiteDatabase, r: ReminderSettings): Promise<void> {
  await db.withTransactionAsync(async () => {
    await setSetting(db, 'reminder_enabled', r.enabled ? '1' : '0');
    await setSetting(db, 'reminder_time', r.time);
    await setSetting(db, 'reminder_days', [...r.days].sort().join(''));
    await setSetting(db, 'report_reminder', r.reportReminder ? '1' : '0');
    await setSetting(db, 'weekly_recap', r.weeklyRecap ? '1' : '0');
  });
}

export async function getReminderSettings(db: SQLiteDatabase): Promise<ReminderSettings> {
  return readReminderSettings(await getSettings(db));
}
