import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Shift } from '@/db/repo';
import { formatDayLabel, type ISODate } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { computeShift } from '@/lib/shift-math';
import { useTheme } from '@/hooks/use-theme';

type Props = { shift: Shift; today: ISODate; onPress: () => void };

export function ShiftRow({ shift, today, onPress }: Props) {
  const theme = useTheme();
  const totals = computeShift(shift);
  const details = [
    shift.minutesWorked > 0 ? formatDuration(shift.minutesWorked) : null,
    totals.realHourlyCents !== null ? `${formatMoney(totals.realHourlyCents)}/hr` : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDayLabel(shift.date, today)}, ${formatMoney(totals.netTipsCents)} in tips. Edit shift`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <View style={styles.left}>
        <ThemedText type="smallBold">{formatDayLabel(shift.date, today)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {shift.positionName}
          {shift.notes ? ` · ${shift.notes}` : ''}
        </ThemedText>
      </View>
      <View style={styles.right}>
        <ThemedText type="smallBold" style={styles.amount}>
          {formatMoney(totals.netTipsCents)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {details.join(' · ') || 'tips only'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  left: {
    flex: 1,
    gap: Spacing.half,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  amount: {
    fontSize: 17,
  },
});
