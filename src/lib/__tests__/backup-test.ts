import { MIGRATIONS } from '@/db/migrations';
import { BACKUP_COLUMNS, buildBackup, parseBackup, type BackupTables } from '@/lib/backup';
import { combineTipOuts, describeTipOuts, parseTipOutDrafts } from '@/lib/tipouts';

const tables = (): BackupTables => ({
  jobs: [
    {
      id: 1,
      name: 'Olive & Vine',
      color: null,
      archived_at: null,
      created_at: '2026-10-01 12:00:00',
      overtime_rule: 'weekly',
      overtime_rate_cents: null,
      overtime_double_time: 0,
    },
  ],
  positions: [
    {
      id: 1,
      job_id: 1,
      name: 'Server',
      hourly_wage_cents: 213,
      tipout_rule: 'pct_tips',
      tipout_value: 300,
      archived_at: null,
      created_at: '2026-10-01 12:00:00',
    },
  ],
  shifts: [
    {
      id: 7,
      position_id: 1,
      date: '2026-10-25',
      start_time: null,
      end_time: null,
      break_minutes: 0,
      minutes_worked: 390,
      hourly_wage_cents: 213,
      cash_tips_cents: 8000,
      card_tips_cents: 12000,
      tip_in_cents: 0,
      tip_out_cents: 1500,
      service_charge_cents: 0,
      sales_cents: null,
      covers: null,
      notes: 'Patio',
      created_at: '2026-10-25 23:00:00',
      updated_at: '2026-10-25 23:00:00',
      period: 'pm',
    },
  ],
  tipouts: [
    { id: 3, shift_id: 7, recipient_name: 'Maria', amount_cents: 1000 },
    { id: 4, shift_id: 7, recipient_name: 'Bar', amount_cents: 500 },
  ],
  paychecks: [
    {
      id: 2,
      job_id: 1,
      pay_date: '2026-10-30',
      period_start: '2026-10-12',
      period_end: '2026-10-25',
      net_cents: 41250,
      gross_cents: 52000,
      notes: null,
      created_at: '2026-10-30 09:00:00',
    },
  ],
  settings: [
    { key: 'week_start', value: '1' },
    { key: 'onboarded', value: '1' },
    { key: 'pro_override', value: '1' },
    { key: 'last_backup_at', value: '2026-10-01' },
  ],
});

const now = new Date('2026-10-26T15:00:00Z');

