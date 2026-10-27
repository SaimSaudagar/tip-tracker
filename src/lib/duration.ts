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

/** The same for screen readers, which read "6h" as "6 h": 390 -> "6 hours 30 minutes". */
export function spokenDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = `${h} ${h === 1 ? 'hour' : 'hours'}`;
  const mins = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  if (h === 0 && m > 0) return mins;
  return m === 0 ? hours : `${hours} ${mins}`;
}

/**
 * Parses a clock time as people type it: "5pm", "5:30 pm", "17:30", "1730", "9a".
 * Returns 24-hour "HH:MM", or null when it can't be read.
 */
export function parseClockTime(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (s === '') return null;
  const m = /^(\d{1,2})(?::?(\d{2}))?(a|am|p|pm)?$/.exec(s);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const suffix = m[3];
  if (minute > 59) return null;
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix.startsWith('p') && hour !== 12) hour += 12;
    if (suffix.startsWith('a') && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** "17:30" -> "5:30 PM", "09:00" -> "9 AM". */
export function formatClock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Shifts starting before 3 PM count as lunch/daytime (AM); later starts as dinner/night (PM). */
export function periodForStart(time: string): 'am' | 'pm' {
  return Number(time.slice(0, 2)) < 15 ? 'am' : 'pm';
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
