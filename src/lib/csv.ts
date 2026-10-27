/**
 * Minimal RFC 4180 CSV: quoted fields, doubled quotes, separators and newlines inside quotes.
 * The separator is a comma, or a semicolon or tab when the file uses those instead
 * (Excel writes semicolons in countries that use a decimal comma).
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // Excel adds a byte-order mark
  const separator = detectSeparator(src);

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === separator) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** The most common of comma, semicolon and tab outside quotes in the first lines. */
function detectSeparator(src: string): string {
  const head = src.split(/\r?\n/, 10).join('\n').replace(/"[^"]*"/g, '');
  const count = (sep: string) => head.split(sep).length - 1;
  return [';', '\t'].reduce((best, sep) => (count(sep) > count(best) ? sep : best), ',');
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) || /^\s|\s$/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map((v) => escapeField(v === null ? '' : String(v))).join(',')).join('\r\n') + '\r\n';
}
