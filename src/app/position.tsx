import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  getPosition,
  listJobNames,
  listJobOvertimeByName,
  listPositions,
  removePosition,
  savePosition,
  type Position,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { bpsToInput, centsToInput, formatMoney, parseMoney, parsePercent } from '@/lib/money';
import { estimateDoubleTimeRate, estimateOvertimeRate, NO_OVERTIME, type JobOvertime } from '@/lib/overtime';
import { freeLimitViolation } from '@/lib/pro';
import { calcTipOut, type TipOutRule } from '@/lib/shift-math';
import { usePro } from '@/purchases/pro-context';

const RULES: { value: TipOutRule; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fixed', label: 'Fixed $' },
  { value: 'pct_tips', label: '% of tips' },
  { value: 'pct_sales', label: '% of sales' },
];

// California is the daily rule plus double time, stored as `doubleTime` on the job.
type OvertimeChoice = 'none' | 'weekly' | 'daily' | 'california';

const OVERTIME_CHOICES: { value: OvertimeChoice; label: string; hint: string | null }[] = [
  { value: 'none', label: 'Off', hint: null },
  { value: 'weekly', label: 'Over 40 hrs a week', hint: 'The federal rule, used in most states.' },
  {
    value: 'daily',
    label: 'Over 8 hrs a day',
    hint: 'After 8 hours in a day, and after 40 regular hours in a week, as in Alaska and Nevada.',
  },
  {
    value: 'california',
    label: 'California',
    hint: 'Time and a half after 8 hours in a day or 40 in a week, and double time after 12 hours in a day. Work all 7 days of a week and the 7th is overtime from the start, double after 8 hours.',
  },
];

const choiceOf = ({ rule, doubleTime }: JobOvertime): OvertimeChoice =>
  rule === 'daily' && doubleTime ? 'california' : rule;
const ruleOf = (choice: OvertimeChoice): Pick<JobOvertime, 'rule' | 'doubleTime'> =>
  choice === 'california' ? { rule: 'daily', doubleTime: true } : { rule: choice, doubleTime: false };

// The example used to preview a tip-out rule.
const EXAMPLE = { cashTipsCents: 8000, cardTipsCents: 12000, salesCents: 100000 };

function overtimeRateHint(choice: OvertimeChoice, wageCents: number | null, rateCents: number | null): string {
  if (choice === 'california') {
    if (rateCents !== null) return `Double time is worked out from it: ${formatMoney(estimateDoubleTimeRate(0, rateCents))}/hr.`;
    return wageCents
      ? `Leave empty to use ${formatMoney(estimateOvertimeRate(wageCents))}/hr, and ${formatMoney(estimateDoubleTimeRate(wageCents, null))}/hr for double time. Your paystub’s rate is more accurate.`
      : 'Enter your overtime rate, or add an hourly wage above so Tipbook can estimate it.';
  }
  return wageCents
    ? `Leave empty to use ${formatMoney(estimateOvertimeRate(wageCents))}/hr, the federal rate for a ${formatMoney(wageCents)} wage (1.5× pay, minus any tip credit). Your paystub’s rate is more accurate.`
    : 'Enter your overtime rate, or add an hourly wage above so Tipbook can estimate it.';
}

