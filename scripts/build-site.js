/**
 * Builds the public website in site/: the Tipbook landing page (index.html), the support page
 * (support.html, the store listings' Support URL), and the privacy policy and terms pages from
 * docs/privacy-policy.md and docs/terms-of-use.md. Run `npm run site` after editing either doc or the page text here, then upload the
 * site/ folder (see docs/launch-checklist.md).
 *
 * Images in site/images/ are web-sized copies of the store screenshots' raw screens and the app
 * icon; replace them when the app's screens change.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appName = require(path.join(root, 'app.json')).expo.name;
const out = path.join(root, 'site');

/** Store pages, once the app is live. While empty, the page says the app is coming soon. */
const STORE_LINKS = {
  appStore: '',
  googlePlay: '',
};

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  escape(s)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** Reads a value out of the app's source, so the site can't drift from it. */
function fromSource(file, pattern, what) {
  const match = pattern.exec(fs.readFileSync(path.join(root, file), 'utf8'));
  if (!match) throw new Error(`Couldn't find ${what} in ${file}; update scripts/build-site.js`);
  return match[1];
}

const price = (plan) => fromSource('src/lib/plans.ts', new RegExp(`${plan}: \\{ priceString: '([^']+)'`), `the ${plan} price`);
const prices = { annual: price('annual'), monthly: price('monthly'), lifetime: price('lifetime') };
const annualPerMonth = fromSource(
  'src/lib/plans.ts',
  /annual: \{ priceString: '[^']+', pricePerMonthString: '([^']+)'/,
  'the annual price per month',
);
const supportEmail = fromSource('src/constants/app.ts', /SUPPORT_EMAIL = '([^']*)'/, 'SUPPORT_EMAIL');

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

const head = (title, description) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="theme-color" content="#0b7a4b" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#06120e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="images/favicon.png">`;

const legalPage = (title, body, description = `${title}.`) => `<!doctype html>
<html lang="en">
<head>
${head(title, description)}
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
  ol, ul { margin: 0 0 12px; padding-left: 24px; }
  li { margin: 0 0 6px; }
  .contact { margin-top: 40px; padding: 20px; border-radius: 16px; background: rgba(11, 122, 75, 0.1); }
</style>
</head>
<body><main>
<nav><a href="index.html">${escape(appName)}</a> · <a href="support.html">Support</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></nav>
${body}
</main></body>
</html>
`;

const FEATURES = [
  {
    title: 'Log a shift in seconds',
    text: 'Cash tips, card tips, hours, done. Or snap your checkout slip and Tipbook fills in the totals, right on your phone.',
  },
  {
    title: 'Your real hourly',
    text: 'Wages plus tips, minus tip-outs, divided by the hours you actually worked. Overtime is counted at your paystub’s rate.',
  },
  {
    title: 'Tip reports for your employer',
    text: 'A monthly employee’s tip report, ready before the 10th, and a year-end summary for tax time with service charges kept separate.',
    pro: true,
  },
  {
    title: 'Find your best shifts',
    text: 'Your best days, lunch vs dinner, tips per guest and 12-week trends, so you know which shifts to pick up.',
    pro: true,
  },
  {
    title: 'Bring your history',
    text: 'Import a CSV from your old tip app or a spreadsheet. Export everything, anytime, in a file any spreadsheet opens.',
  },
  {
    title: 'Private by design',
    text: 'No ads, no account, and your tips never leave your phone. They’re in your phone’s own backups, and you can save a backup file whenever you like.',
  },
];

const EXTRAS = [
  'Home-screen and lock-screen widgets',
  '“Hey Siri, log my tips in Tipbook”',
  'Shift reminders',
  'Tip-pool calculator',
  'Paycheck check',
  'Dark mode',
  'iPhone, iPad and Android',
];

const GALLERY = [
  {
    image: 'log',
    caption: 'Log a shift',
    alt: 'The Log shift screen with cash tips, card tips and hours filled in, and the totals they add up to.',
  },
  {
    image: 'calendar',
    caption: 'Every day at a glance',
    alt: 'The Calendar: each day of the month shows what it paid, with the month’s tips and real hourly on top.',
  },
  {
    image: 'reports',
    caption: 'Reports for your employer and taxes',
    alt: 'Reports: the monthly tip report for an employer and the year-end summary, each with a Share PDF button.',
  },
  {
    image: 'insights',
    caption: 'Insights',
    alt: 'Insights: this month so far, the best day of the week, lunch vs dinner and a 12-week trend.',
  },
];

const FREE = [
  'Unlimited shifts, history and the calendar',
  'This week, this month and your real hourly',
  'One job with up to two positions',
  'Slip scanning, widgets and reminders',
  'CSV import and export, and backups',
];

const PRO = [
  'Monthly tip report for your employer, with a reminder before the 10th',
  'Year-end tip summary for tax time',
  'Unlimited jobs and positions, with automatic tip-outs',
  'Insights: best days, lunch vs dinner, trends',
  'Your whole year at a glance',
];

const FAQ = [
  {
    q: 'Is it really free?',
    a: 'Yes. Logging shifts, your history, the calendar, monthly totals, slip scanning, import and export are free, with no ads. Pro adds reports, insights and more than one job.',
  },
  {
    q: 'Where are my tips stored?',
    a: 'Only on your phone. There’s no account and no Tipbook server. Your tips are included in your phone’s regular iCloud or Google backup, and Settings can save a backup file you keep wherever you like, for moving to a new phone.',
  },
  {
    q: 'Can I bring my tips from another app?',
    a: 'Yes. Most tip apps can export a CSV file, usually under Settings or Reports. Pick it in Tipbook and it matches the columns by name: cash and card tips, tip-outs, hours or clock-in and clock-out times, wages and sales. You can change any match before importing.',
  },
  {
    q: 'What’s the monthly tip report?',
    a: 'In the US, employees who receive $20 or more in tips in a month report them to their employer by the 10th of the next month. Tipbook fills in a report for each employer from your shifts, ready to share as a PDF.',
  },
  {
    q: 'Does Tipbook do my taxes?',
    a: 'No. Tipbook keeps your records and makes reports from them. It isn’t tax advice; for that, ask a tax professional.',
  },
  {
    q: 'How do Pro subscriptions work?',
    a: `The yearly plan starts with 14 days free, and Tipbook reminds you 2 days before the trial ends. Subscriptions renew until you cancel them in your App Store or Google Play settings. Lifetime is a one-time ${prices.lifetime} purchase.`,
  },
];

// Steps name the app's own buttons, so keep them in step with the screens.
const SUPPORT = [
  {
    id: 'log',
    title: 'Log, change or delete a shift',
    steps: [
      'Tap Log shift on Home, fill in your cash tips, card tips and hours, and tap Save.',
      'To log an earlier day, open Calendar, tap the day, then tap “Log a shift for …”.',
      'To change or delete a shift, tap it on Home or in the Calendar. Delete shift is at the bottom.',
      'Tip-outs, tips from coworkers, service charges, sales, guests and start and end times are under “Tip-outs, service charges & more”.',
    ],
  },
  {
    id: 'new-phone',
    title: 'Move to a new phone, or reinstall',
    steps: [
      'Your tips live only on your phone. They’re included in your phone’s own iCloud or Google backup, so restoring a phone backup brings them back.',
      'To move them yourself: Settings → Your data → Back up now, and keep the file in iCloud Drive, Google Drive or email.',
      'On the new phone, install Tipbook, finish the short setup, then Settings → Your data → Restore from a backup and pick the file.',
      'Restoring replaces what’s on the new phone, so do it before logging new shifts there.',
    ],
  },
  {
    id: 'import',
    title: 'Bring your tips from another app or a spreadsheet',
    steps: [
      'In your old app, export your history as a CSV file. It’s usually under Settings or Reports, as Export or Backup; some apps email the file to you.',
      'From Excel, Numbers or Google Sheets, save or download the sheet as CSV.',
      'In Tipbook: Settings → Your data → Import from another app (CSV), and pick the file.',
      'Check which column fills each field (tap a field to change it), look over the preview, and tap Import. Importing the same file twice won’t add shifts twice.',
    ],
  },
  {
    id: 'reports',
    title: 'Monthly tip report and year-end summary',
    steps: [
      'Open Reports. The monthly report shows each job’s tips for the month and when they’re due to your employer.',
      'In the US, tips of $20 or more in a month from one job are reported to that employer by the 10th of the next month.',
      'Tap Share PDF for your employer to send or print it (Pro). The year-end summary has your tips, service charges and wages for tax time.',
      'Tipbook keeps records and makes reports; it isn’t tax advice.',
    ],
  },
  {
    id: 'overtime',
    title: 'Overtime',
    steps: [
      'Settings → Jobs & positions → tap a position → Overtime, and pick the rule on your paystub: over 40 hours a week (most states), over 8 hours a day (as in Alaska and Nevada), or California (adds double time after 12 hours, and the seventh-day rule).',
      'Enter the overtime rate from your paystub for exact numbers; otherwise Tipbook estimates it. Overtime applies to every position at that job.',
    ],
  },
  {
    id: 'widgets',
    title: 'Widgets, Siri and shortcuts',
    steps: [
      'iPhone and iPad: touch and hold the Home Screen, tap Edit → Add Widget, and choose Tipbook. It also fits the Lock Screen.',
      'Android: touch and hold the home screen, tap Widgets, and drag “Tipbook: this week” onto it. Touch and hold the Tipbook icon for Log shift and Scan slip.',
      'Say “Hey Siri, log my tips in Tipbook” to jump straight to logging a shift.',
    ],
  },
  {
    id: 'reminders',
    title: 'Reminders don’t show up',
    steps: [
      'Settings → Reminders → turn on After-shift reminder, and pick the time and the days you work. Days you’ve already logged get no reminder.',
      'If nothing arrives, allow notifications for Tipbook in your phone’s Settings → Notifications.',
    ],
  },
  {
    id: 'subscription',
    title: 'Pro, subscriptions and refunds',
    steps: [
      'Pro is bought through the App Store or Google Play, with your store account. On a new phone, tap Settings → Restore purchases.',
      'To cancel, open your subscriptions: on iPhone, Settings → your name → Subscriptions; on Android, Google Play → profile → Payments & subscriptions → Subscriptions. Cancel at least a day before it renews.',
      'Refunds are handled by Apple (reportaproblem.apple.com) or Google Play, not by Tipbook.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    steps: [
      'There’s no account and no Tipbook server: your tips, hours and notes stay on your phone. There are no ads.',
      'Settings → Your data → Delete all data erases everything in the app. Deleting the app does too, apart from your phone’s own backups.',
    ],
  },
];

const supportPage = () =>
  legalPage(
    `${appName} Support`,
    `<h1>${escape(appName)} Support</h1>
<p class="muted">Answers to common questions. Most things are in Settings.</p>
<ul>${SUPPORT.map((s) => `<li><a href="#${s.id}">${escape(s.title)}</a></li>`).join('')}</ul>
${SUPPORT.map((s) => `<h2 id="${s.id}">${escape(s.title)}</h2>\n<ol>${s.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>`).join('\n')}
<div class="contact">
<h2 style="margin-top:0">Still stuck?</h2>
<p>Email <a href="mailto:${escape(supportEmail || '[support email]')}">${escape(supportEmail || '[support email]')}</a> with what you tried and what happened. Please don’t send your backup file unless we ask: it has all your shifts in it.</p>
</div>`,
    `Help with ${appName}: logging shifts, moving to a new phone, importing, reports, overtime, widgets, reminders and subscriptions.`,
  );

function storeButtons() {
  const links = [
    STORE_LINKS.appStore && `<a class="store" href="${escape(STORE_LINKS.appStore)}">Download on the App Store</a>`,
    STORE_LINKS.googlePlay && `<a class="store" href="${escape(STORE_LINKS.googlePlay)}">Get it on Google Play</a>`,
  ].filter(Boolean);
  return links.length
    ? `<div class="stores">${links.join('\n')}</div>`
    : '<p class="soon">Coming soon to iPhone, iPad and Android.</p>';
}

const check =
  '<svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const list = (items) => `<ul class="checks">${items.map((i) => `<li>${check}<span>${escape(i)}</span></li>`).join('')}</ul>`;

const landing = () => `<!doctype html>
<html lang="en">
<head>
${head(
  `${appName}: tip tracker for servers and bartenders`,
  'Log tips in seconds and see your real hourly. Monthly tip reports for your employer, year-end summaries for tax time. No ads, no account; your tips stay on your phone.',
)}
<meta property="og:title" content="${escape(appName)}: know what you really make">
<meta property="og:description" content="The tip tracker for servers and bartenders. No ads, no account.">
<meta property="og:image" content="images/home.jpg">
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --surface: #f0f0f3; --text: #0b0d0c; --muted: #575b62; --tint: #0b7a4b; --on-tint: #ffffff;
    --tint-soft: #e3f4eb; --hero-from: #16a56e; --hero-to: #075c38; --on-hero: #ffffff; --on-hero-muted: #e3f4eb;
    --phone: #0d1b14; --line: #e0e1e6;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #000000; --surface: #17191b; --text: #f2f2f2; --muted: #b0b4ba; --tint: #34d399; --on-tint: #04271a;
      --tint-soft: #0f2e22; --hero-from: #0f3a29; --hero-to: #06120e; --on-hero: #f2fbf6; --on-hero-muted: #b9e6cf;
      --phone: #26302b; --line: #2e3135;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 17px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased; }
  a { color: var(--tint); }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
  h1, h2, h3 { line-height: 1.12; letter-spacing: -0.02em; margin: 0; }
  h2 { font-size: clamp(28px, 4vw, 38px); }
  h3 { font-size: 19px; letter-spacing: -0.01em; }
  section { padding: 72px 0; }
  .eyebrow { font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tint); margin: 0 0 8px; }
  .section-lead { color: var(--muted); max-width: 620px; margin: 12px 0 0; }

  /* Hero: the phone hangs over the next section. */
  .hero { background: linear-gradient(160deg, var(--hero-from) 0%, var(--hero-to) 100%); color: var(--on-hero); }
  .hero-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; padding-top: 40px; }
  .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 22px; }
  .brand img { border-radius: 12px; }
  .hero h1 { font-size: clamp(40px, 7vw, 64px); margin-top: 32px; font-weight: 800; }
  .lead { font-size: 19px; color: var(--on-hero-muted); margin: 16px 0 0; max-width: 520px; }
  .stores { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
  .store { display: inline-block; padding: 14px 22px; border-radius: 14px; background: var(--on-hero); color: #075c38;
    font-weight: 700; text-decoration: none; }
  .soon { margin: 28px 0 0; font-weight: 700; }
  .trust { list-style: none; padding: 0; margin: 20px 0 0; display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--on-hero-muted); font-size: 15px; }
  .trust li::before { content: "✓ "; font-weight: 800; color: var(--on-hero); }
  .phone { margin: 0 auto; width: min(320px, 78vw); border-radius: 44px; padding: 10px; background: var(--phone);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35); }
  .phone img { display: block; width: 100%; height: auto; border-radius: 35px; }
  .hero .phone { margin-bottom: -120px; }
  @media (min-width: 860px) {
    .hero-grid { grid-template-columns: 1.1fr 0.9fr; padding-top: 56px; }
    .hero .phone { margin-bottom: -160px; }
  }

  /* Features */
  .features { padding-top: 180px; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 36px; }
  @media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 960px) { .grid { grid-template-columns: 1fr 1fr 1fr; } }
  .card { background: var(--surface); border-radius: 20px; padding: 24px; }
  .card p { margin: 8px 0 0; color: var(--muted); }
  .pro { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: var(--tint); color: var(--on-tint);
    font-size: 12px; font-weight: 700; vertical-align: 3px; letter-spacing: 0.02em; }
  .extras { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 0; padding: 0; list-style: none; }
  .extras li { padding: 8px 14px; border-radius: 999px; background: var(--tint-soft); color: var(--text); font-size: 15px; font-weight: 600; }

  /* Gallery: swipes sideways on phones. */
  .gallery { background: var(--surface); }
  .shots { display: grid; grid-auto-flow: column; grid-auto-columns: min(250px, 70vw); gap: 24px; overflow-x: auto;
    padding: 36px 16px 24px; margin: 0 -16px; scroll-snap-type: x mandatory; }
  .shots figure { margin: 0; scroll-snap-align: center; }
  .shots .phone { width: 100%; border-radius: 34px; padding: 8px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18); }
  .shots .phone img { border-radius: 27px; }
  .shots figcaption { text-align: center; margin-top: 14px; font-weight: 600; font-size: 15px; }
  @media (min-width: 1100px) { .shots { justify-content: center; } }

  /* Pricing */
  .plans { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 36px; }
  @media (min-width: 760px) { .plans { grid-template-columns: 1fr 1fr; } }
  .plan { border-radius: 24px; padding: 28px; background: var(--surface); }
  .plan.featured { background: var(--tint-soft); outline: 2px solid var(--tint); }
  .plan-price { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; margin: 10px 0 0; }
  .plan-note { color: var(--muted); margin: 4px 0 0; font-size: 15px; font-weight: 500; letter-spacing: 0; }
  .fine { margin-top: 16px; }
  .checks { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 10px; }
  .checks li { display: flex; gap: 10px; align-items: flex-start; }
  .checks svg { flex-shrink: 0; margin-top: 4px; color: var(--tint); }

  /* FAQ */
  .faq-list { margin-top: 28px; border-top: 1px solid var(--line); }
  details { border-bottom: 1px solid var(--line); }
  summary { cursor: pointer; padding: 18px 0; font-weight: 700; list-style: none; display: flex; justify-content: space-between; gap: 16px; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: "+"; color: var(--tint); font-weight: 800; font-size: 22px; line-height: 1; }
  details[open] summary::after { content: "–"; }
  details p { margin: 0 0 18px; color: var(--muted); max-width: 760px; }

  footer { border-top: 1px solid var(--line); padding: 32px 0 48px; color: var(--muted); font-size: 15px; }
  footer nav { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-bottom: 8px; }
  footer p { margin: 0; }
  :focus-visible { outline: 3px solid var(--tint); outline-offset: 3px; border-radius: 6px; }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap hero-grid">
    <div>
      <div class="brand"><img src="images/icon.png" width="44" height="44" alt="">${escape(appName)}</div>
      <h1>Know what you really make.</h1>
      <p class="lead">The tip tracker for servers and bartenders. Log a shift in about five seconds, see your real hourly, and have your tip report ready for your employer.</p>
      ${storeButtons()}
      <ul class="trust"><li>No ads, ever</li><li>No account</li><li>Your tips stay on your phone</li></ul>
    </div>
    <div class="phone"><img src="images/home.jpg" width="860" height="1864" alt="Tipbook’s Home screen: this week’s tips, progress toward a weekly goal, total earned, hours and real hourly, and recent shifts."></div>
  </div>
</header>

<main>
  <section class="features" aria-labelledby="features-title">
    <div class="wrap">
      <p class="eyebrow">Why Tipbook</p>
      <h2 id="features-title">Everything a tipped shift needs.<br>Nothing it doesn’t.</h2>
      <div class="grid">
        ${FEATURES.map((f) => `<div class="card"><h3>${escape(f.title)}${f.pro ? '<span class="pro">PRO</span>' : ''}</h3><p>${escape(f.text)}</p></div>`).join('\n        ')}
      </div>
      <ul class="extras" aria-label="Also included">${EXTRAS.map((e) => `<li>${escape(e)}</li>`).join('')}</ul>
    </div>
  </section>

  <section class="gallery" aria-labelledby="gallery-title">
    <div class="wrap">
      <p class="eyebrow">A look inside</p>
      <h2 id="gallery-title">Made for the end of a long shift.</h2>
      <p class="section-lead">Big numbers, few taps, and nothing in your way.</p>
      <div class="shots" tabindex="0" role="region" aria-label="Screenshots, scrolls sideways">
        ${GALLERY.map((g) => `<figure><div class="phone"><img src="images/${g.image}.jpg" width="860" height="1864" loading="lazy" alt="${escape(g.alt)}"></div><figcaption>${escape(g.caption)}</figcaption></figure>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section aria-labelledby="pricing-title">
    <div class="wrap">
      <p class="eyebrow">Pricing</p>
      <h2 id="pricing-title">Free to track. Pro when you want reports.</h2>
      <div class="plans">
        <div class="plan">
          <h3>Free</h3>
          <p class="plan-price">$0</p>
          <p class="plan-note">No ads, no time limit.</p>
          ${list(FREE)}
        </div>
        <div class="plan featured">
          <h3>Pro</h3>
          <p class="plan-price">${escape(prices.annual)}<span class="plan-note"> / year</span></p>
          <p class="plan-note">14 days free, then about ${escape(annualPerMonth)} a month. Or ${escape(prices.monthly)} a month, or ${escape(prices.lifetime)} once.</p>
          ${list(PRO)}
        </div>
      </div>
      <p class="plan-note fine">Prices in US dollars; the App Store and Google Play show your local price.</p>
    </div>
  </section>

  <section aria-labelledby="faq-title">
    <div class="wrap">
      <p class="eyebrow">Questions</p>
      <h2 id="faq-title">Good to know</h2>
      <div class="faq-list">
        ${FAQ.map((f) => `<details><summary>${escape(f.q)}</summary><p>${escape(f.a)}</p></details>`).join('\n        ')}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <nav aria-label="Site"><a href="support.html">Support</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Use</a></nav>
    <p>${escape(appName)} keeps records only; it isn’t tax advice.</p>
  </div>
</footer>
</body>
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
  fs.writeFileSync(path.join(out, doc.target), legalPage(doc.title, html));
}
fs.writeFileSync(path.join(out, 'index.html'), landing());
fs.writeFileSync(path.join(out, 'support.html'), supportPage());
if (!supportEmail) console.warn('support.html has no contact email: set SUPPORT_EMAIL in src/constants/app.ts.');

const missing = ['icon.png', 'favicon.png', 'home.jpg', ...GALLERY.map((g) => `${g.image}.jpg`)].filter(
  (file) => !fs.existsSync(path.join(out, 'images', file)),
);
if (missing.length) console.warn(`site/images is missing: ${missing.join(', ')}`);
if (!STORE_LINKS.appStore && !STORE_LINKS.googlePlay) console.log('No store links yet, so the page says "Coming soon".');
console.log(`Wrote ${path.relative(root, out)}/index.html, support.html, privacy.html and terms.html`);
