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
import { t } from '@/i18n';
import { formatShortDate } from '@/lib/dates';
import { formatDuration, spokenDuration } from '@/lib/duration';
import { buildInsights, formatChange, insightsLoadRange, percentChange } from '@/lib/insights';
import { formatHourly, formatMoney, formatPercent, spokenHourly } from '@/lib/money';
import type { PeriodSummary } from '@/lib/shift-math';
import { usePro } from '@/purchases/pro-context';

const TREND_WEEKS = 12;

const hourly = (cents: number | null) => (cents === null ? '—' : formatHourly(cents));
const shiftCount = (count: number) => (count === 1 ? t('1 shift') : t('{count} shifts', { count }));

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
            {t('Insights')}
          </ThemedText>

          {error ? (
            <ThemedText style={{ color: theme.danger }}>{t('Couldn’t load your shifts: {error}', { error: error.message })}</ThemedText>
          ) : null}

          {!isPro ? (
            <View style={[styles.card, { backgroundColor: theme.tintSoft }]}>
              <ThemedText type="amount" style={{ color: theme.tint }}>
                {t('See what pays best')}
              </ThemedText>
              <ThemedText type="small">{t('Pro looks across your shifts so you can pick up the right ones:')}</ThemedText>
              {[
                t('Your best day of the week, by real hourly'),
                t('Lunch vs dinner shifts'),
                t('Twelve weeks of earnings at a glance'),
                t('Your best shifts and your tips as a share of sales'),
              ].map((line) => (
                <View key={line} style={styles.bullet}>
                  <ThemedText style={{ color: theme.tint }}>✓</ThemedText>
                  <ThemedText type="small" style={styles.bulletText}>
                    {line}
                  </ThemedText>
                </View>
              ))}
              {insights?.bestWeekday ? (
                <ThemedText type="smallBold">{t('Your best day is already in your data.')}</ThemedText>
              ) : null}
              <Button title={t('Unlock with Pro')} onPress={showPaywall} />
            </View>
          ) : insights && insights.shiftCount === 0 ? (
            <View style={[styles.card, styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">{t('Nothing to show yet')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t(
                  'Log a few shifts and your patterns show up here: your best days, lunch vs dinner, and how your weeks are trending.',
                )}
              </ThemedText>
            </View>
          ) : insights && data ? (
            <>
              <MonthCard
                thisMonth={insights.monthToDate.thisMonth}
                lastMonth={insights.monthToDate.lastMonth}
                dayOfMonth={insights.monthToDate.dayOfMonth}
              />

              <Card title={t('Best day')}>
                <ThemedText type="amount">
                  {insights.bestWeekday ? insights.bestWeekday.name : t('Not enough shifts yet')}
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  accessibilityLabel={
                    insights.bestWeekday?.realHourlyCents != null
                      ? t('{amount} an hour, tips plus wages, over the last {weeks} weeks.', {
                          amount: formatMoney(insights.bestWeekday.realHourlyCents),
                          weeks: TREND_WEEKS,
                        })
                      : undefined
                  }>
                  {insights.bestWeekday
                    ? t('{hourly} real hourly, tips plus wages, over the last {weeks} weeks.', {
                        hourly: hourly(insights.bestWeekday.realHourlyCents),
                        weeks: TREND_WEEKS,
                      })
                    : t('Log at least two shifts on two different days of the week to see which pays best.')}
                </ThemedText>
                <BarChart
                  bars={insights.byWeekday.map((d) => ({
                    key: String(d.weekday),
                    label: d.label.slice(0, 2),
                    value: d.summary.realHourlyCents ?? 0,
                    highlight: d.weekday === insights.bestWeekday?.weekday,
                  }))}
                  accessibilityLabel={t('Real hourly by day: {days}', {
                    days: insights.byWeekday
                      .map(
                        (d) =>
                          `${d.label} ${d.summary.realHourlyCents === null ? t('no shifts') : spokenHourly(d.summary.realHourlyCents)}`,
                      )
                      .join(', '),
                  })}
                />
              </Card>

              <Card title={t('Lunch vs dinner')}>
                {insights.byPeriod.am.shiftCount + insights.byPeriod.pm.shiftCount === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('Tag shifts as Lunch or Dinner when you log them, and they’ll be compared here.')}
                  </ThemedText>
                ) : (
                  <View style={styles.split}>
                    <PeriodColumn label={t('Lunch · AM')} summary={insights.byPeriod.am} />
                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                    <PeriodColumn label={t('Dinner · PM')} summary={insights.byPeriod.pm} />
                  </View>
                )}
                {insights.byPeriod.untagged > 0 &&
                insights.byPeriod.am.shiftCount + insights.byPeriod.pm.shiftCount > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {insights.byPeriod.untagged === 1
                      ? t('1 shift isn’t tagged and not counted.')
                      : t('{count} shifts aren’t tagged and not counted.', { count: insights.byPeriod.untagged })}
                  </ThemedText>
                ) : null}
              </Card>

              <Card title={t('Last {weeks} weeks', { weeks: TREND_WEEKS })}>
                <WeeklyTrend points={insights.weeklyTrend} />
              </Card>

              {insights.bestShifts.length > 0 ? (
                <View style={styles.section}>
                  <SectionTitle>{t('Best shifts by real hourly')}</SectionTitle>
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

              <Card title={t('Tips vs sales')}>
                {insights.tipRateOfSales ? (
                  <>
                    <ThemedText type="amount">{formatPercent(insights.tipRateOfSales.bps)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('Cash and card tips as a share of your sales, across {shifts} with sales logged.', {
                        shifts: shiftCount(insights.tipRateOfSales.shifts),
                      })}
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('Add your sales when you log a shift to see what share of them you take home in tips.')}
                  </ThemedText>
                )}
              </Card>

              {insights.tipsPerCover ? (
                <Card title={t('Tips per guest')}>
                  <ThemedText type="amount">{formatMoney(insights.tipsPerCover.cents)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('Cash and card tips per guest, across {shifts} with guests logged.', {
                      shifts: shiftCount(insights.tipsPerCover.shifts),
                    })}
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
    <Card title={t('This month so far')}>
      <ThemedText type="amount">{formatMoney(thisMonth.totalCents)}</ThemedText>
      <ThemedText
        type="small"
        style={{
          color: change === null ? theme.textSecondary : change >= 0 ? theme.tint : theme.danger,
        }}>
        {change === null
          ? t('Nothing logged in the same days last month to compare with.')
          : dayOfMonth === 1
            ? t('{change} vs the first day of last month ({amount})', {
                change: formatChange(change),
                amount: formatMoney(lastMonth.totalCents),
              })
            : t('{change} vs the first {days} days of last month ({amount})', {
                change: formatChange(change),
                days: dayOfMonth,
                amount: formatMoney(lastMonth.totalCents),
              })}
      </ThemedText>
      <View style={[styles.split, styles.stats]}>
        <Stat label={t('Tips')} value={formatMoney(thisMonth.netTipsCents)} />
        <Stat
          label={t('Hours')}
          value={formatDuration(thisMonth.minutesWorked)}
          spokenValue={spokenDuration(thisMonth.minutesWorked)}
        />
        <Stat
          label={t('Real hourly')}
          value={hourly(thisMonth.realHourlyCents)}
          spokenValue={thisMonth.realHourlyCents === null ? undefined : spokenHourly(thisMonth.realHourlyCents)}
        />
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
      <ThemedText
        type="amount"
        accessibilityLabel={summary.realHourlyCents === null ? undefined : spokenHourly(summary.realHourlyCents)}>
        {hourly(summary.realHourlyCents)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {summary.shiftCount === 0
          ? t('No shifts')
          : `${shiftCount(summary.shiftCount)} · ${t('{amount} tips each', {
              amount: formatMoney(Math.round(summary.netTipsCents / summary.shiftCount)),
            })}`}
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
        {average === null ? '—' : t('{amount} a week', { amount: formatMoney(average, { wholeDollars: true }) })}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {best
          ? t('Average total earned in weeks you worked. Best week: {week}, {amount}.', {
              week: formatShortDate(best.range.start),
              amount: formatMoney(best.summary.totalCents, { wholeDollars: true }),
            })
          : t('No shifts in the last few weeks.')}
      </ThemedText>
      <BarChart
        height={100}
        bars={points.map((p, i) => ({
          key: p.range.start,
          label: '',
          value: p.summary.totalCents,
          highlight: i === points.length - 1,
        }))}
        accessibilityLabel={t('Total earned per week: {weeks}', {
          weeks: points
            .map((p) =>
              t('week of {date} {amount}', {
                date: formatShortDate(p.range.start),
                amount: formatMoney(p.summary.totalCents, { wholeDollars: true }),
              }),
            )
            .join(', '),
        })}
      />
      <View style={styles.axis}>
        <ThemedText type="small" themeColor="textSecondary">
          {points.length > 0 ? formatShortDate(points[0].range.start) : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('This week')}
        </ThemedText>
      </View>
    </>
  );
}

function Stat({ label, value, spokenValue }: { label: string; value: string; spokenValue?: string }) {
  return (
    <View style={styles.column}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" accessibilityLabel={spokenValue}>
        {value}
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
  // Values line up even when a label wraps (longer in Spanish).
  stats: {
    alignItems: 'flex-end',
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
