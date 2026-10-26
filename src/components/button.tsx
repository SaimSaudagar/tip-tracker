import { useState } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Motion, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
};

const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export function Button({ title, variant = 'primary', disabled, style, onPressIn, onPressOut, ...rest }: Props) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const background = { primary: theme.tint, secondary: theme.backgroundElement, danger: 'transparent' }[variant];
  const color = { primary: theme.onTint, secondary: theme.text, danger: theme.danger }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={style}
      {...rest}>
      {/* Press feedback: a slight scale on press-in, so it reads as physical (skipped with Reduce Motion). */}
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: background,
            opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
            transitionProperty: ['transform', 'opacity'],
            transitionDuration: Motion.fast,
            transitionTimingFunction: EASE_OUT,
          },
        ]}>
        <ThemedText type="smallBold" style={[styles.label, { color }]}>
          {title}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  label: {
    fontSize: 17,
  },
});
