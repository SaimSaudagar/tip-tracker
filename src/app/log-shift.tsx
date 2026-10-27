import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { DateStepper } from '@/components/date-stepper';
import { MoneyField } from '@/components/money-field';
import { showToast } from '@/components/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  countShifts,
  deleteShift,
  getLatestShift,
  getShift,
  getShiftTipOuts,
  getWeekStart,
  getWeeklyGoal,
  listPositions,
  listShiftsBetween,
  recentTipOutNames,
  saveShiftWithTipOuts,
  type Position,
  type Shift,
  type ShiftPeriod,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { confirmDestructive } from '@/lib/confirm';
import { errorText } from '@/lib/errors';
import { celebrationFor } from '@/lib/celebration';
import { monthRange, todayISO, weekRange } from '@/lib/dates';
import {
  formatClock,
  minutesBetween,
  minutesToInput,
  parseClockTime,
  parseDuration,
  periodForStart,
} from '@/lib/duration';
import { haptic } from '@/lib/haptics';
import { centsToInput, formatMoney, formatPercent, parseCount, parseMoney } from '@/lib/money';
import { maybeAskForReview } from '@/lib/review-prompt';
import { calcTipOut, computeShift, summarize } from '@/lib/shift-math';
import { parseTipOutDrafts, type TipOutDraft } from '@/lib/tipouts';
import { usePro } from '@/purchases/pro-context';

type Form = {
  date: string;
  positionId: number | null;
  hours: string;
  start: string;
  end: string;
  breakMinutes: string;
  cash: string;
  card: string;
  tipIn: string;
  tipOut: string;
  serviceCharge: string;
  sales: string;
  covers: string;
  notes: string;
};

const blankForm = (date: string): Form => ({
  date,
  positionId: null,
  hours: '',
  start: '',
  end: '',
  breakMinutes: '',
  cash: '',
  card: '',
  tipIn: '',
  tipOut: '',
  serviceCharge: '',
  sales: '',
  covers: '',
  notes: '',
});

const formFromShift = (s: Shift): Form => ({
  date: s.date,
  positionId: s.positionId,
  hours: minutesToInput(s.minutesWorked),
  start: s.startTime ? formatClock(s.startTime) : '',
  end: s.endTime ? formatClock(s.endTime) : '',
  breakMinutes: s.breakMinutes > 0 ? String(s.breakMinutes) : '',
  cash: centsToInput(s.cashTipsCents),
  card: centsToInput(s.cardTipsCents),
  tipIn: centsToInput(s.tipInCents),
  tipOut: centsToInput(s.tipOutCents),
  serviceCharge: centsToInput(s.serviceChargeCents),
  sales: s.salesCents === null ? '' : centsToInput(s.salesCents),
  covers: s.covers === null ? '' : String(s.covers),
  notes: s.notes ?? '',
});

const MONEY_ERROR = 'Enter an amount like 42 or 42.50';

/** Amounts another screen can fill in (the tip pool calculator and the slip scanner). */
const PREFILL_KEYS = ['cash', 'card', 'tipIn', 'tipOut', 'serviceCharge', 'sales', 'covers'] as const;
type Prefill = Partial<Pick<Form, (typeof PREFILL_KEYS)[number]>>;

function describeRule(p: Position) {
  if (p.tipOutRule === 'fixed') return `${formatMoney(p.tipOutValue)} per shift`;
  if (p.tipOutRule === 'pct_tips') return `${formatPercent(p.tipOutValue)} of tips`;
  if (p.tipOutRule === 'pct_sales') return `${formatPercent(p.tipOutValue)} of sales`;
  return null;
}

