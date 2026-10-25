import type { PlannedNotification } from '@/lib/reminders-plan';

/** Local notifications aren't available on web; reminders only run in the phone app. */
export const notificationsSupported = false;

export async function hasNotificationPermission(): Promise<boolean> {
  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function replaceScheduledNotifications(_plans: PlannedNotification[]): Promise<number> {
  return 0;
}

export function useNotificationRouting() {}
