import { openDatabaseAsync } from 'expo-sqlite';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { loadWidgetSnapshot } from '@/widgets/load';
import { renderWeekWidget } from '@/widgets/android/week-widget';

/** Runs in the background when Android needs the widget drawn; reads the numbers straight from the database. */
export async function widgetTaskHandler({ widgetAction, renderWidget }: WidgetTaskHandlerProps): Promise<void> {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  const db = await openDatabaseAsync(DATABASE_NAME);
  try {
    await migrateDbIfNeeded(db);
    renderWidget(renderWeekWidget(await loadWidgetSnapshot(db)));
  } finally {
    await db.closeAsync();
  }
}