describe('backups', () => {
  it('round-trips every table and leaves device-only settings out', () => {
    const backup = buildBackup(tables(), 2, now);
    expect(backup.exportedAt).toBe('2026-10-26T15:00:00.000Z');
    expect(backup.tables.settings.map((s) => s.key)).toEqual(['week_start', 'onboarded']);

    const parsed = parseBackup(JSON.stringify(backup), 2);
    expect(parsed).toEqual({ ok: true, backup });
  });

  it('covers every column of every table', () => {
    const t = tables();
    for (const table of Object.keys(BACKUP_COLUMNS) as (keyof BackupTables)[]) {
      if (table === 'settings') continue;
      expect(Object.keys(t[table][0]).sort()).toEqual([...BACKUP_COLUMNS[table]].sort());
    }
  });

  it('includes every column the database schema creates', () => {
    const schema = MIGRATIONS.join('\n');
    const tablesSeen: string[] = [];
    const columnsByTable = new Map<string, string[]>();
    for (const match of schema.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\n\s*\);/g)) {
      const [, table, body] = match;
      tablesSeen.push(table);
      columnsByTable.set(
        table,
        body
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^[a-z_]+ (INTEGER|TEXT)/.test(line))
          .map((line) => line.split(' ')[0]),
      );
    }
    for (const [, table, column] of schema.matchAll(/ALTER TABLE (\w+) ADD COLUMN (\w+)/g)) {
      columnsByTable.get(table)!.push(column);
    }
    for (const [table, columns] of columnsByTable) {
      expect([...BACKUP_COLUMNS[table as keyof BackupTables]].sort()).toEqual(columns.sort());
    }
    expect(tablesSeen.sort()).toEqual(Object.keys(BACKUP_COLUMNS).sort());
  });

  it('still restores backups made before paychecks and shift periods existed', () => {
    const old = buildBackup(tables(), 2, now) as unknown as { tables: Record<string, unknown[]> };
    delete old.tables.paychecks;
    (old.tables.shifts[0] as Record<string, unknown>).period = undefined;
    const parsed = parseBackup(JSON.stringify(old), 3);
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.backup.tables.paychecks).toEqual([]);
  });

  it('gives jobs from backups made before overtime existed no overtime', () => {
    const old = buildBackup(tables(), 3, now) as unknown as { tables: Record<string, Record<string, unknown>[]> };
    delete old.tables.jobs[0].overtime_rule;
    delete old.tables.jobs[0].overtime_rate_cents;
    delete old.tables.jobs[0].overtime_double_time;
    const parsed = parseBackup(JSON.stringify(old), 4);
    expect(parsed.ok && parsed.backup.tables.jobs[0]).toMatchObject({ overtime_rule: 'none', overtime_double_time: 0 });
  });

  it('rejects a double-time flag other than 0 or 1', () => {
    const t = tables();
    t.jobs[0].overtime_double_time = 2;
    const parsed = parseBackup(JSON.stringify(buildBackup(t, 5, now)), 5);
    expect(!parsed.ok && parsed.error).toContain('overtime_double_time');
  });

  it('rejects an unknown overtime rule', () => {
    const t = tables();
    t.jobs[0].overtime_rule = 'hourly';
    const parsed = parseBackup(JSON.stringify(buildBackup(t, 4, now)), 4);
    expect(!parsed.ok && parsed.error).toContain('overtime_rule');
  });

  it('rejects a paycheck for a job that isn’t in the backup', () => {
    const t = tables();
    t.paychecks[0].job_id = 42;
    const parsed = parseBackup(JSON.stringify(buildBackup(t, 3, now)), 3);
    expect(!parsed.ok && parsed.error).toContain('paycheck');
  });

  it('strips device-only settings from hand-made files too', () => {
    const backup = { ...buildBackup(tables(), 2, now) };
    backup.tables = { ...backup.tables, settings: [...backup.tables.settings, { key: 'pro_override', value: '1' }] };
    const parsed = parseBackup(JSON.stringify(backup), 2);
    expect(parsed.ok && parsed.backup.tables.settings.some((s) => s.key === 'pro_override')).toBe(false);
  });

  it.each([
    ['not JSON', '{oops', 'valid JSON'],
    ['another app’s file', JSON.stringify({ format: 'something-else' }), 'isn’t a Tipbook backup'],
    ['a newer backup', JSON.stringify({ ...buildBackup(tables(), 3, now) }), 'newer version'],
  ])('rejects %s', (_label, text, message) => {
    const parsed = parseBackup(text, 2);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.error).toContain(message);
  });

  it('rejects damaged values and broken references', () => {
    const damaged = tables();
    damaged.shifts[0].cash_tips_cents = '80' as unknown as number;
    expect(parseBackup(JSON.stringify(buildBackup(damaged, 2, now)), 2)).toMatchObject({ ok: false });

    const orphan = tables();
    orphan.tipouts[0].shift_id = 99;
    const result = parseBackup(JSON.stringify(buildBackup(orphan, 2, now)), 2);
    expect(!result.ok && result.error).toContain('missing shift');

    const empty = tables();
    empty.positions = [];
    empty.shifts = [];
    empty.tipouts = [];
    expect(parseBackup(JSON.stringify(buildBackup(empty, 2, now)), 2)).toMatchObject({ ok: false });
  });
});

describe('tip-out names', () => {
  it('sums named rows and ignores blank ones', () => {
    const parsed = parseTipOutDrafts([
      { key: 'a', name: ' Maria ', amount: '10' },
      { key: 'b', name: 'Bar', amount: '5.50' },
      { key: 'c', name: '', amount: '' },
    ]);
    expect(parsed).toEqual({
      entries: [
        { name: 'Maria', amountCents: 1000 },
        { name: 'Bar', amountCents: 550 },
      ],
      totalCents: 1550,
      valid: true,
    });
    expect(describeTipOuts(parsed.entries)).toBe('Maria $10.00, Bar $5.50');
  });

  it('adds up a month of tip-outs per person', () => {
    expect(
      combineTipOuts([
        [
          { name: 'Maria', amountCents: 1000 },
          { name: 'Bar', amountCents: 500 },
        ],
        [{ name: 'maria', amountCents: 1200 }],
        [],
      ]),
    ).toEqual([
      { name: 'Maria', amountCents: 2200 },
      { name: 'Bar', amountCents: 500 },
    ]);
  });

  it('flags rows missing a name or an amount', () => {
    expect(parseTipOutDrafts([{ key: 'a', name: 'Maria', amount: '' }]).valid).toBe(false);
    expect(parseTipOutDrafts([{ key: 'a', name: '', amount: '10' }]).valid).toBe(false);
    expect(parseTipOutDrafts([{ key: 'a', name: 'Maria', amount: 'ten' }]).valid).toBe(false);
  });
});
