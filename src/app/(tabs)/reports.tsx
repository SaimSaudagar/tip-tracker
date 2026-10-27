import { useLocalSearchParams, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ListGroup } from '@/components/list-group';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import {
  listJobShiftsBetween,
  listPaychecks,
  listShiftsBetween,
  listTipOutsBetween,
  type Paycheck,
} from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { t } from '@/i18n';
import { track } from '@/lib/analytics';
import { shiftMonth } from '@/lib/calendar';
import { formatDayLabel, formatMonthLong, formatRange, formatShortDate, monthRange, yearRange } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { sharePdf } from '@/lib/files';
import { errorText } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { comparePaycheck, PAYCHECK_TOLERANCE_CENTS } from '@/lib/paychecks';
import { buildMonthlyReport, buildYearSummary, monthlyReportHtml, yearSummaryHtml } from '@/lib/reports';
import { combineTipOuts, describeTipOuts } from '@/lib/tipouts';
import { usePro } from '@/purchases/pro-context';

const PAYCHECK_LIMIT = 12;

/** "Olive & Vine" -> "olive-vine", for file names. */
const fileSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'job';

export default function ReportsScreen() {
  const { month, year } = useLocalSearchParams<{ month?: string; year?: string }>();
  const linked = month && /^\d{4}-\d{2}-\d{2}$/.test(month) ? month : null;
  const linkedYear = year && /^\d{4}$/.test(year) ? year : null;
  // A report-reminder link (?month=…) or the tax-season card (?year=…) starts the screen fresh there.
  return <Reports key={`${linked ?? 'month'}-${linkedYear ?? 'year'}`} linkedMonth={linked} linkedYear={linkedYear} />;
}

