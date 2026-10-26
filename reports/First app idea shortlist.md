# First app idea shortlist

*US App Store, data pulled October 25, 2026. This is Phase 1 ("Shortlist") of the app track in* Indie mobile app money playbook.

## How the ideas were checked

- **Proof of money.** I went through the US top-100 grossing charts in seven categories: Health & Fitness, Finance, Education, Lifestyle, Reference, Books and Productivity. That is 700 apps. I looked for niches where small or brand-new apps still make the chart.
- **Whether a newcomer can be found.** For 42 candidate keywords I looked at the top 10 App Store search results. For each keyword I recorded the median rating count of those 10 apps, how many have under 1,000 ratings, how many haven't been updated in 12 months, and how many launched in 2025 or later.
- **What users hate.** I read the ~150–200 most recent reviews of the leading apps in the strongest niches.
- **Not checked yet.** Two numbers need accounts you'd have to create yourself: dollar revenue estimates (free Appfigures account) and search popularity (Apple Ads keyword planner, or Astro at about $9/month). Chart rank shows an app makes real money. It doesn't show how much.

**Filters from your answers:** you can code but want to lean on AI tools, so I favored simple, screen-based apps built with Expo/React Native. Your interests are fitness, money, faith and study, and your market is the US.

---

## Pick 1 (recommended): A tip tracker for servers and bartenders

