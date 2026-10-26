# Tip Tracker

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

In development builds, turn on **Settings → Developer: simulate Pro** to try Pro features before RevenueCat is connected.

## Check it

```bash
npm test
npm run typecheck
npm run lint
```

## Where things are

| Path | What it holds |
|---|---|
| `src/app/(tabs)/index.tsx` | Home: this week with goal ring and day-by-day chart, month and year, recent shifts |
| `src/app/(tabs)/calendar.tsx` | Month calendar with daily tips; log a shift for any past day |
| `src/app/(tabs)/insights.tsx` | Pro insights: best day, lunch vs dinner, 12-week trend, best shifts, tips vs sales |
| `src/app/(tabs)/reports.tsx` | Monthly employer tip report, year-end summary (PDF) and paychecks |
| `src/app/(tabs)/settings.tsx` | Pro status, positions, reminders, weekly goal, week start, backup, CSV export and import, legal |
| `src/app/onboarding.tsx` | First-run setup: role, workplace, wage, tip-out, week start, reminder |
| `src/app/paywall.tsx` | Pro paywall (contextual headline, plans, one-time exit offer) |
| `src/purchases/pro-context.tsx` | Who has Pro; simulated in development until RevenueCat is connected |
| `src/lib/reminders-plan.ts` / `notify.ts` | Reminder planning (pure, tested) and local notification scheduling |
| `src/db/backup.ts` / `src/lib/backup.ts` | Full JSON backup and restore (validated, one transaction) |
| `src/lib/tipouts.ts` | Names of coworkers tipped out, for the IRS daily tip record |
| `src/lib/insights.ts` / `paychecks.ts` / `celebration.ts` | Insights, paycheck comparison and the after-save highlight (pure, tested) |
| `src/components/` | Shared UI: button, chip, bar chart, progress ring, toast, list group, date stepper, money field |
| `docs/` | Privacy policy, terms of use, store listing drafts and the TikTok/Instagram content plan |
| `src/app/log-shift.tsx` | Quick log and edit screen (`?id=…` edits, `?date=…` starts on a day); optional start/end times and lunch/dinner tag |
| `src/app/paycheck.tsx` | Add or edit a paycheck and compare it with the shifts in its pay period |
| `src/app/position.tsx` | Position editor: wage and tip-out rule |
| `src/app/import.tsx` | CSV import with column matching, preview and duplicate skipping |
| `src/lib/` | Pure money, time, date, shift, calendar and CSV logic, with tests in `__tests__/` |
| `src/lib/files.ts` / `files.web.ts` | Share sheet on phones, browser download on web |
| `src/db/migrations.ts` | Database schema, applied with `PRAGMA user_version` |
| `src/db/repo.ts` | All SQL queries |
| `src/db/use-db-query.ts` | Hook that reloads a query when data changes |

See `AGENTS.md` for the conventions (money in cents, local date strings, append-only migrations).
