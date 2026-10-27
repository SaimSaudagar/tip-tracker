import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { t } from '@/i18n';
import { track } from '@/lib/analytics';
import type { PlannedNotification } from '@/lib/reminders-plan';

/** Identifier prefixes for notifications this app schedules (see planReminders). */
const OWN_PREFIXES = ['shift-', 'report-', 'trial-', 'recap-'];
const CHANNEL_ID = 'reminders';

export const notificationsSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('Reminders'),
      importance: AndroidImportance.DEFAULT,
    });
  }
}

const isAllowed = (p: Notifications.NotificationPermissionsStatus) =>
  p.granted || p.ios?.status === IosAuthorizationStatus.PROVISIONAL;

export async function hasNotificationPermission(): Promise<boolean> {
  return isAllowed(await Notifications.getPermissionsAsync());
}

/** Asks for permission if it hasn't been decided yet. Returns whether notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel(); // Android 13+ won't show the prompt until a channel exists
  if (await hasNotificationPermission()) return true;
  return isAllowed(await Notifications.requestPermissionsAsync());
}

/** Replaces every notification this app scheduled with `plans`. Returns how many were scheduled. */
export async function replaceScheduledNotifications(plans: PlannedNotification[]): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => OWN_PREFIXES.some((prefix) => n.identifier.startsWith(prefix)))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  if (plans.length === 0 || !(await hasNotificationPermission())) return 0;
  await ensureChannel();
  for (const plan of plans) {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: { title: plan.title, body: plan.body, data: { url: plan.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: plan.fireAt, channelId: CHANNEL_ID },
    });
  }
  return plans.length;
}

/**
 * Development helper: fires a sample reminder after `seconds` so notifications can be
 * checked on a phone. Uses a `test-` id so reminder syncing doesn't cancel it.
 */
export async function scheduleTestReminder(seconds = 60): Promise<boolean> {
  if (!(await requestNotificationPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: `test-${Date.now()}`,
    content: {
      title: 'How were tips tonight?',
      body: 'Test reminder. Tap to log a shift.',
      data: { url: '/log-shift' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
  });
  return true;
}

/** Opens the screen a tapped notification points to. */
export function useNotificationRouting() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER || typeof url !== 'string') return;
    Notifications.clearLastNotificationResponse();
    track({ name: 'reminder_opened', kind: response.notification.request.identifier.split('-')[0] });
    router.push(url as Href);
  }, [response, router]);
}
