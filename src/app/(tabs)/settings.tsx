import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { getSettings, getWeekStart, listAllShifts, listPositions, setWeekStart, type Position } from '@/db/repo';
import { readReminderSettings, saveReminderSettings } from '@/db/settings';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { todayISO, type Weekday } from '@/lib/dates';
import { shareCsvFile } from '@/lib/files';
import { formatMoney, formatPercent } from '@/lib/money';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notify';
import { FREE_POSITION_LIMIT } from '@/lib/pro';
import { formatTime, type ReminderSettings } from '@/lib/reminders-plan';
import { shiftsToCsv } from '@/lib/transfer';
import { usePro } from '@/purchases/pro-context';

function describePosition(p: Position) {
  const wage = p.hourlyWageCents > 0 ? `${formatMoney(p.hourlyWageCents)}/hr` : 'No hourly wage';
  const rule =
    p.tipOutRule === 'fixed'
      ? `tip-out ${formatMoney(p.tipOutValue)}`
      : p.tipOutRule === 'pct_tips'
        ? `tip-out ${formatPercent(p.tipOutValue)} of tips`
        : p.tipOutRule === 'pct_sales'
          ? `tip-out ${formatPercent(p.tipOutValue)} of sales`
          : null;
  return [wage, rule].filter(Boolean).join(' · ');
}

