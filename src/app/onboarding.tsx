import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
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
import { msg, t } from '@/i18n';
import { track } from '@/lib/analytics';
import { weekdayName, type Weekday } from '@/lib/dates';
import { parseMoney, parsePercent } from '@/lib/money';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notify';
import { DEFAULT_REMINDERS, formatTime } from '@/lib/reminders-plan';
import type { TipOutRule } from '@/lib/shift-math';

// In English here; the position is saved under the name shown, so it's in the person's language.
const ROLES = [
  msg('Server'),
  msg('Bartender'),
  msg('Barista'),
  msg('Host'),
  msg('Busser'),
  msg('Valet'),
  msg('Casino dealer'),
  msg('Stylist'),
  msg('Barber'),
];
const OTHER_ROLE = 'other';
const RULES: { value: TipOutRule; label: string }[] = [
  { value: 'none', label: msg('No tip-out') },
  { value: 'pct_tips', label: msg('% of my tips') },
  { value: 'pct_sales', label: msg('% of my sales') },
  { value: 'fixed', label: msg('Same $ each shift') },
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

  useEffect(() => track({ name: 'onboarding_step_viewed', step: step + 1 }), [step]);

  const wageCents = parseMoney(wage);
  const isPercent = rule === 'pct_tips' || rule === 'pct_sales';
  const ruleCents = rule === 'none' ? 0 : isPercent ? parsePercent(ruleValue) : parseMoney(ruleValue);
  const positionName = role === OTHER_ROLE ? otherRole.trim() || t('My position') : t(role);

  const finish = async (remind: boolean) => {
    setSaving(true);
    setNotice(null);
    try {
      const allowed = remind ? await requestNotificationPermission() : false;
      const [first] = await listPositions(db);
      await savePosition(db, {
        id: first?.id,
        jobName: jobName.trim() || t('My job'),
        name: positionName,
        hourlyWageCents: wageCents ?? 0,
        tipOutRule: ruleCents === null ? 'none' : rule,
        tipOutValue: ruleCents ?? 0,
      });
      await setWeekStart(db, weekStart);
      await saveReminderSettings(db, { ...DEFAULT_REMINDERS, enabled: allowed, time: reminderTime });
      await setSetting(db, 'onboarded', '1');
      track({ name: 'onboarding_completed', reminders: allowed });
      router.replace({ pathname: '/paywall', params: { reason: 'onboarding' } });
    } catch (e) {
      setNotice(t('Something went wrong: {error}', { error: e instanceof Error ? e.message : String(e) }));
      setSaving(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Back')}
              onPress={() => setStep(step - 1)}
              hitSlop={12}>
              <ThemedText style={{ color: theme.tint }}>{t('‹ Back')}</ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <View
            style={styles.dots}
            accessible
            role="progressbar"
            aria-label={t('Step {step} of {count}', { step: step + 1, count: STEPS })}
            aria-valuemin={1}
            aria-valuemax={STEPS}
            aria-valuenow={step + 1}
            aria-valuetext={t('Step {step} of {count}', { step: step + 1, count: STEPS })}>
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
                {t('Know what you really make.')}
              </ThemedText>
              {[
                t('Log a shift in about five seconds'),
                t('See your real hourly, not just your tips'),
                t('Monthly tip reports, ready for your employer'),
                t('No ads. No account. Your tips stay on this phone.'),
              ].map((line) => (
                <View key={line} style={styles.bullet}>
                  <ThemedText style={{ color: theme.tint }}>✓</ThemedText>
                  <ThemedText style={styles.bulletText}>{line}</ThemedText>
                </View>
              ))}
              <ThemedText type="small" themeColor="textSecondary">
                {t(
                  'Switching from another tip app? Set up here first, then import your history from a CSV file on the Home screen.',
                )}
              </ThemedText>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t('What do you do?')}
              </ThemedText>
              <View style={styles.chips}>
                {ROLES.map((r) => (
                  <Chip key={r} label={t(r)} selected={role === r} onPress={() => setRole(r)} />
                ))}
                <Chip label={t('Other')} selected={role === OTHER_ROLE} onPress={() => setRole(OTHER_ROLE)} />
              </View>
              {role === OTHER_ROLE ? (
                <TextInput
                  value={otherRole}
                  onChangeText={setOtherRole}
                  placeholder={t('Your role')}
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel={t('Your role')}
                  maxLength={40}
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                {t('Work more than one role? You can add more later in Settings.')}
              </ThemedText>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t('Where do you work?')}
              </ThemedText>
              <TextInput
                value={jobName}
                onChangeText={setJobName}
                placeholder={t('Restaurant or bar name')}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={t('Workplace name')}
                maxLength={60}
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              <MoneyField
                label={t('Hourly wage before tips')}
                prefix="$"
                suffix={t('/hr')}
                value={wage}
                onChangeText={setWage}
                error={wageCents === null ? t('Enter a wage like 2.13 or 15') : null}
                hint={t('Used for your real hourly. Leave it empty if you’re paid tips only.')}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t('Do you tip out?')}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t('Money you share with bussers, the bar or hosts at the end of a shift.')}
              </ThemedText>
              <View style={styles.chips}>
                {RULES.map((r) => (
                  <Chip
                    key={r.value}
                    label={t(r.label)}
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
                  label={isPercent ? t('Percentage') : t('Amount each shift')}
                  prefix={isPercent ? undefined : '$'}
                  suffix={isPercent ? '%' : undefined}
                  value={ruleValue}
                  onChangeText={setRuleValue}
                  error={
                    ruleCents === null ? (isPercent ? t('Enter a percentage like 3') : t('Enter an amount like 15')) : null
                  }
                />
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t('When does your work week start?')}
              </ThemedText>
              <View style={styles.chips}>
                <Chip label={weekdayName(0)} selected={weekStart === 0} onPress={() => setWeekStartChoice(0)} />
                <Chip label={weekdayName(1)} selected={weekStart === 1} onPress={() => setWeekStartChoice(1)} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {t('Your weekly totals follow this. Match it to your pay week.')}
              </ThemedText>
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t('Want a nudge after your shift?')}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t('One reminder on nights you haven’t logged yet. Never on days you already did.')}
              </ThemedText>
              <View style={styles.chips}>
                {REMINDER_TIMES.map((time) => (
                  <Chip
                    key={time}
                    label={formatTime(time)}
                    selected={reminderTime === time}
                    onPress={() => setReminderTime(time)}
                  />
                ))}
              </View>
              {!notificationsSupported ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('Reminders work in the phone app, not in a browser.')}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {notice ? <ThemedText style={{ color: theme.danger }}>{notice}</ThemedText> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < STEPS - 1 ? (
            <Button
              title={step === 0 ? t('Get started') : t('Continue')}
              onPress={next}
              disabled={(step === 2 && wageCents === null) || (step === 3 && ruleCents === null)}
            />
          ) : (
            <>
              <Button
                title={saving ? t('Setting up…') : t('Remind me at {time}', { time: formatTime(reminderTime) })}
                onPress={() => finish(true)}
                disabled={saving || !notificationsSupported}
              />
              <Button title={t('Not now')} variant="secondary" onPress={() => finish(false)} disabled={saving} />
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
