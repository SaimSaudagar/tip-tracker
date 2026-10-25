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

The web version is for development only. It stores data in the browser.

## Check it

```bash
npm test
npm run typecheck
npm run lint
```

## Where things are

| Path | What it holds |
|---|---|
| `src/app/(tabs)/index.tsx` | Home: this week, month and year, recent shifts |
| `src/app/(tabs)/calendar.tsx` | Month calendar with daily tips; log a shift for any past day |
| `src/app/(tabs)/settings.tsx` | Jobs and positions, week start, CSV export and import |
| `src/app/log-shift.tsx` | Quick log and edit screen (`?id=…` edits, `?date=…` starts on a day) |
| `src/app/position.tsx` | Position editor: wage and tip-out rule |
| `src/app/import.tsx` | CSV import with column matching, preview and duplicate skipping |
| `src/lib/` | Pure money, time, date, shift, calendar and CSV logic, with tests in `__tests__/` |
| `src/lib/files.ts` / `files.web.ts` | Share sheet on phones, browser download on web |
| `src/db/migrations.ts` | Database schema, applied with `PRAGMA user_version` |
| `src/db/repo.ts` | All SQL queries |
| `src/db/use-db-query.ts` | Hook that reloads a query when data changes |

See `AGENTS.md` for the conventions (money in cents, local date strings, append-only migrations).
