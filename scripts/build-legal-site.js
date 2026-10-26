/**
 * Builds the public privacy policy and terms pages (site/) from docs/privacy-policy.md and
 * docs/terms-of-use.md, for the store listings. Run `npm run legal-site` after editing either
 * doc, then upload the site/ folder (see docs/launch-checklist.md).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appName = require(path.join(root, 'app.json')).expo.name;
const out = path.join(root, 'site');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  escape(s)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** The small slice of Markdown the legal docs use. Blockquotes are notes to the developer and are left out. */
function toHtml(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !block.startsWith('>'))
    .map((block) => {
      if (block.startsWith('## ')) return `<h2>${inline(block.slice(3))}</h2>`;
      if (block.startsWith('# ')) return `<h1>${inline(block.slice(2))}</h1>`;
      return `<p>${inline(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

const page = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
  :root { color-scheme: light dark; --text: #111; --muted: #60646c; --bg: #fff; --tint: #0b7a4b; }
  @media (prefers-color-scheme: dark) { :root { --text: #f2f2f2; --muted: #b0b4ba; --bg: #000; --tint: #34d399; } }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 17px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 30px; line-height: 1.2; margin: 0 0 8px; }
  h2 { font-size: 20px; margin: 32px 0 8px; }
  p { margin: 0 0 12px; }
  em, .muted { color: var(--muted); }
  a { color: var(--tint); }
  nav { margin-bottom: 32px; font-size: 15px; }
</style>
</head>
<body><main>
<nav><a href="index.html">${escape(appName)}</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></nav>
${body}
</main></body>
</html>
`;

const docs = [
  { source: 'privacy-policy.md', target: 'privacy.html', title: `${appName} Privacy Policy` },
  { source: 'terms-of-use.md', target: 'terms.html', title: `${appName} Terms of Use` },
];

fs.mkdirSync(out, { recursive: true });
for (const doc of docs) {
  const markdown = fs.readFileSync(path.join(root, 'docs', doc.source), 'utf8');
  const html = toHtml(markdown);
  const placeholders = html.match(/\[[a-z][^\]]*\]/g);
  if (placeholders) console.warn(`${doc.source} still has placeholders: ${[...new Set(placeholders)].join(', ')}`);
  fs.writeFileSync(path.join(out, doc.target), page(doc.title, html));
}
fs.writeFileSync(
  path.join(out, 'index.html'),
  page(
    appName,
    `<h1>${escape(appName)}</h1>
<p>Track every tip in seconds. No ads, no account, and your tips stay on your phone.</p>
<p><a href="privacy.html">Privacy Policy</a><br><a href="terms.html">Terms of Use</a></p>`,
  ),
);
console.log(`Wrote ${path.relative(root, out)}/index.html, privacy.html and terms.html`);
