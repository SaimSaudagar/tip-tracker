/**
 * Updating the app must never lose data: a database left by any earlier version, with
 * shifts, tip-outs and paychecks in it, is migrated to the latest schema intact.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { createBackup, restoreBackup } from '@/db/backup';
import { MIGRATIONS, migrateDbIfNeeded } from '@/db/migrations';
import {
  getJobOvertime,
  getSettings,
  getShiftTipOuts,
  listAllShifts,
  listPaychecks,
  listPositions,
  saveShift,
} from '@/db/repo';
import { openMemoryDb } from '@/db/testing/memory-db';

/** A database as the app at schema `version` left it. */
async function databaseAtVersion(version: number): Promise<SQLiteDatabase> {
  const db = await openMemoryDb({ migrate: false });
  await db.execAsync('PRAGMA foreign_keys = ON;');
  for (let i = 0; i < version; i++) {
    await db.execAsync(MIGRATIONS[i]);
    await db.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
  return db;
}

/** Data an older version could have written: a raise, two shifts (one with tip-out names) and, from v3, a paycheck. */
async function addOldData(db: SQLiteDatabase, version: number) {
  await db.runAsync('UPDATE positions SET hourly_wage_cents = 213, tipout_rule = ?, tipout_value = 300 WHERE id = 1', 'pct_tips');
  await db.runAsync(
    `INSERT INTO shifts (position_id, date, start_time, end_time, break_minutes, minutes_worked, hourly_wage_cents,
       cash_tips_cents, card_tips_cents, tip_in_cents, tip_out_cents, service_charge_cents, sales_cents, covers, notes)
     VALUES (1, '2026-03-14', '16:30', '23:00', 30, 360, 213, 8500, 14250, 0, 1500, 2500, 98000, 21, 'Patio')`,
  );
  await db.runAsync(
    `INSERT INTO shifts (position_id, date, minutes_worked, hourly_wage_cents, cash_tips_cents, card_tips_cents,
       tip_in_cents, tip_out_cents, service_charge_cents)
     VALUES (1, '2026-03-15', 300, 213, 6000, 9000, 1000, 0, 0)`,
  );
  await db.runAsync("INSERT INTO tipouts (shift_id, recipient_name, amount_cents) VALUES (1, 'Busser', 1000), (1, 'Bar', 500)");
  await db.runAsync("INSERT INTO settings (key, value) VALUES ('weekly_goal_cents', '120000')");
  // From version 2 the app's own onboarding marks this; version 1 had no onboarding.
  if (version >= 2) await db.runAsync("INSERT INTO settings (key, value) VALUES ('onboarded', '1')");
  if (version >= 3) {
    await db.runAsync("UPDATE shifts SET period = 'pm' WHERE id = 1");
    await db.runAsync(
      "INSERT INTO paychecks (job_id, pay_date, period_start, period_end, net_cents, gross_cents) VALUES (1, '2026-03-20', '2026-03-01', '2026-03-15', 41200, 52000)",
    );
  }
  if (version >= 4) await db.runAsync("UPDATE jobs SET overtime_rule = 'weekly', overtime_rate_cents = 576 WHERE id = 1");
  if (version >= 5) await db.runAsync("UPDATE jobs SET overtime_rule = 'daily', overtime_double_time = 1 WHERE id = 1");
}

const OLDER_VERSIONS = Array.from({ length: MIGRATIONS.length - 1 }, (_, i) => i + 1);

describe.each(OLDER_VERSIONS)('updating from schema version %i', (version) => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await databaseAtVersion(version);
    await addOldData(db, version);
    await migrateDbIfNeeded(db);
  });

  it('reaches the latest schema', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(MIGRATIONS.length);
    const indexes = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index'");
    expect(indexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(['shifts_date_idx', 'tipouts_shift_idx', 'shifts_position_idx']),
    );
  });

  it('keeps every shift, amount and tip-out name', async () => {
    const shifts = await listAllShifts(db);
    expect(shifts).toHaveLength(2);
    expect(shifts[0]).toMatchObject({
      date: '2026-03-14',
      startTime: '16:30',
      endTime: '23:00',
      breakMinutes: 30,
      minutesWorked: 360,
      hourlyWageCents: 213,
      cashTipsCents: 8500,
      cardTipsCents: 14250,
      tipOutCents: 1500,
      serviceChargeCents: 2500,
      salesCents: 98000,
      covers: 21,
      notes: 'Patio',
      period: version >= 3 ? 'pm' : null,
    });
    expect(shifts[1]).toMatchObject({ date: '2026-03-15', tipInCents: 1000, salesCents: null, covers: null, notes: null });
    expect(await getShiftTipOuts(db, shifts[0].id)).toEqual([
      { name: 'Busser', amountCents: 1000 },
      { name: 'Bar', amountCents: 500 },
    ]);
  });

  it('keeps positions, settings and paychecks, and gives new settings their defaults', async () => {
    const [position] = await listPositions(db);
    expect(position).toMatchObject({ hourlyWageCents: 213, tipOutRule: 'pct_tips', tipOutValue: 300 });
    const settings = await getSettings(db);
    expect(settings.weekly_goal_cents).toBe('120000');
    // Nobody who already logged shifts sees onboarding again (for version 1, migration 2 does this).
    expect(settings.onboarded).toBe('1');
    expect(await listPaychecks(db)).toHaveLength(version >= 3 ? 1 : 0);
    expect(await getJobOvertime(db, position.jobId)).toEqual(
      version >= 5
        ? { rule: 'daily', rateCents: 576, doubleTime: true }
        : version >= 4
          ? { rule: 'weekly', rateCents: 576, doubleTime: false }
          : { rule: 'none', rateCents: null, doubleTime: false },
    );
  });

  it('keeps working after the update: new shifts, backups and restores', async () => {
    const [position] = await listPositions(db);
    await saveShift(db, {
      positionId: position.id,
      date: '2026-10-27',
      minutesWorked: 390,
      hourlyWageCents: 213,
      cashTipsCents: 7000,
      cardTipsCents: 11000,
      tipInCents: 0,
      tipOutCents: 0,
      serviceChargeCents: 0,
      salesCents: null,
      notes: null,
      period: 'pm',
    });
    const backup = await createBackup(db);
    const fresh = await openMemoryDb();
    await restoreBackup(fresh, backup);
    expect(await listAllShifts(fresh)).toEqual(await listAllShifts(db));
  });
});

it('running the migrations again changes nothing', async () => {
  const db = await openMemoryDb();
  await migrateDbIfNeeded(db);
  expect(await listPositions(db)).toHaveLength(1);
});
