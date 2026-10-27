/**
 * Builds the public website in site/: the Tipbook landing page in English (index.html) and
 * Spanish (es.html), the support page
 * (support.html, the store listings' Support URL), and the privacy policy and terms pages from
 * docs/privacy-policy.md and docs/terms-of-use.md. Run `npm run site` after editing either doc or the page text here, then upload the
 * site/ folder (see docs/launch-checklist.md).
 *
 * Images in site/images/ are web-sized copies of the store screenshots' raw screens and the app
 * icon (site/images/es/ has the Spanish screens); replace them when the app's screens change.
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
  'Share your week as a picture',
  '“Hey Siri, log my tips in Tipbook”',
  'Shift reminders',
  'Tip-pool calculator',
  'Paycheck check',
  'Dark mode',
  'iPhone, iPad and Android',
  'In English and Spanish',
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

/** The landing page's text in each language. Support, privacy and terms are in English only. */
const COPY = {
  en: {
    title: `${appName}: tip tracker for servers and bartenders`,
    description:
      'Log tips in seconds and see your real hourly. Monthly tip reports for your employer, year-end summaries for tax time. No ads, no account; your tips stay on your phone.',
    ogTitle: `${appName}: know what you really make`,
    ogDescription: 'The tip tracker for servers and bartenders. No ads, no account.',
    h1: 'Know what you really make.',
    lead: 'The tip tracker for servers and bartenders. Log a shift in about five seconds, see your real hourly, and have your tip report ready for your employer.',
    trust: ['No ads, ever', 'No account', 'Your tips stay on your phone'],
    heroAlt:
      'Tipbook’s Home screen: this week’s tips, progress toward a weekly goal, total earned, hours and real hourly, and recent shifts.',
    soon: 'Coming soon to iPhone, iPad and Android.',
    appStore: 'Download on the App Store',
    googlePlay: 'Get it on Google Play',
    featuresEyebrow: 'Why Tipbook',
    featuresTitle: ['Everything a tipped shift needs.', 'Nothing it doesn’t.'],
    features: FEATURES,
    extrasLabel: 'Also included',
    extras: EXTRAS,
    galleryEyebrow: 'A look inside',
    galleryTitle: 'Made for the end of a long shift.',
    galleryLead: 'Big numbers, few taps, and nothing in your way.',
    galleryLabel: 'Screenshots, scrolls sideways',
    gallery: GALLERY,
    images: 'images',
    pricingEyebrow: 'Pricing',
    pricingTitle: 'Free to track. Pro when you want reports.',
    free: 'Free',
    freeNote: 'No ads, no time limit.',
    freeItems: FREE,
    perYear: ' / year',
    proNote: `14 days free, then about ${annualPerMonth} a month. Or ${prices.monthly} a month, or ${prices.lifetime} once.`,
    proItems: PRO,
    pricesNote: 'Prices in US dollars; the App Store and Google Play show your local price.',
    faqEyebrow: 'Questions',
    faqTitle: 'Good to know',
    faq: FAQ,
    navLabel: 'Site',
    support: 'Support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    footer: `${appName} keeps records only; it isn’t tax advice.`,
    other: { href: 'es.html', lang: 'es', label: 'Español' },
  },
  es: {
    title: `${appName}: registro de propinas para meseros y bartenders`,
    description:
      'Registra tus propinas en segundos y ve tu pago real por hora. Informes mensuales de propinas para tu empleador y resúmenes de fin de año para los impuestos. Sin anuncios ni cuenta; tus propinas se quedan en tu teléfono.',
    ogTitle: `${appName}: descubre lo que de verdad ganas`,
    ogDescription: 'La app de propinas para meseros y bartenders. Sin anuncios, sin cuenta.',
    h1: 'Descubre lo que de verdad ganas.',
    lead: 'La app de propinas para meseros y bartenders. Registra un turno en unos cinco segundos, ve tu pago real por hora y ten listo tu informe de propinas para tu empleador.',
    trust: ['Sin anuncios, nunca', 'Sin cuenta', 'Tus propinas se quedan en tu teléfono'],
    heroAlt:
      'La pantalla de Inicio de Tipbook: las propinas de esta semana, el avance hacia la meta semanal, el total ganado, las horas, el pago real por hora y los turnos recientes.',
    soon: 'Muy pronto en iPhone, iPad y Android.',
    appStore: 'Descárgala en el App Store',
    googlePlay: 'Disponible en Google Play',
    featuresEyebrow: 'Por qué Tipbook',
    featuresTitle: ['Todo lo que necesita un turno con propinas.', 'Nada que sobre.'],
    features: [
      {
        title: 'Registra un turno en segundos',
        text: 'Propinas en efectivo, con tarjeta, horas y listo. O toma una foto de tu ticket de cierre y Tipbook llena los totales, en tu propio teléfono.',
      },
      {
        title: 'Tu pago real por hora',
        text: 'Salario más propinas, menos lo que repartes, dividido entre las horas que de verdad trabajaste. Las horas extra se cuentan con la tarifa de tu talón de pago.',
      },
      {
        title: 'Informes de propinas para tu empleador',
        text: 'Un informe mensual de propinas, listo antes del día 10, y un resumen de fin de año para los impuestos con los cargos por servicio aparte.',
        pro: true,
      },
      {
        title: 'Descubre tus mejores turnos',
        text: 'Tus mejores días, almuerzo frente a cena, propinas por comensal y tendencias de 12 semanas, para que sepas qué turnos tomar.',
        pro: true,
      },
      {
        title: 'Trae tu historial',
        text: 'Importa un CSV de tu app de propinas anterior o de una hoja de cálculo. Exporta todo cuando quieras, en un archivo que abre cualquier hoja de cálculo.',
      },
      {
        title: 'Privada desde el principio',
        text: 'Sin anuncios, sin cuenta, y tus propinas nunca salen de tu teléfono. Están en las copias de seguridad de tu teléfono y puedes guardar un archivo de copia cuando quieras.',
      },
    ],
    extrasLabel: 'También incluye',
    extras: [
      'Widgets para la pantalla de inicio y la bloqueada',
      'Comparte tu semana como imagen',
      'Recordatorios después del turno',
      'Calculadora de fondo de propinas',
      'Revisión de cheques de pago',
      'Modo oscuro',
      'iPhone, iPad y Android',
      'En español y en inglés',
    ],
    galleryEyebrow: 'Un vistazo por dentro',
    galleryTitle: 'Hecha para el final de un turno largo.',
    galleryLead: 'Números grandes, pocos toques y nada que estorbe.',
    galleryLabel: 'Capturas de pantalla, se desplazan hacia los lados',
    gallery: [
      {
        image: 'log',
        caption: 'Registra un turno',
        alt: 'La pantalla Registrar turno con las propinas en efectivo, con tarjeta y las horas, y los totales que suman.',
      },
      {
        image: 'calendar',
        caption: 'Cada día de un vistazo',
        alt: 'El Calendario: cada día del mes muestra lo que pagó, con las propinas y el pago real por hora del mes arriba.',
      },
      {
        image: 'reports',
        caption: 'Informes para tu empleador y los impuestos',
        alt: 'Informes: el informe mensual de propinas para un empleador y el resumen de fin de año, cada uno con un botón para compartir el PDF.',
      },
      {
        image: 'insights',
        caption: 'Análisis',
        alt: 'Análisis: este mes hasta ahora, el mejor día de la semana, almuerzo frente a cena y la tendencia de 12 semanas.',
      },
    ],
    images: 'images/es',
    pricingEyebrow: 'Precios',
    pricingTitle: 'Gratis para registrar. Pro cuando quieras informes.',
    free: 'Gratis',
    freeNote: 'Sin anuncios, sin límite de tiempo.',
    freeItems: [
      'Turnos ilimitados, historial y calendario',
      'Esta semana, este mes y tu pago real por hora',
      'Un trabajo con hasta dos puestos',
      'Escaneo de tickets, widgets y recordatorios',
      'Importar y exportar CSV, y copias de seguridad',
    ],
    perYear: ' / año',
    proNote: `14 días gratis, luego unos ${annualPerMonth} al mes. O ${prices.monthly} al mes, o ${prices.lifetime} una sola vez.`,
    proItems: [
      'Informe mensual de propinas para tu empleador, con un recordatorio antes del día 10',
      'Resumen de propinas de fin de año para los impuestos',
      'Trabajos y puestos ilimitados, con reparto de propinas automático',
      'Análisis: mejores días, almuerzo frente a cena, tendencias',
      'Tu año completo de un vistazo',
    ],
    pricesNote: 'Precios en dólares estadounidenses; el App Store y Google Play muestran el precio de tu país.',
    faqEyebrow: 'Preguntas',
    faqTitle: 'Bueno saberlo',
    faq: [
      {
        q: '¿De verdad es gratis?',
        a: 'Sí. Registrar turnos, tu historial, el calendario, los totales del mes, el escaneo de tickets, importar y exportar son gratis y sin anuncios. Pro agrega informes, análisis y más de un trabajo.',
      },
      {
        q: '¿La app está en español?',
        a: 'Sí. Tipbook se muestra en español si tu teléfono está en español, o puedes elegirlo en Ajustes → Idioma. Los informes en PDF para tu empleador, la política de privacidad y los términos están en inglés.',
      },
      {
        q: '¿Dónde se guardan mis propinas?',
        a: 'Solo en tu teléfono. No hay cuenta ni servidor de Tipbook. Tus propinas se incluyen en la copia de seguridad normal de iCloud o Google de tu teléfono, y en Ajustes puedes guardar un archivo de copia donde quieras, para pasarte a un teléfono nuevo.',
      },
      {
        q: '¿Puedo traer mis propinas de otra app?',
        a: 'Sí. La mayoría de las apps de propinas pueden exportar un archivo CSV, casi siempre en Ajustes o Informes. Elígelo en Tipbook y se emparejan las columnas por nombre: propinas en efectivo y con tarjeta, reparto, horas u horas de entrada y salida, salario y ventas. Puedes cambiar cualquier columna antes de importar.',
      },
      {
        q: '¿Qué es el informe mensual de propinas?',
        a: 'En EE. UU., los empleados que reciben $20 o más en propinas en un mes se las reportan a su empleador a más tardar el día 10 del mes siguiente. Tipbook llena un informe para cada empleador con tus turnos, listo para compartir como PDF.',
      },
      {
        q: '¿Tipbook hace mis impuestos?',
        a: 'No. Tipbook guarda tus registros y hace informes con ellos. No es asesoría de impuestos; para eso, consulta a un profesional de impuestos.',
      },
      {
        q: '¿Cómo funcionan las suscripciones Pro?',
        a: `El plan anual empieza con 14 días gratis, y Tipbook te avisa 2 días antes de que termine la prueba. Las suscripciones se renuevan hasta que las canceles en los ajustes del App Store o de Google Play. De por vida es un pago único de ${prices.lifetime}.`,
      },
    ],
    navLabel: 'Sitio',
    support: 'Soporte (en inglés)',
    privacy: 'Política de privacidad (en inglés)',
    terms: 'Términos de uso (en inglés)',
    footer: `${appName} solo guarda registros; no es asesoría de impuestos.`,
    other: { href: 'index.html', lang: 'en', label: 'English' },
  },
};

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
      'Weekly recap sends your week’s totals the morning after the week ends. The amounts show in the notification, so leave it off if others see your phone.',
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

