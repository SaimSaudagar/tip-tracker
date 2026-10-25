import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? theme.tint : idle }]}>
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
    borderRadius: Spacing.four,
  },
});
