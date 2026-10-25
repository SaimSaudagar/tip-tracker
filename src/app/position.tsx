import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getPosition, listJobNames, listPositions, removePosition, savePosition } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { bpsToInput, centsToInput, formatMoney, parseMoney, parsePercent } from '@/lib/money';
import { calcTipOut, type TipOutRule } from '@/lib/shift-math';

const RULES: { value: TipOutRule; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fixed', label: 'Fixed $' },
  { value: 'pct_tips', label: '% of tips' },
  { value: 'pct_sales', label: '% of sales' },
];

// The example used to preview a tip-out rule.
const EXAMPLE = { cashTipsCents: 8000, cardTipsCents: 12000, salesCents: 100000 };

export default function PositionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const positionId = id ? Number(id) : undefined;
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [jobName, setJobName] = useState('');
  const [wage, setWage] = useState('');
  const [rule, setRule] = useState<TipOutRule>('none');
  const [ruleValue, setRuleValue] = useState('');
  const [jobNames, setJobNames] = useState<string[]>([]);
  const [positionCount, setPositionCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [existing, jobs, positions] = await Promise.all([
        positionId !== undefined ? getPosition(db, positionId) : null,
        listJobNames(db),
        listPositions(db),
      ]);
      if (cancelled) return;
      setJobNames(jobs);
      setPositionCount(positions.length);
      if (existing) {
        setName(existing.name);
        setJobName(existing.jobName);
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

  const wageCents = parseMoney(wage);
  const isPercent = rule === 'pct_tips' || rule === 'pct_sales';
  const parsedRuleValue = rule === 'none' ? 0 : isPercent ? parsePercent(ruleValue) : parseMoney(ruleValue);
  const valid = name.trim() !== '' && jobName.trim() !== '' && wageCents !== null && parsedRuleValue !== null;
  const canSave = loaded && valid && !saving;
  const example =
    rule !== 'none' && parsedRuleValue !== null ? calcTipOut(rule, parsedRuleValue, EXAMPLE) : null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await savePosition(db, {
        id: positionId,
        name,
        jobName,
        hourlyWageCents: wageCents!,
        tipOutRule: rule,
        tipOutValue: parsedRuleValue!,
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

        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

        <Button title={saving ? 'Saving…' : 'Save position'} onPress={save} disabled={!canSave} />
        {positionId !== undefined && positionCount > 1 ? (
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

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
      <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
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
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
});
