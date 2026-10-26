import type { SQLiteDatabase } from 'expo-sqlite';

import type { ISODate, Weekday } from '@/lib/dates';
import type { SampleShift } from '@/lib/sample-data';
import type { ShiftAmounts, TipOutRule } from '@/lib/shift-math';
import type { TipOutEntry } from '@/lib/tipouts';

export type Position = {
  id: number;
  jobId: number;
  jobName: string;
  name: string;
  hourlyWageCents: number;
  tipOutRule: TipOutRule;
  /** Cents for a fixed rule, basis points for percentage rules. */
  tipOutValue: number;
};

/** Lunch/daytime vs dinner/night, used to compare what each pays. */
export type ShiftPeriod = 'am' | 'pm';

export type Shift = ShiftAmounts & {
  id: number;
  positionId: number;
  positionName: string;
  jobName: string;
  date: ISODate;
  /** Local "HH:MM" clock times, when the user entered them. */
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  period: ShiftPeriod | null;
  salesCents: number | null;
  /** Guests served, when the user entered it. */
  covers: number | null;
  notes: string | null;
};

type ShiftTimes = 'startTime' | 'endTime' | 'breakMinutes' | 'period' | 'covers';

export type ShiftInput = Omit<Shift, 'id' | 'positionName' | 'jobName' | ShiftTimes> &
  Partial<Pick<Shift, ShiftTimes>> & { id?: number };

type PositionRow = {
  id: number;
  job_id: number;
  job_name: string;
  name: string;
  hourly_wage_cents: number;
  tipout_rule: TipOutRule;
  tipout_value: number;
};

type ShiftRow = {
  id: number;
  position_id: number;
  position_name: string;
  job_name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  period: string | null;
  minutes_worked: number;
  hourly_wage_cents: number;
  cash_tips_cents: number;
  card_tips_cents: number;
  tip_in_cents: number;
  tip_out_cents: number;
  service_charge_cents: number;
  sales_cents: number | null;
  covers: number | null;
  notes: string | null;
};

const toPosition = (r: PositionRow): Position => ({
  id: r.id,
  jobId: r.job_id,
  jobName: r.job_name,
  name: r.name,
  hourlyWageCents: r.hourly_wage_cents,
  tipOutRule: r.tipout_rule,
  tipOutValue: r.tipout_value,
});

const toShift = (r: ShiftRow): Shift => ({
  id: r.id,
  positionId: r.position_id,
  positionName: r.position_name,
  jobName: r.job_name,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  breakMinutes: r.break_minutes,
  period: r.period === 'am' || r.period === 'pm' ? r.period : null,
  minutesWorked: r.minutes_worked,
  hourlyWageCents: r.hourly_wage_cents,
  cashTipsCents: r.cash_tips_cents,
  cardTipsCents: r.card_tips_cents,
  tipInCents: r.tip_in_cents,
  tipOutCents: r.tip_out_cents,
  serviceChargeCents: r.service_charge_cents,
  salesCents: r.sales_cents,
  covers: r.covers,
  notes: r.notes,
});

const SHIFT_SELECT = `
  SELECT s.id, s.position_id, p.name AS position_name, j.name AS job_name, s.date,
         s.start_time, s.end_time, s.break_minutes, s.period, s.minutes_worked, s.hourly_wage_cents, s.cash_tips_cents, s.card_tips_cents,
         s.tip_in_cents, s.tip_out_cents, s.service_charge_cents, s.sales_cents, s.covers, s.notes
  FROM shifts s
  JOIN positions p ON p.id = s.position_id
  JOIN jobs j ON j.id = p.job_id
`;

export async function listPositions(db: SQLiteDatabase): Promise<Position[]> {
  const rows = await db.getAllAsync<PositionRow>(`
    SELECT p.id, p.job_id, j.name AS job_name, p.name, p.hourly_wage_cents, p.tipout_rule, p.tipout_value
    FROM positions p
    JOIN jobs j ON j.id = p.job_id
    WHERE p.archived_at IS NULL AND j.archived_at IS NULL
    ORDER BY j.created_at, j.id, p.created_at, p.id
  `);
  return rows.map(toPosition);
}

export async function getShift(db: SQLiteDatabase, id: number): Promise<Shift | null> {
  const row = await db.getFirstAsync<ShiftRow>(`${SHIFT_SELECT} WHERE s.id = ?`, id);
  return row ? toShift(row) : null;
}

export async function getLatestShift(db: SQLiteDatabase): Promise<Shift | null> {
  const row = await db.getFirstAsync<ShiftRow>(`${SHIFT_SELECT} ORDER BY s.date DESC, s.id DESC LIMIT 1`);
  return row ? toShift(row) : null;
}

