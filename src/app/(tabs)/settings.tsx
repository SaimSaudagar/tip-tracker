import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { getWeekStart, listAllShifts, listPositions, setWeekStart, type Position } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { todayISO, type Weekday } from '@/lib/dates';
import { shareCsvFile } from '@/lib/files';
import { formatMoney, formatPercent } from '@/lib/money';
import { shiftsToCsv } from '@/lib/transfer';

function describePosition(p: Position) {
  const wage = p.hourlyWageCents > 0 ? `${formatMoney(p.hourlyWageCents)}/hr` : 'No hourly wage';
  const rule =
    p.tipOutRule === 'fixed'
      ? `tip-out ${formatMoney(p.tipOutValue)}`
      : p.tipOutRule === 'pct_tips'
        ? `tip-out ${formatPercent(p.tipOutValue)} of tips`
        : p.tipOutRule === 'pct_sales'
          ? `tip-out ${formatPercent(p.tipOutValue)} of sales`
          : null;
  return [wage, rule].filter(Boolean).join(' · ');
}

const WEEK_STARTS: { value: Weekday; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const load = useCallback(async (database: SQLiteDatabase) => {
    const [positions, weekStart] = await Promise.all([listPositions(database), getWeekStart(database)]);
    return { positions, weekStart };
  }, []);
  const { data } = useDbQuery(load);

  const exportCsv = async () => {
    setExportMessage(null);
    try {
      const shifts = await listAllShifts(db);
      if (shifts.length === 0) {
        setExportMessage('No shifts to export yet.');
        return;
      }
      await shareCsvFile(`tips-${todayISO()}.csv`, shiftsToCsv(shifts));
      setExportMessage(`Exported ${shifts.length} shift${shifts.length === 1 ? '' : 's'}.`);
    } catch (e) {
      setExportMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="subtitle" accessibilityRole="header">
            Settings
          </ThemedText>

          <Section title="JOBS & POSITIONS">
            {data?.positions.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${p.name} at ${p.jobName}`}
                onPress={() => router.push({ pathname: '/position', params: { id: String(p.id) } })}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold">
                  {p.name} · {p.jobName}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {describePosition(p)}
                </ThemedText>
              </Pressable>
            ))}
            <Button title="Add a position" variant="secondary" onPress={() => router.push('/position')} />
            <ThemedText type="small" themeColor="textSecondary">
              Set a wage and tip-out rule per position. Server and bartender at the same place can differ.
            </ThemedText>
          </Section>

          <Section title="WEEK STARTS ON">
            <View style={styles.segment}>
              {WEEK_STARTS.map(({ value, label }) => {
                const selected = data?.weekStart === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Week starts on ${label}`}
                    accessibilityState={{ selected }}
                    onPress={() => setWeekStart(db, value)}
                    style={[styles.segmentItem, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
                    <ThemedText type="smallBold" style={{ color: selected ? theme.onTint : theme.text }}>
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="YOUR DATA">
            <ThemedText type="small" themeColor="textSecondary">
              Your tips are stored only on this phone and included in your phone’s regular backups. No account, no
              ads.
            </ThemedText>
            <Button title="Export all shifts (CSV)" variant="secondary" onPress={exportCsv} />
            {exportMessage ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                {exportMessage}
              </ThemedText>
            ) : null}
            <Button title="Import from another app (CSV)" variant="secondary" onPress={() => router.push('/import')} />
          </Section>

          <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
            Tip Tracker {Constants.expoConfig?.version ?? ''} · Records only, not tax advice.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingTop: Spacing.three + TopTabInset,
    paddingBottom: Spacing.five + BottomTabInset,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  version: {
    textAlign: 'center',
  },
});
