import type { SQLiteDatabase } from 'expo-sqlite';

import { createBackup, restoreBackup } from '@/db/backup';
import { MIGRATIONS, migrateDbIfNeeded } from '@/db/migrations';
import {
  addSampleShifts,
  countShiftsBetween,
  deleteAllData,
  deleteShift,
  getJobOvertime,
  getSettings,
  getShift,
  getShiftTipOuts,
  importShifts,
  listPositions,
  listShiftsBetween,
  removePosition,
  removeSetting,
  savePosition,
  saveShift,
  saveShiftWithTipOuts,
  setSetting,
  type ShiftInput,
} from '@/db/repo';
import { openMemoryDb } from '@/db/testing/memory-db';
import { parseBackup } from '@/lib/backup';
import { buildSampleShifts } from '@/lib/sample-data';

let db: SQLiteDatabase;

beforeEach(async () => {
  db = await openMemoryDb();
});

const shift = (positionId: number, overrides: Partial<ShiftInput> = {}): ShiftInput => ({
  positionId,
  date: '2026-10-24',
  minutesWorked: 360,
  hourlyWageCents: 213,
  cashTipsCents: 8000,
  cardTipsCents: 12000,
  tipInCents: 0,
  tipOutCents: 1500,
  serviceChargeCents: 0,
  salesCents: 95000,
  notes: null,
  ...overrides,
});

async function starterPosition() {
  const [position] = await listPositions(db);
  return position;
}

describe('migrations', () => {
  it('start a new install with one job and position', async () => {
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(MIGRATIONS.length);
    expect(await listPositions(db)).toMatchObject([{ jobName: 'My job', name: 'Server' }]);
  });

  it('do nothing when run again', async () => {
    await migrateDbIfNeeded(db);
    expect(await listPositions(db)).toHaveLength(1);
  });
});