export async function listShiftsBetween(db: SQLiteDatabase, start: ISODate, end: ISODate): Promise<Shift[]> {
  const rows = await db.getAllAsync<ShiftRow>(
    `${SHIFT_SELECT} WHERE s.date BETWEEN ? AND ? ORDER BY s.date DESC, s.id DESC`,
    start,
    end,
  );
  return rows.map(toShift);
}

export async function listRecentShifts(db: SQLiteDatabase, limit: number): Promise<Shift[]> {
  const rows = await db.getAllAsync<ShiftRow>(`${SHIFT_SELECT} ORDER BY s.date DESC, s.id DESC LIMIT ?`, limit);
  return rows.map(toShift);
}

/** Inserts a new shift, or updates it when `id` is set. Returns the shift's id. */
export async function saveShift(db: SQLiteDatabase, s: ShiftInput): Promise<number> {
  const values = [
    s.positionId,
    s.date,
    s.minutesWorked,
    s.hourlyWageCents,
    s.cashTipsCents,
    s.cardTipsCents,
    s.tipInCents,
    s.tipOutCents,
    s.serviceChargeCents,
    s.salesCents,
    s.notes,
    s.startTime ?? null,
    s.endTime ?? null,
    s.breakMinutes ?? 0,
    s.period ?? null,
    s.covers ?? null,
  ];

  if (s.id !== undefined) {
    await db.runAsync(
      `UPDATE shifts SET position_id = ?, date = ?, minutes_worked = ?, hourly_wage_cents = ?,
         cash_tips_cents = ?, card_tips_cents = ?, tip_in_cents = ?, tip_out_cents = ?,
         service_charge_cents = ?, sales_cents = ?, notes = ?, start_time = ?, end_time = ?,
         break_minutes = ?, period = ?, covers = ?, updated_at = datetime('now')
       WHERE id = ?`,
      ...values,
      s.id,
    );
    return s.id;
  }

  const result = await db.runAsync(
    `INSERT INTO shifts (position_id, date, minutes_worked, hourly_wage_cents, cash_tips_cents,
       card_tips_cents, tip_in_cents, tip_out_cents, service_charge_cents, sales_cents, notes,
       start_time, end_time, break_minutes, period, covers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ...values,
  );
  return result.lastInsertRowId;
}

/** Saves a shift and, when `tipOuts` is given, replaces who its tips were paid out to. */
export async function saveShiftWithTipOuts(
  db: SQLiteDatabase,
  shift: ShiftInput,
  tipOuts: TipOutEntry[] | null,
): Promise<number> {
  let id = shift.id;
  await db.withTransactionAsync(async () => {
    id = await saveShift(db, shift);
    if (tipOuts === null) return;
    await db.runAsync('DELETE FROM tipouts WHERE shift_id = ?', id);
    for (const t of tipOuts) {
      await db.runAsync(
        'INSERT INTO tipouts (shift_id, recipient_name, amount_cents) VALUES (?, ?, ?)',
        id,
        t.name,
        t.amountCents,
      );
    }
  });
  return id!;
}

export async function getShiftTipOuts(db: SQLiteDatabase, shiftId: number): Promise<TipOutEntry[]> {
  const rows = await db.getAllAsync<{ recipient_name: string; amount_cents: number }>(
    'SELECT recipient_name, amount_cents FROM tipouts WHERE shift_id = ? ORDER BY id',
    shiftId,
  );
  return rows.map((r) => ({ name: r.recipient_name, amountCents: r.amount_cents }));
}

/** Tip-out names for every shift in a date range, keyed by shift id. */
export async function listTipOutsBetween(
  db: SQLiteDatabase,
  start: ISODate,
  end: ISODate,
): Promise<Map<number, TipOutEntry[]>> {
  const rows = await db.getAllAsync<{ shift_id: number; recipient_name: string; amount_cents: number }>(
    `SELECT t.shift_id, t.recipient_name, t.amount_cents
     FROM tipouts t JOIN shifts s ON s.id = t.shift_id
     WHERE s.date BETWEEN ? AND ? ORDER BY t.id`,
    start,
    end,
  );
  const byShift = new Map<number, TipOutEntry[]>();
  for (const r of rows) {
    byShift.set(r.shift_id, [...(byShift.get(r.shift_id) ?? []), { name: r.recipient_name, amountCents: r.amount_cents }]);
  }
  return byShift;
}

/** Most recently used tip-out names, for one-tap entry. */
export async function recentTipOutNames(db: SQLiteDatabase, limit: number): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT recipient_name AS name FROM tipouts
     GROUP BY lower(recipient_name) ORDER BY MAX(id) DESC LIMIT ?`,
    limit,
  );
  return rows.map((r) => r.name);
}

