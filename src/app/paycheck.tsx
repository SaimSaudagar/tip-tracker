import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { DateStepper } from '@/components/date-stepper';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { showToast } from '@/components/toast';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { deletePaycheck, getPaycheck, listJobs, listJobShiftsBetween, savePaycheck, type Job } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { msg, t } from '@/i18n';
import { confirmDestructive } from '@/lib/confirm';
import { errorText } from '@/lib/errors';
import { addDays, fromISODate, todayISO, type ISODate } from '@/lib/dates';
import { formatDuration, spokenDuration } from '@/lib/duration';
import { haptic } from '@/lib/haptics';
import { centsToInput, formatMoney, parseMoney } from '@/lib/money';
import { comparePaycheck, PAYCHECK_TOLERANCE_CENTS } from '@/lib/paychecks';
import { formatShortDate } from '@/lib/reminders-plan';

type PeriodKind = 'none' | 'week' | 'two-weeks' | 'custom';

const PERIOD_CHOICES: { value: PeriodKind; label: string }[] = [
  { value: 'none', label: msg('Not set') },
  { value: 'week', label: msg('1 week') },
  { value: 'two-weeks', label: msg('2 weeks') },
  { value: 'custom', label: msg('Custom') },
];
const PERIOD_DAYS: Partial<Record<PeriodKind, number>> = { week: 7, 'two-weeks': 14 };

type Form = {
  jobId: number | null;
  payDate: ISODate;
  periodKind: PeriodKind;
  periodStart: ISODate;
  periodEnd: ISODate;
  net: string;
  gross: string;
  notes: string;
};

const daysBetween = (start: ISODate, end: ISODate) =>
  Math.round((fromISODate(end).getTime() - fromISODate(start).getTime()) / 86_400_000) + 1;

function kindFor(start: ISODate, end: ISODate): PeriodKind {
  const days = daysBetween(start, end);
  return days === 7 ? 'week' : days === 14 ? 'two-weeks' : 'custom';
}