function Reports({ linkedMonth, linkedYear }: { linkedMonth: string | null; linkedYear: string | null }) {
  const theme = useTheme();
  const router = useRouter();
  const { isPro } = usePro();
  const today = useToday();

  // Early in the month, last month's report is the one due, so start there.
  const [month, setMonth] = useState(() =>
    linkedMonth ? shiftMonth(linkedMonth, 0) : shiftMonth(today, Number(today.slice(8)) <= 10 ? -1 : 0),
  );
  const [year, setYear] = useState(linkedYear && linkedYear <= today.slice(0, 4) ? linkedYear : today.slice(0, 4));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const m = monthRange(month);
      const y = yearRange(`${year}-01-01`);
      const [monthShifts, yearShifts, tipOuts, paychecks] = await Promise.all([
        listShiftsBetween(db, m.start, m.end),
        listShiftsBetween(db, y.start, y.end),
        listTipOutsBetween(db, m.start, m.end),
        listPaychecks(db, PAYCHECK_LIMIT),
      ]);
      const withNames = monthShifts.map((s) => ({ ...s, tipOuts: tipOuts.get(s.id) ?? [] }));
      // Gross minus what was logged for each paycheck's period, when there's enough to compare.
      const differences = await Promise.all(
        paychecks.map(async (p) => {
          if (p.grossCents === null || p.periodStart === null || p.periodEnd === null) return null;
          const shifts = await listJobShiftsBetween(db, p.jobId, p.periodStart, p.periodEnd);
          return shifts.length > 0 ? comparePaycheck(p.grossCents, shifts).differenceCents : null;
        }),
      );
      return {
        report: buildMonthlyReport(withNames, month),
        summary: buildYearSummary(yearShifts, `${year}-01-01`),
        paychecks: paychecks.map((paycheck, i) => ({ paycheck, differenceCents: differences[i] })),
      };
    },
    [month, year],
  );
  const { data } = useDbQuery(load);

  const showPaywall = () => router.push({ pathname: '/paywall', params: { reason: 'reports' } });

  const share = async (html: string, fileName: string, type: 'monthly_pdf' | 'year_pdf') => {
    setError(null);
    try {
      await sharePdf(html, fileName);
      track({ name: 'report_exported', type });
    } catch (e) {
      setError(errorText(e));
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
            {t('Reports')}
          </ThemedText>

          <View style={styles.section}>
            <SectionTitle>{t('Monthly tip report')}</SectionTitle>
            <Stepper
              label={formatMonthLong(month)}
              previousLabel={t('Previous month')}
              nextLabel={t('Next month')}
              onPrevious={() => setMonth(shiftMonth(month, -1))}
              onNext={() => setMonth(shiftMonth(month, 1))}
              nextDisabled={isCurrentMonth}
            />
            {report && report.jobs.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('No shifts logged in {period}.', { period: formatMonthLong(month) })}
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
                <Line label={t('Cash tips')} value={formatMoney(job.totals.cashCents)} />
                <Line label={t('Card tips')} value={formatMoney(job.totals.cardCents)} />
                {job.totals.tipInCents > 0 ? (
                  <Line label={t('From coworkers')} value={formatMoney(job.totals.tipInCents)} />
                ) : null}
                {job.totals.tipOutCents > 0 ? (
                  <Line label={t('Paid out')} value={`−${formatMoney(job.totals.tipOutCents)}`} />
                ) : null}
                {job.rows.some((r) => r.tipOuts?.length) ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('Paid out to: {names}', { names: describeTipOuts(combineTipOuts(job.rows.map((r) => r.tipOuts ?? []))) })}
                  </ThemedText>
                ) : null}
                {job.totals.serviceChargeCents > 0 ? (
                  <Line label={t('Service charges (not tips)')} value={formatMoney(job.totals.serviceChargeCents)} />
                ) : null}
                <ThemedText type="small" style={{ color: job.mustReport ? theme.tint : theme.textSecondary }}>
                  {job.mustReport
                    ? t('Report to this employer by {date}', { date: formatShortDate(report.dueDate) })
                    : t('Under $20 this month. No employer report needed.')}
                </ThemedText>
                {report.jobs.length > 1 ? (
                  // Each employer gets a PDF with only its own shifts.
                  <Button
                    title={
                      isPro
                        ? t('Share PDF for {job}', { job: job.jobName })
                        : t('Share PDF for {job} · Pro', { job: job.jobName })
                    }
                    variant={isPro ? 'primary' : 'secondary'}
                    onPress={() =>
                      isPro
                        ? share(
                            monthlyReportHtml(report, today, { jobName: job.jobName }),
                            `tip-report-${month.slice(0, 7)}-${fileSlug(job.jobName)}.pdf`,
                            'monthly_pdf',
                          )
                        : showPaywall()
                    }
                    style={styles.jobShare}
                  />
                ) : null}
              </View>
            ))}
            {report && report.jobs.length === 1 ? (
              <Button
                title={isPro ? t('Share PDF for your employer') : t('Share PDF for your employer · Pro')}
                variant={isPro ? 'primary' : 'secondary'}
                onPress={() =>
                  isPro ? share(monthlyReportHtml(report, today), `tip-report-${month.slice(0, 7)}.pdf`, 'monthly_pdf') : showPaywall()
                }
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionTitle>{t('Year-end summary')}</SectionTitle>
            <Stepper
              label={year}
              previousLabel={t('Previous year')}
              nextLabel={t('Next year')}
              onPrevious={() => setYear(String(Number(year) - 1))}
              onNext={() => setYear(String(Number(year) + 1))}
              nextDisabled={isCurrentYear}
            />
            {!isPro ? (
              <View style={[styles.card, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="smallBold">{t('Your year, ready for tax time')}</ThemedText>
                <ThemedText type="small">
                  {t(
                    'Net tips, service charges and wages for the whole year, by job, in one PDF. Service charges are kept apart because they don’t count as tips for the “no tax on tips” deduction.',
                  )}
                </ThemedText>
                <Button title={t('Unlock with Pro')} onPress={showPaywall} />
              </View>
            ) : summary && summary.totals.shiftCount === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('No shifts logged in {period}.', { period: year })}
              </ThemedText>
            ) : summary ? (
              <>
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">{t('Net tips')}</ThemedText>
                    <ThemedText type="smallBold" style={styles.amount}>
                      {formatMoney(summary.totals.netTipsCents)}
                    </ThemedText>
                  </View>
                  <Line label={t('Service charges (not tips)')} value={formatMoney(summary.totals.serviceChargeCents)} />
                  <Line label={t('Wages')} value={formatMoney(summary.totals.wagesCents)} />
                  <Line label={t('Hours')} value={formatDuration(summary.totals.minutesWorked)} />
                  <Line label={t('Shifts')} value={String(summary.totals.shiftCount)} />
                  {summary.jobs.length > 1
                    ? summary.jobs.map((j) => (
                        <Line key={j.jobName} label={t('{job} net tips', { job: j.jobName })} value={formatMoney(j.netTipsCents)} />
                      ))
                    : null}
                </View>
                <Button
                  title={t('Share year-end PDF')}
                  onPress={() => share(yearSummaryHtml(summary, today), `tip-summary-${year}.pdf`, 'year_pdf')}
                />
              </>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionTitle>{t('Paychecks')}</SectionTitle>
            {data && data.paychecks.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('Add your paychecks to check that wages and card tips match the shifts you logged.')}
              </ThemedText>
            ) : null}
            <ListGroup>
              {data?.paychecks.map(({ paycheck, differenceCents }) => (
                <PaycheckRow
                  key={paycheck.id}
                  paycheck={paycheck}
                  differenceCents={differenceCents}
                  today={today}
                  showJob={new Set(data.paychecks.map((p) => p.paycheck.jobId)).size > 1}
                  onPress={() => router.push({ pathname: '/paycheck', params: { id: String(paycheck.id) } })}
                />
              ))}
            </ListGroup>
            <Button title={t('Add paycheck')} variant="secondary" onPress={() => router.push('/paycheck')} />
          </View>

          {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {t(
              'Tips of $20 or more in a month from one job must be reported to that employer by the 10th of the next month. These are your records, not tax advice. See IRS.gov (Topic 761, Tips).',
            )}
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

function PaycheckRow({
  paycheck,
  differenceCents,
  today,
  showJob,
  onPress,
}: {
  paycheck: Paycheck;
  differenceCents: number | null;
  today: string;
  showJob: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const period =
    paycheck.periodStart && paycheck.periodEnd
      ? formatRange({ start: paycheck.periodStart, end: paycheck.periodEnd }, today)
      : null;
  const details = [showJob ? paycheck.jobName : null, period].filter(Boolean).join(' · ');
  const matches = differenceCents !== null && Math.abs(differenceCents) <= PAYCHECK_TOLERANCE_CENTS;
  const status =
    differenceCents === null
      ? null
      : matches
        ? t('Matches shifts')
        : differenceCents < 0
          ? t('{amount} short', { amount: formatMoney(-differenceCents) })
          : t('{amount} over', { amount: formatMoney(differenceCents) });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('Paycheck {date}, {amount}', {
        date: formatDayLabel(paycheck.payDate, today),
        amount: formatMoney(paycheck.netCents),
      })}${status ? `, ${status}` : ''}. ${t('Edit')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.paycheckRow, { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' }]}>
      <View style={styles.paycheckLeft}>
        <ThemedText type="smallBold">{formatDayLabel(paycheck.payDate, today)}</ThemedText>
        {details ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {details}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.paycheckRight}>
        <ThemedText type="smallBold" style={styles.amount}>
          {formatMoney(paycheck.netCents)}
        </ThemedText>
        {status ? (
          <ThemedText type="small" style={{ color: matches ? theme.tint : theme.danger }}>
            {status}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
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
    paddingBottom: Spacing.five,
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
  jobShare: {
    marginTop: Spacing.two,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  note: {
    textAlign: 'center',
  },
  paycheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 60,
    gap: Spacing.three,
  },
  paycheckLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  paycheckRight: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
