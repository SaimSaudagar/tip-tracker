import { openDatabaseAsync } from 'expo-sqlite';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { getSettings } from '@/db/repo';
import { applyLanguagePreference, parseLanguagePreference } from '@/i18n';
import { loadWidgetSnapshot } from '@/widgets/load';
import { renderWeekWidget } from '@/widgets/android/week-widget';

/** Runs in the background when Android needs the widget drawn; reads the numbers straight from the database. */
export async function widgetTaskHandler({ widgetAction, renderWidget }: WidgetTaskHandlerProps): Promise<void> {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  const db = await openDatabaseAsync(DATABASE_NAME);
  try {
    await migrateDbIfNeeded(db);
    // This can run without the app open, so pick up the language chosen in Settings here.
    applyLanguagePreference(parseLanguagePreference((await getSettings(db)).language));
    renderWidget(renderWeekWidget(await loadWidgetSnapshot(db)));
  } finally {
    await db.closeAsync();
  }
}