export default function LogShiftScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string } & Prefill>();
  const { id, date } = params;
  const shiftId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const { isPro } = usePro();
  const today = todayISO();
  // The calendar opens this screen for a specific past day; anything else starts on today.
  const startDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : today;
  // Only well-formed amounts are taken from the link. Keyed by value so the form isn't reset on re-render.
  const prefillKey = PREFILL_KEYS.map((key) => params[key] ?? '').join('|');
  const prefill = useMemo(() => {
    const values: Prefill = {};
    prefillKey.split('|').forEach((raw, i) => {
      const key = PREFILL_KEYS[i];
      const valid = key === 'covers' ? parseCount(raw) : parseMoney(raw);
      if (raw && valid) values[key] = raw;
    });
    return values;
  }, [prefillKey]);

  const [positions, setPositions] = useState<Position[]>([]);
  const [original, setOriginal] = useState<Shift | null>(null);
  const [form, setForm] = useState<Form>(() => blankForm(startDate));
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [tipOutEdited, setTipOutEdited] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipOutRows, setTipOutRows] = useState<TipOutDraft[]>([]);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [period, setPeriod] = useState<ShiftPeriod | null>(null);
  const [periodChosen, setPeriodChosen] = useState(false);
  const nextRowKey = useRef(0);

  const newRow = (name = '', amount = ''): TipOutDraft => ({ key: `row-${nextRowKey.current++}`, name, amount });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [all, existing, latest, names, existingTipOuts] = await Promise.all([
        listPositions(db),
        shiftId !== undefined ? getShift(db, shiftId) : null,
        shiftId === undefined ? getLatestShift(db) : null,
        recentTipOutNames(db, 6),
        shiftId !== undefined ? getShiftTipOuts(db, shiftId) : [],
      ]);
      if (cancelled) return;
      setPositions(all);
      setRecentNames(names);
      if (shiftId !== undefined) {
        if (!existing) {
          setMissing(true);
        } else {
          setOriginal(existing);
          setForm(formFromShift(existing));
          setPeriod(existing.period);
          setPeriodChosen(existing.period !== null);
          setTipOutRows(
            existingTipOuts.map((t, i) => ({ key: `saved-${i}`, name: t.name, amount: centsToInput(t.amountCents) })),
          );
          setTipOutEdited(true);
          setShowMore(
            existing.tipInCents + existing.tipOutCents + existing.serviceChargeCents > 0 ||
              existing.salesCents !== null ||
              existing.covers !== null ||
              !!existing.notes ||
              !!existing.startTime,
          );
        }
      } else {
        // New shifts start from the last one's position and hours, since most shifts look alike.
        const lastPosition = all.find((p) => p.id === latest?.positionId);
        setForm({
          ...blankForm(startDate),
          positionId: lastPosition?.id ?? all[0]?.id ?? null,
          hours: latest && lastPosition ? minutesToInput(latest.minutesWorked) : '',
          ...prefill,
        });
        setPeriod(latest?.period ?? null);
        // A scanned tip-out wins over the position's automatic one.
        if (prefill.tipOut) setTipOutEdited(true);
        if (prefill.tipIn || prefill.tipOut || prefill.serviceCharge || prefill.sales || prefill.covers) setShowMore(true);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, shiftId, startDate, prefill]);

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const position = positions.find((p) => p.id === form.positionId) ?? null;

  // Start and end times, when both are filled in, decide the hours worked.
  const startTime = form.start.trim() === '' ? undefined : parseClockTime(form.start);
  const endTime = form.end.trim() === '' ? undefined : parseClockTime(form.end);
  const breakMinutes = form.breakMinutes.trim() === '' ? 0 : /^\d{1,3}$/.test(form.breakMinutes.trim()) ? Number(form.breakMinutes) : null;
  const usingTimes = !!startTime && !!endTime;
  const timedMinutes = usingTimes && breakMinutes !== null ? minutesBetween(startTime!, endTime!, breakMinutes) : null;
  const minutes = usingTimes ? timedMinutes : parseDuration(form.hours);
  const timesValid = startTime !== null && endTime !== null && breakMinutes !== null;
  // A start time suggests lunch or dinner until the user picks one themselves.
  const effectivePeriod: ShiftPeriod | null = !periodChosen && startTime ? periodForStart(startTime) : period;
  const cash = parseMoney(form.cash);
  const card = parseMoney(form.card);
  const tipIn = parseMoney(form.tipIn);
  const serviceCharge = parseMoney(form.serviceCharge);
  const sales = parseMoney(form.sales);
  const covers = parseCount(form.covers);

  // With Pro, a position's tip-out rule fills the tip-out until the user types their own amount.
  const hasRule = !!position && position.tipOutRule !== 'none';
  const autoTipOut =
    isPro && position && hasRule && cash !== null && card !== null && sales !== null
      ? calcTipOut(position.tipOutRule, position.tipOutValue, {
          cashTipsCents: cash,
          cardTipsCents: card,
          salesCents: form.sales.trim() === '' ? null : sales,
        })
      : null;
  // Naming who you tipped out replaces the single tip-out amount with their total.
  const namedTipOuts = parseTipOutDrafts(tipOutRows);
  const usingNames = tipOutRows.some((r) => r.name.trim() !== '' || r.amount.trim() !== '');
  const usingAutoTipOut = !usingNames && autoTipOut !== null && !tipOutEdited;
  const tipOut = usingNames
    ? namedTipOuts.valid
      ? namedTipOuts.totalCents
      : null
    : usingAutoTipOut
      ? autoTipOut
      : parseMoney(form.tipOut);

  // Keep the wage that was saved with the shift unless the user moves it to another position.
  const hourlyWageCents =
    original && original.positionId === form.positionId ? original.hourlyWageCents : (position?.hourlyWageCents ?? 0);

  const values = [minutes, cash, card, tipIn, tipOut, serviceCharge, sales];
  const valid = values.every((v) => v !== null) && covers !== null && timesValid && form.positionId !== null;
  const amounts = valid
    ? {
        minutesWorked: minutes!,
        hourlyWageCents,
        cashTipsCents: cash!,
        cardTipsCents: card!,
        tipInCents: tipIn!,
        tipOutCents: tipOut!,
        serviceChargeCents: serviceCharge!,
      }
    : null;
  const totals = amounts ? computeShift(amounts) : null;
  const isEmpty =
    !!amounts &&
    amounts.minutesWorked + amounts.cashTipsCents + amounts.cardTipsCents + amounts.tipInCents + amounts.serviceChargeCents === 0;
  const canSave = loaded && !missing && valid && !isEmpty && !saving;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    if (!amounts || form.positionId === null || !canSave) return;
    setSaving(true);
    try {
      const savedId = await saveShiftWithTipOuts(
        db,
        {
          id: shiftId,
          positionId: form.positionId,
          date: form.date,
          ...amounts,
          startTime: usingTimes ? startTime! : null,
          endTime: usingTimes ? endTime! : null,
          breakMinutes: usingTimes ? breakMinutes! : 0,
          period: effectivePeriod,
          salesCents: form.sales.trim() === '' ? null : sales,
          covers: form.covers.trim() === '' ? null : covers,
          notes: form.notes.trim() || null,
        },
        namedTipOuts.entries,
      );
      haptic.success();
      if (shiftId === undefined) {
        countShifts(db).then((nth) => track({ name: 'shift_logged', nth }), () => {});
        await celebrate(savedId);
      } else {
        showToast({ title: 'Changes saved' });
      }
      close();
      if (shiftId === undefined) {
        maybeAskForReview(db).catch((e) => console.warn('Review prompt failed', e));
      }
    } catch (e) {
      showToast({ title: 'Couldn’t save this shift', detail: errorText(e) });
    } finally {
      setSaving(false);
    }
  };

  /** Shows a highlight for the new shift ("Best Friday this month") or a plain confirmation. */
  const celebrate = async (savedId: number) => {
    try {
      const [weekStart, goalCents] = await Promise.all([getWeekStart(db), getWeeklyGoal(db)]);
      const month = monthRange(form.date);
      const week = weekRange(form.date, weekStart);
      const [monthShifts, weekShifts] = await Promise.all([
        listShiftsBetween(db, month.start, month.end),
        listShiftsBetween(db, week.start, week.end),
      ]);
      const saved = monthShifts.find((s) => s.id === savedId);
      if (!saved) throw new Error('Saved shift not found');
      const weekAfter = summarize(weekShifts).totalCents;
      // "This month" and the weekly goal only make sense for shifts in the current month and week.
      const isCurrentWeek = today >= week.start && today <= week.end;
      showToast(
        celebrationFor({
          saved,
          monthShifts: form.date.slice(0, 7) === today.slice(0, 7) ? monthShifts : [saved],
          weekTotalBefore: weekAfter - computeShift(saved).totalCents,
          weekTotalAfter: weekAfter,
          goalCents: isCurrentWeek ? goalCents : null,
        }),
      );
    } catch {
      showToast({ title: 'Shift saved' });
    }
  };

  const remove = async () => {
    if (shiftId === undefined) return;
    const ok = await confirmDestructive('Delete this shift?', 'Its tips and hours will be removed.', 'Delete');
    if (!ok) return;
    try {
      await deleteShift(db, shiftId);
    } catch (e) {
      showToast({ title: 'Couldn’t delete this shift', detail: errorText(e) });
      return;
    }
    haptic.destructive();
    showToast({ title: 'Shift deleted' });
    close();
  };

  const header = (
    <Stack.Screen
      options={{
        title: shiftId !== undefined ? 'Edit shift' : 'Log shift',
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={close}
            hitSlop={12}
            style={styles.headerButton}>
            <ThemedText style={{ color: theme.tint }}>Cancel</ThemedText>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            accessibilityState={{ disabled: !canSave }}
            onPress={save}
            disabled={!canSave}
            hitSlop={12}
            style={styles.headerButton}>
            <ThemedText type="smallBold" style={{ color: theme.tint, fontSize: 16, opacity: canSave ? 1 : 0.4 }}>
              Save
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
        <ThemedText>This shift no longer exists.</ThemedText>
        <Button title="Close" variant="secondary" onPress={close} />
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
        <DateStepper value={form.date} onChange={set('date')} today={today} max={today} label="Shift date" />

        {shiftId === undefined ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace({ pathname: '/scan', params: { date: form.date } })}
            hitSlop={8}
            style={styles.scanLink}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              Scan your checkout slip instead ›
            </ThemedText>
          </Pressable>
        ) : null}

        {positions.length > 1 ? (
          <View style={styles.chips}>
            {positions.map((p) => {
              const selected = p.id === form.positionId;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name} at ${p.jobName}`}
                  accessibilityState={{ selected }}
                  onPress={() => setForm((f) => ({ ...f, positionId: p.id }))}
                  style={[styles.chip, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
                  <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
                    {p.name} · {p.jobName}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.row}>
          <MoneyField
            label="Cash tips"
            prefix="$"
            value={form.cash}
            onChangeText={set('cash')}
            error={cash === null ? MONEY_ERROR : null}
            autoFocus={shiftId === undefined}
            returnKeyType="next"
          />
          <MoneyField
            label="Card tips"
            prefix="$"
            value={form.card}
            onChangeText={set('card')}
            error={card === null ? MONEY_ERROR : null}
          />
        </View>

        <MoneyField
          label="Hours worked"
          suffix="hrs"
          value={usingTimes && timedMinutes !== null ? minutesToInput(timedMinutes) : form.hours}
          editable={!usingTimes}
          onChangeText={set('hours')}
          error={!usingTimes && minutes === null ? 'Enter hours like 6.5 or 6:30 (24 max)' : null}
          hint={
            usingTimes
              ? `${formatClock(startTime!)} – ${formatClock(endTime!)}${breakMinutes ? `, ${breakMinutes} min break` : ''}`
              : undefined
          }
        />

        <View style={styles.periodRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Shift
          </ThemedText>
          <Chip
            label="Lunch · AM"
            accessibilityLabel="Lunch, AM shift"
            selected={effectivePeriod === 'am'}
            onPress={() => {
              setPeriodChosen(true);
              setPeriod(effectivePeriod === 'am' ? null : 'am');
            }}
          />
          <Chip
            label="Dinner · PM"
            accessibilityLabel="Dinner, PM shift"
            selected={effectivePeriod === 'pm'}
            onPress={() => {
              setPeriodChosen(true);
              setPeriod(effectivePeriod === 'pm' ? null : 'pm');
            }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          onPress={() => setShowMore((v) => !v)}
          style={styles.moreToggle}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            {showMore ? 'Hide details' : 'Tip-outs, service charges & more'}
          </ThemedText>
        </Pressable>

        {showMore ? (
          <View style={styles.more}>
            <View style={styles.timesBlock}>
              <ThemedText type="small" themeColor="textSecondary">
                Start & end times (optional; they fill in hours worked)
              </ThemedText>
              <View style={styles.row}>
                <TimeField label="Start" placeholder="4:30pm" value={form.start} onChangeText={set('start')} invalid={startTime === null} />
                <TimeField label="End" placeholder="11pm" value={form.end} onChangeText={set('end')} invalid={endTime === null} />
                <TimeField
                  label="Break (min)"
                  placeholder="0"
                  value={form.breakMinutes}
                  onChangeText={set('breakMinutes')}
                  invalid={breakMinutes === null}
                  numeric
                />
              </View>
              {startTime === null || endTime === null ? (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  Enter times like 4:30pm or 16:30.
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.row}>
              <MoneyField
                label="Tip-out paid"
                prefix="$"
                value={
                  usingNames
                    ? centsToInput(namedTipOuts.totalCents)
                    : usingAutoTipOut
                      ? centsToInput(autoTipOut)
                      : form.tipOut
                }
                editable={!usingNames}
                onChangeText={(v) => {
                  setTipOutEdited(true);
                  set('tipOut')(v);
                }}
                error={!usingNames && tipOut === null ? MONEY_ERROR : null}
                hint={
                  usingNames
                    ? `Total for ${namedTipOuts.entries.length} ${namedTipOuts.entries.length === 1 ? 'person' : 'people'}`
                    : usingAutoTipOut && position
                      ? `Auto: ${describeRule(position)}`
                      : hasRule && !isPro && position
                        ? `Pro fills this in: ${describeRule(position)}`
                        : 'To bussers, bar, hosts'
                }
              />
              <MoneyField
                label="Tips from coworkers"
                prefix="$"
                value={form.tipIn}
                onChangeText={set('tipIn')}
                error={tipIn === null ? MONEY_ERROR : null}
                hint="Tip share or pool"
              />
            </View>

            <View style={styles.names}>
              <ThemedText type="small" themeColor="textSecondary">
                Tipped out to (optional, for your IRS tip record)
              </ThemedText>
              {tipOutRows.map((row) => (
                <View key={row.key} style={styles.nameRow}>
                  <TextInput
                    value={row.name}
                    onChangeText={(name) =>
                      setTipOutRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, name } : r)))
                    }
                    placeholder="Name or role"
                    placeholderTextColor={theme.textSecondary}
                    accessibilityLabel="Tipped out to"
                    maxLength={40}
                    style={[styles.nameInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  />
                  <TextInput
                    value={row.amount}
                    onChangeText={(amount) =>
                      setTipOutRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, amount } : r)))
                    }
                    placeholder="$0"
                    placeholderTextColor={theme.textSecondary}
                    accessibilityLabel={`Amount for ${row.name || 'this person'}`}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    style={[styles.amountInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${row.name || 'this person'}`}
                    onPress={() => setTipOutRows((rows) => rows.filter((r) => r.key !== row.key))}
                    hitSlop={8}
                    style={styles.removeName}>
                    <ThemedText themeColor="textSecondary">✕</ThemedText>
                  </Pressable>
                </View>
              ))}
              {usingNames && !namedTipOuts.valid ? (
                <ThemedText type="small" style={{ color: theme.danger }}>
                  Give each person a name and an amount.
                </ThemedText>
              ) : null}
              <View style={styles.chips}>
                {recentNames
                  .filter((name) => !tipOutRows.some((r) => r.name.trim().toLowerCase() === name.toLowerCase()))
                  .map((name) => (
                    <Chip
                      key={name}
                      label={`+ ${name}`}
                      accessibilityLabel={`Add ${name}`}
                      selected={false}
                      onPress={() => setTipOutRows((rows) => [...rows, newRow(name)])}
                    />
                  ))}
                <Chip
                  label="+ Add person"
                  selected={false}
                  onPress={() => setTipOutRows((rows) => [...rows, newRow()])}
                />
              </View>
            </View>

            <View style={styles.row}>
              <MoneyField
                label="Service charges"
                prefix="$"
                value={form.serviceCharge}
                onChangeText={set('serviceCharge')}
                error={serviceCharge === null ? MONEY_ERROR : null}
                hint="Auto-gratuity, kept apart from tips"
              />
              <MoneyField
                label="Sales"
                prefix="$"
                value={form.sales}
                onChangeText={set('sales')}
                error={sales === null ? MONEY_ERROR : null}
                hint="Optional"
              />
            </View>
            <View style={styles.row}>
              <MoneyField
                label="Covers"
                value={form.covers}
                onChangeText={set('covers')}
                inputMode="numeric"
                keyboardType="number-pad"
                error={covers === null ? 'Enter a whole number' : null}
                hint="Guests served (optional)"
              />
              <View style={styles.rowSpacer} />
            </View>
            <View style={styles.notesWrapper}>
              <ThemedText type="small" themeColor="textSecondary">
                Notes
              </ThemedText>
              <TextInput
                value={form.notes}
                onChangeText={set('notes')}
                placeholder="Big party, patio, double…"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Notes"
                maxLength={200}
                style={[styles.notes, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
            </View>
          </View>
        ) : null}

        <View style={[styles.summary, { backgroundColor: theme.tintSoft }]}>
          <SummaryLine label="Net tips" value={totals ? formatMoney(totals.netTipsCents) : '—'} strong />
          <SummaryLine
            label={hourlyWageCents > 0 ? `Wages (${formatMoney(hourlyWageCents)}/hr)` : 'Wages'}
            value={totals ? formatMoney(totals.wagesCents) : '—'}
          />
          <SummaryLine label="Total earned" value={totals ? formatMoney(totals.totalCents) : '—'} />
          <SummaryLine
            label="Real hourly"
            value={totals?.realHourlyCents != null ? `${formatMoney(totals.realHourlyCents)}/hr` : '—'}
          />
        </View>

        <Button
          title={saving ? 'Saving…' : shiftId !== undefined ? 'Save changes' : 'Save shift'}
          onPress={save}
          disabled={!canSave}
        />
        {isEmpty ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Enter tips or hours to save.
          </ThemedText>
        ) : null}
        {shiftId !== undefined ? <Button title="Delete shift" variant="danger" onPress={remove} /> : null}
      </ScrollView>
    </ThemedView>
  );
}

