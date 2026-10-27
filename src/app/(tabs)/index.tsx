import { useRouter } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart } from '@/components/bar-chart';
import { Button } from '@/components/button';
import { ListGroup } from '@/components/list-group';
import { ProgressRing } from '@/components/progress-ring';
import { ShiftRow } from '@/components/shift-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import {
  countShiftsBetween,
  getSettings,
  getWeekStart,
  getWeeklyGoal,
  listRecentShifts,
  listShiftsBetween,
  setSetting,
} from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import {
  buildDashboardPeriods,
  buildWeekBars,
  dashboardLoadRange,
  goalProgress,
  lastWeekToDate,
  taxSeasonYear,
  type Period,
} from '@/lib/dashboard';
import { formatMonthYear, formatRange, todayISO } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatChange, percentChange } from '@/lib/insights';
import { formatMoney } from '@/lib/money';
import { summarizeRange } from '@/lib/shift-math';
import { usePro } from '@/purchases/pro-context';

const RECENT_LIMIT = 6;

const hourly = (cents: number | null) => (cents === null ? '—' : `${formatMoney(cents)}/hr`);

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { isPro } = usePro();
  const today = todayISO();

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const [weekStart, goalCents, settings] = await Promise.all([getWeekStart(db), getWeeklyGoal(db), getSettings(db)]);
      const taxYear = taxSeasonYear(today, settings.tax_card_dismissed ?? null);
      // Only offer last year's summary when there's something in it.
      const taxYearShifts = taxYear ? await countShiftsBetween(db, `${taxYear}-01-01`, `${taxYear}-12-31`) : 0;
      const range = dashboardLoadRange(today, weekStart);
      const [shifts, recent] = await Promise.all([
        listShiftsBetween(db, range.start, range.end),
        listRecentShifts(db, RECENT_LIMIT),
      ]);
      return {
        periods: buildDashboardPeriods(shifts, today, weekStart),
        bars: buildWeekBars(shifts, today, weekStart),
        lastWeekToDateCents: summarizeRange(shifts, lastWeekToDate(today, weekStart)).totalCents,
        goalCents,
        recent,
        taxYear: taxYearShifts > 0 ? taxYear : null,
      };
    },
    [today],
  );
  const { data, error } = useDbQuery(load);

  const week = data?.periods.week;
  const progress = data && week ? goalProgress(week.summary.totalCents, data.goalCents) : null;
  const change = data && week ? percentChange(data.lastWeekToDateCents, week.summary.totalCents) : null;
  const noShiftsYet = data && data.recent.length === 0;

  return (
    <ThemedView style={styles.screen}>
      {/* The bottom edge keeps the pinned Log shift button above the tab bar: on iOS the
          tab's safe area includes the bar, and on Android the tab content already ends above it. */}
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
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

          <View style={[styles.hero, { backgroundColor: theme.hero }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroMain}>
                <ThemedText type="small" style={{ color: theme.onHero }}>
                  Tips this week
                </ThemedText>
                <ThemedText type="display" style={{ color: theme.onHero }} accessibilityRole="header" adjustsFontSizeToFit numberOfLines={1}>
                  {week ? formatMoney(week.summary.netTipsCents) : ' '}
                </ThemedText>
              </View>
              {progress !== null && data?.goalCents ? (
                <ProgressRing
                  progress={progress}
                  color={theme.heroAccent}
                  trackColor={theme.heroTrack}
                  accessibilityLabel={`Weekly goal: ${Math.round(progress * 100)}% of ${formatMoney(data.goalCents, { wholeDollars: true })}`}>
                  <ThemedText type="smallBold" style={{ color: theme.onHero }}>
                    {Math.round(progress * 100)}%
                  </ThemedText>
                  <ThemedText type="small" style={[styles.ringCaption, { color: theme.onHero }]}>
                    of {formatMoney(data.goalCents, { wholeDollars: true })}
                  </ThemedText>
                </ProgressRing>
              ) : null}
            </View>
            <View style={styles.heroStats}>
              <HeroStat label="Total earned" value={week ? formatMoney(week.summary.totalCents) : '—'} />
              <HeroStat label="Hours" value={week ? formatDuration(week.summary.minutesWorked) : '—'} />
              <HeroStat label="Real hourly" value={week ? hourly(week.summary.realHourlyCents) : '—'} />
            </View>
          </View>

          {data?.taxYear ? (
            <View style={[styles.card, styles.taxCard, { backgroundColor: theme.tintSoft }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Your ${data.taxYear} tip summary is ready. Open reports`}
                onPress={() => router.push({ pathname: '/reports', params: { year: data.taxYear! } })}
                style={styles.taxText}>
                <ThemedText type="smallBold">Your {data.taxYear} tip summary is ready</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Tips, service charges and wages for the whole year, for tax time.
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.tint }}>
                  See it in Reports ›
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                hitSlop={12}
                onPress={() => setSetting(db, 'tax_card_dismissed', data.taxYear!)}>
                <ThemedText themeColor="textSecondary">✕</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {data && !noShiftsYet ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.cardHeader}>
                <ThemedText type="smallBold">Day by day</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {change === null
                    ? 'Total earned'
                    : `${formatChange(change)} vs this time last week`}
                </ThemedText>
              </View>
              <BarChart
                bars={data.bars.map((b) => ({
                  key: b.date,
                  label: b.label,
                  value: b.totalCents,
                  compare: b.lastWeekTotalCents,
                  highlight: b.date === today,
                }))}
                accessibilityLabel={`Total earned per day this week: ${data.bars
                  .map((b) => `${b.label} ${formatMoney(b.totalCents, { wholeDollars: true })}`)
                  .join(', ')}`}
              />
              <View style={styles.legend}>
                <LegendDot color={theme.tint} label="This week" />
                <LegendDot color={theme.backgroundSelected} label="Last week" />
              </View>
            </View>
          ) : null}

          {data && !data.goalCents && !noShiftsYet ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.goalPrompt, { backgroundColor: theme.tintSoft, opacity: pressed ? 0.75 : 1 }]}>
              <ThemedText type="small" style={{ color: theme.tint }}>
                Set a weekly goal to track your progress ›
              </ThemedText>
            </Pressable>
          ) : null}

          <View style={styles.cards}>
            <PeriodCard title={formatMonthYear(today)} period={data?.periods.month} />
            {isPro ? (
              <PeriodCard title={today.slice(0, 4)} period={data?.periods.year} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`See your ${today.slice(0, 4)} totals with Pro`}
                onPress={() => router.push({ pathname: '/paywall', params: { reason: 'year' } })}
                style={[styles.card, styles.halfCard, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {today.slice(0, 4)}
                </ThemedText>
                <ThemedText type="amount" style={{ color: theme.tint }}>
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

          {noShiftsYet ? (
            <View style={[styles.card, styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">No shifts yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Log your first shift. It takes about five seconds, and your tips stay on this phone.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/import')}
                hitSlop={8}
                style={styles.importLink}>
                <ThemedText type="smallBold" style={{ color: theme.tint }}>
                  Switching from another tip app? Import your history ›
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          <ListGroup>
            {data?.recent.map((shift) => (
              <ShiftRow
                key={shift.id}
                shift={shift}
                today={today}
                onPress={() => router.push({ pathname: '/log-shift', params: { id: String(shift.id) } })}
              />
            ))}
          </ListGroup>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Button title="Log shift" onPress={() => router.push('/log-shift')} style={styles.footerMain} />
          <Button title="Scan slip" variant="secondary" onPress={() => router.push('/scan')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.heroStat}>
      <ThemedText type="small" style={{ color: theme.onHero, opacity: 0.8 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: theme.onHero }}>
        {value}
      </ThemedText>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function PeriodCard({ title, period }: { title: string; period?: Period }) {
  const theme = useTheme();
  const s = period?.summary;
  return (
    <View style={[styles.card, styles.halfCard, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedText type="amount">{s ? formatMoney(s.netTipsCents) : '—'}</ThemedText>
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
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroMain: {
    flex: 1,
    gap: Spacing.one,
  },
  ringCaption: {
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.85,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroStat: {
    gap: Spacing.half,
  },
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  taxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taxText: {
    flex: 1,
    gap: Spacing.half,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  goalPrompt: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  cards: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  halfCard: {
    flex: 1,
    gap: Spacing.one,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  emptyText: {
    textAlign: 'center',
  },
  importLink: {
    marginTop: Spacing.two,
  },
  footerMain: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