export default function PositionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const positionId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const { isPro } = usePro();

  const [name, setName] = useState('');
  const [jobName, setJobName] = useState('');
  const [originalJobName, setOriginalJobName] = useState('');
  const [wage, setWage] = useState('');
  const [rule, setRule] = useState<TipOutRule>('none');
  const [ruleValue, setRuleValue] = useState('');
  const [jobNames, setJobNames] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [overtimeByJob, setOvertimeByJob] = useState<Map<string, JobOvertime>>(new Map());
  const [overtimeDraft, setOvertimeDraft] = useState<{ choice: OvertimeChoice; rate: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [existing, jobs, active, overtime] = await Promise.all([
        positionId !== undefined ? getPosition(db, positionId) : null,
        listJobNames(db),
        listPositions(db),
        listJobOvertimeByName(db),
      ]);
      if (cancelled) return;
      setJobNames(jobs);
      setPositions(active);
      setOvertimeByJob(overtime);
      if (existing) {
        setName(existing.name);
        setJobName(existing.jobName);
        setOriginalJobName(existing.jobName);
        setWage(centsToInput(existing.hourlyWageCents));
        setRule(existing.tipOutRule);
        setRuleValue(existing.tipOutRule === 'fixed' ? centsToInput(existing.tipOutValue) : bpsToInput(existing.tipOutValue));
      } else {
        setJobName(jobs[0] ?? '');
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, positionId]);

  // Overtime belongs to the job, so show the settings of whichever job is named until the user edits them.
  // A name no job has yet is a rename (or a new job), which keeps this position's current job settings.
  const savedOvertime =
    overtimeByJob.get(jobName.trim().toLowerCase()) ??
    overtimeByJob.get(originalJobName.trim().toLowerCase()) ??
    NO_OVERTIME;
  const overtimeChoice = overtimeDraft?.choice ?? choiceOf(savedOvertime);
  const overtimeRate = overtimeDraft?.rate ?? (savedOvertime.rateCents === null ? '' : centsToInput(savedOvertime.rateCents));

  const wageCents = parseMoney(wage);
  const overtimeRateCents = overtimeRate.trim() === '' ? null : parseMoney(overtimeRate);
  const overtimeValid = overtimeRate.trim() === '' || (overtimeRateCents !== null && overtimeRateCents > 0);
  const isPercent = rule === 'pct_tips' || rule === 'pct_sales';
  const parsedRuleValue = rule === 'none' ? 0 : isPercent ? parsePercent(ruleValue) : parseMoney(ruleValue);
  const valid =
    name.trim() !== '' && jobName.trim() !== '' && wageCents !== null && parsedRuleValue !== null && overtimeValid;
  const canSave = loaded && valid && !saving;
  const example =
    rule !== 'none' && parsedRuleValue !== null ? calcTipOut(rule, parsedRuleValue, EXAMPLE) : null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const save = async () => {
    if (!canSave) return;
    const violation = isPro ? null : freeLimitViolation(positions, { id: positionId, jobName });
    if (violation) {
      router.push({ pathname: '/paywall', params: { reason: violation } });
      return;
    }
    setSaving(true);
    try {
      await savePosition(db, {
        id: positionId,
        name,
        jobName,
        hourlyWageCents: wageCents!,
        tipOutRule: rule,
        tipOutValue: parsedRuleValue!,
        overtime: { ...ruleOf(overtimeChoice), rateCents: overtimeChoice === 'none' ? null : overtimeRateCents },
      });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (positionId === undefined) return;
    const ok = await confirmDestructive(
      `Remove ${name}?`,
      'Shifts you already logged keep their history. You just won’t be able to pick this position for new shifts.',
      'Remove',
    );
    if (!ok) return;
    try {
      await removePosition(db, positionId);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen
        options={{
          title: positionId !== undefined ? 'Edit position' : 'New position',
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={close} hitSlop={12} style={styles.headerButton}>
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <TextField label="Position" value={name} onChangeText={setName} placeholder="Server, Bartender, Host…" />

        <View style={styles.field}>
          <TextField label="Job / workplace" value={jobName} onChangeText={setJobName} placeholder="Restaurant name" />
          {jobNames.length > 0 ? (
            <View style={styles.chips}>
              {jobNames.map((job) => (
                <Chip key={job} label={job} selected={job === jobName} onPress={() => setJobName(job)} />
              ))}
            </View>
          ) : null}
        </View>

        <MoneyField
          label="Hourly wage"
          prefix="$"
          suffix="/hr"
          value={wage}
          onChangeText={setWage}
          error={wageCents === null ? 'Enter a wage like 2.13 or 15' : null}
          hint="Your base pay before tips. Used for total earned and real hourly."
        />

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Tip-out each shift
          </ThemedText>
          <View style={styles.chips}>
            {RULES.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                selected={rule === r.value}
                onPress={() => {
                  setRule(r.value);
                  setRuleValue('');
                }}
              />
            ))}
          </View>
          {!isPro && rule !== 'none' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Pro fills this tip-out in on every shift automatically. On the free plan you enter it yourself.
            </ThemedText>
          ) : null}
        </View>

        {rule !== 'none' ? (
          <MoneyField
            label={isPercent ? 'Percentage' : 'Amount per shift'}
            prefix={isPercent ? undefined : '$'}
            suffix={isPercent ? '%' : undefined}
            value={ruleValue}
            onChangeText={setRuleValue}
            error={parsedRuleValue === null ? (isPercent ? 'Enter a percentage like 3 or 2.5' : 'Enter an amount like 15') : null}
            hint={
              example !== null
                ? `Example: on $200 in tips and $1,000 in sales, tip-out would be ${formatMoney(example)}. You can still change it on any shift.`
                : undefined
            }
          />
        ) : null}

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">
            Overtime at {jobName.trim() || 'this job'}
          </ThemedText>
          <View style={styles.chips}>
            {OVERTIME_CHOICES.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                selected={overtimeChoice === c.value}
                onPress={() => setOvertimeDraft({ choice: c.value, rate: overtimeRate })}
              />
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {OVERTIME_CHOICES.find((c) => c.value === overtimeChoice)?.hint ??
              'Rules differ by state. Pick the one your paystub follows; it applies to every position at this job.'}
          </ThemedText>
        </View>

        {overtimeChoice !== 'none' ? (
          <MoneyField
            label="Overtime rate (from your paystub)"
            prefix="$"
            suffix="/hr"
            value={overtimeRate}
            placeholder={wageCents ? centsToInput(estimateOvertimeRate(wageCents)) : 'Rate'}
            onChangeText={(rate) => setOvertimeDraft({ choice: overtimeChoice, rate })}
            error={overtimeValid ? null : 'Enter a rate like 5.76 or 22.50'}
            hint={overtimeRateHint(overtimeChoice, wageCents, overtimeRateCents)}
          />
        ) : null}

        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

        <Button title={saving ? 'Saving…' : 'Save position'} onPress={save} disabled={!canSave} />
        {positionId !== undefined && positions.length > 1 ? (
          <Button title="Remove position" variant="danger" onPress={remove} />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function TextField({
  label,
  ...props
}: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        maxLength={60}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: Platform.select({ web: Spacing.three, default: 0 }),
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
    fontSize: 17,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
