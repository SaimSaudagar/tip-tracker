/**
 * The whole reminder chain against a real database: settings and logged shifts in, the
 * notifications that would be scheduled out (expo-notifications itself is mocked away).
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { listPositions, saveShift, setSetting } from '@/db/repo';
import { openMemoryDb } from '@/db/testing/memory-db';
import type { PlannedNotification } from '@/lib/reminders-plan';
import { syncReminders } from '@/lib/sync-reminders';

const scheduled: PlannedNotification[][] = [];
jest.mock('@/lib/notify', () => ({
  replaceScheduledNotifications: async (plans: PlannedNotification[]) => {
    scheduled.push(plans);
    return plans.length;
  },
}));

let db: SQLiteDatabase;

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 27, 15, 0), doNotFake: ['setImmediate', 'nextTick'] });
  scheduled.length = 0;
  db = await openMemoryDb();
  const [position] = await listPositions(db);
  await saveShift(db, {
    positionId: position.id,
    date: '2026-10-26',
    minutesWorked: 390,
    hourlyWageCents: 213,
    cashTipsCents: 8500,
    cardTipsCents: 14250,
    tipInCents: 0,
    tipOutCents: 0,
    serviceChargeCents: 0,
    salesCents: null,
    notes: null,
  });
});

afterEach(() => jest.useRealTimers());

it('schedules the weekly recap with this week’s totals when it’s on', async () => {
  await setSetting(db, 'weekly_recap', '1');
  await syncReminders(db, { isPro: false });
  const ids = scheduled[0].map((p) => p.id);
  expect(ids).toEqual(['recap-2026-10-25']);
  expect(scheduled[0][0]).toMatchObject({
    title: 'Your week: $227.50 in tips',
    fireAt: new Date(2026, 10, 1, 11, 0),
  });
});

it('follows the week start setting and the other reminders', async () => {
  await setSetting(db, 'weekly_recap', '1');
  await setSetting(db, 'week_start', '1'); // Monday: this week is Oct 26 – Nov 1
  await setSetting(db, 'reminder_enabled', '1');
  await setSetting(db, 'reminder_days', '5'); // Fridays
  await syncReminders(db, { isPro: false });
  expect(scheduled[0].map((p) => p.id)).toEqual(['shift-2026-10-30', 'recap-2026-10-26', 'shift-2026-11-06']);
});

it('schedules nothing with everything off', async () => {
  await syncReminders(db, { isPro: false });
  expect(scheduled[0]).toEqual([]);
});
