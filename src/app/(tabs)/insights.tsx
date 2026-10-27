import { useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart } from '@/components/bar-chart';
import { Button } from '@/components/button';
import { ListGroup } from '@/components/list-group';
import { ShiftRow } from '@/components/shift-row';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { getWeekStart, listShiftsBetween } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { formatDuration } from '@/lib/duration';
import { buildInsights, formatChange, insightsLoadRange, percentChange } from '@/lib/insights';
import { formatMoney, formatPercent } from '@/lib/money';
import { formatShortDate } from '@/lib/reminders-plan';
import type { PeriodSummary } from '@/lib/shift-math';
import { usePro } from '@/purchases/pro-context';

const TREND_WEEKS = 12;

const hourly = (cents: number | null) => (cents === null ? '—' : `${formatMoney(cents)}/hr`);

export default function InsightsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isPro } = usePro();
  const today = useToday();

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const weekStart = await getWeekStart(db);
      const range = insightsLoadRange(today, weekStart, TREND_WEEKS);
      const shifts = await listShiftsBetween(db, range.start, range.end);
      return {
        shifts,
        insights: buildInsights(shifts, today, weekStart, TREND_WEEKS),
      };
    },
    [today],
  );
  const { data, error } = useDbQuery(load);
  const insights = data?.insights;

  const showPaywall = () => router.push({ pathname: '/paywall', params: { reason: 'insights' } });
  const editShift = (id: number) => router.push({ pathname: '/log-shift', params: { id: String(id) } });

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="subtitle" accessibilityRole="header">
            Insights
          </ThemedText>

          {error ? (
            <ThemedText style={{ color: theme.danger }}>Couldn’t load your shifts: {error.message}</ThemedText>
          ) : null}

          {!isPro ? (
            <View style={[styles.card, { backgroundColor: theme.tintSoft }]}>
              <ThemedText type="amount" style={{ color: theme.tint }}>
                See what pays best
              </ThemedText>
              <ThemedText type="small">Pro looks across your shifts so you can pick up the right ones:</ThemedText>
              {[
                'Your best day of the week, by real hourly',
                'Lunch vs dinner shifts',
                'Twelve weeks of earnings at a glance',
                'Your best shifts and your tips as a share of sales',
              ].map((line) => (
                <View key={line} style={styles.bullet}>
                  <ThemedText style={{ color: theme.tint }}>✓</ThemedText>
                  <ThemedText type="small" style={styles.bulletText}>
                    {line}
                  </ThemedText>
                </View>
              ))}
              {insights?.bestWeekday ? (
                <ThemedText type="smallBold">Your best day is already in your data.</ThemedText>
              ) : null}
              <Button title="Unlock with Pro" onPress={showPaywall} />
            </View>
          ) : insights && insights.shiftCount === 0 ? (
            <View style={[styles.card, styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Nothing to show yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Log a few shifts and your patterns show up here: your best days, lunch vs dinner, and how your weeks are
                trending.
              </ThemedText>
            </View>
          ) : insights && data ? (
            <>
              <MonthCard
                thisMonth={insights.monthToDate.thisMonth}
                lastMonth={insights.monthToDate.lastMonth}
                dayOfMonth={insights.monthToDate.dayOfMonth}
              />

              <Card title="Best day">
                <ThemedText type="amount">
                  {insights.bestWeekday ? `${insights.bestWeekday.name}s` : 'Not enough shifts yet'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {insights.bestWeekday
                    ? `${hourly(insights.bestWeekday.realHourlyCents)} real hourly, tips plus wages, over the last ${TREND_WEEKS} weeks.`
                    : 'Log at least two shifts on two different days of the week to see which pays best.'}
                </ThemedText>
                <BarChart
                  bars={insights.byWeekday.map((d) => ({
                    key: String(d.weekday),
                    label: d.label.slice(0, 2),
                    value: d.summary.realHourlyCents ?? 0,
                    highlight: d.weekday === insights.bestWeekday?.weekday,
                  }))}
                  accessibilityLabel={`Real hourly by day: ${insights.byWeekday
                    .map(
                      (d) =>
                        `${d.label} ${d.summary.realHourlyCents === null ? 'no shifts' : hourly(d.summary.realHourlyCents)}`,
                    )
                    .join(', ')}`}
                />
              </Card>

              <Card title="Lunch vs dinner">
                {insights.byPeriod.am.shiftCount + insights.byPeriod.pm.shiftCount === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Tag shifts as Lunch or Dinner when you log them, and they’ll be compared here.
                  </ThemedText>
                ) : (
                  <View style={styles.split}>
                    <PeriodColumn label="Lunch · AM" summary={insights.byPeriod.am} />
                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                    <PeriodColumn label="Dinner · PM" summary={insights.byPeriod.pm} />
                  </View>
                )}
                {insights.byPeriod.untagged > 0 &&
                insights.byPeriod.am.shiftCount + insights.byPeriod.pm.shiftCount > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {insights.byPeriod.untagged} shift
                    {insights.byPeriod.untagged === 1 ? ' isn’t' : 's aren’t'} tagged and not counted.
                  </ThemedText>
                ) : null}
              </Card>

              <Card title={`Last ${TREND_WEEKS} weeks`}>
                <WeeklyTrend points={insights.weeklyTrend} />
              </Card>

              {insights.bestShifts.length > 0 ? (
                <View style={styles.section}>
                  <SectionTitle>Best shifts by real hourly</SectionTitle>
                  <ListGroup>
                    {insights.bestShifts.map((best) => {
                      const shift = data.shifts.find((s) => s.id === best.id);
                      return shift ? (
                        <ShiftRow key={best.id} shift={shift} today={today} onPress={() => editShift(best.id)} />
                      ) : null;
                    })}
                  </ListGroup>
                </View>
              ) : null}

              <Card title="Tips vs sales">
                {insights.tipRateOfSales ? (
                  <>
                    <ThemedText type="amount">{formatPercent(insights.tipRateOfSales.bps)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Cash and card tips as a share of your sales, across {insights.tipRateOfSales.shifts} shift
                      {insights.tipRateOfSales.shifts === 1 ? '' : 's'} with sales logged.
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Add your sales when you log a shift to see what share of them you take home in tips.
                  </ThemedText>
                )}
              </Card>

              {insights.tipsPerCover ? (
                <Card title="Tips per guest">
                  <ThemedText type="amount">{formatMoney(insights.tipsPerCover.cents)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Cash and card tips per cover, across {insights.tipsPerCover.shifts} shift
                    {insights.tipsPerCover.shifts === 1 ? '' : 's'} with covers logged.
                  </ThemedText>
                </Card>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

function MonthCard({
  thisMonth,
  lastMonth,
  dayOfMonth,
}: {
  thisMonth: PeriodSummary;
  lastMonth: PeriodSummary;
  dayOfMonth: number;
}) {
  const theme = useTheme();
  const change = percentChange(lastMonth.totalCents, thisMonth.totalCents);
  return (
    <Card title="This month so far">
      <ThemedText type="amount">{formatMoney(thisMonth.totalCents)}</ThemedText>
      <ThemedText
        type="small"
        style={{
          color: change === null ? theme.textSecondary : change >= 0 ? theme.tint : theme.danger,
        }}>
        {change === null
          ? 'Nothing logged in the same days last month to compare with.'
          : `${formatChange(change)} vs the first ${dayOfMonth} day${dayOfMonth === 1 ? '' : 's'} of last month (${formatMoney(lastMonth.totalCents)})`}
      </ThemedText>
      <View style={styles.split}>
        <Stat label="Tips" value={formatMoney(thisMonth.netTipsCents)} />
        <Stat label="Hours" value={formatDuration(thisMonth.minutesWorked)} />
        <Stat label="Real hourly" value={hourly(thisMonth.realHourlyCents)} />
      </View>
    </Card>
  );
}

function PeriodColumn({ label, summary }: { label: string; summary: PeriodSummary }) {
  return (
    <View style={styles.column}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="amount">{hourly(summary.realHourlyCents)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {summary.shiftCount === 0
          ? 'No shifts'
          : `${summary.shiftCount} shift${summary.shiftCount === 1 ? '' : 's'} · ${formatMoney(Math.round(summary.netTipsCents / summary.shiftCount))} tips each`}
      </ThemedText>
    </View>
  );
}

function WeeklyTrend({ points }: { points: ReturnType<typeof buildInsights>['weeklyTrend'] }) {
  const worked = points.filter((p) => p.summary.shiftCount > 0);
  const average =
    worked.length > 0 ? Math.round(worked.reduce((sum, p) => sum + p.summary.totalCents, 0) / worked.length) : null;
  const best = worked.reduce<(typeof points)[number] | null>(
    (top, p) => (top === null || p.summary.totalCents > top.summary.totalCents ? p : top),
    null,
  );
  return (
    <>
      <ThemedText type="amount">
        {average === null ? '—' : `${formatMoney(average, { wholeDollars: true })} a week`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {best
          ? `Average total earned in weeks you worked. Best week: ${formatShortDate(best.range.start)}, ${formatMoney(best.summary.totalCents, { wholeDollars: true })}.`
          : 'No shifts in the last few weeks.'}
      </ThemedText>
      <BarChart
        height={100}
        bars={points.map((p, i) => ({
          key: p.range.start,
          label: '',
          value: p.summary.totalCents,
          highlight: i === points.length - 1,
        }))}
        accessibilityLabel={`Total earned per week: ${points
          .map(
            (p) =>
              `week of ${formatShortDate(p.range.start)} ${formatMoney(p.summary.totalCents, { wholeDollars: true })}`,
          )
          .join(', ')}`}
      />
      <View style={styles.axis}>
        <ThemedText type="small" themeColor="textSecondary">
          {points.length > 0 ? formatShortDate(points[0].range.start) : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          This week
        </ThemedText>
      </View>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.column}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
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
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  bullet: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bulletText: {
    flex: 1,
  },
  split: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  column: {
    flex: 1,
    gap: Spacing.half,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
