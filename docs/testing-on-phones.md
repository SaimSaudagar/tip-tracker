# Testing on your iPhone and Android phone

The app runs in **Expo Go**, a free app that loads your code from your PC over Wi-Fi. No App Store or Play Store account is needed for this.

## 1. One-time setup

1. Install **Expo Go** from the App Store on your iPhone and from Google Play on your Android phone.
2. Connect both phones to the **same Wi-Fi network as your PC**. Guest networks and some office networks block this; a home network works.
3. Your phone needs to be able to reach the PC. If Windows asks whether Node.js may use the network, allow **Private networks**.

## 2. Start the app on your PC

In a terminal in the project folder (`E:\tip-tracker`), run:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '192.168.2.102'; npx expo start
```

The first part forces your real Wi-Fi address. Your PC also has a virtual network adapter (192.168.56.x) that phones can't reach. If your PC's Wi-Fi address changes, find it with `ipconfig` (“IPv4 Address” under your Wi-Fi adapter) and replace `192.168.2.102`.

A QR code appears. Leave this terminal open while testing.

## 3. Open it on each phone

- **iPhone:** open the **Camera** app, point it at the QR code, and tap the “Open in Expo Go” banner.
- **Android:** open **Expo Go** and tap **Scan QR code**.

The first load takes 30–60 seconds while the app is bundled.

**If you see “Open this on your phone instead”** (or a “navigator.storage not available” error), the address was opened in a web browser. Don’t type the `192.168…` address into Safari or Chrome. Scan the QR code so it opens in Expo Go. On the PC, the browser version only works at `http://localhost:8081`.

**If the phone can’t connect** (it keeps loading, or shows “Could not connect to development server”), stop the server with Ctrl+C and start it in tunnel mode instead. It works across networks but is slower:

```bash
npx expo start --tunnel
```

## 4. What to test (both phones)

Tick each one off, and note anything that looks wrong.

**First run**
- [ ] Onboarding: pick a role, enter a workplace and wage, set a tip-out, pick a week start.
- [ ] Last step: tap **Remind me at 11 PM**. The phone asks to allow notifications; tap **Allow**.
- [ ] The paywall appears. Tap ✕: the “1 month free” offer appears once. Tap “No thanks”.

**Layout**
- [ ] The tab bar (Home, Calendar, Reports, Settings) is at the **bottom** and doesn’t cover the **Log shift** button.
- [ ] Nothing is hidden behind the notch, the Dynamic Island or the Android status bar.
- [ ] Switch the phone to dark mode: every screen stays readable.

**Logging**
- [ ] Log a shift: the number keyboard opens; the keyboard doesn’t cover the field you’re typing in.
- [ ] Open “Tip-outs, service charges & more”, add two people under “Tipped out to”, and save.
- [ ] Home, Calendar and Reports all show the shift.
- [ ] Edit the shift, then delete one with the native “Delete this shift?” dialog.
- [ ] Close the app completely (swipe it away), reopen it from Expo Go: your data is still there.

**Pro features (simulated)**
- [ ] Settings → turn on **Developer: simulate Pro**.
- [ ] Log shift: with a tip-out rule set, the tip-out fills itself in (“Auto: …”).
- [ ] Reports → **Share PDF for your employer**: the share sheet opens with a PDF. Open or preview it and check it looks right. Do the same with **Share year-end PDF**.

**Reminders**
- [ ] Settings → **Developer: test reminder in 1 minute**, then leave the app or lock the phone.
- [ ] About a minute later a notification arrives. Tapping it opens **Log shift**.
- [ ] Settings → the after-shift reminder switch is on, and the time and day chips change it.

**Files**
- [ ] Settings → **Back up now**: the share sheet opens. Save the file to Files (iPhone) or Drive (Android).
- [ ] **Restore from a backup**: pick that file. You’re asked to confirm, then it says “Restored N shifts”.
- [ ] **Export all shifts (CSV)**, save it, then **Import from another app (CSV)** with the same file: it reports the shifts as already in the app and skips them.

## 5. Reporting problems

For each problem, note the phone (iPhone or Android), what you tapped, what you expected and what happened. A screenshot helps.

- If a **red error screen** appears, screenshot it; the first lines say what broke.
- **Shake the phone** to open the developer menu. **Reload** restarts the app without losing data.
- Errors also print in the terminal on your PC.

## Good to know

- Test data lives inside Expo Go. Deleting Expo Go deletes it.
- The store rating prompt usually doesn’t appear in Expo Go; that’s expected.
- Real purchases aren’t connected yet. “Simulate Pro” stands in until RevenueCat is set up.
- Expo Go is only for testing. Real TestFlight and Play builds come after the store accounts exist.
