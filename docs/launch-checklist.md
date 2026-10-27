# Launch checklist

What's left before the App Store and Google Play. Every step here needs your accounts or your decision; the code is ready for each one.

## 1. Decide

- [x] **App name: Tipbook.** Store title "Tipbook: Tip Tracker & Log". Before submitting, search the name on tmsearch.uspto.gov and in both stores once more.
- [ ] **Bundle ID.** `app.json` uses `com.saimsaudagar.tipbook` for both `ios.bundleIdentifier` and `android.package`. It can't change after the first upload, so change it now if you want something else.
- [ ] **Support email.** Set `SUPPORT_EMAIL` in `src/constants/app.ts`; Settings shows a "Contact support" row once it's filled in.
- [ ] **Legal placeholders.** Replace `[contact email]`, `[developer name]` and `[jurisdiction]` in `src/constants/legal.ts` **and** in `docs/privacy-policy.md` / `docs/terms-of-use.md`. A test fails if the in-app and hosted copies drift apart.
- [ ] **Host the website.** Run `npm run site`, which rebuilds the `site/` folder: the Tipbook landing page plus the privacy and terms pages (it warns about any placeholders left). The quickest free host is Netlify Drop: open app.netlify.com/drop and drag the `site` folder onto it. You get links like `https://<name>.netlify.app/` for the store's marketing URL, and `/privacy.html` and `/terms.html` for App Store Connect and the Play Console. Once the app is live, put its store links in `STORE_LINKS` at the top of `scripts/build-site.js` and run it again. GitHub Pages also works, but only from a public repository on a free GitHub plan.

## 2. Accounts

- [ ] Apple Developer Program ($99/year) and Google Play Console ($25 once). Then add your Apple Team ID to `app.json` (`ios.appleTeamId`); iOS builds with the widget need it.
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

## 5. Test builds (widget, scanning, Siri, real purchases)

Expo Go can't run the widget, slip scanning, Siri or launcher shortcuts, and RevenueCat only makes mock purchases there. To try them, install a test build of Tipbook itself.

**Android (free, no store account needed):**

```powershell
cd E:\tip-tracker
git pull
npm install
npx eas-cli@latest build --profile preview --platform android
```

The build runs in the cloud (about 15 minutes). Open the link it prints on your Android phone and install the APK. Then try: long-press the Tipbook icon (Log shift, Scan slip), add the "Tipbook: this week" widget, and Scan slip on Home.

**iPhone (needs the Apple Developer Program):**

1. Put your Apple Team ID (developer.apple.com → Membership) in `app.json` as `"ios": { "appleTeamId": "..." }`. The widget needs it to be signed.
2. Register your iPhone: `npx eas-cli@latest device:create`
3. Build: `npx eas-cli@latest build --profile preview --platform ios`
4. Then try: "Hey Siri, log my tips in Tipbook", the Tipbook widget (home screen and lock screen), and Scan slip.

Preview builds behave like the store version, so the Developer switches in Settings are hidden. For live reloading while you code, use a development build instead: `npx expo install expo-dev-client`, then `--profile development`. After installing `expo-dev-client`, `npx expo start` opens development builds by default; press `s` to switch back to Expo Go. Buy with a sandbox (Apple) or license-tester (Google) account to test purchases.

## 6. Before you submit

- [ ] On both phones: **Back up now** → delete the app → reinstall → **Restore from a backup**. This is the data-loss test from the plan.
- [ ] Run `npx expo-doctor` on your PC. The cloud session couldn't reach Expo's servers for two of its checks.
- [ ] Optional: crash reporting with Sentry (`npx expo install @sentry/react-native`, needs a development build) and analytics by connecting PostHog or Aptabase in `src/lib/analytics.ts`. Either one means updating the privacy policy and the store privacy labels.
- [ ] Fill in the App Store privacy labels and the Play Console Data safety form to match the privacy policy. RevenueCat's documentation lists what its SDK collects.
- [ ] Screenshots and listing text: `docs/store-listing.md`. The app supports iPad, so App Store Connect asks for iPad screenshots too (`docs/store-screenshots/ipad-13/`). If you'd rather skip iPad review for the first release, set `ios.supportsTablet` to `false` in `app.json`; iPads then run the iPhone layout.
- [ ] Build and submit:

```powershell
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

In the iOS "Notes for reviewer", explain what makes the app different: no ads, no account, IRS-style monthly and year-end reports, import from other tip apps.

## Not built yet, and why

- **Double time.** The "over 8 hrs a day" overtime rule doesn't count California's double time after 12 hours.
- **Slip scanning has only been tested on made-up slips.** Real photos from different POS systems (Toast, Square, Clover, Aloha…) are needed to tune it.
