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
import { SectionTitle } from '@/components/section-title';
import { showToast } from '@/components/toast';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SUPPORT_EMAIL } from '@/constants/app';
import { MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import {
  addSampleShifts,
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
import { getLanguage, LANGUAGE_OPTIONS, parseLanguagePreference, t, type LanguagePreference } from '@/i18n';
import { track } from '@/lib/analytics';
import { APPEARANCE_OPTIONS, parseAppearance, type AppearancePreference } from '@/lib/appearance';
import { parseBackup } from '@/lib/backup';
import { confirmDestructive } from '@/lib/confirm';
import { errorText } from '@/lib/errors';
import { formatDayLabel, toISODate, todayISO, weekdayName, weekdayShortName, type Weekday } from '@/lib/dates';
import { CSV, JSON_FILE, readPickedFile, shareTextFile } from '@/lib/files';
import { haptic } from '@/lib/haptics';
import { centsToInput, formatHourly, formatMoney, formatPercent, parseMoney, spokenHourly } from '@/lib/money';
import { notificationsSupported, requestNotificationPermission, scheduleTestReminder } from '@/lib/notify';
import { FREE_POSITION_LIMIT } from '@/lib/pro';
import { buildSampleShifts } from '@/lib/sample-data';
import { formatTime, type ReminderSettings } from '@/lib/reminders-plan';
import { shiftsToCsv } from '@/lib/transfer';
import { usePro } from '@/purchases/pro-context';

/** "$2.13/hr · tip-out 3% of tips"; `spoken` says "an hour" for screen readers. */
function describePosition(p: Position, { spoken = false } = {}) {
  const rate = spoken ? spokenHourly : formatHourly;
  const wage = p.hourlyWageCents > 0 ? rate(p.hourlyWageCents) : t('No hourly wage');
  const rule =
    p.tipOutRule === 'fixed'
      ? t('tip-out {amount}', { amount: formatMoney(p.tipOutValue) })
      : p.tipOutRule === 'pct_tips'
        ? t('tip-out {percent} of tips', { percent: formatPercent(p.tipOutValue) })
        : p.tipOutRule === 'pct_sales'
          ? t('tip-out {percent} of sales', { percent: formatPercent(p.tipOutValue) })
          : null;
  return [wage, rule].filter(Boolean).join(' · ');
}

const WEEK_STARTS: Weekday[] = [0, 1];
const REMINDER_TIMES = ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const permissionOff = () =>
  t('Notifications are off for Tipbook. Turn them on in your phone’s Settings app, then try again.');
const shiftCount = (count: number) => (count === 1 ? t('1 shift') : t('{count} shifts', { count }));

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
      language: parseLanguagePreference(settings.language),
    };
  }, []);
  const { data } = useDbQuery(load);
  const reminders = data?.reminders;

  const showPaywall = (reason: string) => router.push({ pathname: '/paywall', params: { reason } });

  const updateReminders = async (change: Partial<ReminderSettings>) => {
    if (!reminders) return;
    setReminderMessage(null);
    const turningOn =
      (change.enabled && !reminders.enabled) ||
      (change.reportReminder && !reminders.reportReminder) ||
      (change.weeklyRecap && !reminders.weeklyRecap);
    try {
      if (turningOn && !(await requestNotificationPermission())) {
        setReminderMessage(permissionOff());
        return;
      }
      await saveReminderSettings(db, { ...reminders, ...change });
    } catch (e) {
      setReminderMessage(t('Couldn’t change reminders: {error}', { error: errorText(e) }));
    }
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
        setExportMessage(t('No shifts to export yet.'));
        return;
      }
      const tipOuts = await listTipOutsBetween(db, '0000-01-01', '9999-12-31');
      await shareTextFile(
        `tips-${todayISO()}.csv`,
        shiftsToCsv(shifts.map((s) => ({ ...s, tipOuts: tipOuts.get(s.id) ?? [] }))),
        CSV,
      );
      setExportMessage(t('Exported {shifts}.', { shifts: shiftCount(shifts.length) }));
      track({ name: 'report_exported', type: 'csv' });
    } catch (e) {
      setExportMessage(t('Export failed: {error}', { error: errorText(e) }));
    }
  };

  const backUp = async () => {
    setBackupMessage(null);
    try {
      const backup = await createBackup(db);
      const today = todayISO();
      await shareTextFile(`tipbook-backup-${today}.json`, JSON.stringify(backup), JSON_FILE);
      await setSetting(db, 'last_backup_at', today);
      track({ name: 'report_exported', type: 'backup' });
      const count = backup.tables.shifts.length;
      setBackupMessage({
        text: t('Backed up {shifts}. Keep the file somewhere safe, like iCloud Drive or Google Drive.', {
          shifts: shiftCount(count),
        }),
      });
    } catch (e) {
      setBackupMessage({ text: t('Backup failed: {error}', { error: errorText(e) }), error: true });
    }
  };

  const restore = async () => {
    setBackupMessage(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const parsed = parseBackup(await readPickedFile(picked.assets[0]), SCHEMA_VERSION);
      if (!parsed.ok) {
        setBackupMessage({ text: parsed.error, error: true });
        return;
      }
      const count = parsed.backup.tables.shifts.length;
      const exportedAt = new Date(parsed.backup.exportedAt);
      const made = Number.isNaN(exportedAt.getTime())
        ? t('an unknown date')
        : formatDayLabel(toISODate(exportedAt), todayISO());
      const ok = await confirmDestructive(
        t('Replace everything on this phone?'),
        t('This backup from {date} has {shifts}. Everything currently in the app will be replaced by it.', {
          date: made,
          shifts: shiftCount(count),
        }),
        t('Replace'),
      );
      if (!ok) return;
      await restoreBackup(db, parsed.backup);
      setBackupMessage({ text: t('Restored {shifts} from {date}.', { shifts: shiftCount(count), date: made }) });
    } catch (e) {
      setBackupMessage({ text: t('Restore failed, nothing was changed: {error}', { error: errorText(e) }), error: true });
    }
  };

  const restorePro = async () => {
    setProMessage(null);
    try {
      setProMessage(
        (await restorePurchases())
          ? t('Pro restored. Thanks for your support!')
          : t('No previous purchase found for this account.'),
      );
    } catch (e) {
      setProMessage(t('Couldn’t restore purchases: {error}', { error: errorText(e) }));
    }
  };

  const eraseEverything = async () => {
    const ok = await confirmDestructive(
      t('Delete all data?'),
      t(
        'Every shift, position, paycheck and setting on this phone will be erased, and the app will start over. This can’t be undone, so back up first if you might want them later.',
      ),
      t('Delete everything'),
    );
    if (!ok) return;
    try {
      await deleteAllData(db);
    } catch (e) {
      showToast({ title: t('Couldn’t delete your data, nothing was changed'), detail: errorText(e) });
      return;
    }
    haptic.destructive();
    showToast({ title: t('All data deleted') });
  };

  const loadSampleShifts = async () => {
    try {
      const [position] = await listPositions(db);
      if (!position) return;
      const count = await addSampleShifts(db, position, buildSampleShifts(todayISO(), { seed: Date.now() % 100_000 }));
      showToast({ title: `Added ${count} sample shifts`, detail: 'Delete all data to remove them.' });
    } catch (e) {
      showToast({ title: 'Couldn’t add sample shifts', detail: errorText(e) });
    }
  };

  const contactSupport = () => {
    const subject = encodeURIComponent(t('Tipbook support'));
    // The last line tells support which version, phone and language (en or es) to answer for.
    const body = encodeURIComponent(
      `\n\n—\nTipbook ${Constants.expoConfig?.version ?? ''} · ${Platform.OS} ${String(Platform.Version)} · ${getLanguage()}`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
      showToast({ title: t('No email app found'), detail: t('Write to {email}', { email: SUPPORT_EMAIL }) }),
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          <ThemedText type="subtitle" accessibilityRole="header">
            {t('Settings')}
          </ThemedText>

          <View style={[styles.proCard, { backgroundColor: isPro ? theme.backgroundElement : theme.tintSoft }]}>
            <ThemedText type="smallBold">{isPro ? t('Tipbook Pro is active') : 'Tipbook Pro'}</ThemedText>
            <ThemedText type="small" themeColor={isPro ? 'textSecondary' : undefined}>
              {isPro
                ? t('Thanks for supporting an app with no ads. Manage your subscription in your App Store or Google Play account.')
                : t('Reports for your employer and tax time, automatic tip-outs, every job you work, and your year at a glance.')}
            </ThemedText>
            {!isPro ? (
              <>
                <Button title={t('See Pro')} onPress={() => showPaywall('settings')} />
                <Button title={t('Restore purchases')} variant="secondary" onPress={restorePro} />
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

          <Section title={t('Jobs & positions')}>
            {data?.positions.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`${t('{position} at {job}', { position: p.name, job: p.jobName })}, ${describePosition(p, { spoken: true })}`}
                accessibilityHint={t('Edit this position')}
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
            <Button title={t('Add a position')} variant="secondary" onPress={addPosition} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('Set a wage and tip-out rule per position. Server and bartender at the same place can differ.')}
            </ThemedText>
          </Section>

          <Section title={t('Reminders')}>
            {!notificationsSupported ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('Reminders work in the phone app, not in a browser.')}
              </ThemedText>
            ) : null}
            <ToggleRow
              label={t('After-shift reminder')}
              hint={t('Only on days you haven’t logged a shift yet.')}
              value={!!reminders?.enabled}
              disabled={!notificationsSupported || !reminders}
              onValueChange={(on) => updateReminders({ enabled: on })}
            />
            {reminders?.enabled ? (
              <>
                <View style={styles.chips}>
                  {REMINDER_TIMES.map((time) => (
                    <Chip
                      key={time}
                      label={formatTime(time)}
                      accessibilityLabel={t('Remind me at {time}', { time: formatTime(time) })}
                      selected={reminders.time === time}
                      onPress={() => updateReminders({ time })}
                    />
                  ))}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('On these days')}
                </ThemedText>
                <View style={styles.chips}>
                  {WEEKDAYS.map((day) => (
                    <Chip
                      key={day}
                      label={weekdayShortName(day)}
                      accessibilityLabel={weekdayName(day)}
                      selected={reminders.days.includes(day)}
                      onPress={() => toggleDay(day)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <ToggleRow
              label={t('Weekly recap')}
              hint={t('The morning after your week ends: what you made and your real hourly. The amounts show in the notification.')}
              value={!!reminders?.weeklyRecap}
              disabled={!notificationsSupported || !reminders}
              onValueChange={(on) => updateReminders({ weeklyRecap: on })}
            />
            <ToggleRow
              label={isPro ? t('Monthly report reminder') : t('Monthly report reminder · Pro')}
              hint={t('On the 8th, a nudge that last month’s tip report is due to your employer by the 10th.')}
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
                        : permissionOff(),
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

          <Section title={t('Weekly goal')}>
            {data ? <GoalField goalCents={data.weeklyGoal} onSave={(cents) => setWeeklyGoal(db, cents)} /> : null}
            <ThemedText type="small" themeColor="textSecondary">
              {t('What you aim to earn each week, tips plus wages. Home shows how close you are. Leave it empty for no goal.')}
            </ThemedText>
          </Section>

          <Section title={t('Week starts on')}>
            <View style={styles.segment}>
              {WEEK_STARTS.map((value) => (
                <SegmentItem
                  key={value}
                  label={weekdayName(value)}
                  accessibilityLabel={t('Week starts on {day}', { day: weekdayName(value) })}
                  selected={data?.weekStart === value}
                  onPress={() => setWeekStart(db, value)}
                />
              ))}
            </View>
          </Section>

          <Section title={t('Appearance')}>
            <View style={styles.segment}>
              {APPEARANCE_OPTIONS.map(({ value, label }) => (
                <SegmentItem
                  key={value}
                  label={t(label)}
                  accessibilityLabel={t('Appearance: {option}', { option: t(label) })}
                  selected={data?.appearance === value}
                  onPress={() => setSetting(db, 'appearance', value satisfies AppearancePreference)}
                />
              ))}
            </View>
          </Section>

          <Section title={t('Language')}>
            <View style={styles.segment}>
              {LANGUAGE_OPTIONS.map(({ value, label }) => (
                <SegmentItem
                  key={value}
                  // The language names stay in their own language, so they're findable whatever is showing.
                  label={value === 'system' ? t(label) : label}
                  accessibilityLabel={`${t('Language')}: ${value === 'system' ? t(label) : label}`}
                  selected={data?.language === value}
                  onPress={() => setSetting(db, 'language', value satisfies LanguagePreference)}
                />
              ))}
            </View>
          </Section>

          <Section title={t('Your data')}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('Your tips are stored only on this phone and included in your phone’s regular backups. No account, no ads.')}
            </ThemedText>
            <View style={[styles.backupCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">{t('Full backup')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {data?.lastBackup
                  ? t('Last backup: {date}', { date: formatDayLabel(data.lastBackup, todayISO()) })
                  : t('Not backed up yet. One file holds every shift, position and setting, so you can move to a new phone.')}
              </ThemedText>
              <Button title={t('Back up now')} onPress={backUp} />
              <Button title={t('Restore from a backup')} variant="secondary" onPress={restore} />
              {backupMessage ? (
                <ThemedText
                  type="small"
                  style={{ color: backupMessage.error ? theme.danger : theme.textSecondary }}
                  accessibilityLiveRegion="polite">
                  {backupMessage.text}
                </ThemedText>
              ) : null}
            </View>
            <Button title={t('Export all shifts (CSV)')} variant="secondary" onPress={exportCsv} />
            {exportMessage ? (
              <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                {exportMessage}
              </ThemedText>
            ) : null}
            <Button title={t('Import from another app (CSV)')} variant="secondary" onPress={() => router.push('/import')} />
            <Button title={t('Delete all data')} variant="danger" onPress={eraseEverything} />
          </Section>

          <Section title={t('Tools')}>
            <LinkRow label={t('Tip pool calculator')} onPress={() => router.push('/tip-pool')} />
          </Section>

          <Section title={t('About')}>
            <LinkRow
              label={t('Privacy policy')}
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
            />
            <LinkRow label={t('Terms of use')} onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
            {SUPPORT_EMAIL ? <LinkRow label={t('Contact support')} onPress={contactSupport} /> : null}
          </Section>

          {__DEV__ ? (
            <Section title="Developer">
              <Button title="Developer: add 12 weeks of sample shifts" variant="secondary" onPress={loadSampleShifts} />
            </Section>
          ) : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
            Tipbook {Constants.expoConfig?.version ?? ''} · {t('Records only, not tax advice.')}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
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
    try {
      await onSave(parsed > 0 ? parsed : null);
      setDraft(null);
    } catch (e) {
      showToast({ title: t('Couldn’t save your goal'), detail: errorText(e) });
    }
  };
  return (
    <MoneyField
      label={t('Goal per week')}
      prefix="$"
      placeholder={t('No goal')}
      value={value}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      returnKeyType="done"
      error={parsed === null ? t('Enter an amount like 800') : null}
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
