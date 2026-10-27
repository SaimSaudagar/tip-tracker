import type { WidgetSnapshot } from '@/lib/widget-snapshot';

/** Redraws any Tipbook widgets on the home screen. Does nothing in Expo Go, which lacks the widget module. */
export async function updateHomeWidgets(snapshot: WidgetSnapshot): Promise<void> {
  let widgets: typeof import('react-native-android-widget');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    widgets = require('react-native-android-widget');
  } catch {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderWeekWidget } = require('./android/week-widget') as typeof import('./android/week-widget');
  await widgets.requestWidgetUpdate({ widgetName: 'WeekWidget', renderWidget: () => renderWeekWidget(snapshot) });
}
