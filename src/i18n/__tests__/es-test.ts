import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { es } from '@/i18n/es';

const SRC = join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** Every 'text' passed to t() or msg() in the app, with the file it's in. */
function translatableText() {
  const found = new Map<string, string>();
  const nonLiteral: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?<![\w.])(?:t|msg)\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      const text = match[1].replace(/\\'/g, "'");
      if (!found.has(text)) found.set(text, relative(SRC, file));
    }
    // Text in double quotes or backticks would slip past this test.
    for (const match of source.matchAll(/(?<![\w.])(?:t|msg)\(\s*["`]/g)) {
      nonLiteral.push(`${relative(SRC, file)}: ${source.slice(match.index, match.index + 50)}`);
    }
  }
  return { found, nonLiteral };
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Spanish translations', () => {
  const { found, nonLiteral } = translatableText();

  it('finds the app’s text', () => {
    expect(found.size).toBeGreaterThan(500);
    expect(found.get('Save shift')).toBe('app/log-shift.tsx');
  });

  it('cover every string in the app', () => {
    const missing = [...found].filter(([text]) => !(text in es)).map(([text, file]) => `${file}: ${text}`);
    expect(missing).toEqual([]);
  });

  it('keep the same {placeholders}', () => {
    const mismatched = Object.entries(es)
      .filter(([english, spanish]) => placeholders(english).join() !== placeholders(spanish).join())
      .map(([english, spanish]) => `${english} → ${spanish}`);
    expect(mismatched).toEqual([]);
  });

  it('have no entries the app no longer uses', () => {
    expect(Object.keys(es).filter((text) => !found.has(text))).toEqual([]);
  });

  it('keep leading and trailing spaces, which join sentence parts', () => {
    const changed = Object.entries(es).filter(
      ([english, spanish]) => english.startsWith(' ') !== spanish.startsWith(' ') || english.endsWith(' ') !== spanish.endsWith(' '),
    );
    expect(changed).toEqual([]);
  });

  it('are never empty', () => {
    expect(Object.entries(es).filter(([, spanish]) => spanish.trim() === '')).toEqual([]);
  });

  it('are only looked up with plain quoted text', () => {
    expect(nonLiteral).toEqual([]);
  });
});
