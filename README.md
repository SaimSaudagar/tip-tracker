# Tipbook

A tip tracker for servers and bartenders: log a shift in five seconds, see your real hourly, no ads, no account. Tip data stays on the phone.

Built with Expo (SDK 58), Expo Router and `expo-sqlite`.

## Run it

```bash
npm install
npm start
```

Scan the QR code with **Expo Go** on your phone (iOS or Android), or press `w` to open it in a browser.

```bash
npm run web
```

The web version is for development only. It stores data in the browser, and reminders and the share sheet only work on phones.

In development builds, turn on **Settings → Developer: simulate Pro** to try Pro features before RevenueCat is connected, and use **Settings → Developer: add 12 weeks of sample shifts** to fill every screen with realistic data (Delete all data removes it).

## Features that need a Tipbook build

The home-screen widget (iOS and Android), checkout-slip scanning, Siri ("Log my tips in Tipbook") and Android launcher shortcuts use native code that Expo Go doesn't have. In Expo Go they quietly step aside: scanning offers manual entry and the widget isn't updated. Build an installable test version with `npx eas-cli@latest build --profile preview --platform android` (see `docs/launch-checklist.md`, step 5).

| Feature | Where |
|---|---|
| iOS widget | `targets/widget/` (SwiftUI, added to Xcode by `@bacons/apple-targets`; data through the App Group) |
| Android widget | `src/widgets/android/` (`react-native-android-widget`; background task registered in `index.ts`) |
| Siri and Android shortcuts | `plugins/with-shortcuts.js` and `plugins/siri/` |
| Slip scanning | `src/app/scan.tsx`, `src/lib/scan.ts` (on-device text recognition), `src/lib/checkout-slip.ts` (reading the totals) |

## Purchases (RevenueCat)

Without RevenueCat keys the app simulates Pro in development (**Settings → Developer: simulate Pro**) and shows "purchases aren't available" in release builds. To turn on real purchases, put the public SDK keys from the RevenueCat dashboard in a `.env.local` file (see `.env.example`):

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
```

In Expo Go, RevenueCat runs in Preview API Mode with mock purchases. Real purchases need a development or store build. `docs/launch-checklist.md` lists the dashboard setup the code expects.

## Check it

```bash
npm test            # calculations, database, backups, upgrades, 5 years of data
npm run typecheck
npm run lint
npm run test:e2e    # clicks through the app in a browser (first time: npx playwright install chromium)
```

`test:e2e` starts the web version by itself (or reuses one already running on port 8081) and goes through onboarding, logging and editing shifts, the calendar, reports and PDFs, import, backup and restore, settings, the tip pool and overtime, on a fixed date so the numbers never change.

## Where things are

| Path | What it holds |
|---|---|
| `src/app/(tabs)/index.tsx` | Home: this week with goal ring and day-by-day chart, month and year, recent shifts, tax-season card (Jan–Apr) |
| `src/app/(tabs)/calendar.tsx` | Month calendar with daily tips; log a shift for any past day |
| `src/app/(tabs)/insights.tsx` | Pro insights: best day, lunch vs dinner, 12-week trend, best shifts, tips vs sales, tips per guest |
| `src/app/(tabs)/reports.tsx` | Monthly employer tip report, year-end summary (PDF) and paychecks |
| `src/app/(tabs)/settings.tsx` | Pro status and restore, positions, reminders, weekly goal, week start, appearance, backup, CSV export and import, delete all data, tools, legal, support |
| `src/app/onboarding.tsx` | First-run setup: role, workplace, wage, tip-out, week start, reminder |
| `src/app/paywall.tsx` | Pro paywall (contextual headline, plans, one-time exit offer) |
| `src/purchases/pro-context.tsx` | Who has Pro, plans with store prices, purchase and restore; simulated in development without a RevenueCat key |
| `src/purchases/revenuecat.ts` | RevenueCat setup: keys, entitlement and offering names, trial end from the entitlement |
| `src/lib/plans.ts` | Paywall plan text, with the store's price strings when they've loaded |
| `src/app/tip-pool.tsx` / `src/lib/tip-pool.ts` | Tip pool calculator: split by hours or equally, exact to the cent |
| `src/lib/appearance.ts` | Light / dark / automatic choice, applied app-wide |
| `src/lib/analytics.ts` | The launch plan's funnel events; nothing is sent until a service is connected |
| `src/constants/app.ts` | Support email (the Settings row is hidden while it's empty) |
| `src/lib/reminders-plan.ts` / `notify.ts` | Reminder planning (pure, tested) and local notification scheduling |
| `src/db/backup.ts` / `src/lib/backup.ts` | Full JSON backup and restore (validated, one transaction) |
| `src/lib/tipouts.ts` | Names of coworkers tipped out, for the IRS daily tip record |
| `src/lib/insights.ts` / `paychecks.ts` / `celebration.ts` | Insights, paycheck comparison and the after-save highlight (pure, tested) |
| `src/components/` | Shared UI: button, chip, bar chart, progress ring, toast, list group, date stepper, money field |
| `docs/` | Privacy policy, terms of use, store listing drafts, release notes, support and review replies, the TikTok/Instagram content plan with 30 written posts and demo clips, phone testing and the launch checklist |
| `src/app/log-shift.tsx` | Quick log and edit screen (`?id=…` edits, `?date=…` starts on a day, `?tipIn=…` prefills a tip-pool share); optional start/end times, lunch/dinner tag and covers |
| `src/app/paycheck.tsx` | Add or edit a paycheck and compare it with the shifts in its pay period |
| `src/app/position.tsx` | Position editor: wage and tip-out rule |
| `src/app/import.tsx` | CSV import with column matching, preview and duplicate skipping |
| `src/lib/` | Pure money, time, date, shift, calendar and CSV logic, with tests in `__tests__/` |
| `src/lib/files.ts` / `files.web.ts` | Share sheet on phones, browser download on web |
| `src/db/migrations.ts` | Database schema, applied with `PRAGMA user_version` |
| `src/db/repo.ts` | All SQL queries |
| `src/db/use-db-query.ts` | Hook that reloads a query when data changes |
| `src/db/__tests__/` / `src/db/testing/memory-db.ts` | Tests of the real SQL against an in-memory SQLite (sql.js) |
| `src/lib/sample-data.ts` | Development-only sample shifts |
| `src/lib/overtime.ts` | Overtime per job: over 40 hours a week or 8 a day, at the paystub rate or a federal estimate |
| `src/lib/widget-snapshot.ts` / `src/widgets/` | What the home-screen widgets show, and keeping them up to date |
| `index.ts` | App entry: Expo Router plus the Android widget task |
| `scripts/build-site.js` → `site/` | `npm run site` builds the public website: the landing page, the support page, and the privacy and terms pages from `docs/` |
| `docs/store-screenshots/` | Draft App Store and Google Play screenshots |

See `AGENTS.md` for the conventions (money in cents, local date strings, append-only migrations).