describe('shifts', () => {
  it('save and read back every field, including covers and times', async () => {
    const position = await starterPosition();
    const id = await saveShift(db, shift(position.id, { covers: 22, startTime: '16:30', endTime: '23:00', breakMinutes: 30, period: 'pm', notes: 'Patio' }));
    expect(await getShift(db, id)).toMatchObject({
      id,
      positionName: 'Server',
      jobName: 'My job',
      covers: 22,
      startTime: '16:30',
      endTime: '23:00',
      breakMinutes: 30,
      period: 'pm',
      salesCents: 95000,
      notes: 'Patio',
    });
  });

  it('update in place, and clear covers when removed', async () => {
    const position = await starterPosition();
    const id = await saveShift(db, shift(position.id, { covers: 10 }));
    await saveShift(db, shift(position.id, { id, cashTipsCents: 100, covers: null }));
    expect(await getShift(db, id)).toMatchObject({ cashTipsCents: 100, covers: null });
    expect(await countShiftsBetween(db, '2026-10-01', '2026-10-31')).toBe(1);
  });

  it('replace tip-out names, and delete them with the shift', async () => {
    const position = await starterPosition();
    const id = await saveShiftWithTipOuts(db, shift(position.id), [
      { name: 'Maria', amountCents: 1000 },
      { name: 'Bar', amountCents: 500 },
    ]);
    await saveShiftWithTipOuts(db, shift(position.id, { id }), [{ name: 'Bar', amountCents: 1500 }]);
    expect(await getShiftTipOuts(db, id)).toEqual([{ name: 'Bar', amountCents: 1500 }]);

    await deleteShift(db, id);
    expect(await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM tipouts')).toEqual({ n: 0 });
  });

  it('list newest first within a range', async () => {
    const position = await starterPosition();
    await saveShift(db, shift(position.id, { date: '2026-10-20' }));
    await saveShift(db, shift(position.id, { date: '2026-10-22' }));
    await saveShift(db, shift(position.id, { date: '2026-11-02' }));
    const dates = (await listShiftsBetween(db, '2026-10-01', '2026-10-31')).map((s) => s.date);
    expect(dates).toEqual(['2026-10-22', '2026-10-20']);
  });
});

describe('positions', () => {
  it('archive a position that has shifts, delete one that has none, and keep the last one', async () => {
    const server = await starterPosition();
    const barId = await savePosition(db, { jobName: 'My job', name: 'Bartender', hourlyWageCents: 500, tipOutRule: 'none', tipOutValue: 0 });
    const hostId = await savePosition(db, { jobName: 'Hotel', name: 'Host', hourlyWageCents: 0, tipOutRule: 'none', tipOutValue: 0 });
    await saveShift(db, shift(barId));

    expect(await removePosition(db, barId)).toBe('archived');
    expect(await removePosition(db, hostId)).toBe('deleted');
    expect((await listPositions(db)).map((p) => p.id)).toEqual([server.id]);
    await expect(removePosition(db, server.id)).rejects.toThrow('Keep at least one position');
    // History keeps its label.
    expect((await listShiftsBetween(db, '2026-10-01', '2026-10-31'))[0].positionName).toBe('Bartender');
  });
});

describe('import', () => {
  it('files rows under named jobs and skips them the second time', async () => {
    const fallback = await starterPosition();
    const rows = [
      { ...shift(0), jobName: null, positionName: null, covers: 12 },
      { ...shift(0, { date: '2026-10-25' }), jobName: 'Hotel Bar', positionName: 'Bartender', covers: null },
    ];
    expect(await importShifts(db, rows, fallback, { useImportedWage: true })).toEqual({ imported: 2, duplicates: 0 });
    expect(await importShifts(db, rows, fallback, { useImportedWage: true })).toEqual({ imported: 0, duplicates: 2 });

    const saved = await listShiftsBetween(db, '2026-10-01', '2026-10-31');
    expect(saved.map((s) => [s.jobName, s.positionName, s.covers])).toEqual([
      ['Hotel Bar', 'Bartender', null],
      ['My job', 'Server', 12],
    ]);
  });
});

describe('delete all data', () => {
  it('erases everything but purchase settings and the language, and starts over', async () => {
    const position = await starterPosition();
    await saveShiftWithTipOuts(db, shift(position.id), [{ name: 'Bar', amountCents: 500 }]);
    await db.runAsync("INSERT INTO paychecks (job_id, pay_date, net_cents) VALUES (?, '2026-10-30', 50000)", position.jobId);
    await setSetting(db, 'onboarded', '1');
    await setSetting(db, 'weekly_goal_cents', '80000');
    await setSetting(db, 'pro_override', '1');
    await setSetting(db, 'trial_ends_at', '2026-11-09');
    await setSetting(db, 'language', 'es');

    await deleteAllData(db);

    for (const table of ['shifts', 'tipouts', 'paychecks']) {
      expect(await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`)).toEqual({ n: 0 });
    }
    expect(await listPositions(db)).toMatchObject([{ jobName: 'My job', name: 'Server' }]);
    expect(await getSettings(db)).toEqual({
      week_start: '0',
      pro_override: '1',
      trial_ends_at: '2026-11-09',
      language: 'es',
    });
  });
});

describe('backup and restore', () => {
  it('reproduce the data exactly and leave this phone’s purchase settings alone', async () => {
    const position = await starterPosition();
    const barId = await savePosition(db, { jobName: 'Hotel', name: 'Bartender', hourlyWageCents: 700, tipOutRule: 'pct_tips', tipOutValue: 300 });
    await saveShiftWithTipOuts(db, shift(position.id, { covers: 18, period: 'am' }), [{ name: 'Maria', amountCents: 1500 }]);
    await saveShift(db, shift(barId, { date: '2026-10-25' }));
    await setSetting(db, 'weekly_goal_cents', '90000');
    await setSetting(db, 'pro_override', '1');

    const backup = parseBackup(JSON.stringify(await createBackup(db)), MIGRATIONS.length);
    if (!backup.ok) throw new Error(backup.error);
    expect(backup.backup.tables.settings.some((s) => s.key === 'pro_override')).toBe(false);
    const before = await listShiftsBetween(db, '2026-01-01', '2026-12-31');

    const other = await openMemoryDb();
    await setSetting(other, 'pro_override', '0');
    await restoreBackup(other, backup.backup);

    expect(await listShiftsBetween(other, '2026-01-01', '2026-12-31')).toEqual(before);
    expect(await getShiftTipOuts(other, before[1].id)).toEqual([{ name: 'Maria', amountCents: 1500 }]);
    expect(await listPositions(other)).toEqual(await listPositions(db));
    const settings = await getSettings(other);
    expect(settings).toMatchObject({ weekly_goal_cents: '90000', onboarded: '1', pro_override: '0' });
  });

  it('keep the app out of onboarding at every step of a restore', async () => {
    const position = await starterPosition();
    await saveShift(db, shift(position.id));
    await setSetting(db, 'onboarded', '1');
    const backup = await createBackup(db);

    // Screens may read while a restore runs, so check what they'd see after every statement.
    const other = await openMemoryDb();
    await setSetting(other, 'onboarded', '1');
    const seen: (string | undefined)[] = [];
    const watch = <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A) => {
        const result = await fn(...args);
        seen.push((await getSettings(other)).onboarded);
        return result;
      };
    other.runAsync = watch(other.runAsync.bind(other)) as typeof other.runAsync;
    other.execAsync = watch(other.execAsync.bind(other)) as typeof other.execAsync;

    await restoreBackup(other, backup);
    expect(seen.length).toBeGreaterThan(5);
    expect(new Set(seen)).toEqual(new Set(['1']));
  });

  it('roll back completely when a restore fails part-way', async () => {
    const position = await starterPosition();
    await saveShift(db, shift(position.id));
    const backup = await createBackup(db);
    backup.tables.shifts.push({ ...backup.tables.shifts[0], position_id: 999 }); // breaks a foreign key

    await expect(restoreBackup(db, backup)).rejects.toThrow();
    expect(await countShiftsBetween(db, '2026-01-01', '2026-12-31')).toBe(1);
  });
});

describe('overtime', () => {
  it('adds the premium using the whole week, even when the range starts mid-week', async () => {
    const position = await starterPosition();
    await savePosition(db, { ...position, overtime: { rule: 'weekly', rateCents: null, doubleTime: false } });
    // Sun Oct 25 – Fri Oct 30: six 8-hour shifts at $15, so Friday is all overtime.
    for (const date of ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']) {
      await saveShift(db, shift(position.id, { date, minutesWorked: 480, hourlyWageCents: 1500 }));
    }
    const [friday] = await listShiftsBetween(db, '2026-10-30', '2026-10-31');
    expect(friday.overtimePremiumCents).toBe(6000); // 8 hours × ($22.50 − $15)
    const monday = (await listShiftsBetween(db, '2026-10-26', '2026-10-26'))[0];
    expect(monday.overtimePremiumCents).toBeUndefined();
  });

  it('stores California rules and pays double time after 12 hours', async () => {
    const position = await starterPosition();
    await savePosition(db, { ...position, overtime: { rule: 'daily', rateCents: null, doubleTime: true } });
    expect(await getJobOvertime(db, position.jobId)).toEqual({ rule: 'daily', rateCents: null, doubleTime: true });
    await saveShift(db, shift(position.id, { date: '2026-10-27', minutesWorked: 840, hourlyWageCents: 1650 }));
    const [long] = await listShiftsBetween(db, '2026-10-27', '2026-10-27');
    expect(long.overtimePremiumCents).toBe(6600); // 4 hours × $8.25 + 2 hours × $16.50

    // A weekly rule never keeps the flag.
    await savePosition(db, { ...position, overtime: { rule: 'weekly', rateCents: null, doubleTime: true } });
    expect((await getJobOvertime(db, position.jobId)).doubleTime).toBe(false);
  });

  it('leaves wages alone for jobs without a rule', async () => {
    const position = await starterPosition();
    await saveShift(db, shift(position.id, { minutesWorked: 600 }));
    expect((await listShiftsBetween(db, '2026-10-01', '2026-10-31'))[0].overtimePremiumCents).toBeUndefined();
  });
});

describe('sample data', () => {
  it('adds every sample shift with its tip-out names', async () => {
    const samples = buildSampleShifts('2026-10-26');
    expect(await addSampleShifts(db, await starterPosition(), samples)).toBe(samples.length);
    expect(await countShiftsBetween(db, '2026-01-01', '2026-12-31')).toBe(samples.length);
    const [latest] = await listShiftsBetween(db, '2026-10-01', '2026-10-31');
    expect(latest.hourlyWageCents).toBe(213);
    expect((await getShiftTipOuts(db, latest.id)).map((t) => t.name)).toContain('Busser');
  });
});

describe('settings', () => {
  it('set, overwrite and remove', async () => {
    await setSetting(db, 'appearance', 'dark');
    await setSetting(db, 'appearance', 'light');
    expect((await getSettings(db)).appearance).toBe('light');
    await removeSetting(db, 'appearance');
    expect((await getSettings(db)).appearance).toBeUndefined();
  });
});