export async function deleteShift(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM shifts WHERE id = ?', id);
}

export async function listAllShifts(db: SQLiteDatabase): Promise<Shift[]> {
  const rows = await db.getAllAsync<ShiftRow>(`${SHIFT_SELECT} ORDER BY s.date, s.id`);
  return rows.map(toShift);
}

export async function getWeekStart(db: SQLiteDatabase): Promise<Weekday> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'week_start'");
  const n = Number(row?.value ?? 0);
  return (n >= 0 && n <= 6 ? n : 0) as Weekday;
}

export async function setWeekStart(db: SQLiteDatabase, weekStart: Weekday): Promise<void> {
  await setSetting(db, 'week_start', String(weekStart));
}

export async function getSettings(db: SQLiteDatabase): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

export async function removeSetting(db: SQLiteDatabase, key: string): Promise<void> {
  await db.runAsync('DELETE FROM settings WHERE key = ?', key);
}

/** Settings about purchases and one-time prompts, which survive "Delete all data". */
const KEPT_ON_ERASE = ['pro_override', 'trial_ends_at', 'exit_offer_shown', 'review_asked_on'];

/**
 * Erases every job, position, shift, tip-out, paycheck and setting, leaving the
 * starter job a new install has. Without the onboarded flag the app returns to onboarding.
 */
export async function deleteAllData(db: SQLiteDatabase): Promise<void> {
  const kept = KEPT_ON_ERASE.map(() => '?').join(', ');
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM tipouts; DELETE FROM paychecks; DELETE FROM shifts; DELETE FROM positions; DELETE FROM jobs;');
    await db.runAsync(`DELETE FROM settings WHERE key NOT IN (${kept})`, ...KEPT_ON_ERASE);
    const job = await db.runAsync("INSERT INTO jobs (name) VALUES ('My job')");
    await db.runAsync("INSERT INTO positions (job_id, name) VALUES (?, 'Server')", job.lastInsertRowId);
    await setSetting(db, 'week_start', '0');
  });
}

export async function countShifts(db: SQLiteDatabase): Promise<number> {
  return (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM shifts'))?.n ?? 0;
}

export async function countShiftsBetween(db: SQLiteDatabase, start: ISODate, end: ISODate): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM shifts WHERE date BETWEEN ? AND ?', start, end);
  return row?.n ?? 0;
}

export async function listLoggedDates(db: SQLiteDatabase, start: ISODate, end: ISODate): Promise<Set<ISODate>> {
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM shifts WHERE date BETWEEN ? AND ?',
    start,
    end,
  );
  return new Set(rows.map((r) => r.date));
}

// ---- Jobs and positions ----

export type PositionInput = {
  id?: number;
  jobName: string;
  name: string;
  hourlyWageCents: number;
  tipOutRule: TipOutRule;
  tipOutValue: number;
};

export async function listJobNames(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM jobs WHERE archived_at IS NULL ORDER BY created_at, id',
  );
  return rows.map((r) => r.name);
}

export async function getPosition(db: SQLiteDatabase, id: number): Promise<Position | null> {
  const row = await db.getFirstAsync<PositionRow>(
    `SELECT p.id, p.job_id, j.name AS job_name, p.name, p.hourly_wage_cents, p.tipout_rule, p.tipout_value
     FROM positions p JOIN jobs j ON j.id = p.job_id WHERE p.id = ?`,
    id,
  );
  return row ? toPosition(row) : null;
}

/** Finds a job by name (ignoring case), reviving it if archived, or creates it. */
async function findOrCreateJob(db: SQLiteDatabase, name: string): Promise<number> {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM jobs WHERE lower(name) = lower(?) ORDER BY archived_at IS NOT NULL, id LIMIT 1',
    name,
  );
  if (existing) {
    await db.runAsync('UPDATE jobs SET archived_at = NULL WHERE id = ?', existing.id);
    return existing.id;
  }
  return (await db.runAsync('INSERT INTO jobs (name) VALUES (?)', name)).lastInsertRowId;
}

/** Archives jobs that no longer have any active positions. */
async function archiveEmptyJobs(db: SQLiteDatabase) {
  await db.runAsync(`
    UPDATE jobs SET archived_at = datetime('now')
    WHERE archived_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM positions p WHERE p.job_id = jobs.id AND p.archived_at IS NULL)
  `);
}

