/**
 * Five years of shifts at two jobs (about 2,500, like someone importing their old app's
 * history): every heavy read stays quick, and totals survive export, import and backup exactly.
 * Times are generous upper bounds for the in-memory test database, which is slower than a phone's.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { createBackup, restoreBackup } from '@/db/backup';
import { MIGRATIONS } from '@/db/migrations';
import {
  addSampleShifts,
  countShifts,
  deleteShift,
  getShift,
  getShiftTipOuts,
  importShifts,
  listAllShifts,
  listPositions,
  listRecentShifts,
  listShiftsBetween,
  listTipOutsBetween,
  savePosition,
} from '@/db/repo';
import { openMemoryDb } from '@/db/testing/memory-db';
import { parseBackup } from '@/lib/backup';
import { parseCsv } from '@/lib/csv';
import { buildDashboardPeriods, dashboardLoadRange } from '@/lib/dashboard';
import { buildInsights, insightsLoadRange } from '@/lib/insights';
import { buildMonthlyReport, buildYearSummary, monthlyReportHtml, yearSummaryHtml } from '@/lib/reports';
import { buildSampleShifts } from '@/lib/sample-data';
import { summarize } from '@/lib/shift-math';
import { buildImportDrafts, guessMapping, shiftsToCsv, splitHeader } from '@/lib/transfer';

const TODAY = '2026-10-27';
const FIVE_YEARS = 5 * 365;

jest.setTimeout(120_000);

async function timed<T>(label: string, limitMs: number, work: () => Promise<T> | T): Promise<T> {
  const started = performance.now();
  const result = await work();
  const ms = performance.now() - started;
  if (process.env.SHOW_TIMINGS) console.log(`${label}: ${Math.round(ms)} ms`);
  expect({ label, slow: ms > limitMs }).toEqual({ label, slow: false });
  return result;
}

let db: SQLiteDatabase;
let totalShifts: number;

beforeAll(async () => {
  db = await openMemoryDb();
  const [server] = await listPositions(db);
  await savePosition(db, { ...server, overtime: { rule: 'weekly', rateCents: null, doubleTime: false } });
  const barId = await savePosition(db, {
    jobName: 'Harbor Bar',
    name: 'Bartender',
    hourlyWageCents: 1650,
    tipOutRule: 'none',
    tipOutValue: 0,
    overtime: { rule: 'daily', rateCents: null, doubleTime: true },
  });
  const positions = await listPositions(db);
  const bar = positions.find((p) => p.id === barId)!;
  await addSampleShifts(db, positions[0], buildSampleShifts(TODAY, { days: FIVE_YEARS, seed: 11 }));
  await addSampleShifts(db, bar, buildSampleShifts(TODAY, { days: FIVE_YEARS, seed: 23 }));
  totalShifts = await countShifts(db);
});

it('holds about five years of shifts at two jobs', () => {
  expect(totalShifts).toBeGreaterThan(2_400);
});

it('loads Home, Calendar, Insights and Reports quickly', async () => {
  const range = dashboardLoadRange(TODAY, 0);
  const homeShifts = await timed('home', 1_500, () => listShiftsBetween(db, range.start, range.end));
  const periods = buildDashboardPeriods(homeShifts, TODAY, 0);
  expect(periods.year.summary.shiftCount).toBe(homeShifts.filter((s) => s.date >= '2026-01-01').length);
  await timed('recent', 500, () => listRecentShifts(db, 12));
  await timed('calendar month', 500, () => listShiftsBetween(db, '2026-09-27', '2026-11-07'));

  const insightsRange = insightsLoadRange(TODAY, 0);
  const insightShifts = await timed('insights load', 1_000, () => listShiftsBetween(db, insightsRange.start, insightsRange.end));
  const insights = await timed('insights build', 200, () => buildInsights(insightShifts, TODAY, 0));
  expect(insights.bestWeekday).not.toBeNull();

  const year = await timed('year load', 1_500, () => listShiftsBetween(db, '2025-01-01', '2025-12-31'));
  const summary = await timed('year summary', 200, () => buildYearSummary(year, '2025-01-01'));
  expect(summary.totals.shiftCount).toBe(year.length);
  expect(summary.months.reduce((sum, m) => sum + m.netTipsCents, 0)).toBe(summary.totals.netTipsCents);
  await timed('year pdf html', 200, () => yearSummaryHtml(summary, TODAY));
  const month = buildMonthlyReport(await listShiftsBetween(db, '2026-09-01', '2026-09-30'), '2026-09-01');
  await timed('month pdf html', 200, () => monthlyReportHtml(month, TODAY));
});

it('adds overtime across the whole history without changing totals elsewhere', async () => {
  const all = await timed('all shifts with overtime', 5_000, () => listAllShifts(db));
  expect(all).toHaveLength(totalShifts);
  const premiums = all.filter((s) => (s.overtimePremiumCents ?? 0) > 0);
  // Regular dinner shifts stay under 8 hours and 40 a week, so overtime is the exception.
  expect(premiums.length).toBeLessThan(all.length / 10);
});

it('exports everything and imports it back exactly', async () => {
  const all = await listAllShifts(db);
  const tipOuts = await listTipOutsBetween(db, '0000-01-01', '9999-12-31');
  const csv = await timed('csv export', 1_000, () => shiftsToCsv(all.map((s) => ({ ...s, tipOuts: tipOuts.get(s.id) ?? [] }))));

  const { headers, rows, firstLine } = splitHeader(parseCsv(csv));
  const { drafts, skipped } = await timed('csv parse', 1_000, () =>
    buildImportDrafts(rows, guessMapping(headers), firstLine),
  );
  expect(skipped).toEqual([]);
  expect(drafts).toHaveLength(all.length);

  const fresh = await openMemoryDb();
  const [fallback] = await listPositions(fresh);
  const result = await timed('import', 30_000, () => importShifts(fresh, drafts, fallback, { useImportedWage: true }));
  expect(result).toEqual({ imported: all.length, duplicates: 0 });

  // Importing the same file again adds nothing.
  expect(await importShifts(fresh, drafts, fallback, { useImportedWage: true })).toEqual({
    imported: 0,
    duplicates: all.length,
  });

  // Overtime depends on each job's settings, which a CSV doesn't carry, so compare before overtime.
  const base = (list: typeof all) => summarize(list.map((s) => ({ ...s, overtimePremiumCents: 0 })));
  expect(base(await listAllShifts(fresh))).toEqual(base(all));
});

it('opens and deletes a shift quickly', async () => {
  const [latest] = await listRecentShifts(db, 1);
  await timed('open shift', 50, async () => {
    await getShift(db, latest.id);
    await getShiftTipOuts(db, latest.id);
  });
  const plan = await db.getAllAsync<{ detail: string }>('EXPLAIN QUERY PLAN SELECT * FROM tipouts WHERE shift_id = ?', 1);
  expect(plan.map((p) => p.detail).join(' ')).toContain('tipouts_shift_idx');

  const [oldest] = await db.getAllAsync<{ id: number }>('SELECT id FROM shifts ORDER BY date LIMIT 1');
  await timed('delete shift', 50, () => deleteShift(db, oldest.id));
  expect(await getShiftTipOuts(db, oldest.id)).toEqual([]);
  totalShifts -= 1;
});

it('backs up and restores everything exactly', async () => {
  const backup = await timed('backup', 2_000, () => createBackup(db));
  const parsed = parseBackup(JSON.stringify(backup), MIGRATIONS.length);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;

  const restored = await openMemoryDb();
  await timed('restore', 30_000, () => restoreBackup(restored, parsed.backup));
  const before = await listAllShifts(db);
  const after = await listAllShifts(restored);
  expect(after).toEqual(before);
  expect(summarize(after)).toEqual(summarize(before));
});
