/**
 * Light, dark or follow the phone. The choice is saved in the `appearance` setting and
 * applied by AppearanceSync in the root layout; useColorScheme reads it from here.
 */
import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

export const APPEARANCE_OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function parseAppearance(value: string | undefined): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

let preference: AppearancePreference = 'system';
const listeners = new Set<() => void>();

export function applyAppearance(next: AppearancePreference) {
  if (next === preference) return;
  preference = next;
  // Native controls (switches, alerts, keyboards, tab bar) follow the override too. The web
  // version has no override, so there only this app's colors change.
  if (Platform.OS !== 'web') Appearance.setColorScheme(next === 'system' ? 'auto' : next);
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useAppearancePreference(): AppearancePreference {
  return useSyncExternalStore(subscribe, () => preference, () => preference);
}