export async function savePosition(db: SQLiteDatabase, input: PositionInput): Promise<number> {
  let id = input.id;
  await db.withTransactionAsync(async () => {
    const jobId = await findOrCreateJob(db, input.jobName.trim());
    const values = [jobId, input.name.trim(), input.hourlyWageCents, input.tipOutRule, input.tipOutValue];
    if (id !== undefined) {
      await db.runAsync(
        'UPDATE positions SET job_id = ?, name = ?, hourly_wage_cents = ?, tipout_rule = ?, tipout_value = ? WHERE id = ?',
        ...values,
        id,
      );
    } else {
      id = (
        await db.runAsync(
          'INSERT INTO positions (job_id, name, hourly_wage_cents, tipout_rule, tipout_value) VALUES (?, ?, ?, ?, ?)',
          ...values,
        )
      ).lastInsertRowId;
    }
    await archiveEmptyJobs(db);
  });
  return id!;
}

/**
 * Removes a position from the app. Positions with logged shifts are archived so
 * history keeps its labels; unused ones are deleted. The last position can't be removed.
 */
export async function removePosition(db: SQLiteDatabase, id: number): Promise<'archived' | 'deleted'> {
  const active = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM positions WHERE archived_at IS NULL',
  );
  if ((active?.n ?? 0) <= 1) throw new Error('Keep at least one position to log shifts against.');

  const used = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM shifts WHERE position_id = ?', id);
  const outcome = (used?.n ?? 0) > 0 ? 'archived' : 'deleted';
  await db.withTransactionAsync(async () => {
    if (outcome === 'archived') {
      await db.runAsync("UPDATE positions SET archived_at = datetime('now') WHERE id = ?", id);
    } else {
      await db.runAsync('DELETE FROM positions WHERE id = ?', id);
    }
    await archiveEmptyJobs(db);
  });
  return outcome;
}

// ---- Import ----

export type ImportShift = Omit<ShiftInput, 'id' | 'positionId'> & {
  jobName: string | null;
  positionName: string | null;
};

/**
 * Imports shifts in one transaction. Rows naming a job or position are filed under
 * it (created if needed); others go to `fallback`. A row matching an existing shift's
 * date, position, tips and hours is skipped, so importing the same file twice is harmless.
 */
