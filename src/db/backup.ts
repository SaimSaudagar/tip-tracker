import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

import { SCHEMA_VERSION } from '@/db/migrations';
import { setSetting } from '@/db/repo';
import {
  BACKUP_COLUMNS,
  DEVICE_ONLY_SETTINGS,
  buildBackup,
  type Backup,
  type BackupTables,
  type Row,
  type TableName,
} from '@/lib/backup';

const ORDER: Record<TableName, string> = {
  jobs: 'id',
  positions: 'id',
  shifts: 'id',
  tipouts: 'id',
  paychecks: 'id',
  settings: 'key',
};

export async function createBackup(db: SQLiteDatabase): Promise<Backup> {
  const tables = {} as BackupTables;
  for (const table of Object.keys(BACKUP_COLUMNS) as TableName[]) {
    tables[table] = await db.getAllAsync<Row>(
      `SELECT ${BACKUP_COLUMNS[table].join(', ')} FROM ${table} ORDER BY ${ORDER[table]}`,
    );
  }
  return buildBackup(tables, SCHEMA_VERSION, new Date());
}

/** Replaces everything on this phone with the backup's contents, in one transaction. */
export async function restoreBackup(db: SQLiteDatabase, backup: Backup): Promise<void> {
  const deviceOnly = DEVICE_ONLY_SETTINGS.map(() => '?').join(', ');
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM tipouts; DELETE FROM paychecks; DELETE FROM shifts; DELETE FROM positions; DELETE FROM jobs;');
    await db.runAsync(`DELETE FROM settings WHERE key NOT IN (${deviceOnly})`, ...DEVICE_ONLY_SETTINGS);

    // Parents before children, so foreign keys hold at every step.
    for (const table of ['jobs', 'positions', 'shifts', 'tipouts', 'paychecks', 'settings'] as TableName[]) {
      const columns = BACKUP_COLUMNS[table];
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of backup.tables[table]) {
        await db.runAsync(sql, ...columns.map((c) => (row[c] ?? null) as SQLiteBindValue));
      }
    }
    await setSetting(db, 'onboarded', '1');
  });
}
