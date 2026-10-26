# Tip tracker: MVP and paywall plan

*Plan date: October 26, 2026. It is based on the 6 leading US tip trackers' in-app purchase prices, 816 of their recent App Store reviews, their store descriptions, and IRS tip-reporting rules.*

## 1. Positioning

**Promise:** *Track every tip in 5 seconds. No ads, ever. No account to lose. Your tips stay on your phone, and the app builds your monthly and yearly tip reports for you.*

Why this promise, from the competitor research:

| Pain in competitor reviews (816 scanned) | Mentions | Our answer |
|---|---|---|
| Ads, including casino/explicit pop-ups during entry, even after paying | 118 | No ads in any tier, as a permanent promise |
| Hours and real hourly pay | 100 | Real hourly (wage + tips ÷ hours) on the home screen |
| Export, taxes, spreadsheets | 63 | Monthly employer report, year-end tip summary, CSV export |
| Lost data after a login, logout, phone change or update | 51 | No account. Local database, OS backups, one-tap backup file |
| Paycheck and wage tracking | 43 | Wage per position in v1.0; paycheck log in v1.1 |
| Paying several times for features (TipTracker: $5.99 per extra job, $8.99 to remove ads, $2.99 to export) | many | One simple Pro plan |

**Competitive reality:** 3 established apps (ServerLife, TipTracker, Just The Tips) plus at least 8 recent small entrants (TipKeepr, TipKeep, TipMax, TipOut, TipJoy, Server44, Checkout, Tip Tally). That raises the bar for being clearly different, both for users and for Apple's 4.3 spam review. The differences that carry the pitch are no ads, no account, the tax-ready reports, and import from other apps.

## 2. MVP scope (v1.0)

### Must have

1. **Onboarding (5 screens, then paywall)**
   - Your role: server, bartender, barista, valet, dealer, stylist or other.
   - Hourly wage.
   - Tip-out habit: none, fixed $, % of tips, or % of sales.
   - Week start day.
   - After-shift reminder time. Ask for notification permission here, with the reason shown.
2. **Quick log (the core screen, under 5 seconds)**
   - Fields: date (defaults to today), position, hours (start/end with break, or a total), cash tips, card tips, tips received from coworkers, tip-out, service charges / auto-gratuity (kept separate), sales (optional), covers (optional) and notes.
   - The number pad opens first. Fields prefill from your last shift. Tip-out calculates from your rule and you can edit it. A day can hold more than one entry.
3. **Home dashboard:** this week, this month and this year on one screen (a request in the reviews). Shows real hourly, recent shifts and a big "Log shift" button.
4. **Calendar:** daily totals on each day, with the month total visible on the calendar itself (another request). Tap a day to edit.
5. **Jobs and positions:** each position has its own wage and tip-out rule. This covers one person working front-of-house and back-of-house, or two jobs.
6. **Reports**
   - Weekly, monthly and yearly summaries.
   - **Monthly tip report for your employer**, built from the IRS daily-record fields: date, cash and card tips, tips shared in, tips paid out and who you paid them to. Shared as a PDF, with a reminder 2 days before the 10th.
   - **Year-end tip summary** that keeps voluntary tips apart from service charges, since service charges don't count for the "no tax on tips" deduction.
   - CSV export of everything.
7. **Data safety**
   - Local SQLite database and no login.
   - The database must live in a folder that iCloud device backup and Android Auto Backup include. Test this: back up, delete the app, restore.
   - "Back up now" writes a file to Files or Google Drive, and "Restore" reads one back.
8. **Import from other tip apps:** a CSV importer where the user matches columns to fields. This lowers the cost of switching, and "Switch from ServerLife in 60 seconds" is your best marketing hook.
9. **Settings:** dark mode (requested), week start, reminders, restore purchases, export or delete all data, support email, privacy policy and terms.
10. **Rating prompt** at a happy moment, for example after the 5th logged shift when the weekly total is higher than last week's. Never right after an error. iOS shows it at most 3 times a year.

