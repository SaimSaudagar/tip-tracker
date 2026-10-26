import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/haptics';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Read by screen readers instead of `label` when the visible text needs context. */
  accessibilityLabel?: string;
  background?: 'element' | 'page';
};

/** A selectable pill, used for single- and multi-choice options. */
export function Chip({ label, selected, onPress, accessibilityLabel, background = 'element' }: Props) {
  const theme = useTheme();
  const idle = background === 'page' ? theme.background : theme.backgroundElement;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) haptic.selection();
        onPress();
      }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? theme.tint : idle, opacity: pressed ? 0.75 : 1 },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
});
