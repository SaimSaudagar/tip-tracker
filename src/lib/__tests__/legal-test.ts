/// <reference types="node" />
import fs from 'fs';
import path from 'path';

import { PRIVACY_POLICY, TERMS, type LegalDoc } from '@/constants/legal';

/** Reads a hosted legal doc into the same shape as the in-app copy, ignoring notes to the developer. */
function readDoc(file: string) {
  const text = fs.readFileSync(path.join(__dirname, '../../../docs', file), 'utf8');
  const plain = (s: string) =>
    s
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links become their text
      .replace(/\s+/g, ' ')
      .trim();
  const [head, ...sections] = text.split(/^## /m);
  return {
    updated: /\*Last updated: (.+?)\*/.exec(head)?.[1] ?? null,
    sections: sections.map((section) => {
      const [heading, ...body] = section.split('\n');
      const paragraphs = body.join('\n').split(/\n\s*\n/).filter((p) => p.trim() && !p.trim().startsWith('>'));
      return { heading: heading.trim(), body: plain(paragraphs.join(' ')) };
    }),
  };
}

describe.each([
  ['privacy-policy.md', PRIVACY_POLICY],
  ['terms-of-use.md', TERMS],
] as [string, LegalDoc][])('docs/%s', (file, inApp) => {
  it('says the same as the in-app copy', () => {
    const hosted = readDoc(file);
    expect(hosted.updated).toBe(inApp.updated);
    expect(hosted.sections).toEqual(inApp.sections.map((s) => ({ heading: s.heading, body: s.body })));
  });
});
