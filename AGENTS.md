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
- **Database:** `expo-sqlite`, opened by `SQLiteProvider` in `src/app/_layout.tsx`. Schema changes go in a new entry at the end of `MIGRATIONS` in `src/db/migrations.ts` and never edit an entry that has shipped. All SQL lives in `src/db/repo.ts`. Screens read data with `useDbQuery` (reloads on database change and on focus).
- **Shifts store the hourly wage they were logged with**, so changing a position's wage never rewrites past earnings.
- **Service charges / auto-gratuity are kept separate from tips** because they don't count as voluntary tips for tax reporting.
- **No ads, no accounts, no tip data sent off the device.** Don't add analytics events that include amounts.
- **Free vs. Pro** lives in `src/lib/pro.ts` (limits) and `src/purchases/pro-context.tsx` (`usePro()`). Logging, history, the calendar, monthly totals, export and import are always free. Never hide a user's own entries behind the paywall.
- **Purchases** go through RevenueCat (`src/purchases/revenuecat.ts`) when `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` is set; Pro is the `pro` entitlement. Without a key, development builds simulate purchases with the `pro_override` setting. Paywall text comes from `buildPlan` in `src/lib/plans.ts`, which swaps in the store's price strings, so never hard-code a price elsewhere. A running trial's last day is kept in the `trial_ends_at` setting and gets a reminder 2 days before.
- **Analytics:** call `track` from `src/lib/analytics.ts` with one of its typed events. Nothing is sent until a service is connected there; event properties never include money.
- **Appearance:** components get light/dark from `useTheme()` / `useColorScheme()` in `src/hooks`, which respect the Settings choice (`appearance` setting). Never import `useColorScheme` from `react-native` directly.
- **Delete all data** (`deleteAllData` in `src/db/repo.ts`) keeps only the purchase and one-time-prompt settings listed in `KEPT_ON_ERASE`; add new settings of that kind there.
- **Reminders** are planned by the pure `planReminders` (one-off dates, skipping days that already have a shift) and scheduled by `src/lib/notify.ts`. `ReminderSync` in the root layout re-plans whenever shifts or settings change, so screens never schedule notifications themselves.
- **Platform splits** use `.web.ts` files (`files`, `notify`). Keep both files' exports identical.
- **Legal text** in `src/constants/legal.ts` must match `docs/privacy-policy.md` and `docs/terms-of-use.md`.
- **Backups** copy every table column listed in `BACKUP_COLUMNS` (`src/lib/backup.ts`). When a migration adds a column, add it there too; a test compares the list against the schema and fails if they differ. Settings that describe the device (`pro_override`, `last_backup_at`) are never backed up or restored.
- **Covers** (guests served) are optional whole numbers on a shift, parsed with `parseCount`. They feed the "tips per guest" insight and the CSV export/import.
- **Clock times are `HH:MM` 24-hour strings** (`parseClockTime` / `formatClock` in `src/lib/duration.ts`). When a shift has both start and end times they decide its minutes worked; `period` ('am' | 'pm' | null) tags lunch vs dinner.
- **Paychecks** are compared with what was logged by `comparePaycheck` (`src/lib/paychecks.ts`): wages + card tips + service charges for that job and period, against gross pay. Cash tips are never on a paycheck.
- **Design tokens** live in `src/constants/theme.ts` (`Colors`, `Spacing`, `Radius`, `Shadows`, `Motion`, `NumberFont`). Use them instead of literals; money uses `ThemedText` types `display` and `amount`.
- **Motion and haptics:** no animation on screens seen many times a day (charts are static). Buttons scale to 0.97 on press. One haptic per action through `src/lib/haptics.ts` (selection on chips, success on save, destructive on delete). Confirmations go through `showToast` (`src/components/toast.tsx`), which respects Reduce Motion and announces itself to screen readers.
- Run `npm test`, `npm run typecheck` and `npm run lint` before declaring a task done.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
