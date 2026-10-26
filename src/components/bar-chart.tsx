import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Bar = {
  key: string;
  label: string;
  value: number;
  /** Optional second value drawn as a ghost bar beside the main one (e.g. last week). */
  compare?: number;
  highlight?: boolean;
};

type Props = {
  bars: Bar[];
  height?: number;
  /** Read by screen readers instead of the bars, which are decorative. */
  accessibilityLabel: string;
};

/** A simple static bar chart built from Views. Static on purpose: it's seen many times a day. */
export function BarChart({ bars, height = 120, accessibilityLabel }: Props) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.flatMap((b) => [b.value, b.compare ?? 0]));
  const hasCompare = bars.some((b) => b.compare !== undefined);
  const barHeight = (v: number) => (v <= 0 ? 0 : Math.max(3, Math.round((v / max) * height)));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.chart}>
      <View style={[styles.plot, { height }]}>
        {bars.map((b) => (
          <View key={b.key} style={styles.column}>
            <View style={styles.bars}>
              {hasCompare ? (
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight(b.compare ?? 0),
                      backgroundColor: theme.backgroundSelected,
                    },
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight(b.value),
                    backgroundColor: b.highlight ? theme.tint : theme.tintSoft,
                  },
                  b.highlight ? null : { borderWidth: 1, borderColor: theme.tint },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      {bars.some((b) => b.label) ? (
        <View style={styles.labels}>
          {bars.map((b) => (
            <ThemedText
              key={b.key}
              type="small"
              themeColor={b.highlight ? 'text' : 'textSecondary'}
              style={[styles.label, b.highlight ? styles.labelHighlight : null]}>
              {b.label}
            </ThemedText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    gap: Spacing.one,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 12,
    borderRadius: Radius.sm / 2,
    borderCurve: 'continuous',
  },
  labels: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
  labelHighlight: {
    fontWeight: 700,
  },
});