### v1.1 (weeks 5–8, after launch data)

- Home-screen widget showing this week, with a quick-log button.
- Paycheck log and paycheck estimate (43 review mentions).
- Weekly income goal.
- Overtime rules.
- Insights: best weekday and shift, and $/hour trend.
- Tip-pool split calculator for bartenders and teams.
- Siri / Shortcuts ("Log my tips").
- iPad layout.

### v1.2 experiment

**Scan your checkout slip:** on-device text recognition reads the end-of-shift report and fills in the fields. It makes a strong TikTok demo.

### Not now

Cloud accounts and sync servers, a web/PC app, bank connections, gig-driver mileage, and chat AI. Each adds cost, review risk or the login problems your users are running from.

## 3. Data model

Store money as integer cents and dates as local date strings.

```text
jobs(id, name, color, archived_at, created_at)
positions(id, job_id, name, hourly_wage_cents,
          tipout_rule  -- none | fixed | pct_tips | pct_sales
          tipout_value, created_at)
shifts(id, position_id, date, start_at, end_at, break_minutes, hours_override,
       cash_tips_cents, card_tips_cents, tip_in_cents, tip_out_cents,
       service_charge_cents, sales_cents, covers, notes, created_at, updated_at)
tipouts(id, shift_id, recipient_name, amount_cents)   -- names for the IRS daily record
settings(key, value)
```

Derived values:
- `net_tips = cash + card + tip_in − tip_out`
- `wages = hours × wage`
- `real_hourly = (wages + net_tips) ÷ hours`
- `deduction_eligible_estimate = net_tips` (service charges are already excluded). Label it as an estimate.

## 4. Tech stack

| Need | Choice |
|---|---|
| App | Expo (latest SDK) + TypeScript + Expo Router. Use development builds, not Expo Go, because purchases need native code |
| Database | `expo-sqlite` + Drizzle ORM (migrations, live queries) |
| Charts | `victory-native` (Skia) or `react-native-gifted-charts` |
| PDF reports | `expo-print` (HTML to PDF) + `expo-sharing` |
| CSV import/export | `papaparse` + `expo-document-picker` + `expo-file-system` |
| Reminders | `expo-notifications`, local notifications only |
| Purchases and paywall | RevenueCat (`react-native-purchases` + `react-native-purchases-ui`). Free up to $2.5K/month tracked revenue. Remote paywalls let you change copy and price without an app update |
| Analytics and crashes | PostHog or Aptabase free tier, plus Sentry free tier. Never send tip amounts |
| Builds | EAS Build (free tier: 15 builds per platform per month) + EAS Submit |

Two notes:
- **Privacy label trade-off.** The "Data Not Collected" label would be a nice selling point, but analytics and crash reporting count as collection. Recommendation: keep anonymous usage analytics, declare them honestly, and keep the promise that *tip data never leaves your phone*.
- **Working with AI tools.** Ask for one feature at a time. Read every file it writes, keep the schema and money math in files you fully understand, and write unit tests for the money calculations first.

## 5. Paywall plan

### What competitors charge (US App Store, Oct 2026)

