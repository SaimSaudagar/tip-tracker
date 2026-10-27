/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    tint: '#0B7A4B',
    onTint: '#ffffff',
    tintSoft: '#E3F4EB',
    danger: '#C62828',
    /** The big summary card on Home: brand green by day. */
    hero: '#0B7A4B',
    onHero: '#ffffff',
    heroAccent: '#ffffff',
    heroTrack: 'rgba(255,255,255,0.25)',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    tint: '#34D399',
    onTint: '#04271A',
    tintSoft: '#0F2E22',
    danger: '#FF6B6B',
    /** A deep green at night instead of a bright mint block; mint stays for the goal ring. */
    hero: '#123D2C',
    onHero: '#F2FBF6',
    heroAccent: '#34D399',
    heroTrack: 'rgba(255,255,255,0.14)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** boxShadow strings; use on light surfaces only (dark mode relies on contrast). */
export const Shadows = {
  card: '0 1px 2px rgba(0, 0, 0, 0.06)',
  raised: '0 8px 24px rgba(0, 0, 0, 0.16)',
} as const;

export const Motion = {
  /** Press feedback, chip changes. */
  fast: 120,
  /** Toasts and other enter/exit transitions. */
  base: 250,
} as const;

/** Money and stats: the rounded system face, with digits that line up in columns. */
export const NumberFont = {
  fontFamily: Fonts?.rounded,
  fontVariant: ['tabular-nums'],
} as const;

/**
 * Rough tab bar height, only for overlays drawn outside the tabs (the toast). Tab screens
 * use the safe area instead, which knows the real height on every device.
 */
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** On web, native tabs fall back to a floating bar at the top of the screen. */
export const TopTabInset = Platform.select({ web: 64 }) ?? 0;
export const MaxContentWidth = 800;
/** Two-column dashboards on wide screens (see useWideLayout). */
export const WideContentWidth = 1200;
