/**
 * Reads the numbers off an end-of-shift checkout slip (the server report a POS such as
 * Toast, Square, Clover or Aloha prints) from text recognized in a photo.
 *
 * Text recognition returns lines (iOS) or blocks of lines (Android) without positions,
 * so a label and its amount can arrive on one line, on consecutive lines, or as a column
 * of labels followed by a column of amounts. All three are handled. Everything found is
 * shown to the user to check before it fills the shift; nothing is saved directly.
 */
import { parseCount, parseMoney } from '@/lib/money';

export type SlipField = 'sales' | 'cardTips' | 'cashTips' | 'tipOut' | 'serviceCharge' | 'covers';

export type SlipValues = Partial<Record<SlipField, number>>;

/** Label patterns per field, best first: an earlier pattern beats a later one for the same field. */
const LABELS: { field: SlipField; patterns: RegExp[] }[] = [
  { field: 'sales', patterns: [/\bnet sales\b/, /\b(gross|total) sales\b/, /^sales$/] },
  {
    field: 'cardTips',
    patterns: [
      /\b(credit ?card|cc|charge|card|credit|non-?cash) tips?\b/,
      /\btips? \((credit|card|charge)\)/,
      /\b(charged|card) gratuit(y|ies)\b/,
    ],
  },
  { field: 'cashTips', patterns: [/\b(declared )?cash tips?( declared)?\b/, /\bdeclared tips?\b/] },
  { field: 'tipOut', patterns: [/\btip ?-?outs?\b/, /\btip share( paid)?\b/, /\btips? paid out\b/] },
  { field: 'serviceCharge', patterns: [/\bauto[ -]?grat(uity)?\b/, /\bservice charges?\b/, /\bsvc chg\b/, /^gratuit(y|ies)$/] },
  { field: 'covers', patterns: [/\b(guest count|guests|covers|# ?of guests|number of guests|cover count)\b/] },
];

// Lines that look like a field but aren't: tax, averages, percentages, tips received from others.
const EXCLUDE = /\btax\b|\bavg\b|average|\bper (guest|cover|check)\b|%|received|\btip share in\b|\bin from\b/;

const VALUE_AT_END = /(\(?-?\$?\s?\d[\d,]*(?:\.\d{1,2})?\)?)\s*$/;
const VALUE_ONLY = /^\(?-?\$?\s?\d[\d,]*(?:\.\d{1,2})?\)?$/;

type Match = { field: SlipField; rank: number };

function matchLabel(label: string): Match | null {
  const text = label.toLowerCase().replace(/[:.…]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (text === '' || EXCLUDE.test(text)) return null;
  for (const { field, patterns } of LABELS) {
    const rank = patterns.findIndex((p) => p.test(text));
    if (rank !== -1) return { field, rank };
  }
  return null;
}

/** Cents for money fields, a whole number for covers; null when the text isn't a usable value. */
function readValue(field: SlipField, raw: string): number | null {
  const cleaned = raw.replace(/[()\s]/g, '').replace(/^-/, '');
  if (field === 'covers') return /^\d+$/.test(cleaned) ? parseCount(cleaned) : null;
  // Money needs cents or a dollar sign, so stray counts like "23" aren't read as dollars.
  if (!/\.\d{2}$/.test(cleaned) && !cleaned.startsWith('$')) return null;
  const cents = parseMoney(cleaned);
  return cents === null || cents === 0 ? null : cents;
}

export function parseCheckoutSlip(recognized: string[]): SlipValues {
  const lines = recognized.flatMap((block) => block.split('\n')).map((l) => l.trim()).filter(Boolean);
  const best = new Map<SlipField, { rank: number; value: number }>();
  const offer = (match: Match, raw: string) => {
    const value = readValue(match.field, raw);
    const current = best.get(match.field);
    if (value !== null && (!current || match.rank < current.rank)) best.set(match.field, { rank: match.rank, value });
  };

  // 1 and 2: the amount on the label's own line, or alone on the next line. A value followed
  // by more values is the start of a column instead, which step 3 pairs up.
  const isValue = (l: string | undefined) => l !== undefined && VALUE_ONLY.test(l);
  lines.forEach((line, i) => {
    const valueMatch = VALUE_AT_END.exec(line);
    const label = valueMatch ? line.slice(0, valueMatch.index) : line;
    const match = matchLabel(label);
    if (!match) return;
    if (valueMatch && label.trim() !== '') offer(match, valueMatch[1]);
    else if (isValue(lines[i + 1]) && !isValue(lines[i + 2])) offer(match, lines[i + 1]);
  });

  // 3: a column of labels followed by a column of values. Android returns each column as one
  // block; iOS returns lines, where any header lines sit above the labels, so the values pair
  // with the labels just before them.
  const pairColumns = (labels: string[], values: string[]) =>
    labels.slice(labels.length - values.length).forEach((label, n) => {
      const match = matchLabel(label);
      if (match && !best.has(match.field)) offer(match, values[n]);
    });
  const blocks = recognized.map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean));
  blocks.forEach((block, i) => {
    const next = blocks[i + 1] ?? [];
    if (block.length >= 2 && next.length >= 2 && next.every(isValue) && block.length >= next.length && !block.some(isValue)) {
      pairColumns(block, next);
    }
  });
  for (let i = 0; i < lines.length; ) {
    let j = i;
    while (j < lines.length && !isValue(lines[j])) j++;
    let k = j;
    while (k < lines.length && isValue(lines[k])) k++;
    if (k - j >= 2 && j - i >= k - j) pairColumns(lines.slice(i, j), lines.slice(j, k));
    i = k > i ? k : i + 1;
  }

  return Object.fromEntries([...best].map(([field, { value }]) => [field, value])) as SlipValues;
}