export default function PaycheckScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const paycheckId = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const today = todayISO();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<Form>({
    jobId: null,
    payDate: today,
    periodKind: 'none',
    periodStart: addDays(today, -13),
    periodEnd: today,
    net: '',
    gross: '',
    notes: '',
  });
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [allJobs, existing] = await Promise.all([
        listJobs(db),
        paycheckId !== undefined ? getPaycheck(db, paycheckId) : null,
      ]);
      if (cancelled) return;
      setJobs(allJobs);
      if (paycheckId !== undefined && !existing) {
        setMissing(true);
      } else if (existing) {
        const hasPeriod = existing.periodStart !== null && existing.periodEnd !== null;
        setForm({
          jobId: existing.jobId,
          payDate: existing.payDate,
          periodKind: hasPeriod ? kindFor(existing.periodStart!, existing.periodEnd!) : 'none',
          periodStart: existing.periodStart ?? addDays(existing.payDate, -13),
          periodEnd: existing.periodEnd ?? existing.payDate,
          net: centsToInput(existing.netCents),
          gross: existing.grossCents === null ? '' : centsToInput(existing.grossCents),
          notes: existing.notes ?? '',
        });
      } else {
        setForm((f) => ({ ...f, jobId: allJobs[0]?.id ?? null }));
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, paycheckId]);

  const set =
    <K extends keyof Form>(key: K) =>
    (value: Form[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  // Fixed-length periods keep their length when the end moves.
  const setPeriodEnd = (end: ISODate) =>
    setForm((f) => {
      const days = PERIOD_DAYS[f.periodKind];
      return { ...f, periodEnd: end, periodStart: days ? addDays(end, -(days - 1)) : f.periodStart };
    });
  const setPeriodKind = (kind: PeriodKind) =>
    setForm((f) => {
      const days = PERIOD_DAYS[kind];
      return { ...f, periodKind: kind, periodStart: days ? addDays(f.periodEnd, -(days - 1)) : f.periodStart };
    });

  const net = parseMoney(form.net);
  const gross = form.gross.trim() === '' ? undefined : parseMoney(form.gross);
  const hasPeriod = form.periodKind !== 'none';
  const periodValid = !hasPeriod || form.periodStart <= form.periodEnd;
  const canSave =
    loaded && !saving && form.jobId !== null && net !== null && form.net.trim() !== '' && gross !== null && periodValid;

  const loadComparison = useCallback(
    async (database: SQLiteDatabase) => {
      if (form.jobId === null || !hasPeriod || !periodValid) return null;
      return listJobShiftsBetween(database, form.jobId, form.periodStart, form.periodEnd);
    },
    [form.jobId, form.periodStart, form.periodEnd, hasPeriod, periodValid],
  );
  const { data: periodShifts } = useDbQuery(loadComparison);
  const comparison = periodShifts ? comparePaycheck(gross ?? null, periodShifts) : null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/reports'));

  const save = async () => {
    if (!canSave || form.jobId === null || net === null) return;
    setSaving(true);
    try {
      await savePaycheck(db, {
        id: paycheckId,
        jobId: form.jobId,
        payDate: form.payDate,
        periodStart: hasPeriod ? form.periodStart : null,
        periodEnd: hasPeriod ? form.periodEnd : null,
        netCents: net,
        grossCents: gross ?? null,
        notes: form.notes.trim() || null,
      });
      haptic.success();
      showToast({ title: paycheckId === undefined ? t('Paycheck saved') : t('Changes saved') });
      close();
    } catch (e) {
      showToast({ title: t('Couldn’t save this paycheck'), detail: errorText(e) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (paycheckId === undefined) return;
    const ok = await confirmDestructive(t('Delete this paycheck?'), t('This can’t be undone.'), t('Delete'));
    if (!ok) return;
    try {
      await deletePaycheck(db, paycheckId);
    } catch (e) {
      showToast({ title: t('Couldn’t delete this paycheck'), detail: errorText(e) });
      return;
    }
    haptic.destructive();
    showToast({ title: t('Paycheck deleted') });
    close();
  };

  const header = (
    <Stack.Screen
      options={{
        title: paycheckId !== undefined ? t('Edit paycheck') : t('Add paycheck'),
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Cancel')}
            onPress={close}
            hitSlop={12}
            style={styles.headerButton}>
            <ThemedText style={{ color: theme.tint }}>{t('Cancel')}</ThemedText>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Save')}
            accessibilityState={{ disabled: !canSave }}
            onPress={save}
            disabled={!canSave}
            hitSlop={12}
            style={styles.headerButton}>
            <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 16, opacity: canSave ? 1 : 0.4 }}>
              {t('Save')}
            </ThemedText>
          </Pressable>
        ),
      }}
    />
  );

  if (missing) {
    return (
      <ThemedView style={styles.centered}>
        {header}
        <ThemedText>{t('This paycheck no longer exists.')}</ThemedText>
        <Button title={t('Close')} variant="secondary" onPress={close} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      {header}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {jobs.length > 1 ? (
          <View style={styles.chips}>
            {jobs.map((job) => (
              <Chip
                key={job.id}
                label={job.name}
                selected={form.jobId === job.id}
                onPress={() => set('jobId')(job.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('Pay date')}
          </ThemedText>
          <DateStepper value={form.payDate} onChange={set('payDate')} today={today} label={t('Pay date')} />
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <MoneyField
              label={t('Take-home (net)')}
              prefix="$"
              value={form.net}
              onChangeText={set('net')}
              error={form.net.trim() !== '' && net === null ? t('Enter an amount like 812.40') : null}
            />
          </View>
          <View style={styles.half}>
            <MoneyField
              label={t('Gross (optional)')}
              prefix="$"
              value={form.gross}
              onChangeText={set('gross')}
              error={gross === null ? t('Enter an amount like 1,040.00') : null}
            />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('Pay period, to check it against your shifts')}
          </ThemedText>
          <View style={styles.chips}>
            {PERIOD_CHOICES.map((c) => (
              <Chip
                key={c.value}
                label={t(c.label)}
                accessibilityLabel={t('Pay period: {option}', { option: t(c.label) })}
                selected={form.periodKind === c.value}
                onPress={() => setPeriodKind(c.value)}
              />
            ))}
          </View>
          {form.periodKind === 'custom' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {t('First day')}
              </ThemedText>
              <DateStepper
                value={form.periodStart}
                onChange={set('periodStart')}
                today={today}
                label={t('Period first day')}
              />
            </>
          ) : null}
          {hasPeriod ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {form.periodKind === 'custom'
                  ? t('Last day')
                  : t('Last day ({count} days, starting {date})', {
                      count: PERIOD_DAYS[form.periodKind] ?? daysBetween(form.periodStart, form.periodEnd),
                      date: formatShortDate(form.periodStart),
                    })}
              </ThemedText>
              <DateStepper
                value={form.periodEnd}
                onChange={setPeriodEnd}
                today={today}
                label={t('Period last day')}
              />
            </>
          ) : null}
          {!periodValid ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('The first day must be on or before the last day.')}
            </ThemedText>
          ) : null}
        </View>

        {comparison ? <Comparison comparison={comparison} gross={gross ?? null} /> : null}

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            {t('Notes')}
          </ThemedText>
          <TextInput
            accessibilityLabel={t('Notes')}
            placeholder={t('Check number, missing hours…')}
            placeholderTextColor={theme.textSecondary}
            value={form.notes}
            onChangeText={set('notes')}
            multiline
            style={[styles.notes, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        </View>

        {paycheckId !== undefined ? <Button title={t('Delete paycheck')} variant="danger" onPress={remove} /> : null}
      </ScrollView>
    </ThemedView>
  );
}

function Comparison({
  comparison,
  gross,
}: {
  comparison: ReturnType<typeof comparePaycheck>;
  gross: number | null;
}) {
  const theme = useTheme();
  const diff = comparison.differenceCents;
  const matches = diff !== null && Math.abs(diff) <= PAYCHECK_TOLERANCE_CENTS;
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{t('What you logged for this period')}</ThemedText>
      {comparison.shiftCount === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('No shifts logged for this job in these dates.')}
        </ThemedText>
      ) : (
        <>
          <Line
            label={
              comparison.shiftCount === 1 ? t('1 shift') : t('{count} shifts', { count: comparison.shiftCount })
            }
            value={formatDuration(comparison.minutesWorked)}
            spokenValue={spokenDuration(comparison.minutesWorked)}
          />
          <Line label={t('Wages')} value={formatMoney(comparison.wagesCents)} />
          <Line label={t('Card tips')} value={formatMoney(comparison.cardTipsCents)} />
          {comparison.serviceChargeCents > 0 ? (
            <Line label={t('Service charges')} value={formatMoney(comparison.serviceChargeCents)} />
          ) : null}
          <View style={[styles.rule, { backgroundColor: theme.backgroundSelected }]} />
          <Line label={t('Expected gross')} value={formatMoney(comparison.expectedCents)} bold />
        </>
      )}
      {diff !== null && comparison.shiftCount > 0 ? (
        <ThemedText type="smallBold" style={{ color: matches ? theme.tint : theme.danger }}>
          {matches
            ? t('✓ Your gross matches what you logged.')
            : diff < 0
              ? t(
                  'Your gross is {amount} less than you logged. Worth checking your hours and card tips with your manager.',
                  { amount: formatMoney(-diff) },
                )
              : t('Your gross is {amount} more than you logged. A bonus, overtime, or a shift you didn’t log?', {
                  amount: formatMoney(diff),
                })}
        </ThemedText>
      ) : gross === null && comparison.shiftCount > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('Add the gross amount from your pay stub to check it.')}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {t('Cash tips aren’t included: you already have them. Wages use each position’s hourly rate.')}
      </ThemedText>
    </View>
  );
}

function Line({ label, value, spokenValue, bold }: { label: string; value: string; spokenValue?: string; bold?: boolean }) {
  return (
    <View style={styles.line}>
      <ThemedText type={bold ? 'smallBold' : 'small'} themeColor={bold ? undefined : 'textSecondary'}>
        {label}
      </ThemedText>
      <ThemedText type={bold ? 'smallBold' : 'small'} accessibilityLabel={spokenValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  headerButton: {
    paddingHorizontal: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
  },
  notes: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    padding: Spacing.three,
    minHeight: 72,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
