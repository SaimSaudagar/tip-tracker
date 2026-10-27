/**
 * Splits a shared tip pool between coworkers, by hours worked or equally. Shares are
 * whole cents and always add up to the pool exactly: after rounding down, the leftover
 * cents go to the people with the largest remainders (earlier rows win ties).
 */
import { t } from '@/i18n';
import { formatDuration } from '@/lib/duration';
import { formatMoney } from '@/lib/money';

export type SplitMode = 'hours' | 'equal';
export type PoolMember = { name: string; minutes: number };
export type PoolShare = PoolMember & { amountCents: number };

/** Each member's share, in the order given, or null when there's nothing to split by. */
export function splitTipPool(totalCents: number, members: PoolMember[], mode: SplitMode): PoolShare[] | null {
  if (members.length === 0 || totalCents < 0) return null;
  const weights = members.map((m) => (mode === 'equal' ? 1 : m.minutes));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return null;

  // Integer math throughout: cents × minutes stays far below Number.MAX_SAFE_INTEGER.
  const parts = weights.map((w, index) => ({
    index,
    cents: Math.floor((totalCents * w) / totalWeight),
    remainder: (totalCents * w) % totalWeight,
  }));
  let leftover = totalCents - parts.reduce((sum, p) => sum + p.cents, 0);
  for (const part of [...parts].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (leftover === 0) break;
    part.cents += 1;
    leftover -= 1;
  }
  return members.map((m, i) => ({ ...m, amountCents: parts[i].cents }));
}

/** Plain text for sharing the split with the team. */
export function describeTipPool(totalCents: number, shares: PoolShare[], mode: SplitMode): string {
  const lines = shares.map((s) =>
    mode === 'hours'
      ? `${s.name}: ${formatMoney(s.amountCents)} (${formatDuration(s.minutes)})`
      : `${s.name}: ${formatMoney(s.amountCents)}`,
  );
  const heading =
    mode === 'hours'
      ? t('Tip pool {total}, split by hours worked:', { total: formatMoney(totalCents) })
      : t('Tip pool {total}, split equally:', { total: formatMoney(totalCents) });
  return [heading, ...lines].join('\n');
}