function TimeField({
  label,
  invalid,
  numeric,
  ...props
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  invalid: boolean;
  numeric?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.timeField}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={numeric ? 'number-pad' : 'default'}
        maxLength={8}
        style={[
          styles.timeInput,
          { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: invalid ? theme.danger : 'transparent' },
        ]}
        {...props}
      />
    </View>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <ThemedText type={strong ? 'smallBold' : 'small'}>{label}</ThemedText>
      <ThemedText type="smallBold" style={strong ? styles.summaryStrong : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerButton: {
    // Native headers inset their buttons already; the web header doesn't.
    paddingHorizontal: Platform.select({ web: Spacing.three, default: 0 }),
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowSpacer: {
    flex: 1,
  },
  scanLink: {
    alignSelf: 'flex-start',
  },
  moreToggle: {
    paddingVertical: Spacing.one,
  },
  more: {
    gap: Spacing.three,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  timesBlock: {
    gap: Spacing.two,
  },
  timeField: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one,
  },
  timeInput: {
    minWidth: 0,
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    fontSize: 16,
  },
  notesWrapper: {
    gap: Spacing.one,
  },
  names: {
    gap: Spacing.two,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nameInput: {
    flex: 2,
    minWidth: 0,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    fontSize: 16,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    fontSize: 16,
  },
  removeName: {
    paddingHorizontal: Spacing.one,
  },
  notes: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.select({ ios: Spacing.three, default: Spacing.two }),
    fontSize: 16,
    minHeight: 48,
  },
  summary: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStrong: {
    fontSize: 18,
  },
  centerText: {
    textAlign: 'center',
  },
});
