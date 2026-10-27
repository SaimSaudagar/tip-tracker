/**
 * Money is always stored and calculated as integer cents, and percentages as
 * basis points (1% = 100 bps), so no money math ever touches floating point.
 */
import { t } from '@/i18n';

const MAX_CENTS = 999_999_999; // $9,999,999.99
const MAX_BPS = 10_000; // 100%

const pad2 = (n: number) => String(n).padStart(2, '0');
const withCommas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Parses what a user typed ("12", "12.5", ".5", "$1,234.56") into cents.
 * Empty input means 0; anything invalid (letters, negatives, 3+ decimals) is null.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (cleaned === '') return 0;
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match || (match[1] === '' && !match[2])) return null;
  const cents = Number(match[1] || '0') * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return cents <= MAX_CENTS ? cents : null;
}

/** Formats cents as US dollars: 123456 -> "$1,234.56", or "$1,235" with wholeDollars. */
export function formatMoney(cents: number, { wholeDollars = false } = {}): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  if (wholeDollars) return `${sign}$${withCommas(Math.round(abs / 100))}`;
  return `${sign}$${withCommas(Math.floor(abs / 100))}.${pad2(abs % 100)}`;
}

/** An hourly rate: "$31.30/hr" ("$31.30/h" in Spanish). */
export function formatHourly(cents: number): string {
  return t('{amount}/hr', { amount: formatMoney(cents) });
}

/** The same for screen readers, which read "/hr" letter by letter: "$31.30 an hour". */
export function spokenHourly(cents: number): string {
  return t('{amount} an hour', { amount: formatMoney(cents) });
}

/** Turns stored cents back into editable text: 0 -> "", 1200 -> "12", 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  if (cents === 0) return '';
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(dollars) : `${dollars}.${pad2(rest)}`;
}

/** Parses a percentage ("3", "2.5", "2.55%") into basis points. Empty is 0; over 100% is null. */
export function parsePercent(input: string): number | null {
  const cleaned = input.replace(/[%\s]/g, '');
  if (cleaned === '') return 0;
  const match = /^(\d{0,3})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match || (match[1] === '' && !match[2])) return null;
  const bps = Number(match[1] || '0') * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return bps <= MAX_BPS ? bps : null;
}

/** Turns basis points back into editable text: 300 -> "3", 250 -> "2.5". */
export function bpsToInput(bps: number): string {
  if (bps === 0) return '';
  const whole = Math.floor(bps / 100);
  const rest = bps % 100;
  if (rest === 0) return String(whole);
  return `${whole}.${pad2(rest).replace(/0$/, '')}`;
}

/** Formats basis points for display: 300 -> "3%", 255 -> "2.55%". */
export function formatPercent(bps: number): string {
  return `${bpsToInput(bps) || '0'}%`;
}

/** Parses a whole count such as covers ("42"). Empty is 0; anything else, or over 9,999, is null. */
export function parseCount(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '');
  if (cleaned === '') return 0;
  if (!/^\d{1,4}$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** A percentage of an amount, rounded to the nearest cent. */
export function percentOf(cents: number, bps: number): number {
  return Math.round((cents * bps) / MAX_BPS);
}