| App | Pricing |
|---|---|
| ServerLife (#59 Finance grossing) | $2.99–4.99/mo · $19.99–24.99/yr · $11.99–16.99/6 mo · one-time $5.99–6.99 · remove ads $0.99/mo or $3.99/yr |
| TipTracker | Pay per feature: add a job $5.99, account $10.99, remove ads $8.99, export $2.99, category $3.99 |
| Just The Tips | $1.99 or $19.99 |
| Waiter Pal (solo developer) | $5.99/wk · $7.99–9.99/mo · $19.99–26.99/yr |
| TipSee | $4.99/mo · $24.99/yr |
| TipKeepr (new, 4.98★) | $5.39/mo · $53.90/yr · $125.99 lifetime |

The market band is **about $20–27 a year**. Reviews praise one-time upgrades ("worth the one time $7.00 upgrade") and punish surprises ("$46.27 blow").

### Free vs. Pro

**Rules:**
- No ads in any tier.
- Never hold someone's data hostage. Free users can always see all their entries, back them up and export a CSV.
- Free has to beat the ad-funded free apps, or nobody stays long enough to upgrade.

| Free, forever | Pro |
|---|---|
| Unlimited shift logging | Unlimited jobs and positions (free: 1 job, 2 positions) |
| Dashboard: week and month | Year view, all-time history and trends |
| Calendar with daily and monthly totals | Automatic tip-out rules (% of tips or sales) |
| Current and previous month summaries | Monthly employer tip report (PDF) + reminder before the 10th |
| CSV export, backup and restore, import | Year-end tip summary for tax time (tips vs. service charges) |
| Reminders, dark mode | Insights: real hourly by weekday and shift, best shifts (v1.1) |

### Prices to launch with

- **Annual: $24.99/year with a 14-day free trial.** This is the anchor and the default selection, shown as "$2.08/month".
  - Why 14 days: RevenueCat's 2026 data shows longer trials convert better, and 3-day trials do worst. Two weeks covers 8–10 shifts, enough to see two weekly totals.
- **Monthly: $3.99**, no trial. Its main job is to make the annual plan look like a deal ("save 48%").
- **Lifetime: $49.99.** For people who refuse subscriptions, and this audience includes many.
- **No weekly plan.** Weekly plans are the main complaint against competitors' paywalls in similar niches, and they look predatory to this audience.

### Where the paywall appears

1. **End of onboarding:** a full-screen offer of the 14-day trial, with a visible "Continue with free plan" link.
2. **Feature paywalls:** opening the year view, adding a 2nd job, opening the monthly or year-end report, or setting an automatic tip-out rule. Each one leads with that feature's benefit.
3. **One exit offer**, the first time the onboarding paywall is closed: "Try Pro free for 1 month instead". Show it once only.
4. **Tax-season push (Jan–Apr):** "Your 2026 tip summary is ready," shown on the home screen as a card, not a pop-up.

### Draft paywall copy

> **Track every tip. No ads. Ever.**
>
> ✓ Year-end tip summary for tax time
> ✓ Monthly tip report for your employer, with a reminder before the 10th
> ✓ Unlimited jobs and automatic tip-outs
> ✓ Your real hourly and best shifts
>
> ◉ **Yearly: 14 days free, then $24.99/year** ($2.08/mo)
> ○ Monthly: $3.99/month
> ○ Lifetime: $49.99 once
>
> **[ Start my free 14 days ]**
> No payment now. We'll remind you 2 days before your trial ends. Cancel anytime in Settings.
>
> Continue with free plan · Restore purchases · Terms · Privacy

The trial-end reminder is a local notification scheduled from RevenueCat's expiration date. It builds trust and heads off "they charged me" 1-star reviews.

### Rules that protect the account

Apple guideline 3.1.2 and the account terminations described in the research report:
- Show the price, billing period, trial length and renewal terms next to the button.
- Keep the close / free option visible. No fake countdowns or fake discounts.
- Make Restore Purchases easy to find, and link the Terms (EULA) and Privacy Policy in the app and the store listing.
- Call the tax features "records and reports", never tax advice. Add a short "Not tax advice. See IRS.gov" line on report screens.

### Tests, in this order

Run one at a time. Small apps rarely have the traffic for clean A/B tests, so compare 2–3 week periods instead.

1. A 14-day trial against a 7-day trial on the annual plan.
2. Annual at $24.99 against $29.99.
3. With and without the exit offer.
4. Lifetime at $39.99 against $59.99.

## 6. What to measure, and the day-60 decision

| Metric | Target | Source of target |
|---|---|---|
| New users who log a shift on day 0 | ≥ 40% | my target |
| New users with 3+ shifts in the first 7 days | ≥ 25% | my target |
| Installs that start a trial | ≥ 8% | my target |
| Trial to paid | 25–40% | research report (Phase 7) |
| Download to paid within 35 days | ≥ 2% | RevenueCat median |
| Revenue per install by day 60 | ≥ $0.34 | RevenueCat median |

Track these events:
- `onboarding_step_viewed`, `onboarding_completed`
- `paywall_viewed {placement}`, `paywall_dismissed`, `trial_started`, `purchase_completed {product}`
- `shift_logged {nth}`, `report_exported {type}`, `import_completed {rows}`, `reminder_opened`

**Day 60–90 gate (from the research report):**
- **Kill** if you're below the medians with no improving trend after trying 3+ content formats.
- **Iterate** if only one metric lags.
- **Scale** if you're above the medians and one content format keeps working.

## 7. Build timeline (part-time, about 15–20 hours/week)

| Week | Build | In parallel |
|---|---|---|
| **0** (now) | Set up the Expo project and RevenueCat; create the 3 products in App Store Connect and Play Console | Enroll with Apple ($99/yr) and Google Play ($25). Recruit **12 real servers and bartenders** as testers: they satisfy Google's 12-tester, 14-day rule and become your first feedback and reviews |
| **1** | Database schema + money math (with unit tests), quick log, dashboard | Write the competitor-switch pitch and screenshot headlines |
| **2** | Calendar, jobs and positions, tip-out rules, CSV export and import | Send a rough Android build to the closed test (starts the 14-day clock) |
| **3** | Onboarding, paywall + RevenueCat, PDF reports, reminders, settings, dark mode | Start warming a TikTok/Instagram account in the server niche (7–14 days before posting) |
| **4** | Polish, analytics and crash reporting, backup/restore test, App Store listing, privacy policy and terms | Submit iOS. Explain the differences in Notes to Reviewer (no ads, no account, IRS-style reports, import). Request Google production access |
| **5** | Launch | Daily content: "What I made this week" summaries, "switch from ServerLife" videos, tax-season angle |

**Store listing starting point:**
- Title: *[Brand]: Tip Tracker & Log*
- Subtitle: *No Ads. Cash & Card Tips*
- First screenshot: the 5-second log with "No ads. Ever."
- Second screenshot: the monthly employer report.
- Third screenshot: real hourly by week.

## 8. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| Apple 4.3 spam rejection (crowded niche) | Your own design and features (reports, import, positions), and a clear Notes to Reviewer. No template code |
| Users angry about the trial | Visible free plan, generous free tier, trial-end reminder, no weekly plan |
| Data loss (the incumbents' biggest failure) | Test backup and restore on both platforms before launch; add a "last backup" date to Settings |
| Tax-claim liability | "Records, not advice" wording; link to IRS Topic 761; don't calculate a tax amount |
| Tip-tracker market too small | Check Appfigures revenue and Apple Ads search popularity first (shortlist steps 1–2). Expansion later: barbers, stylists, valets, casino dealers (ServerLife already targets them) |

## Sources

- Competitor prices, descriptions and reviews: US App Store listings and the public customer-review feeds for ServerLife, TipTracker, Just The Tips, Waiter Pal, TipKeepr and TipSee (pulled Oct 26, 2026).
- Tip reporting rules: [IRS Topic 761, Tips](https://www.irs.gov/taxtopics/tc761); [IRS: Here's how taxpayers should report tip income](https://www.irs.gov/newsroom/heres-how-taxpayers-should-report-tip-income); [IRS Publication 1244 (2005)](https://www.irs.gov/pub/irs-prior/p1244--2005.pdf); [Form 4137 (2025)](https://www.irs.gov/pub/irs-pdf/f4137.pdf).
- "No tax on tips" deduction: [NerdWallet](https://www.nerdwallet.com/taxes/learn/are-tips-taxable); [GetYourRefund](https://www.getyourrefund.org/en/faq/2026_new/no_tax_on_tips).
- Trial length, conversion medians, revenue per install and the decision gates: *Indie mobile app money playbook* (RevenueCat State of Subscription Apps 2026 data).
