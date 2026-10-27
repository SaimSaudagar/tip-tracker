import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema changes are append-only: add a new entry to MIGRATIONS and never edit
 * one that has shipped. PRAGMA user_version records how many have run.
 */
export const MIGRATIONS: string[] = [
  // 1: jobs, positions, shifts, tip-outs and settings, plus a starter job.
  `
  CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hourly_wage_cents INTEGER NOT NULL DEFAULT 0 CHECK (hourly_wage_cents >= 0),
    tipout_rule TEXT NOT NULL DEFAULT 'none'
      CHECK (tipout_rule IN ('none', 'fixed', 'pct_tips', 'pct_sales')),
    -- cents for 'fixed', basis points for the percentage rules
    tipout_value INTEGER NOT NULL DEFAULT 0 CHECK (tipout_value >= 0),
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL REFERENCES positions(id),
    date TEXT NOT NULL, -- local YYYY-MM-DD
    start_time TEXT,    -- local HH:MM, optional
    end_time TEXT,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    minutes_worked INTEGER NOT NULL DEFAULT 0 CHECK (minutes_worked >= 0),
    -- wage copied from the position when logged, so later raises don't rewrite history
    hourly_wage_cents INTEGER NOT NULL DEFAULT 0,
    cash_tips_cents INTEGER NOT NULL DEFAULT 0,
    card_tips_cents INTEGER NOT NULL DEFAULT 0,
    tip_in_cents INTEGER NOT NULL DEFAULT 0,
    tip_out_cents INTEGER NOT NULL DEFAULT 0,
    service_charge_cents INTEGER NOT NULL DEFAULT 0,
    sales_cents INTEGER,
    covers INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX shifts_date_idx ON shifts(date);

  -- who tips were paid out to, for the IRS-style daily tip record
  CREATE TABLE tipouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  INSERT INTO jobs (name) VALUES ('My job');
  INSERT INTO positions (job_id, name) VALUES (last_insert_rowid(), 'Server');
  INSERT INTO settings (key, value) VALUES ('week_start', '0');
  `,
  // 2: onboarding. Anyone who already logged shifts has effectively onboarded.
  `
  INSERT OR IGNORE INTO settings (key, value)
    SELECT 'onboarded', '1' WHERE EXISTS (SELECT 1 FROM shifts);
  `,
  // 3: lunch/dinner tag on shifts, and paychecks.
  `
  ALTER TABLE shifts ADD COLUMN period TEXT; -- 'am' | 'pm' | NULL

  CREATE TABLE paychecks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    pay_date TEXT NOT NULL,   -- local YYYY-MM-DD
    period_start TEXT,
    period_end TEXT,
    net_cents INTEGER NOT NULL CHECK (net_cents >= 0),
    gross_cents INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX paychecks_date_idx ON paychecks(pay_date);
  `,
  // 4: overtime per job. The rate is from the paystub; NULL means estimate it.
  `
  ALTER TABLE jobs ADD COLUMN overtime_rule TEXT NOT NULL DEFAULT 'none'
    CHECK (overtime_rule IN ('none', 'weekly', 'daily'));
  ALTER TABLE jobs ADD COLUMN overtime_rate_cents INTEGER CHECK (overtime_rate_cents >= 0);
  `,
  // 5: California's double time and seventh-day rule, on top of the 'daily' overtime rule.
  `
  ALTER TABLE jobs ADD COLUMN overtime_double_time INTEGER NOT NULL DEFAULT 0
    CHECK (overtime_double_time IN (0, 1));
  `,
];

export const DATABASE_NAME = 'tips.db';
export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  if (Platform.OS !== 'web') await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
