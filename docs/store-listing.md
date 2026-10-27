# Store listing drafts

Character counts were checked against each store’s limits. The app is called **Tipbook**.

## Name

**Tipbook**, with the store title "Tipbook: Tip Tracker & Log" (the keyword after the brand helps search). A quick App Store search found no tip tracker using the name; it is not a trademark clearance, so check tmsearch.uspto.gov before submitting. Names ruled out: TipJar (taken by a tip tracker), Tipwise (used by a tip calculator).

---

## Apple App Store

| Field | Limit | Draft |
|---|---|---|
| Name | 30 | `Tipbook: Tip Tracker & Log` |
| Subtitle | 30 | `No Ads. Cash & Card Tips` (24) |
| Keywords | 100 | `server,bartender,waiter,waitress,gratuity,income,shift,hourly,wage,tipout,report,irs,tax,restaurant` (99) |
| Primary category | | Finance |
| Secondary category | | Productivity |
| Age rating | | 4+ |
| Price | | Free, with in-app purchases |

Don’t repeat words from the name or subtitle in the keyword field; Apple already indexes them.

**Promotional text** (170 max, editable without review):

> Log tips in 5 seconds. No ads, no account. Real hourly, tip-outs and reports for your employer and tax time.

**Description:**

> Know what you really make.
>
> Tipbook is the tip tracker for servers, bartenders and everyone who earns tips. Log a shift in about five seconds and see your real hourly: wages plus tips, divided by the hours you actually worked.
>
> NO ADS. EVER.
> No pop-ups while you’re entering tips. No account to lose. Your tips stay on your phone and are included in your phone’s regular backups.
>
> LOG A SHIFT IN SECONDS
> • Cash tips, card tips and hours
> • Tip-outs to bussers, bar and hosts, plus tips shared with you
> • Service charges and auto-gratuity kept apart from tips
> • Sales and notes when you want them
>
> SEE YOUR MONEY
> • This week, this month and your real hourly at a glance
> • A calendar with what you made each day
> • Every job and position, each with its own wage
>
> SCAN YOUR CHECKOUT SLIP
> Snap the slip at the end of your shift and Tipbook reads the totals for you, right on your phone.
>
> ALWAYS ONE TAP AWAY
> • A home-screen and lock-screen widget with this week's tips
> • "Hey Siri, log my tips in Tipbook"
> • Overtime pay worked out for you, at your paystub's rate
>
> SWITCH IN A MINUTE
> Import your history from another tip app or a spreadsheet (CSV). Export everything anytime.
>
> Tipbook PRO
> • Monthly tip report for your employer, with a reminder before the 10th
> • Year-end tip summary for tax time, with service charges separated and an estimate of the 2025–2028 tip deduction
> • Automatic tip-outs (% of tips, % of sales or a fixed amount)
> • Unlimited jobs and positions
> • Your whole year at a glance
>
> Pro is available as a yearly subscription with a 14-day free trial, a monthly subscription, or a one-time lifetime purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the period. Manage them in your Apple ID settings.
>
> Records only, not tax advice.
>
> Terms of Use: [hosted terms URL]
> Privacy Policy: [hosted privacy URL]

**Screenshots:** drafts are in `docs/store-screenshots/`: `iphone-6.9/` (1290 × 2796, the size the App Store requires for iPhone), `ipad-13/` (2064 × 2752, required because the app runs on iPad) and `android-phone/` (1080 × 1920). They show the real app screens filled with the developer sample data, framed with these headlines:

1. **No ads. Ever.** Log a shift in about 5 seconds. *(quick log)*
2. **Your real hourly,** not just your tips. *(Home)*
3. **Every day at a glance.** See what each shift paid. *(Calendar)*
4. **Your employer tip report,** ready before the 10th. *(Reports)*
5. **Switch apps in a minute.** Bring your history with you. *(import)*
6. **Find your best shifts.** Best days, lunch vs dinner, trends. *(Insights)*

They were rendered from the web build, so fonts differ slightly from iOS, and on iPad Log shift opens as a sheet rather than full screen. Before submitting, you can swap in captures from your own devices (Settings → Developer: add 12 weeks of sample shifts, then take screenshots) for a pixel-exact match. On iPads 900 points wide or more (landscape, or the 13" in portrait), Home and Calendar use two columns.

**App Privacy (nutrition label):** tip data never leaves the device. Once RevenueCat is added, check its App Privacy guide (revenuecat.com/docs) for what the SDK collects. It is typically *Purchase History* and an app-scoped *User ID*, used for App Functionality and not linked to identity or used for tracking. Update this before submitting.

**Notes for the reviewer (guideline 4.3 context):**

> Tipbook is a tip and earnings log for service workers. What sets it apart from other tip trackers:
> (1) no ads in any tier, and no account; all data is stored on the device;
> (2) a monthly employer tip report with what IRS Publication 531 asks employees to report, with a reminder before the 10th of the month;
> (3) a year-end summary that keeps service charges apart from voluntary tips;
> (4) per-position wages and automatic tip-out rules;
> (5) CSV import from other tip apps, with column matching and duplicate detection.
> Pro features can be tested with a sandbox account via the paywall (Settings → See Pro).

---

## Google Play

| Field | Limit | Draft |
|---|---|---|
| App name | 30 | `Tipbook: Tip Tracker & Log` |
| Short description | 80 | `Log tips in 5 seconds. Real hourly, tip-outs, employer reports. No ads, ever.` (77) |
| Category | | Finance |
| Content rating | | Everyone (complete the IARC questionnaire) |

**Full description:** reuse the App Store description, but replace “Apple ID settings” with “Google Play subscriptions”.

**Data safety form:**
- No user data is collected or shared by the app itself; tips and shifts stay on the device.
- Once RevenueCat is added, declare what its SDK collects (typically purchase history and an app-scoped identifier, for app functionality). Check RevenueCat’s Google Play data safety guide.
- Data is encrypted in transit (RevenueCat uses HTTPS).
- Users can delete their data by uninstalling the app or clearing its storage.

**Before you can publish (personal account):** a closed test with 12 testers opted in for 14 days in a row, then a production access application.
