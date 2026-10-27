This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Tip tracker conventions

- **Money is integer cents** everywhere (database, state, math). Percentages are basis points (1% = 100). Parse user input with `parseMoney` / `parsePercent` and format with `formatMoney` from `src/lib/money.ts`. Never use floats for money.
- **Time worked is whole minutes.** Use `parseDuration` / `formatDuration` from `src/lib/duration.ts`.
- **Dates are local `YYYY-MM-DD` strings** (`src/lib/dates.ts`). Never convert shift dates through UTC or `Date#toISOString`.
- **Business math lives in pure functions** in `src/lib/` with tests in `src/lib/__tests__/*-test.ts`. Screens call these functions; they don't do their own arithmetic.
- **Database tests:** `src/db/__tests__/` runs the real SQL in `src/db/` against an in-memory SQLite from `openMemoryDb()` (`src/db/testing/memory-db.ts`). Add a test there when you change a query or a migration. Don't nest `withTransactionAsync` calls or start one while another may be running: expo-sqlite rejects a transaction inside a transaction.
- **Database:** `expo-sqlite`, opened by `SQLiteProvider` in `src/app/_layout.tsx`. The file lives in `Documents/SQLite` on iOS and `files/SQLite` on Android, both included in the phone's own backups (`android.allowBackup` is on). Schema changes go in a new entry at the end of `MIGRATIONS` in `src/db/migrations.ts` and never edit an entry that has shipped. All SQL lives in `src/db/repo.ts`. Screens read data with `useDbQuery` (reloads on database change and on focus).
- **Shifts store the hourly wage they were logged with**, so changing a position's wage never rewrites past earnings.
- **Service charges / auto-gratuity are kept separate from tips** because they don't count as voluntary tips for tax reporting.
- **No ads, no accounts, no tip data sent off the device.** Don't add analytics events that include amounts.
- **Free vs. Pro** lives in `src/lib/pro.ts` (limits) and `src/purchases/pro-context.tsx` (`usePro()`). Logging, history, the calendar, monthly totals, export and import are always free. Never hide a user's own entries behind the paywall.
- **Purchases** go through RevenueCat (`src/purchases/revenuecat.ts`) when `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` is set; Pro is the `pro` entitlement. Without a key, development builds simulate purchases with the `pro_override` setting. Paywall text comes from `buildPlan` in `src/lib/plans.ts`, which swaps in the store's price strings, so never hard-code a price elsewhere. A running trial's last day is kept in the `trial_ends_at` setting and gets a reminder 2 days before.
- **Analytics:** call `track` from `src/lib/analytics.ts` with one of its typed events. Nothing is sent until a service is connected there; event properties never include money.
- **Appearance:** components get light/dark from `useTheme()` / `useColorScheme()` in `src/hooks`, which respect the Settings choice (`appearance` setting). Never import `useColorScheme` from `react-native` directly.
- **Delete all data** (`deleteAllData` in `src/db/repo.ts`) keeps only the purchase and one-time-prompt settings listed in `KEPT_ON_ERASE`; add new settings of that kind there.
- **Reminders** are planned by the pure `planReminders` (one-off dates, skipping days that already have a shift; the weekly recap fires at 11 AM the day after the week ends and is re-planned as shifts change, so its totals stay current) and scheduled by `src/lib/notify.ts`. Every notification id starts with a prefix listed in `OWN_PREFIXES`. `ReminderSync` in the root layout re-plans whenever shifts or settings change, so screens never schedule notifications themselves.
- **Platform splits** use `.web.ts` files (`files`, `notify`). Keep both files' exports identical.
- **Legal text** in `src/constants/legal.ts` must match `docs/privacy-policy.md` and `docs/terms-of-use.md`; `legal-test.ts` fails when they drift. After changing either doc, run `npm run site` to rebuild the hosted pages in `site/`. The landing page's text is in `scripts/build-site.js`; it reads prices from `src/lib/plans.ts`, so keep its feature list in step with the paywall.
- **Backups** copy every table column listed in `BACKUP_COLUMNS` (`src/lib/backup.ts`). When a migration adds a column, add it there too; a test compares the list against the schema and fails if they differ. Settings that describe the device (`pro_override`, `last_backup_at`) are never backed up or restored.
- **Overtime** is set per job (`overtime_rule` 'none' | 'weekly' | 'daily', optional `overtime_rate_cents` from the paystub, and `overtime_double_time` for California's double time and seventh-day rule on top of 'daily'; the position screen shows that combination as "California"). `computeOvertime` in `src/lib/overtime.ts` works it out per week; repo list functions attach the result as `overtimePremiumCents`, which `computeShift` adds to wages. Never add overtime anywhere else, and load shifts through the repo so the premium is there.
- **Native-only features** (widgets, slip scanning, Siri, launcher shortcuts) must keep Expo Go working: load their native modules with a guarded `require` (see `src/lib/scan.ts`, `src/widgets/*.android.ts`) and degrade quietly. Native configuration lives in `app.json`, `targets/` and `plugins/`, never in `ios/` or `android/`.
- **Widgets** show `buildWidgetSnapshot` (`src/lib/widget-snapshot.ts`). `WidgetSync` in the root layout pushes it to iOS (App Group `APP_GROUP`, read by `targets/widget/index.swift`) and Android (`requestWidgetUpdate`); Android's background task in `src/widgets/android/task-handler.ts` reads the database itself. If the snapshot's fields change, update the Swift reader too.
- **Deep links** `tipbook://log-shift` and `tipbook://scan` are used by widgets, Siri and shortcuts. Log shift accepts amounts in its link (`cash`, `card`, `tipIn`, `tipOut`, `serviceCharge`, `sales`, `covers`), which the scanner and tip pool use.
- **Covers** (guests served) are optional whole numbers on a shift, parsed with `parseCount`. They feed the "tips per guest" insight and the CSV export/import.
- **Clock times are `HH:MM` 24-hour strings** (`parseClockTime` / `formatClock` in `src/lib/duration.ts`). When a shift has both start and end times they decide its minutes worked; `period` ('am' | 'pm' | null) tags lunch vs dinner.
- **Paychecks** are compared with what was logged by `comparePaycheck` (`src/lib/paychecks.ts`): wages + card tips + service charges for that job and period, against gross pay. Cash tips are never on a paycheck.
- **Design tokens** live in `src/constants/theme.ts` (`Colors`, `Spacing`, `Radius`, `Shadows`, `Motion`, `NumberFont`). Use them instead of literals; money uses `ThemedText` types `display` and `amount`.
- **Motion and haptics:** no animation on screens seen many times a day (charts are static). Buttons scale to 0.97 on press. One haptic per action through `src/lib/haptics.ts` (selection on chips, success on save, destructive on delete). Confirmations go through `showToast` (`src/components/toast.tsx`), which respects Reduce Motion and announces itself to screen readers.
- **Layout widths:** screens center their content at `MaxContentWidth` (800). On windows `useWideLayout()` says are wide (900+ points: iPad landscape, the 13" iPad, big Split View panes), Home and Calendar switch to two columns up to `WideContentWidth`. Keep phone layouts single-column.
- **Accessibility:** every `Pressable` gets an `accessibilityRole` and, when its text isn't enough, an `accessibilityLabel` that starts with the visible text (so Voice Control finds it). Group labels above sections use `SectionTitle` (a heading, read in normal case). Text on colored surfaces needs 4.5:1 contrast; don't dim it with opacity below 0.9. Text inside fixed-size shapes (calendar cells, the goal ring) caps `maxFontSizeMultiplier` at 1.3 and the shape's label carries the full value. Read durations with `spokenDuration`.
- Run `npm test`, `npm run typecheck` and `npm run lint` before declaring a task done, and `npm run test:e2e` (Playwright, `e2e/*.e2e.ts`) after changing a screen or flow. E2E tests run on a fixed date (`TODAY` in `e2e/helpers.ts`); after a save, wait for the modal to close (`waitToLeave`) before navigating, or the write can be cut off by the page load.
- **Screens read with `useDbQuery`**, which reloads on database changes (batched, so bulk writes cause one reload) and on focus. Anything that rewrites many tables in one go (restore, delete all) must leave `onboarded` readable at every step, or the tabs redirect to onboarding mid-way.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