export async function importShifts(
  db: SQLiteDatabase,
  shifts: ImportShift[],
  fallback: Position,
  { useImportedWage }: { useImportedWage: boolean },
): Promise<{ imported: number; duplicates: number }> {
  let imported = 0;
  let duplicates = 0;
  const positionCache = new Map<string, { id: number; wage: number }>();

  await db.withTransactionAsync(async () => {
    for (const s of shifts) {
      const jobName = s.jobName ?? fallback.jobName;
      const positionName = s.positionName ?? fallback.name;
      const key = `${jobName.toLowerCase()}\u0000${positionName.toLowerCase()}`;

      let position = positionCache.get(key);
      if (!position) {
        if (!s.jobName && !s.positionName) {
          position = { id: fallback.id, wage: fallback.hourlyWageCents };
        } else {
          const jobId = await findOrCreateJob(db, jobName);
          const found = await db.getFirstAsync<{ id: number; hourly_wage_cents: number }>(
            'SELECT id, hourly_wage_cents FROM positions WHERE job_id = ? AND lower(name) = lower(?) ORDER BY archived_at IS NOT NULL, id LIMIT 1',
            jobId,
            positionName,
          );
          if (found) {
            await db.runAsync('UPDATE positions SET archived_at = NULL WHERE id = ?', found.id);
            position = { id: found.id, wage: found.hourly_wage_cents };
          } else {
            const created = await db.runAsync(
              'INSERT INTO positions (job_id, name, hourly_wage_cents) VALUES (?, ?, ?)',
              jobId,
              positionName,
              useImportedWage ? s.hourlyWageCents : 0,
            );
            position = { id: created.lastInsertRowId, wage: useImportedWage ? s.hourlyWageCents : 0 };
          }
        }
        positionCache.set(key, position);
      }

      const duplicate = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM shifts WHERE position_id = ? AND date = ? AND minutes_worked = ?
           AND cash_tips_cents = ? AND card_tips_cents = ? AND tip_out_cents = ? LIMIT 1`,
        position.id,
        s.date,
        s.minutesWorked,
        s.cashTipsCents,
        s.cardTipsCents,
        s.tipOutCents,
      );
      if (duplicate) {
        duplicates++;
        continue;
      }

      await saveShift(db, {
        ...s,
        positionId: position.id,
        hourlyWageCents: useImportedWage ? s.hourlyWageCents : position.wage,
      });
      imported++;
    }
  });

  return { imported, duplicates };
}

/** Development only: adds generated shifts, with their tip-out names, to `position`. */
export async function addSampleShifts(db: SQLiteDatabase, position: Position, shifts: SampleShift[]): Promise<number> {
  await db.withTransactionAsync(async () => {
    for (const { tipOuts, ...s } of shifts) {
      const id = await saveShift(db, { ...s, positionId: position.id, hourlyWageCents: position.hourlyWageCents || 213 });
      for (const t of tipOuts) {
        await db.runAsync('INSERT INTO tipouts (shift_id, recipient_name, amount_cents) VALUES (?, ?, ?)', id, t.name, t.amountCents);
      }
    }
  });
  return shifts.length;
}

// ---- Weekly goal ----

export async function getWeeklyGoal(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'weekly_goal_cents'");
  const cents = Number(row?.value);
  return Number.isInteger(cents) && cents > 0 ? cents : null;
}

export async function setWeeklyGoal(db: SQLiteDatabase, cents: number | null): Promise<void> {
  if (cents === null || cents <= 0) await db.runAsync("DELETE FROM settings WHERE key = 'weekly_goal_cents'");
  else await setSetting(db, 'weekly_goal_cents', String(cents));
}

// ---- Paychecks ----

export type Paycheck = {
  id: number;
  jobId: number;
  jobName: string;
  payDate: ISODate;
  periodStart: ISODate | null;
  periodEnd: ISODate | null;
  netCents: number;
  grossCents: number | null;
  notes: string | null;
};

export type PaycheckInput = Omit<Paycheck, 'id' | 'jobName'> & { id?: number };

type PaycheckRow = {
  id: number;
  job_id: number;
  job_name: string;
  pay_date: string;
  period_start: string | null;
  period_end: string | null;
  net_cents: number;
  gross_cents: number | null;
  notes: string | null;
};

const toPaycheck = (r: PaycheckRow): Paycheck => ({
  id: r.id,
  jobId: r.job_id,
  jobName: r.job_name,
  payDate: r.pay_date,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  netCents: r.net_cents,
  grossCents: r.gross_cents,
  notes: r.notes,
});

const PAYCHECK_SELECT = `
  SELECT c.id, c.job_id, j.name AS job_name, c.pay_date, c.period_start, c.period_end,
         c.net_cents, c.gross_cents, c.notes
  FROM paychecks c JOIN jobs j ON j.id = c.job_id
`;

export async function listPaychecks(db: SQLiteDatabase, limit = 50): Promise<Paycheck[]> {
  const rows = await db.getAllAsync<PaycheckRow>(
    `${PAYCHECK_SELECT} ORDER BY c.pay_date DESC, c.id DESC LIMIT ?`,
    limit,
  );
  return rows.map(toPaycheck);
}

export async function getPaycheck(db: SQLiteDatabase, id: number): Promise<Paycheck | null> {
  const row = await db.getFirstAsync<PaycheckRow>(`${PAYCHECK_SELECT} WHERE c.id = ?`, id);
  return row ? toPaycheck(row) : null;
}

export async function savePaycheck(db: SQLiteDatabase, p: PaycheckInput): Promise<number> {
  const values = [p.jobId, p.payDate, p.periodStart, p.periodEnd, p.netCents, p.grossCents, p.notes];
  if (p.id !== undefined) {
    await db.runAsync(
      `UPDATE paychecks SET job_id = ?, pay_date = ?, period_start = ?, period_end = ?, net_cents = ?,
         gross_cents = ?, notes = ? WHERE id = ?`,
      ...values,
      p.id,
    );
    return p.id;
  }
  const result = await db.runAsync(
    `INSERT INTO paychecks (job_id, pay_date, period_start, period_end, net_cents, gross_cents, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ...values,
  );
  return result.lastInsertRowId;
}

export async function deletePaycheck(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM paychecks WHERE id = ?', id);
}

export type Job = { id: number; name: string };

export async function listJobs(db: SQLiteDatabase): Promise<Job[]> {
  return db.getAllAsync<Job>('SELECT id, name FROM jobs WHERE archived_at IS NULL ORDER BY created_at, id');
}

/** Shifts for one job between two dates, for comparing against a paycheck. */
export async function listJobShiftsBetween(
  db: SQLiteDatabase,
  jobId: number,
  start: ISODate,
  end: ISODate,
): Promise<Shift[]> {
  const rows = await db.getAllAsync<ShiftRow>(
    `${SHIFT_SELECT} WHERE j.id = ? AND s.date BETWEEN ? AND ? ORDER BY s.date`,
    jobId,
    start,
    end,
  );
  return rows.map(toShift);
}
