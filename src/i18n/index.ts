/**
 * The app's text in English and Spanish. Text is written in English in the code and wrapped
 * in t(); src/i18n/es.ts maps each English string to Spanish. A test checks that every t()
 * string has a translation, with the same {placeholders}.
 *
 * The language follows the phone unless Settings picks one. Changing it remounts the screens
 * (see LanguageSync in the root layout), so text read during render is always current.
 */
import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';

import { es } from '@/i18n/es';

export type Language = 'en' | 'es';
export type LanguagePreference = 'system' | Language;

export const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'system', label: msg('Automatic') },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

const TRANSLATIONS: Record<Exclude<Language, 'en'>, Record<string, string>> = { es };

function deviceLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

let current: Language = deviceLanguage();
const listeners = new Set<() => void>();

export function parseLanguagePreference(value: string | undefined): LanguagePreference {
  return value === 'en' || value === 'es' ? value : 'system';
}

export function applyLanguagePreference(preference: LanguagePreference) {
  const next = preference === 'system' ? deviceLanguage() : preference;
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

export function getLanguage(): Language {
  return current;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The current language, re-rendering when it changes. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, () => current, () => current);
}

/**
 * Translates English UI text into the current language, falling back to the English.
 * `{name}` placeholders are filled from `params`.
 */
export function t(text: string, params?: Record<string, string | number>): string {
  const translated = current === 'en' ? text : (TRANSLATIONS[current][text] ?? text);
  if (!params) return translated;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match));
}

/**
 * Marks English text kept in a list outside render, so the translation test finds it. Pass
 * it through t() where it's shown.
 */
export function msg(text: string): string {
  return text;
}

/** Picks the English or Spanish version of something that isn't a single string (word lists, formats). */
export function byLanguage<T>(values: Record<Language, T>): T {
  return values[current];
}
