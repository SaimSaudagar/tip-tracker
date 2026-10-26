# Launch checklist

What's left before the App Store and Google Play. Every step here needs your accounts or your decision; the code is ready for each one.

## 1. Decide

- [ ] **App name.** "Tip Tracker" is a placeholder (the plan suggests *[Brand]: Tip Tracker & Log*). Change `name` in `app.json` and search the code for "Tip Tracker".
- [ ] **Bundle ID.** `app.json` uses `com.saimsaudagar.tiptracker` for both `ios.bundleIdentifier` and `android.package`. Change it now if you want something else: it can't change after the first upload.
- [ ] **Support email.** Set `SUPPORT_EMAIL` in `src/constants/app.ts`; Settings shows a "Contact support" row once it's filled in.
- [ ] **Legal placeholders.** Replace `[contact email]`, `[developer name]` and `[jurisdiction]` in `src/constants/legal.ts` **and** in `docs/privacy-policy.md` / `docs/terms-of-use.md` (they must match). Host the two docs somewhere public for the store listings.

## 2. Accounts

- [ ] Apple Developer Program ($99/year) and Google Play Console ($25 once).
- [ ] RevenueCat (free up to $2.5K a month in tracked revenue).
- [ ] Recruit 12 servers and bartenders for Google's closed test. It must run 14 days before you can apply for production access, so start early.

## 3. Store products

Create these in App Store Connect and the Play Console:

| Plan | Product | Price |
|---|---|---|
| Yearly | Auto-renewing subscription with a **14-day free trial** | $24.99/year |
| Monthly | Auto-renewing subscription, no trial | $3.99/month |
| Lifetime | One-time purchase (non-consumable) | $49.99 |
| Exit offer | Yearly with a **1-month free trial** (iOS: a second product in the same subscription group; Android: a second offer on the yearly subscription) | $24.99/year |

## 4. RevenueCat dashboard

The code in `src/purchases/revenuecat.ts` expects:

- [ ] An entitlement named **`pro`**, with all four products attached.
- [ ] A current offering with **Annual**, **Monthly** and **Lifetime** packages.
- [ ] A second offering named **`exit_offer`** whose **Annual** package is the 1-month-trial yearly product.
- [ ] The public SDK keys copied into `.env.local` (see `.env.example`) for local runs, and into the EAS project's environment variables for builds:
  `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.

The paywall then shows the store's own prices (in the buyer's currency), and a trial's end date comes from the store, so the "2 days before your trial ends" reminder fires on the right day.

## 5. Development build (real purchases)

Expo Go can't make real purchases; RevenueCat runs there with mock purchases. To test the real thing:

```powershell
npx expo install expo-dev-client
npx eas-cli@latest build --profile development --platform android
```

After installing `expo-dev-client`, `npx expo start` opens development builds by default; press `s` in the terminal to switch back to Expo Go. For iPhone, register it first with `npx eas-cli@latest device:create`, then build with `--platform ios`. Buy with a sandbox (Apple) or license-tester (Google) account.

## 6. Before you submit

- [ ] On both phones: **Back up now** → delete the app → reinstall → **Restore from a backup**. This is the data-loss test from the plan.
- [ ] Run `npx expo-doctor` on your PC. The cloud session couldn't reach Expo's servers for two of its checks.
- [ ] Optional: crash reporting with Sentry (`npx expo install @sentry/react-native`, needs a development build) and analytics by connecting PostHog or Aptabase in `src/lib/analytics.ts`. Either one means updating the privacy policy and the store privacy labels.
- [ ] Fill in the App Store privacy labels and the Play Console Data safety form to match the privacy policy. RevenueCat's documentation lists what its SDK collects.
- [ ] Screenshots and listing text: `docs/store-listing.md`.
- [ ] Build and submit:

```powershell
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

In the iOS "Notes for reviewer", explain what makes the app different: no ads, no account, IRS-style monthly and year-end reports, import from other tip apps.

## Not built yet, and why

- **Home-screen widget, Siri / Shortcuts, scanning a checkout slip.** These need native code, so they can't run in Expo Go. They're v1.1/v1.2 items for after launch, once you're on development builds.
- **Overtime.** For tipped workers, overtime is figured on the full minimum wage minus the tip credit, and states add their own rules (California has daily overtime). Getting it wrong would make the paycheck check misleading, so it needs a decision on which rules to support first.
