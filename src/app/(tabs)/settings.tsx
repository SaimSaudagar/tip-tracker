import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { MoneyField } from '@/components/money-field';
import { showToast } from '@/components/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SUPPORT_EMAIL } from '@/constants/app';
import { MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import {
  deleteAllData,
  getSettings,
  getWeekStart,
  getWeeklyGoal,
  listAllShifts,
  listPositions,
  listTipOutsBetween,
  setSetting,
  setWeekStart,
  setWeeklyGoal,
  type Position,
} from '@/db/repo';
import { createBackup, restoreBackup } from '@/db/backup';
import { SCHEMA_VERSION } from '@/db/migrations';
import { readReminderSettings, saveReminderSettings } from '@/db/settings';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { APPEARANCE_OPTIONS, parseAppearance, type AppearancePreference } from '@/lib/appearance';
import { parseBackup } from '@/lib/backup';
import { confirmDestructive } from '@/lib/confirm';
import { formatDayLabel, toISODate, todayISO, type Weekday } from '@/lib/dates';
import { CSV, JSON_FILE, readPickedFile, shareTextFile } from '@/lib/files';
import { haptic } from '@/lib/haptics';
import { centsToInput, formatMoney, formatPercent, parseMoney } from '@/lib/money';
import { notificationsSupported, requestNotificationPermission, scheduleTestReminder } from '@/lib/notify';
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
  const { isPro, restore: restorePurchases, setSimulatedPro } = usePro();
  const [proMessage, setProMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async (database: SQLiteDatabase) => {
    const [positions, weekStart, settings, weeklyGoal] = await Promise.all([
      listPositions(database),
      getWeekStart(database),
      getSettings(database),
      getWeeklyGoal(database),
    ]);
    return {
      positions,
      weekStart,
      weeklyGoal,
      reminders: readReminderSettings(settings),
      lastBackup: settings.last_backup_at ?? null,
      appearance: parseAppearance(settings.appearance),
    };
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
      const tipOuts = await listTipOutsBetween(db, '0000-01-01', '9999-12-31');
      await shareTextFile(
        `tips-${todayISO()}.csv`,
        shiftsToCsv(shifts.map((s) => ({ ...s, tipOuts: tipOuts.get(s.id) ?? [] }))),
        CSV,
      );
      setExportMessage(`Exported ${shifts.length} shift${shifts.length === 1 ? '' : 's'}.`);
      track({ name: 'report_exported', type: 'csv' });
    } catch (e) {
      setExportMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const backUp = async () => {
    setBackupMessage(null);
    try {
      const backup = await createBackup(db);
      const today = todayISO();
      await shareTextFile(`tip-tracker-backup-${today}.json`, JSON.stringify(backup), JSON_FILE);
      await setSetting(db, 'last_backup_at', today);
      track({ name: 'report_exported', type: 'backup' });
      const count = backup.tables.shifts.length;
      setBackupMessage({ text: `Backed up ${count} shift${count === 1 ? '' : 's'}. Keep the file somewhere safe, like iCloud Drive or Google Drive.` });
    } catch (e) {
      setBackupMessage({ text: `Backup failed: ${e instanceof Error ? e.message : String(e)}`, error: true });
    }
  };

  const restore = async () => {
    setBackupMessage(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const parsed = parseBackup(await readPickedFile(picked.assets[0]), SCHEMA_VERSION);
      if (!parsed.ok) {
        setBackupMessage({ text: parsed.error, error: true });
        return;
      }
      const count = parsed.backup.tables.shifts.length;
      const made = formatDayLabel(toISODate(new Date(parsed.backup.exportedAt)), todayISO());
      const ok = await confirmDestructive(
        'Replace everything on this phone?',
        `This backup from ${made} has ${count} shift${count === 1 ? '' : 's'}. Everything currently in the app will be replaced by it.`,
        'Replace',
      );
      if (!ok) return;
      await restoreBackup(db, parsed.backup);
      setBackupMessage({ text: `Restored ${count} shift${count === 1 ? '' : 's'} from ${made}.` });
    } catch (e) {
      setBackupMessage({ text: `Restore failed, nothing was changed: ${e instanceof Error ? e.message : String(e)}`, error: true });
    }
  };

  const restorePro = async () => {
    setProMessage(null);
    try {
      setProMessage((await restorePurchases()) ? 'Pro restored. Thanks for your support!' : 'No previous purchase found for this account.');
    } catch (e) {
      setProMessage(`Couldn’t restore purchases: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const eraseEverything = async () => {
    const ok = await confirmDestructive(
      'Delete all data?',
      'Every shift, position, paycheck and setting on this phone will be erased, and the app will start over. This can’t be undone, so back up first if you might want them later.',
      'Delete everything',
    );
    if (!ok) return;
    await deleteAllData(db);
    haptic.destructive();
    showToast({ title: 'All data deleted' });
  };

  const contactSupport = () => {
    const subject = encodeURIComponent('Tip Tracker support');
    const body = encodeURIComponent(
      `\n\n—\nTip Tracker ${Constants.expoConfig?.version ?? ''} on ${Platform.OS} ${String(Platform.Version)}`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      showToast({ title: 'No email app found', detail: `Write to ${SUPPORT_EMAIL}` }),
    );
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
            {!isPro ? (
              <>
                <Button title="See Pro" onPress={() => showPaywall('settings')} />
                <Button title="Restore purchases" variant="secondary" onPress={restorePro} />
              </>
            ) : null}
            {proMessage ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                {proMessage}
              </ThemedText>
            ) : null}
            {__DEV__ ? (
              <ToggleRow
                label="Developer: simulate Pro"
                hint="Development builds only: turns Pro on without buying it."
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
            {__DEV__ && notificationsSupported ? (
              <>
                <Button
                  title="Developer: test reminder in 1 minute"
                  variant="secondary"
                  onPress={async () => {
                    setTestMessage(null);
                    setTestMessage(
                      (await scheduleTestReminder(60))
                        ? 'Scheduled. Leave the app or lock your phone; it arrives in about a minute. Tap it to open Log shift.'
                        : PERMISSION_OFF,
                    );
                  }}
                />
                {testMessage ? (
                  <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                    {testMessage}
                  </ThemedText>
                ) : null}
              </>
            ) : null}
          </Section>

          <Section title="WEEKLY GOAL">
            {data ? <GoalField goalCents={data.weeklyGoal} onSave={(cents) => setWeeklyGoal(db, cents)} /> : null}
            <ThemedText type="small" themeColor="textSecondary">
              What you aim to earn each week, tips plus wages. Home shows how close you are. Leave it empty for no goal.
            </ThemedText>
          </Section>

          <Section title="WEEK STARTS ON">
            <View style={styles.segment}>
              {WEEK_STARTS.map(({ value, label }) => (
                <SegmentItem
                  key={value}
                  label={label}
                  accessibilityLabel={`Week starts on ${label}`}
                  selected={data?.weekStart === value}
                  onPress={() => setWeekStart(db, value)}
                />
              ))}
            </View>
          </Section>

          <Section title="APPEARANCE">
            <View style={styles.segment}>
              {APPEARANCE_OPTIONS.map(({ value, label }) => (
                <SegmentItem
                  key={value}
                  label={label}
                  accessibilityLabel={`Appearance: ${label}`}
                  selected={data?.appearance === value}
                  onPress={() => setSetting(db, 'appearance', value satisfies AppearancePreference)}
                />
              ))}
            </View>
          </Section>

          <Section title="YOUR DATA">
            <ThemedText type="small" themeColor="textSecondary">
              Your tips are stored only on this phone and included in your phone’s regular backups. No account, no
              ads.
            </ThemedText>
            <View style={[styles.backupCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Full backup</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {data?.lastBackup
                  ? `Last backup: ${formatDayLabel(data.lastBackup, todayISO())}`
                  : 'Not backed up yet. One file holds every shift, position and setting, so you can move to a new phone.'}
              </ThemedText>
              <Button title="Back up now" onPress={backUp} />
              <Button title="Restore from a backup" variant="secondary" onPress={restore} />
              {backupMessage ? (
                <ThemedText
                  type="small"
                  style={{ color: backupMessage.error ? theme.danger : theme.textSecondary }}
                  accessibilityLiveRegion="polite">
                  {backupMessage.text}
                </ThemedText>
              ) : null}
            </View>
            <Button title="Export all shifts (CSV)" variant="secondary" onPress={exportCsv} />
            {exportMessage ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                {exportMessage}
              </ThemedText>
            ) : null}
            <Button title="Import from another app (CSV)" variant="secondary" onPress={() => router.push('/import')} />
            <Button title="Delete all data" variant="danger" onPress={eraseEverything} />
          </Section>

          <Section title="TOOLS">
            <LinkRow label="Tip pool calculator" onPress={() => router.push('/tip-pool')} />
          </Section>

          <Section title="ABOUT">
            <LinkRow label="Privacy policy" onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} />
            <LinkRow label="Terms of use" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
            {SUPPORT_EMAIL ? <LinkRow label="Contact support" onPress={contactSupport} /> : null}
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

/** Edits the goal in place and saves when the field loses focus or Done is pressed. */
function GoalField({ goalCents, onSave }: { goalCents: number | null; onSave: (cents: number | null) => Promise<void> }) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? (goalCents ? centsToInput(goalCents) : '');
  const parsed = value.trim() === '' ? 0 : parseMoney(value);
  const commit = async () => {
    if (draft === null || parsed === null) return;
    await onSave(parsed > 0 ? parsed : null);
    setDraft(null);
  };
  return (
    <MoneyField
      label="Goal per week"
      prefix="$"
      placeholder="No goal"
      value={value}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      returnKeyType="done"
      error={parsed === null ? 'Enter an amount like 800' : null}
    />
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

function SegmentItem(props: { label: string; accessibilityLabel: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={{ selected: props.selected }}
      onPress={() => {
        if (!props.selected) haptic.selection();
        props.onPress();
      }}
      style={[styles.segmentItem, { backgroundColor: props.selected ? theme.tint : theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={{ color: props.selected ? theme.onTint : theme.text }}>
        {props.label}
      </ThemedText>
    </Pressable>
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
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  backupCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
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
