import { ExtensionStorage } from '@bacons/apple-targets';

import { APP_GROUP } from '@/constants/app';
import type { WidgetSnapshot } from '@/lib/widget-snapshot';

const storage = new ExtensionStorage(APP_GROUP);

/**
 * Hands the numbers to the widget (targets/widget) through the shared App Group and asks
 * iOS to redraw it. In Expo Go the storage module is missing and this quietly does nothing.
 */
export async function updateHomeWidgets(snapshot: WidgetSnapshot): Promise<void> {
  storage.set('week', snapshot);
  ExtensionStorage.reloadWidget();
}
