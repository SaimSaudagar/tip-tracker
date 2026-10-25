/** Time worked is stored as whole minutes. */

const MAX_MINUTES = 24 * 60;

/**
 * Parses hours worked as typed: "6", "6.5" (decimal hours) or "6:30" (hours:minutes).
 * Empty input means 0; invalid input or more than 24 hours is null.
 */
export function parseDuration(input: string): number | null {
  const cleaned = input.replace(/\s/g, '');
  if (cleaned === '') return 0;

  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(cleaned);
  if (clock) {
    const minutes = Number(clock[1]) * 60 + Number(clock[2]);
    return minutes <= MAX_MINUTES ? minutes : null;
  }

  if (!/^(\d{1,2})?(\.\d{0,2})?$/.test(cleaned) || cleaned === '.') return null;
  const minutes = Math.round(Number(cleaned) * 60);
  return minutes <= MAX_MINUTES ? minutes : null;
}

/** Turns minutes back into editable decimal hours: 390 -> "6.5", 380 -> "6.33", 0 -> "". */
export function minutesToInput(minutes: number): string {
  if (minutes === 0) return '';
  return String(Number((minutes / 60).toFixed(2)));
}

/** Formats minutes for display: 390 -> "6h 30m", 360 -> "6h", 45 -> "45m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0 && m > 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Minutes between two "HH:MM" clock times, minus a break.
 * An end time earlier than the start means the shift ran past midnight.
 */
export function minutesBetween(start: string, end: string, breakMinutes = 0): number | null {
  const toMinutes = (t: string) => {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(t.trim());
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return null;
  const span = e >= s ? e - s : e + MAX_MINUTES - s;
  return Math.max(0, span - breakMinutes);
}
