import type { SQLiteDatabase } from 'expo-sqlite';

import { getWeekStart, getWeeklyGoal, listShiftsBetween } from '@/db/repo';
import { todayISO, weekRange } from '@/lib/dates';
import { buildWidgetSnapshot, type WidgetSnapshot } from '@/lib/widget-snapshot';

/** This week's numbers for the home-screen widgets, straight from the database. */
export async function loadWidgetSnapshot(db: SQLiteDatabase): Promise<WidgetSnapshot> {
  const today = todayISO();
  const [weekStart, goalCents] = await Promise.all([getWeekStart(db), getWeeklyGoal(db)]);
  const week = weekRange(today, weekStart);
  const shifts = await listShiftsBetween(db, week.start, week.end);
  return buildWidgetSnapshot(shifts, today, weekStart, goalCents);
}
