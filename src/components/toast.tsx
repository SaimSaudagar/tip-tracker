import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Motion, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Toast = { title: string; detail?: string; celebrate?: boolean };

const VISIBLE_MS = 3500;

// A tiny module-level store: any screen can show a toast; the host in the root layout renders it.
let current: (Toast & { id: number }) | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

export function showToast(toast: Toast) {
  current = { ...toast, id: nextId++ };
  listeners.forEach((l) => l());
  AccessibilityInfo.announceForAccessibility(toast.detail ? `${toast.title}. ${toast.detail}` : toast.title);
}

function dismiss(id: number) {
  if (current?.id !== id) return;
  current = null;
  listeners.forEach((l) => l());
}

/** Renders the current toast above the tab bar. Mount once, in the root layout. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(current);

  useEffect(() => {
    const listener = () => setToast(current);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismiss(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + BottomTabInset + 84 }]}>
      <Animated.View
        key={toast.id}
        entering={FadeInDown.duration(Motion.base).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(Motion.base).reduceMotion(ReduceMotion.System)}
        style={[styles.toast, { backgroundColor: theme.text, boxShadow: Shadows.raised }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${toast.title}. Dismiss`}
          onPress={() => dismiss(toast.id)}
          style={styles.content}>
          {toast.celebrate ? <View style={[styles.dot, { backgroundColor: theme.tint }]} /> : null}
          <View style={styles.text}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {toast.title}
            </ThemedText>
            {toast.detail ? (
              <ThemedText type="small" style={{ color: theme.background, opacity: 0.8 }}>
                {toast.detail}
              </ThemedText>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
