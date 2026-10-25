import { useLocalSearchParams, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { listShiftsBetween, listTipOutsBetween } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { shiftMonth } from '@/lib/calendar';
import { monthRange, todayISO, yearRange } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { sharePdf } from '@/lib/files';
import { formatMoney } from '@/lib/money';
import { formatShortDate } from '@/lib/reminders-plan';
import { buildMonthlyReport, buildYearSummary, monthlyReportHtml, yearSummaryHtml } from '@/lib/reports';
import { combineTipOuts, describeTipOuts } from '@/lib/tipouts';
import { usePro } from '@/purchases/pro-context';

export default function ReportsScreen() {
  const { month } = useLocalSearchParams<{ month?: string }>();
  const linked = month && /^\d{4}-\d{2}-\d{2}$/.test(month) ? month : null;
  // A report-reminder link (?month=…) starts the screen fresh on that month.
  return <Reports key={linked ?? 'default'} linkedMonth={linked} />;
}

function Reports({ linkedMonth }: { linkedMonth: string | null }) {
  const theme = useTheme();
  const router = useRouter();
  const { isPro } = usePro();
  const today = todayISO();

  // Early in the month, last month's report is the one due, so start there.
  const [month, setMonth] = useState(() =>
    linkedMonth ? shiftMonth(linkedMonth, 0) : shiftMonth(today, Number(today.slice(8)) <= 10 ? -1 : 0),
  );
  const [year, setYear] = useState(today.slice(0, 4));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const m = monthRange(month);
      const y = yearRange(`${year}-01-01`);
      const [monthShifts, yearShifts, tipOuts] = await Promise.all([
        listShiftsBetween(db, m.start, m.end),
        listShiftsBetween(db, y.start, y.end),
        listTipOutsBetween(db, m.start, m.end),
      ]);
      const withNames = monthShifts.map((s) => ({ ...s, tipOuts: tipOuts.get(s.id) ?? [] }));
      return {
        report: buildMonthlyReport(withNames, month),
        summary: buildYearSummary(yearShifts, `${year}-01-01`),
      };
    },
    [month, year],
  );
  const { data } = useDbQuery(load);

  const showPaywall = () => router.push({ pathname: '/paywall', params: { reason: 'reports' } });

  const share = async (html: string, fileName: string) => {
    setError(null);
    try {
      await sharePdf(html, fileName);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const report = data?.report;
  const summary = data?.summary;
  const isCurrentMonth = month === shiftMonth(today, 0);
  const isCurrentYear = year === today.slice(0, 4);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="subtitle" accessibilityRole="header">
            Reports
          </ThemedText>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              MONTHLY TIP REPORT
            </ThemedText>
            <Stepper
              label={report?.label ?? ''}
              previousLabel="Previous month"
              nextLabel="Next month"
              onPrevious={() => setMonth(shiftMonth(month, -1))}
              onNext={() => setMonth(shiftMonth(month, 1))}
              nextDisabled={isCurrentMonth}
            />
            {report && report.jobs.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No shifts logged in {report.label}.
              </ThemedText>
            ) : null}
            {report?.jobs.map((job) => (
              <View key={job.jobName} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="smallBold">{job.jobName}</ThemedText>
                  <ThemedText type="smallBold" style={styles.amount}>
                    {formatMoney(job.totals.netTipsCents)}
                  </ThemedText>
                </View>
                <Line label="Cash tips" value={formatMoney(job.totals.cashCents)} />
                <Line label="Card tips" value={formatMoney(job.totals.cardCents)} />
                {job.totals.tipInCents > 0 ? <Line label="From coworkers" value={formatMoney(job.totals.tipInCents)} /> : null}
                {job.totals.tipOutCents > 0 ? <Line label="Paid out" value={`−${formatMoney(job.totals.tipOutCents)}`} /> : null}
                {job.rows.some((r) => r.tipOuts?.length) ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Paid out to: {describeTipOuts(combineTipOuts(job.rows.map((r) => r.tipOuts ?? [])))}
                  </ThemedText>
                ) : null}
                {job.totals.serviceChargeCents > 0 ? (
                  <Line label="Service charges (not tips)" value={formatMoney(job.totals.serviceChargeCents)} />
                ) : null}
                <ThemedText type="small" style={{ color: job.mustReport ? theme.tint : theme.textSecondary }}>
                  {job.mustReport
                    ? `Report to this employer by ${formatShortDate(report.dueDate)}`
                    : 'Under $20 this month. No employer report needed.'}
                </ThemedText>
              </View>
            ))}
            {report && report.jobs.length > 0 ? (
              <Button
                title={isPro ? 'Share PDF for your employer' : 'Share PDF for your employer · Pro'}
                variant={isPro ? 'primary' : 'secondary'}
                onPress={() =>
                  isPro ? share(monthlyReportHtml(report, today), `tip-report-${month.slice(0, 7)}.pdf`) : showPaywall()
                }
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              YEAR-END SUMMARY
            </ThemedText>
            <Stepper
              label={year}
              previousLabel="Previous year"
              nextLabel="Next year"
              onPrevious={() => setYear(String(Number(year) - 1))}
              onNext={() => setYear(String(Number(year) + 1))}
              nextDisabled={isCurrentYear}
            />
            {!isPro ? (
              <View style={[styles.card, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="smallBold">Your year, ready for tax time</ThemedText>
                <ThemedText type="small">
                  Net tips, service charges and wages for the whole year, by job, in one PDF. Service charges are kept apart
                  because they don’t count as tips for the “no tax on tips” deduction.
                </ThemedText>
                <Button title="Unlock with Pro" onPress={showPaywall} />
              </View>
            ) : summary && summary.totals.shiftCount === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No shifts logged in {year}.
              </ThemedText>
            ) : summary ? (
              <>
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">Net tips</ThemedText>
                    <ThemedText type="smallBold" style={styles.amount}>
                      {formatMoney(summary.totals.netTipsCents)}
                    </ThemedText>
                  </View>
                  <Line label="Service charges (not tips)" value={formatMoney(summary.totals.serviceChargeCents)} />
                  <Line label="Wages" value={formatMoney(summary.totals.wagesCents)} />
                  <Line label="Hours" value={formatDuration(summary.totals.minutesWorked)} />
                  <Line label="Shifts" value={String(summary.totals.shiftCount)} />
                  {summary.jobs.length > 1
                    ? summary.jobs.map((j) => (
                        <Line key={j.jobName} label={`${j.jobName} net tips`} value={formatMoney(j.netTipsCents)} />
                      ))
                    : null}
                </View>
                <Button
                  title="Share year-end PDF"
                  onPress={() => share(yearSummaryHtml(summary, today), `tip-summary-${year}.pdf`)}
                />
              </>
            ) : null}
          </View>

          {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Tips of $20 or more in a month from one job must be reported to that employer by the 10th of the next month.
            These are your records, not tax advice. See IRS.gov (Topic 761, Tips).
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Stepper(props: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={props.previousLabel} onPress={props.onPrevious} hitSlop={12} style={styles.arrow}>
        <ThemedText type="subtitle">‹</ThemedText>
      </Pressable>
      <ThemedText type="smallBold" style={styles.stepperLabel}>
        {props.label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.nextLabel}
        disabled={props.nextDisabled}
        onPress={props.onNext}
        hitSlop={12}
        style={[styles.arrow, { opacity: props.nextDisabled ? 0.25 : 1 }]}>
        <ThemedText type="subtitle">›</ThemedText>
      </Pressable>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    paddingHorizontal: Spacing.three,
  },
  stepperLabel: {
    fontSize: 18,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.one,
  },
  amount: {
    fontSize: 20,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  note: {
    textAlign: 'center',
  },
});
