import { useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ListGroup } from '@/components/list-group';
import { ShiftRow } from '@/components/shift-row';
import { SectionTitle } from '@/components/section-title';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, TopTabInset, WideContentWidth } from '@/constants/theme';
import { getWeekStart, listShiftsBetween } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { buildMonthGrid, formatCellAmount, shiftMonth, summarizeByDay, weekdayInitials } from '@/lib/calendar';
import { formatDayLabel, formatMonthYear, monthRange } from '@/lib/dates';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';
import { summarizeRange } from '@/lib/shift-math';

const CELL_MAX_FONT_SCALE = 1.3;

export default function CalendarScreen() {
  const theme = useTheme();
  const wide = useWideLayout();
  const router = useRouter();
  const today = useToday();
  const [month, setMonth] = useState(() => shiftMonth(today, 0));
  const [selected, setSelected] = useState(today);

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const weekStart = await getWeekStart(db);
      const grid = buildMonthGrid(month, weekStart);
      const shifts = await listShiftsBetween(db, grid[0][0].date, grid[grid.length - 1][6].date);
      return { weekStart, grid, shifts, byDay: summarizeByDay(shifts) };
    },
    [month],
  );
  const { data } = useDbQuery(load);

  const monthSummary = data ? summarizeRange(data.shifts, monthRange(month)) : null;
  const dayShifts = data?.shifts.filter((s) => s.date === selected) ?? [];
  const isCurrentMonth = month === shiftMonth(today, 0);

  const goToMonth = (offset: number) => {
    const next = shiftMonth(month, offset);
    setMonth(next);
    setSelected(next === shiftMonth(today, 0) ? today : next);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, wide && styles.contentWide]}
          contentInsetAdjustmentBehavior="automatic">
          {/* One column on phones; on wide screens the selected day sits beside the month. */}
          <View style={[styles.column, wide && styles.columnWide]}>
            <View style={styles.monthBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() => goToMonth(-1)}
                hitSlop={12}
                style={styles.arrow}>
                <ThemedText type="subtitle">‹</ThemedText>
              </Pressable>
              <ThemedText type="smallBold" style={styles.monthTitle} accessibilityRole="header">
                {formatMonthYear(month)}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                disabled={isCurrentMonth}
                onPress={() => goToMonth(1)}
                hitSlop={12}
                style={[styles.arrow, { opacity: isCurrentMonth ? 0.25 : 1 }]}>
                <ThemedText type="subtitle">›</ThemedText>
              </Pressable>
            </View>

            <View style={[styles.summary, { backgroundColor: theme.backgroundElement }]}>
              <SummaryStat label="Tips" value={monthSummary ? formatMoney(monthSummary.netTipsCents) : '—'} />
              <SummaryStat label="Hours" value={monthSummary ? formatDuration(monthSummary.minutesWorked) : '—'} />
              <SummaryStat
                label="Real hourly"
                value={monthSummary?.realHourlyCents != null ? `${formatMoney(monthSummary.realHourlyCents)}/hr` : '—'}
              />
              <SummaryStat label="Shifts" value={monthSummary ? String(monthSummary.shiftCount) : '—'} />
            </View>

            <View style={styles.weekRow}>
              {(data ? weekdayInitials(data.weekStart) : []).map((d, i) => (
                <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekday}>
                  {d}
                </ThemedText>
              ))}
            </View>

            <View style={styles.grid}>
              {data?.grid.map((week) => (
                <View key={week[0].date} style={styles.weekRow}>
                  {week.map((cell) => {
                    const day = data.byDay.get(cell.date);
                    const isSelected = cell.date === selected;
                    const isFuture = cell.date > today;
                    return (
                      <Pressable
                        key={cell.date}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected, disabled: isFuture }}
                        accessibilityLabel={`${formatDayLabel(cell.date, today)}${day ? `, ${formatMoney(day.netTipsCents)} in tips` : ', no shifts'}`}
                        disabled={isFuture}
                        onPress={() => setSelected(cell.date)}
                        style={[
                          styles.cell,
                          {
                            backgroundColor: isSelected ? theme.tint : day && cell.inMonth ? theme.tintSoft : 'transparent',
                            borderColor: cell.date === today && !isSelected ? theme.tint : 'transparent',
                            opacity: isFuture ? 0.35 : 1,
                          },
                        ]}>
                        {/* Days from the next or previous month are told apart by color, not opacity, so they stay readable.
                            Text in the fixed-shape cells stops growing at 130% so large text sizes don't clip it;
                            the cell's label reads the full amount. */}
                        <ThemedText
                          type="small"
                          maxFontSizeMultiplier={CELL_MAX_FONT_SCALE}
                          style={{ color: isSelected ? theme.onTint : cell.inMonth ? theme.text : theme.textSecondary }}>
                          {Number(cell.date.slice(8))}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          numberOfLines={1}
                          maxFontSizeMultiplier={CELL_MAX_FONT_SCALE}
                          style={[
                            styles.cellAmount,
                            { color: isSelected ? theme.onTint : cell.inMonth ? theme.tint : theme.textSecondary },
                          ]}>
                          {day ? formatCellAmount(day.netTipsCents) : ' '}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.column, wide && styles.columnWide]}>
            <SectionTitle style={wide ? null : styles.sectionTitle}>{formatDayLabel(selected, today)}</SectionTitle>

            {data && dayShifts.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                No shifts logged this day.
              </ThemedText>
            ) : null}

            <ListGroup>
              {dayShifts.map((shift) => (
                <ShiftRow
                  key={shift.id}
                  shift={shift}
                  today={today}
                  onPress={() => router.push({ pathname: '/log-shift', params: { id: String(shift.id) } })}
                />
              ))}
            </ListGroup>

            {selected <= today ? (
              <Button
                title={`Log a shift for ${formatDayLabel(selected, today).replace(/^Today$/, 'today').replace(/^Yesterday$/, 'yesterday')}`}
                variant="secondary"
                onPress={() => router.push({ pathname: '/log-shift', params: { date: selected } })}
              />
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
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
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  contentWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
    maxWidth: WideContentWidth,
  },
  column: {
    gap: Spacing.three,
  },
  columnWide: {
    flex: 1,
    minWidth: 0,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    paddingHorizontal: Spacing.three,
  },
  monthTitle: {
    fontSize: 20,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  stat: {
    gap: Spacing.half,
  },
  grid: {
    gap: Spacing.one,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: Spacing.two,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  cellAmount: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
});