| Check | What the data shows |
|---|---|
| Proof of money | **ServerLife – Tip Tracker is #59 in US Finance top-grossing** (9,911 ratings, launched 2016) |
| Search competition for "tip tracker" | Median of the top 10 is **537 ratings**; 5 of 10 have under 1,000. Only three real incumbents: ServerLife (9.9k), TipTracker (9.5k) and Just The Tips (3.1k), all launched 2013–2016 |
| What users hate | **24–40% of recent reviews for those three are 1–2 stars.** The complaints: pop-up and casino-game ads during tip entry (even after paying), years of tip history lost after a login or phone change, crashes, and being charged twice |
| What users already pay | One-time $3.99–$10.99 to remove ads, and some pay for premium subscriptions (per reviews) |
| Timely hook | The federal "no tax on tips" deduction runs 2025–2028, up to $25,000 a year. Workers are told to keep a daily tip record ([NerdWallet](https://www.nerdwallet.com/taxes/learn/are-tips-taxable), [GetYourRefund](https://www.getyourrefund.org/en/faq/2026_new/no_tax_on_tips)) |
| Build difficulty | Low. Logging, calendar, charts and export, with no AI or API bill. Fits Expo + RevenueCat well |
| Marketing fit | People already search "tip tracker", and servers and bartenders already post "what I made tonight" videos. The app's nightly summary screen can be the content |
| App Review risk | Low. Apple doesn't list tip trackers among its saturated categories |

**Draft one-line difference:** *The tip tracker with no ads, ever. Your tips stay on your phone, back up to iCloud, and turn into a ready-made "no tax on tips" record at tax time.*

**Product sketch:**
- 5-second shift entry: cash, card, tip-out and hours, giving your real hourly wage.
- Calendar with weekly and monthly totals, and multiple jobs.
- Data saved on the phone first, backed up to iCloud or Google, with CSV/PDF export.
- A year-end tip report modeled on the IRS daily tip record.
- A home-screen widget.

**Pricing to test:** keep basic logging free, because the incumbents are free and a hard paywall would likely backfire. Charge for Pro: exports, the tax report, multiple jobs and insights. Test about $19.99/year against about $29.99 lifetime. These prices are guesses to test, not findings.

**Caveats:**
- This is a smaller niche than consumer AI apps, and servers are price-sensitive.
- Don't give tax advice. Say the app "keeps your records" and link to IRS.gov.
- Confirm the revenue size (step 1 below) before you build.

---

## Pick 2: AI sermon notes with honest pricing

| Check | What the data shows |
|---|---|
| Proof of money | **Bible Note: Sermon Notes is #30 in US Reference top-grossing** (24,319 ratings, launched April 2025) |
| Search competition for "sermon notes" | Median of the top 10 is **14 ratings**. The next-best apps have 1,549 and 1,034 ratings, and the second of those hasn't been updated since 2021 |
| What users hate | 44 of 200 recent reviews are 1–2 stars. Complaints: **$6.99/week pricing** ("paywalling God"), "free" that turns out to be a 3-day trial, and wrong verse text |
| Build | Record the sermon, transcribe it on the device (no per-minute bill), then generate an AI summary, key verses and discussion questions. Pull verse text from a public-domain Bible (KJV or the World English Bible), never from AI |
| Marketing fit | A weekly Sunday habit. Sharing the recap with a small group spreads the app by word of mouth |

**Difference:** honest yearly pricing, verses taken from a real Bible text, and small-group sharing.

**Muslim variant:** Friday khutbah notes with translation. It has almost no competition (the "khutbah" top 10 has a median of 1 rating), but nothing shows that people want it yet. Try it after the Christian version.

**Caveats:** there is one strong leader, faith users react badly to weekly subscriptions, and you have to check the AI's output for accuracy.

---

## Pick 3: CNA exam prep built around the skills test

| Check | What the data shows |
|---|---|
| Proof of money | Weaker. No CNA app is in the top-100 Education grossing. Exam prep does earn in general: a solo developer's DMV practice-test app is #87 with only 420 ratings, and SkillCat (EPA 608 & HVAC) is #65 |
| Search competition for "cna practice test" | Median of the top 10 is **237 ratings**; the best has 2,254 |
| What users hate | Aggressive pricing ($49/month, a "fake free trial") |
| Demand warning | The top two apps got only 69 and 16 reviews in total across all the recent pages I fetched, so searches may be few. Check search popularity first |

**Difference:** most apps only drill multiple-choice questions. The CNA exam also includes a hands-on skills test, so step-by-step skill checklists are a difference users can see.

**Risks:**
- Apple's 4.3 spam rule. There are many near-identical "Practice Test 2026" apps.
- You are responsible for every answer being correct.

---

## Watch list: money is proven, but there's a catch

- **GLP-1 companion.** MeAgain (#35 Health & Fitness) and Shotsy (#74) prove the money. But 8 of the top 10 "glp-1 tracker" results launched in 2025 or later. It only works with a sharp angle, such as protein tracking and keeping muscle while on GLP-1.
- **Military benefits finder.** ServicePerks is **#27 in Finance after launching in August 2026, with only 705 ratings**. Military Benefits App, launched May 2026, is #64 in Lifestyle. Search competition is weak. But getting the benefits right and earning the community's trust need real military knowledge.

## Skip, and why

- **Bible and Quran app blockers.** These have been flooded with copycats: 9 of the top 10 "bible app blocker" results and 8 of the top 10 "quran app blocker" results launched since 2025, mostly with 0–16 ratings. They also need Apple's Screen Time entitlement and native Swift code.
- **Settlement / class-action finders.** Seven are in the grossing chart, but the leaders are strong (Settlemate has 76k ratings, PayMe 36k), and about 10 new apps have joined.
- **Camera heart-rate and "health monitor" apps.** They carry medical-accuracy and "scareware" risk with Apple.
- **Sober trackers, step counters, intermittent fasting, budget apps, DMV tests, citizenship tests.** The median rating count of the top 10 apps for these keywords is 8k–147k.

---

## Your next 7 days (to finish Phase 1 for Pick 1)

1. **Revenue check.** Make a free Appfigures account and look up ServerLife, TipTracker and Just The Tips. Continue if the top one earns at least about $5K/month, the floor one Reddit developer uses for small niches.
2. **Search popularity check.** Make a free Apple Ads account and look at popularity for "tip tracker", "tip log", "server tips", "bartender tips" and "no tax on tips". Avoid keywords near popularity 5; aim for 20 or more.
3. **Use the competitors.** Install the three apps, screenshot their onboarding and paywalls, and time one tip entry.
4. **Write your difference.** Write the final one-liner and the headlines for your first three screenshots.
5. **Start the store clocks.** Enroll with Apple ($99/year) and Google Play ($25). On a personal Google account, start the 12-tester, 14-day closed test with a rough build.
6. **Start Phase 2.** Warm up a TikTok or Instagram account in the server and bartender niche for 7–14 days before posting.

If Pick 1 fails step 1 or 2, run the same two checks on Pick 2.
