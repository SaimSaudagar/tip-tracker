/**
 * Test-only: an in-memory SQLite database (sql.js) behind the slice of expo-sqlite's
 * async API that src/db uses, so the real SQL can be tested in Jest without a phone.
 * Never imported by the app.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { BindParams, Database, SqlValue } from 'sql.js';

import { migrateDbIfNeeded } from '@/db/migrations';

type Params = SqlValue[];

// The single-file build with embedded WebAssembly works in Jest without locating a .wasm file.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs: (config?: object) => Promise<{ Database: new () => Database }> = require('sql.js/dist/sql-wasm-inline.js');

const flatten = (params: unknown[]): Params =>
  (params.length === 1 && Array.isArray(params[0]) ? params[0] : params) as Params;

function rows<T>(db: Database, sql: string, params: Params): T[] {
  const statement = db.prepare(sql);
  try {
    statement.bind(params as BindParams);
    const result: T[] = [];
    while (statement.step()) result.push(statement.getAsObject() as T);
    return result;
  } finally {
    statement.free();
  }
}

/**
 * A fresh database with every migration applied, like a new install. With `migrate: false`
 * it starts empty, for building a database as an older version of the app left it.
 */
export async function openMemoryDb({ migrate = true } = {}): Promise<SQLiteDatabase> {
  const SQL = await initSqlJs();
  const raw = new SQL.Database();

  const db = {
    async execAsync(sql: string) {
      raw.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]) {
      raw.run(sql, flatten(params) as BindParams);
      const changes = raw.getRowsModified();
      const lastInsertRowId = Number(raw.exec('SELECT last_insert_rowid()')[0].values[0][0]);
      return { changes, lastInsertRowId };
    },
    async getFirstAsync<T>(sql: string, ...params: unknown[]) {
      return rows<T>(raw, sql, flatten(params))[0] ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: unknown[]) {
      return rows<T>(raw, sql, flatten(params));
    },
    async withTransactionAsync(task: () => Promise<void>) {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  } as unknown as SQLiteDatabase;

  if (migrate) await migrateDbIfNeeded(db);
  return db;
}
