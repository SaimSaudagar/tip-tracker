import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { addDays, formatDayLabel, type ISODate } from '@/lib/dates';

type Props = {
  value: ISODate;
  onChange: (date: ISODate) => void;
  today: ISODate;
  /** Latest date allowed; leave out to allow future dates. */
  max?: ISODate;
  /** Read before the date by screen readers, e.g. "Pay date". */
  label?: string;
};

/** A day picker that steps one day at a time: ‹ Yesterday ›. */
export function DateStepper({ value, onChange, today, max, label }: Props) {
  const theme = useTheme();
  const atMax = max !== undefined && value >= max;
  const prefix = label ? `${label}: ` : '';
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${prefix}${t('previous day')}`}
        onPress={() => onChange(addDays(value, -1))}
        hitSlop={8}
        style={styles.arrow}>
        <ThemedText type="subtitle">‹</ThemedText>
      </Pressable>
      <ThemedText type="smallBold" style={styles.label} accessibilityLabel={`${prefix}${formatDayLabel(value, today)}`}>
        {formatDayLabel(value, today)}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${prefix}${t('next day')}`}
        disabled={atMax}
        onPress={() => onChange(addDays(value, 1))}
        hitSlop={8}
        style={[styles.arrow, { opacity: atMax ? 0.25 : 1 }]}>
        <ThemedText type="subtitle">›</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.two,
  },
  arrow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  label: {
    fontSize: 17,
  },
});
