import * as StoreReview from 'expo-store-review';
import type { SQLiteDatabase } from 'expo-sqlite';

import { countShifts, getSettings, getWeekStart, listShiftsBetween, setSetting } from '@/db/repo';
import { addDays, todayISO, weekRange } from '@/lib/dates';
import { shouldAskForReview } from '@/lib/pro';
import { summarize } from '@/lib/shift-math';

/** Call after a new shift is saved. Asks for a store rating only when the moment is right. */
export async function maybeAskForReview(db: SQLiteDatabase): Promise<boolean> {
  const today = todayISO();
  const weekStart = await getWeekStart(db);
  const thisWeek = weekRange(today, weekStart);
  const lastWeek = weekRange(addDays(thisWeek.start, -1), weekStart);
  const [shiftCount, settings, thisWeekShifts, lastWeekShifts] = await Promise.all([
    countShifts(db),
    getSettings(db),
    listShiftsBetween(db, thisWeek.start, thisWeek.end),
    listShiftsBetween(db, lastWeek.start, lastWeek.end),
  ]);

  const ask = shouldAskForReview({
    shiftCount,
    thisWeekTipsCents: summarize(thisWeekShifts).netTipsCents,
    lastWeekTipsCents: summarize(lastWeekShifts).netTipsCents,
    lastAskedOn: settings.review_asked_on ?? null,
    today,
  });
  if (!ask || !(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return false;

  await setSetting(db, 'review_asked_on', today);
  await StoreReview.requestReview();
  return true;
}
