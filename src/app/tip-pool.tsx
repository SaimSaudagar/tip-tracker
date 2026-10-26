import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { MoneyField } from '@/components/money-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, parseDuration } from '@/lib/duration';
import { centsToInput, formatMoney, parseMoney } from '@/lib/money';
import { describeTipPool, splitTipPool, type SplitMode } from '@/lib/tip-pool';

type Row = { key: string; name: string; hours: string };

export default function TipPoolScreen() {
  const router = useRouter();
  const theme = useTheme();
  const nextKey = useRef(2);
  const [total, setTotal] = useState('');
  const [mode, setMode] = useState<SplitMode>('hours');
  const [rows, setRows] = useState<Row[]>([
    { key: 'row-0', name: 'Me', hours: '' },
    { key: 'row-1', name: '', hours: '' },
  ]);

  const totalCents = parseMoney(total);
  const filled = rows.filter((r) => r.name.trim() !== '' || r.hours.trim() !== '');
  const members = filled.map((r, i) => ({
    key: r.key,
    name: r.name.trim() || `Person ${i + 1}`,
    minutes: parseDuration(r.hours),
    missingHours: r.hours.trim() === '',
  }));
  const hoursProblem = mode === 'hours' && members.some((m) => m.minutes === null || m.missingHours);
  const shares =
    totalCents && !hoursProblem && members.length > 0
      ? splitTipPool(
          totalCents,
          members.map((m) => ({ name: m.name, minutes: m.minutes ?? 0 })),
          mode,
        )
      : null;
  // The first row is you; its share can go straight into a new shift.
  const myIndex = members.findIndex((m) => m.key === rows[0]?.key);
  const myShare = shares && myIndex >= 0 ? shares[myIndex] : null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const updateRow = (key: string, change: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...change } : r)));

  const share = () => {
    if (!shares || !totalCents) return;
    Share.share({ message: describeTipPool(totalCents, shares, mode) }).catch(() => {});
  };

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Tip pool',
          headerLeft: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={12} style={styles.headerButton}>
              <ThemedText style={{ color: theme.tint }}>Close</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          Split a shared pool between the team, by hours worked or equally. Nothing here is saved.
        </ThemedText>

        <MoneyField
          label="Tip pool total"
          prefix="$"
          value={total}
          onChangeText={setTotal}
          autoFocus
          error={totalCents === null ? 'Enter an amount like 480 or 480.50' : null}
        />

        <View style={styles.chips}>
          <Chip label="By hours" selected={mode === 'hours'} onPress={() => setMode('hours')} />
          <Chip label="Equally" selected={mode === 'equal'} onPress={() => setMode('equal')} />
        </View>

        <View style={styles.people}>
          {rows.map((row, i) => (
            <View key={row.key} style={styles.personRow}>
              <TextInput
                value={row.name}
                onChangeText={(name) => updateRow(row.key, { name })}
                placeholder={`Person ${i + 1}`}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={`Name ${i + 1}`}
                maxLength={30}
                style={[styles.nameInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              {mode === 'hours' ? (
                <TextInput
                  value={row.hours}
                  onChangeText={(hours) => updateRow(row.key, { hours })}
                  placeholder="hrs"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel={`Hours for ${row.name || `person ${i + 1}`}`}
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  style={[styles.hoursInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${row.name || `person ${i + 1}`}`}
                disabled={rows.length <= 1}
                onPress={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                hitSlop={8}
                style={[styles.remove, { opacity: rows.length <= 1 ? 0.3 : 1 }]}>
                <ThemedText themeColor="textSecondary">✕</ThemedText>
              </Pressable>
            </View>
          ))}
          <View style={styles.chips}>
            <Chip
              label="+ Add person"
              selected={false}
              onPress={() => setRows((current) => [...current, { key: `row-${nextKey.current++}`, name: '', hours: '' }])}
            />
          </View>
          {hoursProblem ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              Enter hours like 6.5 or 6:30 for everyone.
            </ThemedText>
          ) : null}
        </View>

        {shares ? (
          <View style={[styles.result, { backgroundColor: theme.tintSoft }]} accessibilityLiveRegion="polite">
            {shares.map((s, i) => (
              <View key={members[i].key} style={styles.resultLine}>
                <ThemedText type={i === myIndex ? 'smallBold' : 'small'} style={styles.resultName} numberOfLines={1}>
                  {s.name}
                  {mode === 'hours' ? ` · ${formatDuration(s.minutes)}` : ''}
                </ThemedText>
                <ThemedText type="smallBold">{formatMoney(s.amountCents)}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {myShare ? (
          <Button
            title={`Log my ${formatMoney(myShare.amountCents)} in a shift`}
            onPress={() => router.replace({ pathname: '/log-shift', params: { tipIn: centsToInput(myShare.amountCents) } })}
          />
        ) : null}
        {shares ? <Button title="Share the split" variant="secondary" onPress={share} /> : null}
        {myShare ? (
          <ThemedText type="small" themeColor="textSecondary">
            Your share goes in as tips from coworkers. If you put your own tips into the pool, enter those as tip-out.
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
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
  people: {
    gap: Spacing.two,
  },
  personRow: {
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
  hoursInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    fontSize: 16,
  },
  remove: {
    paddingHorizontal: Spacing.one,
  },
  result: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  resultLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  resultName: {
    flex: 1,
  },
});