function storeButtons(copy) {
  const links = [
    STORE_LINKS.appStore && `<a class="store" href="${escape(STORE_LINKS.appStore)}">${escape(copy.appStore)}</a>`,
    STORE_LINKS.googlePlay && `<a class="store" href="${escape(STORE_LINKS.googlePlay)}">${escape(copy.googlePlay)}</a>`,
  ].filter(Boolean);
  return links.length ? `<div class="stores">${links.join('\n')}</div>` : `<p class="soon">${escape(copy.soon)}</p>`;
}

const check =
  '<svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const list = (items) => `<ul class="checks">${items.map((i) => `<li>${check}<span>${escape(i)}</span></li>`).join('')}</ul>`;

const landing = (lang) => {
  const copy = COPY[lang];
  return `<!doctype html>
<html lang="${lang}">
<head>
${head(copy.title, copy.description)}
<meta property="og:title" content="${escape(copy.ogTitle)}">
<meta property="og:description" content="${escape(copy.ogDescription)}">
<meta property="og:image" content="${copy.images}/home.jpg">
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
  .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 22px; }
  .language { color: var(--on-hero); font-weight: 700; font-size: 15px; }
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
      <div class="top">
        <div class="brand"><img src="images/icon.png" width="44" height="44" alt="">${escape(appName)}</div>
        <a class="language" href="${copy.other.href}" hreflang="${copy.other.lang}" lang="${copy.other.lang}">${escape(copy.other.label)}</a>
      </div>
      <h1>${escape(copy.h1)}</h1>
      <p class="lead">${escape(copy.lead)}</p>
      ${storeButtons(copy)}
      <ul class="trust">${copy.trust.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>
    </div>
    <div class="phone"><img src="${copy.images}/home.jpg" width="860" height="1864" alt="${escape(copy.heroAlt)}"></div>
  </div>
</header>

<main>
  <section class="features" aria-labelledby="features-title">
    <div class="wrap">
      <p class="eyebrow">${escape(copy.featuresEyebrow)}</p>
      <h2 id="features-title">${copy.featuresTitle.map(escape).join('<br>')}</h2>
      <div class="grid">
        ${copy.features.map((f) => `<div class="card"><h3>${escape(f.title)}${f.pro ? '<span class="pro">PRO</span>' : ''}</h3><p>${escape(f.text)}</p></div>`).join('\n        ')}
      </div>
      <ul class="extras" aria-label="${escape(copy.extrasLabel)}">${copy.extras.map((e) => `<li>${escape(e)}</li>`).join('')}</ul>
    </div>
  </section>

  <section class="gallery" aria-labelledby="gallery-title">
    <div class="wrap">
      <p class="eyebrow">${escape(copy.galleryEyebrow)}</p>
      <h2 id="gallery-title">${escape(copy.galleryTitle)}</h2>
      <p class="section-lead">${escape(copy.galleryLead)}</p>
      <div class="shots" tabindex="0" role="region" aria-label="${escape(copy.galleryLabel)}">
        ${copy.gallery.map((g) => `<figure><div class="phone"><img src="${copy.images}/${g.image}.jpg" width="860" height="1864" loading="lazy" alt="${escape(g.alt)}"></div><figcaption>${escape(g.caption)}</figcaption></figure>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section aria-labelledby="pricing-title">
    <div class="wrap">
      <p class="eyebrow">${escape(copy.pricingEyebrow)}</p>
      <h2 id="pricing-title">${escape(copy.pricingTitle)}</h2>
      <div class="plans">
        <div class="plan">
          <h3>${escape(copy.free)}</h3>
          <p class="plan-price">$0</p>
          <p class="plan-note">${escape(copy.freeNote)}</p>
          ${list(copy.freeItems)}
        </div>
        <div class="plan featured">
          <h3>Pro</h3>
          <p class="plan-price">${escape(prices.annual)}<span class="plan-note">${escape(copy.perYear)}</span></p>
          <p class="plan-note">${escape(copy.proNote)}</p>
          ${list(copy.proItems)}
        </div>
      </div>
      <p class="plan-note fine">${escape(copy.pricesNote)}</p>
    </div>
  </section>

  <section aria-labelledby="faq-title">
    <div class="wrap">
      <p class="eyebrow">${escape(copy.faqEyebrow)}</p>
      <h2 id="faq-title">${escape(copy.faqTitle)}</h2>
      <div class="faq-list">
        ${copy.faq.map((f) => `<details><summary>${escape(f.q)}</summary><p>${escape(f.a)}</p></details>`).join('\n        ')}
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <nav aria-label="${escape(copy.navLabel)}"><a href="support.html">${escape(copy.support)}</a><a href="privacy.html">${escape(copy.privacy)}</a><a href="terms.html">${escape(copy.terms)}</a><a href="${copy.other.href}" hreflang="${copy.other.lang}" lang="${copy.other.lang}">${escape(copy.other.label)}</a></nav>
    <p>${escape(copy.footer)}</p>
  </div>
</footer>
</body>
</html>
`;
};

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
fs.writeFileSync(path.join(out, 'index.html'), landing('en'));
fs.writeFileSync(path.join(out, 'es.html'), landing('es'));
fs.writeFileSync(path.join(out, 'support.html'), supportPage());
if (!supportEmail) console.warn('support.html has no contact email: set SUPPORT_EMAIL in src/constants/app.ts.');

const missing = [
  'images/icon.png',
  'images/favicon.png',
  ...Object.values(COPY).flatMap((copy) => [
    `${copy.images}/home.jpg`,
    ...copy.gallery.map((g) => `${copy.images}/${g.image}.jpg`),
  ]),
].filter((file) => !fs.existsSync(path.join(out, file)));
if (missing.length) console.warn(`site/ is missing: ${missing.join(', ')}`);
if (!STORE_LINKS.appStore && !STORE_LINKS.googlePlay) console.log('No store links yet, so the page says "Coming soon".');
console.log(`Wrote ${path.relative(root, out)}/index.html, es.html, support.html, privacy.html and terms.html`);
