import { useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ShiftRow } from '@/components/shift-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { getWeekStart, listRecentShifts, listShiftsBetween } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { buildDashboardPeriods, dashboardLoadRange, type Period } from '@/lib/dashboard';
import { formatMonthYear, formatRange, todayISO } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { usePro } from '@/purchases/pro-context';

const RECENT_LIMIT = 8;

const hourly = (cents: number | null) => (cents === null ? '—' : `${formatMoney(cents)}/hr`);

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isPro } = usePro();
  const today = todayISO();

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const weekStart = await getWeekStart(db);
      const range = dashboardLoadRange(today, weekStart);
      const [shifts, recent] = await Promise.all([
        listShiftsBetween(db, range.start, range.end),
        listRecentShifts(db, RECENT_LIMIT),
      ]);
      return { periods: buildDashboardPeriods(shifts, today, weekStart), recent };
    },
    [today],
  );
  const { data, error } = useDbQuery(load);

  const week = data?.periods.week;
  const logShift = () => router.push('/log-shift');

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <View style={styles.header}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              THIS WEEK
            </ThemedText>
            {week ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatRange(week.range, today)}
              </ThemedText>
            ) : null}
          </View>

          {error ? (
            <ThemedText style={{ color: theme.danger }}>Couldn’t load your shifts: {error.message}</ThemedText>
          ) : null}

          <View style={[styles.hero, { backgroundColor: theme.tint }]}>
            <ThemedText type="small" style={{ color: theme.onTint }}>
              Tips this week
            </ThemedText>
            <ThemedText style={[styles.heroAmount, { color: theme.onTint }]} accessibilityRole="header">
              {week ? formatMoney(week.summary.netTipsCents) : ' '}
            </ThemedText>
            <View style={styles.heroStats}>
              <HeroStat label="Total earned" value={week ? formatMoney(week.summary.totalCents) : '—'} />
              <HeroStat label="Hours" value={week ? formatDuration(week.summary.minutesWorked) : '—'} />
              <HeroStat label="Real hourly" value={week ? hourly(week.summary.realHourlyCents) : '—'} />
            </View>
          </View>

          <View style={styles.cards}>
            <PeriodCard title={formatMonthYear(today)} period={data?.periods.month} />
            {isPro ? (
              <PeriodCard title={today.slice(0, 4)} period={data?.periods.year} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`See your ${today.slice(0, 4)} totals with Pro`}
                onPress={() => router.push({ pathname: '/paywall', params: { reason: 'year' } })}
                style={[styles.card, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {today.slice(0, 4)}
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.cardAmount, { color: theme.tint }]}>
                  Your year
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.tint }}>
                  See it with Pro ›
                </ThemedText>
              </Pressable>
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            RECENT SHIFTS
          </ThemedText>

          {data && data.recent.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">No shifts yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Log your first shift. It takes about five seconds, and your tips stay on this phone.
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.list}>
            {data?.recent.map((shift) => (
              <ShiftRow
                key={shift.id}
                shift={shift}
                today={today}
                onPress={() => router.push({ pathname: '/log-shift', params: { id: String(shift.id) } })}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Button title="Log shift" onPress={logShift} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.heroStat}>
      <ThemedText type="small" style={{ color: theme.onTint, opacity: 0.8 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: theme.onTint }}>
        {value}
      </ThemedText>
    </View>
  );
}

function PeriodCard({ title, period }: { title: string; period?: Period }) {
  const theme = useTheme();
  const s = period?.summary;
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.cardAmount}>
        {s ? formatMoney(s.netTipsCents) : '—'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {!s ? ' ' : s.shiftCount === 0 ? 'No shifts yet' : `${hourly(s.realHourlyCents)} · ${formatDuration(s.minutesWorked)}`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingTop: Spacing.three + TopTabInset,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.two,
  },
  hero: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroAmount: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: 700,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  heroStat: {
    gap: Spacing.half,
  },
  cards: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  card: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardAmount: {
    fontSize: 24,
    lineHeight: 32,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  empty: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three + BottomTabInset,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
