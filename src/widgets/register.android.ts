/**
 * Registers the task Android runs when a widget is added, resized or due for a refresh,
 * even while the app is closed. Skipped in Expo Go, which lacks the widget module.
 */
export function registerHomeWidgets(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('./android/task-handler') as typeof import('./android/task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // No widget support in this build.
  }
}
