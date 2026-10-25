/**
 * Full backups: every job, position, shift, tip-out and setting in one JSON
 * file, restorable on any phone. Rows keep their database column names and ids
 * so a restore reproduces the database exactly.
 */

export const BACKUP_FORMAT = 'tip-tracker-backup';
export const BACKUP_VERSION = 1;

/** Settings that describe this phone, not your data, so they aren't backed up or restored. */
export const DEVICE_ONLY_SETTINGS = ['pro_override', 'last_backup_at'];

type Value = string | number | null;
export type Row = Record<string, Value>;

/** Columns per table, in insert order. Must cover every column in src/db/migrations.ts. */
export const BACKUP_COLUMNS = {
  jobs: ['id', 'name', 'color', 'archived_at', 'created_at'],
  positions: ['id', 'job_id', 'name', 'hourly_wage_cents', 'tipout_rule', 'tipout_value', 'archived_at', 'created_at'],
  shifts: [
    'id',
    'position_id',
    'date',
    'start_time',
    'end_time',
    'break_minutes',
    'minutes_worked',
    'hourly_wage_cents',
    'cash_tips_cents',
    'card_tips_cents',
    'tip_in_cents',
    'tip_out_cents',
    'service_charge_cents',
    'sales_cents',
    'covers',
    'notes',
    'created_at',
    'updated_at',
  ],
  tipouts: ['id', 'shift_id', 'recipient_name', 'amount_cents'],
  settings: ['key', 'value'],
} as const;

export type TableName = keyof typeof BACKUP_COLUMNS;
export type BackupTables = Record<TableName, Row[]>;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  /** PRAGMA user_version of the database that made it. */
  schemaVersion: number;
  exportedAt: string;
  tables: BackupTables;
};

export function buildBackup(tables: BackupTables, schemaVersion: number, now: Date): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion,
    exportedAt: now.toISOString(),
    tables: {
      ...tables,
      settings: tables.settings.filter((s) => !DEVICE_ONLY_SETTINGS.includes(String(s.key))),
    },
  };
}

// Which columns must be integers or non-empty text; everything else may be null.
const INTEGER_COLUMNS = new Set([
  'id',
  'job_id',
  'position_id',
  'shift_id',
  'hourly_wage_cents',
  'tipout_value',
  'break_minutes',
  'minutes_worked',
  'cash_tips_cents',
  'card_tips_cents',
  'tip_in_cents',
  'tip_out_cents',
  'service_charge_cents',
  'amount_cents',
]);
const REQUIRED_TEXT = new Set(['name', 'date', 'tipout_rule', 'recipient_name', 'key', 'value']);
const NULLABLE_INTEGERS = new Set(['sales_cents', 'covers']);

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export function parseBackup(text: string, currentSchemaVersion: number): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file isn’t a Tip Tracker backup (it isn’t valid JSON).' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as Backup).format !== BACKUP_FORMAT) {
    return { ok: false, error: 'This file isn’t a Tip Tracker backup.' };
  }
  const b = raw as Backup;
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION || b.schemaVersion > currentSchemaVersion) {
    return { ok: false, error: 'This backup was made by a newer version of the app. Update the app, then try again.' };
  }
  if (typeof b.tables !== 'object' || b.tables === null) {
    return { ok: false, error: 'This backup is incomplete.' };
  }

  for (const table of Object.keys(BACKUP_COLUMNS) as TableName[]) {
    const rows = b.tables[table];
    if (!Array.isArray(rows)) return { ok: false, error: `This backup is missing its ${table}.` };
    for (const row of rows) {
      if (typeof row !== 'object' || row === null) return { ok: false, error: `A ${table} entry is damaged.` };
      for (const column of BACKUP_COLUMNS[table]) {
        const value = (row as Row)[column];
        const bad =
          (INTEGER_COLUMNS.has(column) && !Number.isInteger(value)) ||
          (NULLABLE_INTEGERS.has(column) && value != null && !Number.isInteger(value)) ||
          (REQUIRED_TEXT.has(column) && (typeof value !== 'string' || value === '')) ||
          (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number');
        if (bad) return { ok: false, error: `A ${table} entry has a damaged “${column}” value.` };
      }
    }
  }

  const ids = (rows: Row[]) => new Set(rows.map((r) => r.id));
  const jobIds = ids(b.tables.jobs);
  const positionIds = ids(b.tables.positions);
  const shiftIds = ids(b.tables.shifts);
  if (b.tables.positions.length === 0) return { ok: false, error: 'This backup has no positions to restore.' };
  if (b.tables.positions.some((p) => !jobIds.has(p.job_id))) return { ok: false, error: 'A position in this backup points to a missing job.' };
  if (b.tables.shifts.some((s) => !positionIds.has(s.position_id))) return { ok: false, error: 'A shift in this backup points to a missing position.' };
  if (b.tables.tipouts.some((t) => !shiftIds.has(t.shift_id))) return { ok: false, error: 'A tip-out in this backup points to a missing shift.' };

  return { ok: true, backup: { ...b, tables: { ...b.tables, settings: b.tables.settings.filter((s) => !DEVICE_ONLY_SETTINGS.includes(String(s.key))) } } };
}
