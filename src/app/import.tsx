import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { importShifts, listPositions, type Position } from '@/db/repo';
import { track } from '@/lib/analytics';
import { useTheme } from '@/hooks/use-theme';
import { parseCsv } from '@/lib/csv';
import { formatDayLabel, todayISO } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { readPickedFile } from '@/lib/files';
import { formatMoney } from '@/lib/money';
import { computeShift } from '@/lib/shift-math';
import { IMPORT_FIELDS, buildImportDrafts, guessMapping, splitHeader, type ImportField, type ImportMapping } from '@/lib/transfer';

type Loaded = { fileName: string; headers: string[]; rows: string[][]; firstLine: number };
type Result = { imported: number; duplicates: number; skipped: number };

const CSV_TYPES = ['text/csv', 'text/comma-separated-values', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];

export default function ImportScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const today = todayISO();

  const [positions, setPositions] = useState<Position[]>([]);
  const [fallbackId, setFallbackId] = useState<number | null>(null);
  const [file, setFile] = useState<Loaded | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [editing, setEditing] = useState<ImportField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    listPositions(db).then((all) => {
      setPositions(all);
      setFallbackId(all[0]?.id ?? null);
    });
  }, [db]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const pickFile = async () => {
    setError(null);
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: CSV_TYPES, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    try {
      const { headers, rows, firstLine } = splitHeader(parseCsv(await readPickedFile(asset)));
      if (headers.length === 0 || rows.length === 0) {
        setError('That file has no rows to import. Export a CSV from your old app and try again.');
        return;
      }
      setFile({ fileName: asset.name, headers, rows, firstLine });
      setMapping(guessMapping(headers));
      setEditing(null);
    } catch (e) {
      setError(`Couldn’t read that file: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const preview = file && mapping && mapping.date !== null ? buildImportDrafts(file.rows, mapping, file.firstLine) : null;
  const fallback = positions.find((p) => p.id === fallbackId) ?? null;
  const usesPositionColumns = mapping?.job != null || mapping?.position != null;

  const runImport = async () => {
    if (!preview || !fallback || !mapping) return;
    setBusy(true);
    setError(null);
    try {
      const { imported, duplicates } = await importShifts(db, preview.drafts, fallback, {
        useImportedWage: mapping.wage !== null || mapping.wagesEarned !== null,
      });
      setResult({ imported, duplicates, skipped: preview.skipped.length });
      track({ name: 'import_completed', rows: imported });
    } catch (e) {
      setError(`Import failed, nothing was saved: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const columnName = (index: number | null) => (index === null ? 'Not imported' : file?.headers[index] || `Column ${index + 1}`);

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Import shifts',
          headerLeft: () => (
            <Pressable accessibilityRole="button" onPress={close} hitSlop={12} style={styles.headerButton}>
              <ThemedText style={{ color: theme.tint }}>{result ? 'Done' : 'Cancel'}</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {result ? (
          <View style={[styles.card, { backgroundColor: theme.tintSoft }]} accessibilityLiveRegion="polite">
            <ThemedText type="smallBold" style={styles.big}>
              Imported {result.imported} shift{result.imported === 1 ? '' : 's'}
            </ThemedText>
            {result.duplicates > 0 ? (
              <ThemedText type="small">
                {result.duplicates === 1 ? '1 was' : `${result.duplicates} were`} already in the app and skipped.
              </ThemedText>
            ) : null}
            {result.skipped > 0 ? (
              <ThemedText type="small">
                {result.skipped === 1 ? '1 row' : `${result.skipped} rows`} couldn’t be read and{' '}
                {result.skipped === 1 ? 'was' : 'were'} left out.
              </ThemedText>
            ) : null}
            <Button title="Done" onPress={close} />
          </View>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Export your history as a CSV from your old tip app (or a spreadsheet), then pick the file here. Tipbook
              matches the columns by name, such as cash and card tips, tip-outs, hours or start and end times, wages and
              sales, and you can change any match. Nothing is saved until you tap Import.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Can’t find the export? In most tip apps it’s under Settings or Reports, as Export or Backup; some email the
              file to you. In Excel, Numbers or Google Sheets, save or download the sheet as CSV.
            </ThemedText>
            <Button title={file ? `Choose a different file` : 'Choose CSV file'} variant={file ? 'secondary' : 'primary'} onPress={pickFile} />
          </>
        )}

        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

        {file && mapping && !result ? (
          <>
            <SectionTitle>{`${file.fileName} · ${file.rows.length} rows`}</SectionTitle>
            <ThemedText type="small" themeColor="textSecondary">
              Check which column fills each field. Tap a field to change it.
            </ThemedText>

            <View style={styles.list}>
              {IMPORT_FIELDS.map((field) => {
                const open = editing === field.key;
                const index = mapping[field.key];
                const missingRequired = 'required' in field && field.required && index === null;
                return (
                  <View key={field.key} style={[styles.mapRow, { backgroundColor: theme.backgroundElement }]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityLabel={`${field.label}: ${columnName(index)}. Change column`}
                      onPress={() => setEditing(open ? null : field.key)}
                      style={styles.mapHeader}>
                      <ThemedText type="smallBold">{field.label}</ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: missingRequired ? theme.danger : index === null ? theme.textSecondary : theme.tint }}>
                        {missingRequired ? 'Pick a column' : columnName(index)}
                      </ThemedText>
                    </Pressable>
                    {open ? (
                      <View style={styles.chips}>
                        {[null, ...file.headers.map((_, i) => i)].map((option) => {
                          const selected = option === index;
                          return (
                            <Pressable
                              key={option ?? 'none'}
                              accessibilityRole="button"
                              accessibilityLabel={`Use ${columnName(option)} for ${field.label}`}
                              accessibilityState={{ selected }}
                              onPress={() => {
                                setMapping({ ...mapping, [field.key]: option });
                                setEditing(null);
                              }}
                              style={[styles.chip, { backgroundColor: selected ? theme.tint : theme.background }]}>
                              <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
                                {columnName(option)}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {positions.length > 1 || !usesPositionColumns ? (
              <View style={styles.list}>
                <SectionTitle>{usesPositionColumns ? 'Rows without a job go to' : 'Import into'}</SectionTitle>
                <View style={styles.chips}>
                  {positions.map((p) => {
                    const selected = p.id === fallbackId;
                    return (
                      <Pressable
                        key={p.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${p.name} at ${p.jobName}`}
                        accessibilityState={{ selected }}
                        onPress={() => setFallbackId(p.id)}
                        style={[styles.chip, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
                        <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
                          {p.name} · {p.jobName}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {preview ? (
              <View style={styles.list}>
                <SectionTitle>Preview</SectionTitle>
                {preview.drafts.slice(0, 3).map((d, i) => {
                  const t = computeShift(d);
                  return (
                    <View key={i} style={[styles.previewRow, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText type="small">{formatDayLabel(d.date, today)}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {d.minutesWorked > 0 ? formatDuration(d.minutesWorked) : 'no hours'}
                      </ThemedText>
                      <ThemedText type="smallBold">{formatMoney(t.netTipsCents)}</ThemedText>
                    </View>
                  );
                })}
                {preview.skipped.length > 0 ? (
                  <View style={styles.list}>
                    <ThemedText type="small" style={{ color: theme.danger }}>
                      {preview.skipped.length} row{preview.skipped.length === 1 ? '' : 's'} can’t be read and will be
                      left out:
                    </ThemedText>
                    {preview.skipped.slice(0, 3).map((s) => (
                      <ThemedText key={s.line} type="small" themeColor="textSecondary">
                        Line {s.line}: {s.reason}
                      </ThemedText>
                    ))}
                  </View>
                ) : null}
                <Button
                  title={busy ? 'Importing…' : `Import ${preview.drafts.length} shift${preview.drafts.length === 1 ? '' : 's'}`}
                  onPress={runImport}
                  disabled={busy || preview.drafts.length === 0 || !fallback}
                />
              </View>
            ) : (
              <ThemedText type="small" style={{ color: theme.danger }}>
                Pick the column that holds each shift’s date to continue.
              </ThemedText>
            )}
          </>
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  big: {
    fontSize: 20,
  },
  list: {
    gap: Spacing.two,
  },
  mapRow: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
});
