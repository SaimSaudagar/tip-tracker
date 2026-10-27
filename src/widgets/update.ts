import type { WidgetSnapshot } from '@/lib/widget-snapshot';

/** Home-screen widgets exist only in the phone apps (see update.ios.ts and update.android.ts). */
export async function updateHomeWidgets(_snapshot: WidgetSnapshot): Promise<void> {}