const WEEK_STARTS: { value: Weekday; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];
const REMINDER_TIMES = ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERMISSION_OFF = 'Notifications are off for Tip Tracker. Turn them on in your phone’s Settings app, then try again.';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const { isPro, setSimulatedPro } = usePro();
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const load = useCallback(async (database: SQLiteDatabase) => {
    const [positions, weekStart, settings] = await Promise.all([
      listPositions(database),
      getWeekStart(database),
      getSettings(database),
    ]);
    return { positions, weekStart, reminders: readReminderSettings(settings) };
  }, []);
  const { data } = useDbQuery(load);
  const reminders = data?.reminders;

  const showPaywall = (reason: string) => router.push({ pathname: '/paywall', params: { reason } });

  const updateReminders = async (change: Partial<ReminderSettings>) => {
    if (!reminders) return;
    setReminderMessage(null);
    const turningOn = (change.enabled && !reminders.enabled) || (change.reportReminder && !reminders.reportReminder);
    if (turningOn && !(await requestNotificationPermission())) {
      setReminderMessage(PERMISSION_OFF);
      return;
    }
    await saveReminderSettings(db, { ...reminders, ...change });
  };

  const toggleDay = (day: Weekday) => {
    if (!reminders) return;
    const days = reminders.days.includes(day) ? reminders.days.filter((d) => d !== day) : [...reminders.days, day];
    if (days.length > 0) updateReminders({ days });
  };

  const addPosition = () => {
    if (!isPro && (data?.positions.length ?? 0) >= FREE_POSITION_LIMIT) showPaywall('positions');
    else router.push('/position');
  };

  const exportCsv = async () => {
    setExportMessage(null);
    try {
      const shifts = await listAllShifts(db);
      if (shifts.length === 0) {
        setExportMessage('No shifts to export yet.');
        return;
      }
      await shareCsvFile(`tips-${todayISO()}.csv`, shiftsToCsv(shifts));
      setExportMessage(`Exported ${shifts.length} shift${shifts.length === 1 ? '' : 's'}.`);
    } catch (e) {
      setExportMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="subtitle" accessibilityRole="header">
            Settings
          </ThemedText>

          <View style={[styles.proCard, { backgroundColor: isPro ? theme.backgroundElement : theme.tintSoft }]}>
            <ThemedText type="smallBold">{isPro ? 'Tip Tracker Pro is active' : 'Tip Tracker Pro'}</ThemedText>
            <ThemedText type="small" themeColor={isPro ? 'textSecondary' : undefined}>
              {isPro
                ? 'Thanks for supporting an app with no ads. Manage your subscription in your App Store or Google Play account.'
                : 'Reports for your employer and tax time, automatic tip-outs, every job you work, and your year at a glance.'}
            </ThemedText>
            {!isPro ? <Button title="See Pro" onPress={() => showPaywall('settings')} /> : null}
            {__DEV__ ? (
              <ToggleRow
                label="Developer: simulate Pro"
                hint="Development builds only, until RevenueCat is connected."
                value={isPro}
                onValueChange={(on) => setSimulatedPro(on)}
              />
            ) : null}
          </View>

          <Section title="JOBS & POSITIONS">
            {data?.positions.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${p.name} at ${p.jobName}`}
                onPress={() => router.push({ pathname: '/position', params: { id: String(p.id) } })}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold">
                  {p.name} · {p.jobName}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {describePosition(p)}
                </ThemedText>
              </Pressable>
            ))}
            <Button title="Add a position" variant="secondary" onPress={addPosition} />
            <ThemedText type="small" themeColor="textSecondary">
              Set a wage and tip-out rule per position. Server and bartender at the same place can differ.
            </ThemedText>
          </Section>

          <Section title="REMINDERS">
            {!notificationsSupported ? (
              <ThemedText type="small" themeColor="textSecondary">
                Reminders work in the phone app, not in a browser.
              </ThemedText>
            ) : null}
            <ToggleRow
              label="After-shift reminder"
              hint="Only on days you haven’t logged a shift yet."
              value={!!reminders?.enabled}
              disabled={!notificationsSupported || !reminders}
              onValueChange={(on) => updateReminders({ enabled: on })}
            />
            {reminders?.enabled ? (
              <>
                <View style={styles.chips}>
                  {REMINDER_TIMES.map((t) => (
                    <Chip
                      key={t}
                      label={formatTime(t)}
                      accessibilityLabel={`Remind me at ${formatTime(t)}`}
                      selected={reminders.time === t}
                      onPress={() => updateReminders({ time: t })}
                    />
                  ))}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  On these days
                </ThemedText>
                <View style={styles.chips}>
                  {DAY_NAMES.map((name, day) => (
                    <Chip
                      key={name}
                      label={name.slice(0, 3)}
                      accessibilityLabel={name}
                      selected={reminders.days.includes(day as Weekday)}
                      onPress={() => toggleDay(day as Weekday)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <ToggleRow
              label={isPro ? 'Monthly report reminder' : 'Monthly report reminder · Pro'}
              hint="On the 8th, a nudge that last month’s tip report is due to your employer by the 10th."
              value={isPro && !!reminders?.reportReminder}
              disabled={!notificationsSupported || !reminders}
              onValueChange={(on) => (isPro ? updateReminders({ reportReminder: on }) : showPaywall('reports'))}
            />
            {reminderMessage ? (
              <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
                {reminderMessage}
              </ThemedText>
            ) : null}
          </Section>

          <Section title="WEEK STARTS ON">
            <View style={styles.segment}>
              {WEEK_STARTS.map(({ value, label }) => {
                const selected = data?.weekStart === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Week starts on ${label}`}
                    accessibilityState={{ selected }}
                    onPress={() => setWeekStart(db, value)}
                    style={[styles.segmentItem, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
                    <ThemedText type="smallBold" style={{ color: selected ? theme.onTint : theme.text }}>
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="YOUR DATA">
            <ThemedText type="small" themeColor="textSecondary">
              Your tips are stored only on this phone and included in your phone’s regular backups. No account, no
              ads.
            </ThemedText>
            <Button title="Export all shifts (CSV)" variant="secondary" onPress={exportCsv} />
            {exportMessage ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                {exportMessage}
              </ThemedText>
            ) : null}
            <Button title="Import from another app (CSV)" variant="secondary" onPress={() => router.push('/import')} />
          </Section>

          <Section title="ABOUT">
            <LinkRow label="Privacy policy" onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
            <LinkRow label="Terms of use" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
          </Section>

          <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
            Tip Tracker {Constants.expoConfig?.version ?? ''} · Records only, not tax advice.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function ToggleRow(props: {
  label: string;
  hint?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (on: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <ThemedText type="smallBold">{props.label}</ThemedText>
        {props.hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {props.hint}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={props.label}
        value={props.value}
        disabled={props.disabled}
        onValueChange={props.onValueChange}
        trackColor={{ true: theme.tint }}
      />
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        ›
      </ThemedText>
    </Pressable>
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
  proCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  toggleText: {
    flex: 1,
    gap: Spacing.half,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  version: {
    textAlign: 'center',
  },
});
