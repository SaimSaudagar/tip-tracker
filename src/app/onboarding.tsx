import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { listPositions, savePosition, setSetting, setWeekStart } from '@/db/repo';
import { saveReminderSettings } from '@/db/settings';
import { useTheme } from '@/hooks/use-theme';
import type { Weekday } from '@/lib/dates';
import { parseMoney, parsePercent } from '@/lib/money';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notify';
import { DEFAULT_REMINDERS, formatTime } from '@/lib/reminders-plan';
import type { TipOutRule } from '@/lib/shift-math';

const ROLES = ['Server', 'Bartender', 'Barista', 'Host', 'Busser', 'Valet', 'Casino dealer', 'Stylist', 'Barber', 'Other'];
const RULES: { value: TipOutRule; label: string }[] = [
  { value: 'none', label: 'No tip-out' },
  { value: 'pct_tips', label: '% of my tips' },
  { value: 'pct_sales', label: '% of my sales' },
  { value: 'fixed', label: 'Same $ each shift' },
];
const REMINDER_TIMES = ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
const STEPS = 6;

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState('Server');
  const [otherRole, setOtherRole] = useState('');
  const [jobName, setJobName] = useState('');
  const [wage, setWage] = useState('');
  const [rule, setRule] = useState<TipOutRule>('none');
  const [ruleValue, setRuleValue] = useState('');
  const [weekStart, setWeekStartChoice] = useState<Weekday>(0);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDERS.time);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const wageCents = parseMoney(wage);
  const isPercent = rule === 'pct_tips' || rule === 'pct_sales';
  const ruleCents = rule === 'none' ? 0 : isPercent ? parsePercent(ruleValue) : parseMoney(ruleValue);
  const positionName = role === 'Other' ? otherRole.trim() || 'My position' : role;

  const finish = async (remind: boolean) => {
    setSaving(true);
    setNotice(null);
    try {
      const allowed = remind ? await requestNotificationPermission() : false;
      const [first] = await listPositions(db);
      await savePosition(db, {
        id: first?.id,
        jobName: jobName.trim() || 'My job',
        name: positionName,
        hourlyWageCents: wageCents ?? 0,
        tipOutRule: ruleCents === null ? 'none' : rule,
        tipOutValue: ruleCents ?? 0,
      });
      await setWeekStart(db, weekStart);
      await saveReminderSettings(db, { ...DEFAULT_REMINDERS, enabled: allowed, time: reminderTime });
      await setSetting(db, 'onboarded', '1');
      router.replace({ pathname: '/paywall', params: { reason: 'onboarding' } });
    } catch (e) {
      setNotice(`Something went wrong: ${e instanceof Error ? e.message : String(e)}`);
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStep(step - 1)} hitSlop={12}>
              <ThemedText style={{ color: theme.tint }}>‹ Back</ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={styles.dots} accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: i <= step ? theme.tint : theme.backgroundSelected }]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          {step === 0 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Know what you really make.
              </ThemedText>
              {[
                'Log a shift in about five seconds',
                'See your real hourly, not just your tips',
                'Monthly tip reports, ready for your employer',
                'No ads. No account. Your tips stay on this phone.',
              ].map((line) => (
                <View key={line} style={styles.bullet}>
                  <ThemedText style={{ color: theme.tint }}>✓</ThemedText>
                  <ThemedText style={styles.bulletText}>{line}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                What do you do?
              </ThemedText>
              <View style={styles.chips}>
                {ROLES.map((r) => (
                  <Chip key={r} label={r} selected={role === r} onPress={() => setRole(r)} />
                ))}
              </View>
              {role === 'Other' ? (
                <TextInput
                  value={otherRole}
                  onChangeText={setOtherRole}
                  placeholder="Your role"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Your role"
                  maxLength={40}
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                Work more than one role? You can add more later in Settings.
              </ThemedText>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Where do you work?
              </ThemedText>
              <TextInput
                value={jobName}
                onChangeText={setJobName}
                placeholder="Restaurant or bar name"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Workplace name"
                maxLength={60}
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              <MoneyField
                label="Hourly wage before tips"
                prefix="$"
                suffix="/hr"
                value={wage}
                onChangeText={setWage}
                error={wageCents === null ? 'Enter a wage like 2.13 or 15' : null}
                hint="Used for your real hourly. Leave it empty if you’re paid tips only."
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Do you tip out?
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Money you share with bussers, the bar or hosts at the end of a shift.
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
              {rule !== 'none' ? (
                <MoneyField
                  label={isPercent ? 'Percentage' : 'Amount each shift'}
                  prefix={isPercent ? undefined : '$'}
                  suffix={isPercent ? '%' : undefined}
                  value={ruleValue}
                  onChangeText={setRuleValue}
                  error={ruleCents === null ? (isPercent ? 'Enter a percentage like 3' : 'Enter an amount like 15') : null}
                />
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                When does your work week start?
              </ThemedText>
              <View style={styles.chips}>
                <Chip label="Sunday" selected={weekStart === 0} onPress={() => setWeekStartChoice(0)} />
                <Chip label="Monday" selected={weekStart === 1} onPress={() => setWeekStartChoice(1)} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Your weekly totals follow this. Match it to your pay week.
              </ThemedText>
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Want a nudge after your shift?
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                One reminder on nights you haven’t logged yet. Never on days you already did.
              </ThemedText>
              <View style={styles.chips}>
                {REMINDER_TIMES.map((t) => (
                  <Chip key={t} label={formatTime(t)} selected={reminderTime === t} onPress={() => setReminderTime(t)} />
                ))}
              </View>
              {!notificationsSupported ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Reminders work in the phone app, not in a browser.
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {notice ? <ThemedText style={{ color: theme.danger }}>{notice}</ThemedText> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < STEPS - 1 ? (
            <Button
              title={step === 0 ? 'Get started' : 'Continue'}
              onPress={next}
              disabled={(step === 2 && wageCents === null) || (step === 3 && ruleCents === null)}
            />
          ) : (
            <>
              <Button
                title={saving ? 'Setting up…' : `Remind me at ${formatTime(reminderTime)}`}
                onPress={() => finish(true)}
                disabled={saving || !notificationsSupported}
              />
              <Button title="Not now" variant="secondary" onPress={() => finish(false)} disabled={saving} />
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    minHeight: 40,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  block: {
    gap: Spacing.three,
  },
  bullet: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
    fontSize: 17,
  },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
