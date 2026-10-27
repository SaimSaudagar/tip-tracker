/**
 * Who a shift's tips were paid out to. The daily tip record IRS Publication 531
 * suggests keeping lists the coworkers you tipped out alongside the amounts.
 */
import { formatMoney, parseMoney } from '@/lib/money';

export type TipOutEntry = { name: string; amountCents: number };
export type TipOutDraft = { key: string; name: string; amount: string };

export type ParsedTipOuts = {
  entries: TipOutEntry[];
  totalCents: number;
  /** False when any row is missing a name or has an unreadable amount. */
  valid: boolean;
};

/** Reads the editable rows, ignoring completely empty ones. */
export function parseTipOutDrafts(rows: TipOutDraft[]): ParsedTipOuts {
  const filled = rows.filter((r) => r.name.trim() !== '' || r.amount.trim() !== '');
  const entries: TipOutEntry[] = [];
  let valid = true;
  for (const row of filled) {
    const amountCents = parseMoney(row.amount);
    if (row.name.trim() === '' || amountCents === null || amountCents === 0) {
      valid = false;
      continue;
    }
    entries.push({ name: row.name.trim(), amountCents });
  }
  return { entries, totalCents: entries.reduce((sum, e) => sum + e.amountCents, 0), valid };
}

/** Adds up tip-outs per person (names matched ignoring case), largest first. */
export function combineTipOuts(lists: TipOutEntry[][]): TipOutEntry[] {
  const totals = new Map<string, TipOutEntry>();
  for (const entry of lists.flat()) {
    const key = entry.name.toLowerCase();
    const existing = totals.get(key);
    totals.set(key, { name: existing?.name ?? entry.name, amountCents: (existing?.amountCents ?? 0) + entry.amountCents });
  }
  return [...totals.values()].sort((a, b) => b.amountCents - a.amountCents);
}

/** "Maria $10.00, Bar $5.00" for reports and exports. */
export function describeTipOuts(entries: TipOutEntry[]): string {
  return entries.map((e) => `${e.name} ${formatMoney(e.amountCents)}`).join(', ');
}
