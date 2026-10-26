/**
 * One haptic per user action, fired with the visual it belongs to. Haptics are
 * often off or silent, so they're never the only feedback. Failures are ignored:
 * a missed vibration must never break the action it decorates.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';
const ignore = () => {};

export const haptic = {
  /** A choice changed: chips, segmented options. */
  selection: () => {
    if (supported) Haptics.selectionAsync().catch(ignore);
  },
  /** Something saved. */
  success: () => {
    if (supported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
  },
  /** A destructive action went through. */
  destructive: () => {
    if (supported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(ignore);
  },
};
