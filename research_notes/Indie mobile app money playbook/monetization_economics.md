# Monetization Models and Unit Economics for Simple Mobile Games and Simple Mobile Apps (2025–2026)

Research date: 2026-10-25. Labels used: **[GAMES]** = simple/casual/hyper-casual/hybrid-casual games; **[APPS]** = simple subscription/utility apps; **[BOTH]** = applies to both. Older data is labeled with its year. Many "benchmark" pages online are vendor blogs that repackage each other. Primary or near-primary sources (RevenueCat, Adapty, Adjust, AppsFlyer, Liftoff/Singular, GameAnalytics, Sensor Tower, Newzoo, Apple/Google) are preferred, and secondary ones are flagged.

---

## 1. Ad monetization for simple games: mediation, formats, eCPMs, ARPDAU, and what 10k DAU earns

### Takeaway
Rewarded video is the top ad format. US/Tier-1 rewarded eCPMs run roughly $10–30, but blended averages across all geos are only about $3–5 because of the long tail. Ad-only casual/hyper-casual games typically earn about $0.01–0.08 per DAU per day. A 10k-DAU ad-only game therefore realistically grosses about **$1k–$10k/month**, depending mostly on geo mix and ad load. A Tier-1-heavy hybrid game can reach about $15–20k+. AppLovin MAX dominates mediation.

### Cited Findings
**Mediation platforms [GAMES]**
- In a 2025 GameBiz sample, 128 of 175 top-downloaded games with ads (~73%) used AppLovin MAX. MAX was in 33 of 60 ad-monetized top-grossing titles (~55%), more than all other mediation platforms combined. In the top-downloaded list, AdMob's share was more than double Unity LevelPlay's. The authors call these estimates conservative because some games could not be attributed — [PocketGamer.biz, "Nine facts about the mediation space in 2025"](https://www.pocketgamer.biz/nine-facts-about-the-mediation-space-in-2025); [Gamigion](https://www.gamigion.com/mediations-in-2025-9-facts-out-there/)
- Segwise says MAX, LevelPlay and AdMob together held >90% of the mediation market in 2025, with MAX above half. It also repeats a claim of >80% share for AppLovin. The two figures don't reconcile and both trace to the same newsletter, so treat them with caution — [Segwise AppLovin publisher guide 2026](https://segwise.ai/blog/applovin-publisher-monetization-guide)
- Small-publisher anecdote (2022, Reddit): with 400–700 DAU including Tier-1 countries, a dev earned only about $2–3/day on Yodo1 MAS (a MAX wrapper that takes a 15% fee, $50 minimum withdrawal) and did better with Appodeal. That works out to about $0.003–0.0075 ARPDAU — [r/gamedev, "MAS Yodo1 vs Appodeal 2022"](https://reddit.com/r/gamedev/comments/ucz0yj/mas_yodo1_vs_appodeal_2022_complex_analysis/)

**eCPMs by format and country tier [GAMES/BOTH]**
- **Tenjin × CAS.AI, Q2 2024, game apps excluding kids apps (top countries):**
  - Rewarded: US $24.39 iOS / $30.25 Android; South Korea $20.94 iOS / $22.01 Android; Australia $19.91 iOS; Canada $23.13 Android.
  - Interstitial: US $23.17 iOS / $16.15 Android.
  - Banner: US $0.99 iOS / $1.18 Android; Canada $2.00 Android.
  - Source is a secondary compilation. Note the data is about 2 years old — [Playio eCPM benchmarks 2026](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- **Appodeal, Q4 2024 (Oct–Dec 2024), 100,000+ apps, values read from charts (approximate):**

  | Region | Rewarded iOS | Rewarded Android | Interstitial iOS | Interstitial Android |
  |---|---|---|---|---|
  | North America | ~$13.6 | ~$9.0 | ~$10.4 | ~$9.6 |
  | Europe | ~$8.9 | ~$5.1 | ~$5.3 | ~$3.6 |
  | APAC | ~$7.5 | ~$8.2 | ~$5.3 | ~$5.5 |
  | Middle East | ~$8.4 | ~$2.4 | ~$3.3 | ~$1.6 |
  | Latin America | ~$3.4 | ~$1.8 | ~$2.2 | ~$1.3 |

  - North America banners were ~$0.4 (iOS) and ~$0.5 (Android).
  - The overall monthly average rewarded eCPM, including the long tail, was only ~$4 on iOS and ~$3 on Android.
  - Sources: [Playio](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026); [Appodeal Q4 2024 report PDF](https://appodeal.com/wp-content/uploads/2025/03/Quarterly_Mobile_eCPM_Report_-_Q4_2024.pdf)
- Other secondary readings of Appodeal give conflicting US numbers: one says rewarded US $19.63 iOS / $16.49 Android; another says $13.75 iOS / $12.01 Android. Treat them as approximate — [Appodeal Q4 2024 view](https://appodeal.com/the-mobile-ecpm-report-updated-q4-2024-view); [MAF eCPM blog](https://maf.ad/en/blog/mobile-ads-ecpm/)
- **Playwire (published Sept 2025; methodology undisclosed):**
  - Tier-1: rewarded $15–30, interstitial $5–8, banner $0.5–1.5.
  - Global: rewarded $8–18, interstitial $2.5–5, banner $0.2–0.8.
  - Source: [Playio summary](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- MonetizeMore (2024, 500+ publishers): the US app-open eCPM peaked at $10.51 (March) and US interstitials at $8.57 — [Playio summary](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026). MonetizeMore's Feb 2026 playbook puts Tier-1 banner eCPMs at $0.50–2.10 and global banner averages at $0.25–0.90 — [MonetizeMore 2026 AdMob playbook](https://www.monetizemore.com/blog/admob-monetization/)
- Vendor case study (date not given): Kongregate saw a $30 average CPM and 90% fill on AdMob rewarded video in a strategy game. It is not typical — [Google AdMob case study](https://admob.google.co.in/home/resources/kongregate-uses-admob-to-boost-revenue-average-30-dollar-cpm/)
- Market-level implied eCPM: Sensor Tower reports mobile-game ad revenue >$12B in 2025 across only 19 countries, and ~2.4 trillion ad impressions in games. That implies a blended ~$5 per 1,000 impressions. The figures are via secondary coverage — [wnhub summary of Sensor Tower](https://wnhub.io/news/analytics/item-51349); [Playio calculator post](https://blog.playio.co/mobile-game-ad-revenue-calculator)
- Platform share of ad revenue: Android took 57% vs iOS 43% in Q1 2026 (60/40 in Q4 2025) — [Tenjin ad monetization benchmark (search excerpt)](https://tenjin.com/tr/wp-json/wp/v2/posts/11489). The US accounts for ~58% of iOS and ~32% of Android ad revenue (Tenjin, Q2 2026) — [Playio ARPDAU benchmarks](https://blog.playio.co/arpdau-benchmarks-mobile-games)
- Ads' share of mobile-game revenue: ~22% in the US vs ~70% in India (Jan–May 2026) — [Cinevva casual trends 2026 (secondary)](https://app.cinevva.com/de/guides/casual-games-trends-2026). Deconstructor of Fun estimates ads at ~13% of US game revenue including D2C, and ~23% across the 19 countries Sensor Tower covers — [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/5-numbers-hiding-in-plain-sight-sensor-towers-ad-monetization-report)

**ARPDAU / ad revenue per user [GAMES]**
- ARPDAU ranges (Game Growth Advisor, H1 2025, via Playio). The compiler itself says it has no trustworthy primary source:
  - Hyper-casual (ad-driven): $0.03–0.08
  - Casual ads-only: $0.01–0.05
  - Hybrid-casual (ads + IAP, 40–60% IAP): $0.15–0.50
  - Source: [Playio ARPDAU benchmarks](https://blog.playio.co/arpdau-benchmarks-mobile-games)
- AppsFlyer State of App Monetization 2026 (Jan 2025–Mar 2026; $7.2B ad revenue verified), D90 in-app-ad revenue per user, global: casual $0.55, casino $0.47, midcore $0.40, hypercasual $0.22 — [GameDev Reports summary of AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- Ad revenue is extremely front-loaded:
  - Day-1 ad revenue = 57% of a cohort's D60 ad revenue (63% for hypercasual).
  - Day 7 = 89% of D60.
  - Source: [GameDev Reports / AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- Worked bottom-up example: 3 rewarded views per DAU at a $12 eCPM ≈ $0.036 rewarded ARPDAU — [Playio](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- MonetizeMore (Feb 2026, unsourced): a new gaming app with 50,000 DAU "could" earn $5,000–7,000/month on AdMob alone with optimized rewarded and interstitial ads. That is ≈$0.003–0.005 ARPDAU — [MonetizeMore](https://www.monetizemore.com/blog/admob-monetization/)
- **Real indie data point (2025, Google Play, "Flappy Bat," roguelite Flappy Bird clone, mostly US/Western users):**
  - Volume: 6,400 downloads in 2025; average DAU 71; D7 ~12%; 4.7★.
  - Revenue: $1,694.60 gross for the year — IAP $1,146.60 (67.5%), ads $548 (32.5%).
  - Implied ARPDAU (my calculation): ad ≈ $0.021, total ≈ $0.065.
  - Source: [r/gamedev postmortem, Jan 2026](https://reddit.com/r/gamedev/comments/1q4u7qf/mobile_hobby_dev_what_my_first_game_earned_in/)
- Indie anecdote (Dec 2025): a solo dev's "Rocket Adventure" earns ~50% IAP / ~50% ads using x2-collect, revive, and an interstitial every 6–7 runs. Revenue is described only as "small but stable" — [r/Unity3D](https://reddit.com/r/Unity3D/comments/1pt3kjx/should_i_remove_ads_from_my_indie_mobile_game/)

**Payouts for ad revenue [BOTH]**
- The AdMob payment cycle is monthly. Earnings are finalized early the following month and paid on or around the 21st if the balance is above the threshold. Below-threshold balances roll over, and payments can be held for up to a year — [Google AdMob Help](https://support.google.com/admob/answer/3001017?hl=en)
- Google's pages refer to a "default payment threshold in your local currency." Third-party guides cite $100 (an older FAQ says $20 PayPal / $100 ACH), but this research could not confirm a current flat $100 for every method — [AdMob Help](https://support.google.com/admob/answer/2998394); [onecity FAQ (third-party)](https://mobileapp.onecity.co.in/faqs/how-does-admob-pays-me-for-the-add-revenue-my-app-has-earned)

### Inferences
- **What 10k DAU earns per month (ads only)** — ~300,000 DAU-days per month:
  - Tier-3/global-heavy ad-only game at $0.003–0.01 ARPDAU (MonetizeMore and 2022 Yodo1 anecdote level) ≈ **$1k–3k/month**.
  - Typical casual/hyper-casual blend at $0.01–0.05 ≈ **$3k–15k/month**.
  - Tier-1-heavy game with a good rewarded loop at the Flappy Bat ad level of ~$0.02 ≈ **~$6k/month**.
  - Adding IAP at the Flappy Bat total of ~$0.065 ≈ **~$20k/month gross**, before store fees on the IAP portion.
  - These are back-of-envelope figures from cited ARPDAU ranges, not measured outcomes.
- Geo mix dominates the result. Tier-1 rewarded eCPMs ($15–30) are 5–15x LATAM or Android Middle East levels ($1.8–2.4), so the same DAU can differ ~10x in revenue.
- Rewarded video and interstitials carry nearly all ad revenue. Banners pay ~$0.2–2 eCPM and are a rounding error.
- Because ~57–63% of D60 ad revenue arrives on day 1, ad-funded games depend on constant install volume (organic or paid). Once installs stop, revenue decays quickly.

### Gaps
- No primary, current (2025–2026) country-by-format eCPM table was retrievable. The Appodeal Q4 2024 and Tenjin Q2 2024 numbers are the most specific, and the Tenjin 2026 page was blocked (HTTP 403).
- No primary-source hybrid-casual or puzzle ARPDAU benchmark was found. The $0.15–0.50 hybrid-casual range is explicitly unverified by its compiler.
- No independent fill-rate benchmarks, and no AppLovin/Unity-published eCPM benchmarks.

---

## 2. IAP and hybrid monetization (remove-ads, coin packs, battle passes, subscriptions in games; payer conversion; hybrid-casual vs hyper-casual)

### Takeaway
Hybrid-casual adds IAP to an ad base: 20–60% of revenue from IAP, with subscriptions rising. Cited ARPDAU ranges are several times hyper-casual's, and hybrid-casual IAP was growing 67–100% YoY in 2025. Typical game payer conversion is low single digits. A "remove ads" IAP alone is a small revenue line; the 2015 anecdote puts it at ~0.1% of DAU.

### Cited Findings
- Unity: hybrid games generate 20–50% of revenue from IAP, "significantly more than hyper-casual" — [Unity trend report](https://unity.com/en/blog/the-shift-from-hyper-to-hybrid-games-and-why-it-matters-for-everyone)
- AppMagic: hybrid-casual IAP revenue grew 67% YoY in Q1 2025 and ~100% YoY in Q2 2025. The top-10 hybrid-casual titles earned $126M IAP in Q2 2025 — [GameDev Reports / AppMagic](https://gamedevreports.substack.com/p/appmagic-top-10-hybrid-casual-games)
- AppsFlyer (2024 data): the share of hypercasual games using hybrid models rose from 19% to 26% in nine months — [AppsFlyer gated report landing](https://www.appsflyer.com/gated-report/)
- AppsFlyer State of App Monetization 2026 (Jan 2025–Mar 2026):
  - In apps that use ads + IAP + subscriptions (mostly games), the ad share fell 63% → 56% and the subscription share rose 4% → 7%. IAP is ~35%.
  - D90 IAP ARPU: casual $1.34, midcore $2.13, casino $2.43, non-gaming $2.32.
  - D90 IAP ARPPU (per payer): casual $7.26, midcore $9.80, casino $11.40, non-gaming $10.85.
  - Growth (Q1 2026 YoY): subscriptions +105%, IAP +29%, ads +14%.
  - Source: [GameDev Reports / AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- AppsFlyer 2026 payer conversion (within 30 days):
  - Casino: 4.95% paying, 3.01% repeat.
  - Non-gaming apps: 9.84% first-time purchasers, 4.64% repeat.
  - North America first-purchase conversion: 11.14%; LATAM: 6.51%.
  - These are well above the "1–2%" often cited for games. The denominator is probably different (e.g., paid-install cohorts), so treat them with caution.
  - Source: [GameDev Reports / AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- Paid installs drive game IAP: they account for 59% of gaming IAP revenue (79% for hypercasual payments, 61% casual) vs 30% for non-gaming apps — [GameDev Reports / AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- **Subscriptions inside games (RevenueCat SOSA 2026, gaming category):**
  - Funnel: download-to-trial 4.4%; trial-to-paid 25.0% (top quartile 39.8%); D35 download-to-paid 1.0% (top quartile 2.3%).
  - Revenue per install: D14 $0.08, D60 $0.14. Realized LTV per payer: $8.41 at month 1, $11.22 at year 1.
  - Median prices: weekly $5.81, monthly $4.99, yearly $24.99. Weekly plans dominate (82%) and yearly is only 13%.
  - Packaging: 40.5% of gaming subscription apps are subscription-only, 27.5% also sell consumables, 9.6% use all three models.
  - Milestones: 20.0% reach $1K/month within 2 years and 8.9% reach $10K/month (the highest of any category). Median monthly revenue 1 year after launch is $56.
  - Source: [RevenueCat SOSA 2026 – Gaming](https://www.revenuecat.com/state-of-subscription-apps-2026-gaming)
- Payer conversion rule of thumb: Playio frames game payer conversion as "near 1%" / "1–2%", but cites no source for it — [Playio ARPDAU benchmarks](https://blog.playio.co/arpdau-benchmarks-mobile-games)
- **Remove-ads IAP (2015 anecdote, TouchArcade via r/gamedev):**
  - A game with ~10K DAU and 400K+ update downloads sold 28 "no ads" and 68 "all themes + no ads" IAPs in about a week. That is ≈0.1% of DAU, with sales dropping to 1–2/day.
  - Another dev said ad-removal revenue was about 1/10 of 1% of their ad revenue.
  - Source: [r/gamedev 2015](https://reddit.com/r/gamedev/comments/362z77/ads_is_it_the_only_option_for_mobile_games/)
- Ad-removal is moving to subscriptions. A 2026 Reddit post complained about a game charging $15/month to remove ads (anecdotal sentiment, not a benchmark) — [r/enshittification](https://reddit.com/r/enshittification/comments/1u8p462/i_remember_when_removing_ads_on_a_mobile_game_was/)
- Real indie split: Flappy Bat (2025) earned 67.5% from IAP and 32.5% from ads on 71 DAU — [r/gamedev](https://reddit.com/r/gamedev/comments/1q4u7qf/mobile_hobby_dev_what_my_first_game_earned_in/)

### Inferences
- The hybrid-casual edge comes from adding a payer tail: casual D90 IAP ARPU ($1.34) is ~2.4x casual D90 ad ARPU ($0.55) in AppsFlyer data. A small payer base (low single-digit %) at ~$7 ARPPU outweighs ad revenue per user.
- A standalone "remove ads" IAP should be expected to add little. It works better bundled with currency or perks (as in the 68 bundle sales vs 28 plain), or reframed as a VIP/subscription.
- For a simple game, a subscription is viable but low-value: median RLTV per payer is $11.22/yr and D60 RPI is $0.14. Its main advantage is speed to small milestones (median 32 days to $1K/month for gaming subscription apps, per RevenueCat).

### Gaps
- No primary 2025–2026 benchmark for battle-pass attach rates, coin-pack price distributions, or remove-ads conversion rates in casual games.
- No credible primary 2025 payer-conversion benchmark by casual subgenre (puzzle, hyper-casual, hybrid-casual).

---

## 3. Subscriptions for simple apps: RevenueCat 2026 (2025 data), Adapty 2025, Superwall, paywall tactics

### Takeaway
The median subscription app converts ~2% of downloads to paid within 35 days and earns ~$0.34 per install by day 60. One year after launch it makes only ~$72/month; just 17.3% reach $1K MRR and 4.6% reach $10K MRR within two years. Hard paywalls convert ~5x better than freemium (10.7% vs 2.1%) with nearly identical 1-year retention. Longer trials, higher prices, North American users, and multi-page onboarding paywalls all correlate with better results.

### Cited Findings
**RevenueCat State of Subscription Apps 2026 (data year 2025; 115,000+ apps, $16B+ revenue, 1B+ transactions) [APPS]** — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps)
- **Download-to-paid (D35) median: 2.0%.**
  - Hard paywall 10.7% (top quartile 20.0%, P90 38.7%) vs freemium 2.1% (top quartile 4.5%).
  - By category: Health & Fitness 2.9%, Business 2.6%, Shopping 1.3%, Gaming 1.0%.
  - By region: North America 2.8%, Asia-Pacific 2.4%, Western Europe 2.0%, India/SEA 0.7%.
  - By price tier: high 2.8%, mid 2.0%, low 1.4%.
- **Trial-to-paid:**
  - By trial length: 17–32 days 42.5% (top quartile 59.4%); 5–9 days 37.4%; ≤4 days 25.5%.
  - By category: Travel 43.5%, Health & Fitness 37.7%, Gaming 25.0%, Photo & Video 22.2%.
  - By region: North America 34.2%, Asia-Pacific 31.9%, Western Europe 29.7%, India/SEA 15.2%.
- **Download-to-trial:** high-priced apps 8.9% vs low-priced 4.4% — [SaaStr summary](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- **Trial behavior:**
  - The share of trials ≤4 days rose from 42.1% to 46.5% YoY.
  - For 3-day trials, 55.4% of cancellations happen on Day 0 (vs 39.8% for 7-day, 35.7% for 14-day, and 31% for 30-day trials).
  - ~50% of paid conversions occur on Day 0.
  - Sources: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- **Median prices:**
  - Weekly ~$5.99 (most common $5); monthly $10; yearly $34.80, up from $31.60 (most common $30).
  - North America: monthly $9.99, yearly $39.99. India/SEA: monthly $3.75, yearly $18.32.
  - Common price bands: $4.99–6.99 weekly, $7.99–9.99 monthly, $29.99–39.99 annual.
  - Sources: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- **Revenue per install (median):**
  - Day 14: $0.23 overall (Health & Fitness $0.48; Gaming $0.08; North America $0.38; India/SEA $0.08).
  - Day 60: $0.34 overall (Health & Fitness $0.66; Gaming $0.14; North America $0.55; India/SEA $0.11).
  - Hard paywall vs freemium: **D14 $2.32 vs $0.27; D60 $3.09 vs $0.38.**
  - By dominant plan (D60): yearly $0.46, monthly $0.29, weekly $0.32 (another section of the report says weekly $0.09).
  - Source: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- **Realized LTV per payer, year 1:**
  - Global median $23; top quartile $44+. By region: North America $32, Western Europe $25, India/SEA $14.
  - By category: Health & Fitness $35.64, Business $35.48, Productivity $24.95, Education $22.82, Gaming $11.22.
  - By price tier: high $62.19, mid $28.75 (PPC Land reports $26.07), low $10.69.
  - Sources: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [PPC Land](https://ppc.land/the-app-middle-class-is-dying-and-revenuecats-data-shows-exactly-how-fast/)
- **Retention:**
  - One-year retention: high-priced apps 23%, low-priced 36%.
  - Median monthly-plan retention: 10.8% (low-priced) and 6.1% (high-priced). Median weekly-plan retention: 1.3% and 1.0%.
  - One-year retention of converted users: hard paywall 27% vs freemium 28%.
  - Source: [PPC Land reporting RevenueCat](https://ppc.land/the-app-middle-class-is-dying-and-revenuecats-data-shows-exactly-how-fast/)
- **Revenue milestones:**
  - Within 2 years of launch, 17.3% of new apps reach $1K/month (19% the prior year) and 4.6% reach $10K/month (5.3% the prior year).
  - Median days to $1K/month: 58 overall; Gaming 32, Business 113.
  - **Median monthly revenue one year after launch is ~$72.** Top quartile is $429+ and top 10% is $2,574+. The middle 50% spans $16–$429/month.
  - Sources: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [PPC Land](https://ppc.land/the-app-middle-class-is-dying-and-revenuecats-data-shows-exactly-how-fast/)
- **Growth distribution:**
  - Median YoY MRR growth 5.3%; top 25% grew 80%+; top 10% grew 306%+; bottom 25% shrank 33%+.
  - Latin America median growth was 17.2%.
  - Source: [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- **AI apps:** ~41% more revenue per payer but churn ~30% faster — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [PPC Land](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/)
- **Web purchases:** web revenue is 3.2% of revenue globally (4.9% North America, 0.8% India/SEA). 41% of top-tier apps have web revenue vs 1.3% of the bottom tier — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- **Involuntary churn:** billing failures cause ~31% of Google Play cancellations vs 14% on the App Store — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)

**Adapty State of In-App Subscriptions 2025 ($1.9B revenue, 11,000+ apps; App Store data 2024–2025) [APPS]** — [Adapty 10-minute summary](https://adapty.io/blog/markdown/state-of-in-app-subscriptions-2025-in-10-minutes.md); [Adapty report page](https://adapty.io/reports/state-of-in-app-subscriptions-2025/)
- **Plan mix:** weekly plans grew 10% YoY to nearly half of all subscriptions. Weekly is >50% of revenue in Productivity, Utilities, and Photo & Video. Annual leads in Health & Fitness and Education.
- **Average prices** (averages, so higher than RevenueCat's medians): weekly US $8.1 / Europe $8.3; monthly US $15.2 / Europe $13.3; annual US $44.6 / Europe $42.0.
- **12-month LTV:** weekly plans — Utilities $58.4, Productivity $53.2. Annual plans — Health & Fitness $46.1, Education $45.8, Photo & Video $42.4. Trial starters have up to 64% higher LTV.
- **Retention by plan:**
  - Weekly: 65% cancel within 30 days and 5% remain after one year. Adding a trial raises D30 retention from 23% to 42%.
  - Monthly: 43% retained at day 90 and 17% after one year.
  - Annual: nearly all retained through 12 months, but churn spikes at renewal.
- **Conversion:** install-to-trial is below 12% in most cases. Adapty states install-to-paid (no trial) at 18–38%, which conflicts sharply with RevenueCat's 2% median and likely uses a different denominator (e.g., paywall viewers). Do not compare the two directly.
- **Refunds:** annual 4.2% (highest), weekly 2.6% (lowest); LATAM and US >3%; Europe/MEA ~2.3%.
- **Paywall structure:** three-plan paywalls (weekly + monthly + annual) produce the strongest LTV. The US is ~49% of global in-app subscription revenue — [App Developer Magazine on Adapty](https://appdevelopermagazine.com/in-app-subscriptions-report-for-2025/)

**Superwall onboarding paywalls (vendor analysis, Feb–May 2026, ~40M onboarding paywall opens) [APPS]**
- Multi-page onboarding paywalls converted 12.41% vs 9.07% for single-page, a 37% relative lift.
- Multi-page flows are still only ~24% of onboarding opens.
- Conversion is defined as unique users starting a trial or buying ÷ unique paywall viewers (≥50 opens per paywall).
- This is a vendor analysis, not independent research — [Superwall blog](https://superwall.com/blog/new-postmulti-page-onboarding-paywalls-convert-37-better-than-single-page-heres-why)

**Indie reality checks (Reddit, 2025–2026) [APPS]**
- A senior iOS dev shipped 3 side-project apps in year one: 2,500 downloads in total, $100–200/month revenue — [r/iOSProgramming, Oct 2025](https://reddit.com/r/iOSProgramming/comments/1ogkkb0/senior_ios_dev_by_day_indie_developer_by_night/)
- One app at ~$120 MRR ("paid my light bill") — [r/iOSProgramming, Dec 2025](https://reddit.com/r/iOSProgramming/comments/1pcw23f/my_app_paid_for_my_light_bill/)
- A niche poker-tracking app got its first paid subscriber in Jan 2024 ($20/yr) and reported reaching $1K MRR in Nov 2025, about 22 months later — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1p2xt96/the_road_to_1kmrr_is_not_immediate_nor_glamorous/)
- A macOS menubar-app hobbyist had 1.21K installs and $224 in sales in year two, after switching from paid to freemium — [r/iOSProgramming, Jan 2026](https://reddit.com/r/iOSProgramming/comments/1q3ekl1/my_second_year_of_indie_app_development/)

### Inferences
- For a simple utility app, the median-case math is roughly: 1,000 downloads → ~20 payers (2%) → ~$460 of first-year payer revenue at the $23 median RLTV, i.e. ~$0.34–0.46 per install. A hard paywall shifts this to ~$3 per install at D60, but only for apps whose value is clear before use.
- Weekly plans give the fastest cash but retain terribly (5% at one year per Adapty; ~1% weekly-plan retention medians per RevenueCat). Annual plans give the best RPI (D60 $0.46 for yearly-dominant apps). The usual playbook is a three-plan paywall with annual as the anchor.
- 3-day trials lose more than half their cancellations on Day 0, and longer trials convert much better (42.5% vs 25.5%). Trial length is a high-leverage test.
- The App Store/Google Play billing split matters: Google Play's 31% involuntary churn means Android subscription apps need grace periods and billing-retry handling.

### Gaps
- No RevenueCat figure for the share of all apps (not just new launches) above $1K/$10K MRR, and no top-1% revenue share. These may be in the 330-page PDF, which was not retrieved.
- No independent (non-vendor) benchmark for onboarding-paywall placement. Superwall's figure is vendor-produced.
- Adapty's 18–38% "install-to-paid" figure is ambiguous and unreconciled with RevenueCat.

---

## 4. Retention benchmarks (D1/D7/D30) by genre/category

### Takeaway
The median mobile game (GameAnalytics 2026, indie-skewed) keeps ~22% of users on D1, under 4% on D7, and under 1% on D30. Top-10% games keep ~40% D1 and 11–12% D7. Utility and productivity apps have lower D1 than games but hold users better at D30. Puzzle, board, card and casino games retain best long-term, while arcade and hyper-casual retain worst.

### Cited Findings
- **GameAnalytics 2026 benchmarks (2025 data; 16,262 games with ≥1,000 MAU; iOS + Android) [GAMES]:**
  - D1: median ~22%; top 25% just above 30%; top 10% ~40%; top 1% 64–68%.
  - D7: median just under 4%; top 25% 6–7%; top 10% 11–12%; top 1% >25%.
  - D30: median 0.69–0.79%; top 25% ~1.6–1.8%; top 1% 13–15%.
  - D1 declined vs 2024.
  - Playtime: daily playtime is 22–24 min at the top 25% and 40–42 min at the top 10%.
  - Sources: [GameDev Reports (sponsored summary of GameAnalytics 2026)](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game); [GameAnalytics 2026 PDF mirror](https://investgame.net/wp-content/uploads/2026/01/2026-01-27-2026-mobile-pc-benchmarks_compressed.pdf)
- **GameAnalytics 2025 benchmarks (2024 data; 11,600 games, 16 genres) [GAMES]:**
  - Median D7 was 3.42–3.94%, and 75% of projects had D28 retention below 3%.
  - Arcade leads D1 but retains poorly long-term. Board, card, puzzle and casino retain best at mid/long term.
  - GameAnalytics data skews toward indies and early-stage teams.
  - Source: [GameDev Reports summary](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- **Adjust Gaming App Insights 2026 (Jan 2024–Jan 2026; top 5,000 apps plus the full Adjust dataset) [GAMES]:**
  - All-genre D1 was 27% in 2025. Hypercasual and hybrid-casual have the highest D1 (no figure given).
  - Family-genre D1 rose from 18% to 23%. Japan has the highest country D1 at ~25%.
  - Day-zero sessions: 1.65.
  - Source: [GameDev Reports / Adjust 2026](https://gamedevreports.substack.com/p/adjust-gaming-app-insights-report)
- **MWM, US, Q3 2025, apps with ≥1,000 D30 downloads, median D1/D7/D30 [BOTH]:**
  - Game: 36.6% / 9.3% / 2.9%
  - Productivity & Tools: 23.0% / 8.9% / 4.5%
  - Lifestyle & Well-being: 23.6% / 9.6% / 4.8%
  - Education & Knowledge: 24.9% / 8.6% / 3.6%
  - Media & Entertainment: 24.9% / 8.0% / 3.4%
  - Social & Communication: 31.9% / 12.3% / 5.9%
  - Country medians across US/UK/DE/FR/JP/KR/BR/IN are ~27% / 9% / 4%.
  - Source: [MWM retention glossary](https://mwm.ai/glossary/retention)
- **MWM "rough 2026 anchors"** (unsourced ranges, D1/D7/D30):
  - Casual games: 35–45% / 12–20% / 5–10%
  - Hyper-casual: 25–35% / 5–10% / 1–3%
  - Task-specific utilities: 15–30% / <5% / <5%
  - Source: [MWM](https://mwm.ai/glossary/retention)
- An unsourced "casual puzzle" table circulating on several blogs gives D1 30–40%, D7 10–20%, D30 3–7%. Treat it as a rule of thumb only — [Playio retention by genre](https://blog.playio.co/retention-by-game-genre); [Segwise retention 2026](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies.md)
- **Subscription retention (paid users) [APPS]:** see Section 3 — Adapty weekly 5% and monthly 17% after 1 year; RevenueCat 1-year retention 23–36% by price tier.

### Inferences
- Benchmarks differ by population. GameAnalytics (indie-heavy, ≥1,000 MAU) medians are far below MWM/Adjust figures, which include scaled, UA-backed titles. A simple indie game should treat ~25–30% D1 and ~5–6% D7 as "top-quartile among indies" and ~40% D1 / 10%+ D7 as "top-10%, scalable."
- Utility apps have weak D1 but better D30 (4–5% vs ~3% for games in MWM). That suits subscriptions, where a few retained payers matter more than daily engagement.

### Gaps
- No verified 2025 per-genre D1/D7/D30 medians for puzzle vs hyper-casual vs hybrid-casual. The GameAnalytics 2025 PDF with the genre tables was too large to fetch (>10 MB).
- No utilities-specific median from a primary source.

---

## 5. LTV vs CPI: what paid user acquisition costs in 2025–2026 and what makes it profitable

### Takeaway
Casual-game CPIs average ~$1.41 on iOS and ~$0.14 on Android globally, and North America gaming CPI is ~$1.68 and rising 30%/yr. Non-game app installs on Meta/TikTok/Apple Ads in the US typically cost ~$1–6. Against median monetization (D60 RPI $0.34 for subscription apps; D90 ad ARPU $0.22–0.55 for games), the median simple app or game cannot profitably buy US users. Paid UA works only for top-quartile monetizers: hard-paywall apps at ~$3 RPI, or hybrid games with a strong IAP tail.

### Cited Findings
**CPIs [GAMES]**
- **Liftoff × Singular 2025 Casual Gaming Apps Report** (Feb 2024–Feb 2025; 2.4B installs, $11.9B spend, 1.1T impressions):
  - Casual games (including hyper-casual) CPI: **$1.41 iOS, $0.14 Android**. Casino iOS CPI is $21.03; RPG Android is $4.29.
  - **Casual D30 ROAS: 47% iOS, 15% Android.** CTR: 8.8% iOS, 9.4% Android.
  - Sources: [Liftoff 2025 Casual Gaming Apps Report](https://liftoff.ai/?p=34267); [GameDev Reports summary](https://gamedevreports.substack.com/p/liftoff-and-singular-casual-games)
- **Adjust Gaming App Insights 2026** (2025 data):
  - CPI: global gaming CPI **$0.56 (+30% YoY)**. North America **$1.68** (from $1.28, +31%); Europe $0.53 (from $0.36); LATAM $0.14. By subgenre: slots $4.47, idle RPG $3.19, strategy $1.03.
  - CPM: average $4.34 (+20%); North America $15.98.
  - IPM: ~8.6 average.
  - Paid-to-organic install ratio: median rose from 2.07 to 3.33. The US ratio is 3.53.
  - ATT opt-in: 39% in Q1 2026.
  - Source: [GameDev Reports / Adjust 2026](https://gamedevreports.substack.com/p/adjust-gaming-app-insights-report)
- Secondary (unverified) estimate: hyper-casual CPI ~$0.40 on Android (global median) and $1.50–2.50 on iOS. Tier-1 averages of ~$4.22 iOS / $2.97 Android likely reflect non-casual scope — [FoxData 2026 UA cost benchmarks](https://foxdata.com/en/blogs/2026-mobile-game-user-acquisition-cost-benchmarks-how-much-should-you-spend/); [Segwise CPI/IPM/ROAS](https://segwise.ai/blog/cpi-ipm-roas-benchmarks-optimizing-ad-spend/)

**CPIs [APPS] (non-game, US)**
- **Apple Ads (Search Ads):**
  - AppTweak: global median cost per tap (search results) ~$0.92; US ~$1.91. US CPI ranges from $1.33 (Shopping) to $26.70 (Sports), with Games at $4.63 — [AppTweak Apple Ads benchmarks](https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks?lang=en-US)
  - SplitMetrics 2025: average CPT $2.25 across its top 15 categories and average CPA $3.76. Utilities tap-through rate was 11.3% — [SplitMetrics Apple Ads benchmarks 2026](https://splitmetrics.com/apple-ads-search-results-benchmarks-2026/executive-summary)
- **Meta and TikTok** (planning ranges, not measured surveys; the platforms don't publish CPI by channel):
  - Meta, US non-gaming: ~$1.50–3.00 Android, ~$3.00–6.00 iOS.
  - TikTok: ~$1.00–2.50 Android, ~$2.50–4.50 iOS.
  - Source: [FindClout CPI by channel 2026](https://findclout.com/blog/cost-per-install-by-channel-2026)
  - US utilities, blended 25th–75th percentile: ~$1.20–3.50 iOS, ~$0.60–2.00 Android — [SemNexus CPI benchmarks 2026](https://semnexus.com/cpi-benchmarks-app-category-platform-2026/)
- Indie anecdote (Dec 2025): an Apple Ads rep told a small education-app developer that CPA in their niche was ≈$2 in the US vs ≈$0.10 in Germany/Brazil. Advice for <$1K/month budgets: one country per campaign, exact-match keywords, Search Match off — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1pi9rma/i_talked_to_apple_about_why_my_search_ads_were/)

**LTV side and ROAS thresholds [BOTH]**
- Breakeven ROAS = 1 ÷ margin (e.g., a 70% margin implies 1.43x). D7 ROAS should be judged against the predicted D30/D60/D180 LTV curve — [Unity "What is ROAS"](https://unity.com/resources/what-is-roas)
- Liftoff (Apr 2026), citing Segwise 2025: D7 ROAS ~7.6% iOS / ~7.8% Android for hyper-casual and ~4.3% / ~6.1% for midcore. Casual D30 ROAS is ~47% iOS / ~15% Android — [Liftoff "What is a good ROAS" 2026](https://liftoff.ai/pt-br/?p=35616%2F)
- One reference expects hyper-casual payback within 30 days, which makes a D28 ROAS of 40% a red flag. Sources disagree, so treat these as directional — [Segwise good ROAS](https://segwise.ai/blog/good-roas-facebook-ads); [Tenjin hypercasual glossary](https://tenjin.com/glossary/hypercasual-game/)
- Monetization per install (cross-reference):
  - Subscription apps (RevenueCat): D60 RPI median $0.34 overall, $0.55 North America, $3.09 hard paywall — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
  - Games (AppsFlyer): D90 ad ARPU casual $0.55 and hypercasual $0.22; D90 IAP ARPU casual $1.34 — [GameDev Reports / AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-app-monetization-in-2026)
- Playio rule of thumb: a median game at $0.10 ARPDAU with ~2–3 days of expected active life has an LTV of ~$0.20–0.30, which is its CPI ceiling — [Playio](https://blog.playio.co/arpdau-benchmarks-mobile-games)

### Inferences
- Rough LTV-vs-CPI comparisons:
  - **Subscription utility app, US iOS:** a CPI of ~$1.2–3.5 vs a median D60 RPI of $0.55 (North America) means paid UA loses money at the median. A hard-paywall app at ~$3 D60 RPI can roughly break even within ~2 months and profit on renewals, which is why paid-UA subscription apps cluster around hard paywalls.
  - **Casual game:** D90 total ARPU of ~$1.89 (ads $0.55 + IAP $1.34) vs iOS casual CPI of $1.41 (global) or North America gaming CPI of $1.68 leaves a thin margin. Store fees also cut 15–30% of the IAP portion.
  - **Hyper-casual:** D90 ad ARPU of ~$0.22 only works against Android CPIs of ~$0.14–0.40 at massive scale. This is consistent with the shift to hybrid-casual.
- Store fees inflate the required gross ROAS. If IAP is paid on a 15% store fee (keeping 85%), breakeven gross ROAS on IAP is ~1.18x; at 30% it is ~1.43x. Ad revenue carries no store fee.
- With paid-to-organic ratios rising (median 3.33 in gaming) and CPIs up ~30% YoY, the "build it and rely on organic" path is getting harder. Indie apps without a paid-UA-capable LTV depend on ASO, content, and niche keywords, where CPA can be 20x cheaper outside the US.

### Gaps
- No primary measured Meta/TikTok CPI by category for 2025–2026. The platforms don't publish it, and the cited ranges are planning estimates.
- No primary D7 ROAS benchmark for hybrid-casual specifically.

---

## 6. Platform fees, payouts, and web checkout/external payments (Apple, Google, US rulings, EU DMA)

### Takeaway
Small developers pay 15% on Apple (Small Business Program, ≤$1M prior-year proceeds) and Google (first $1M/year; subscriptions 15% on Google from day one, and on Apple after a subscriber's first year). The standard rate is 30%. In the **US**, Apple has been barred since late April/May 2025 from charging any commission on link-out web purchases. The Ninth Circuit (Dec 2025) told the district court to set a "reasonable" commission, and as of Aug 2026 no rate had been set. **Google** began charging US link-out fees on Oct 1, 2026: 10% for subscriptions and 10%/20% for other offers. In the **EU**, Apple's new terms from Oct 1, 2026 are 26% standard (15% small business), 20% with alternative payment processing, and 15% for link-outs.

### Cited Findings
**Standard and small-business rates [BOTH]**
- **Apple Small Business Program:**
  - 15% commission for developers with ≤$1M in proceeds in the prior calendar year (all associated accounts count). It covers paid apps, IAP and subscriptions.
  - Developers who cross $1M lose eligibility the following year and can requalify later.
  - The standard rate is 30%. For auto-renewing subscriptions, the rate drops to 15% after a subscriber's first year of paid service.
  - Sources: [Appbot explainer](https://appbot.co/blog/app-developers-apple-google-small-business-programs/); [RevenueCat blog](https://revenuecat.com/blog/engineering/small-business-program); [SplitMetrics fee guide, Aug 2025](https://splitmetrics.com/blog/google-play-apple-app-store-fees/)
- **Google Play:** 15% on the first $1M of earnings each year (since July 1, 2021); auto-renewing subscriptions are 15% from day one — [AppleInsider 2021](https://appleinsider.com/articles/21/03/16/google-following-apple-cutting-google-play-commission-fee-to-15); [Glassfy docs](https://docs.glassfy.io/docs/reduced-platform-commission-for-new-and-small-publishers)

**US: Epic v. Apple anti-steering [APPS/GAMES on iOS]**
- **April 30, 2025:** Judge Gonzalez Rogers found Apple in willful contempt. Apple had been charging a 27% commission (12% for small developers) on link-out purchases. It was barred from charging "any commission or any fee" on purchases made outside the app — [FastSpring](https://fastspring.com/blog/news-apple-loses-stay-against-mandate-in-epic-case/); [Gulf News](https://gulfnews.com/amp/story/technology%2Fcompanies%2Fapple-revises-app-store-guidelines-allows-apps-that-offer-in-app-purchases-1.1705485097579)
- **May 2025:** Apple updated guidelines 3.1.1(a) and 3.1.3 for the US storefront. Apps may include buttons, external links and calls to action with no entitlement required. Alternative in-app payment processing is still not permitted — [512 Pixels](https://512pixels.net/2025/05/apple-updates-app-review-guidelines/); [Superwall](https://superwall.com/blog/apple-allows-external-payment-links-in-the-app-store-everything-you-need-to)
- **December 2025:** the Ninth Circuit upheld the contempt finding and the finding that the 27% fee violated the injunction. It vacated the total ban on any commission and remanded for the district court to set a commission "more reasonably tied to Apple's actual costs"/IP — [Bloomberg Law](https://news.bloomberglaw.com/antitrust/apple-loses-appeals-court-ruling-in-app-store-fight-with-epic); [Courthouse News](https://www.courthousenews.com/apples-fight-over-commissions-for-linked-out-app-store-purchases-continues-in-district-court/)
- **May 2026:** the Supreme Court rejected Apple's stay request and the case returned to the district court. Apple separately petitioned the Supreme Court on the contempt finding and nationwide scope. Per May 2026 reporting, Apple cannot charge commissions on linked-out purchases until the district court approves a rate — [9to5Mac, May 6 2026](https://9to5mac.com/2026/05/06/supreme-court-rejects-apples-stay-request-epic-games-case-to-head-back-to-district-court/); [MacRumors, Jun 2026](https://macrumors.com/2026/06/11/apple-fights-back-against-epic/)
- **August 18, 2026:** MLex described a two-front fight (Supreme Court petition plus district-court rate setting), with no rate yet set — [MLex](https://www.mlex.com/mlex/articles/2515086)

**US: Google Play external content links (post Epic v. Google) [APPS/GAMES on Android]**
- The proposed Epic–Google settlement (fees of 9–20%) was jointly withdrawn on July 15, 2026. The 2024 injunction remains in force — [Stash blog](https://www.stash.gg/blog/why-epic-and-google-just-walked-away-from-their-own-settlement); [Appcharge blog](https://appcharge.com/blog/epic-v-google-the-settlement-is-off-the-table)
- **Google US external content links program — fees on transactions completed within 24 hours of a link-out:**
  - **Recurring subscriptions: 10%.**
  - **Other offers, new installs** (first installed on or after June 30, 2026): 10% on the first $1M of annual earnings and 20% standard (15% for Play Games Level Up / Apps Experience participants).
  - If the link-out leads to an app install, a per-install fee of **$3.65 (games) / $2.85 (apps)** applies instead.
  - Fee reporting and payment start **October 1, 2026**; the deadline to report downloads is February 1, 2027.
  - Enrollment is optional and subject to the court order.
  - Sources: [Google Play Help – external content links program](https://support.google.com/googleplay/android-developer/answer/16470497); [Google Play Help – US programs notice](https://support.google.com/googleplay/android-developer/answer/15582165?hl=en)

**EU DMA [BOTH]**
- **Apple's new EU terms (announced Aug 18, 2026; effective Oct 1, 2026):**
  - App Store IAP: 26% standard; 15% for Small Business Program members; 15% for auto-renewing subscriptions after year one.
  - Alternative payment processing in-app: 20%.
  - Link-out to a web purchase: 15%.
  - The per-install Core Technology Fee (€0.50 per install beyond 1M/year) is replaced by a 5% Core Technology Commission on digital transactions for apps distributed outside the App Store.
  - Store Services Fee and Initial Acquisition Fee abolished, though sources conflict on whether they were folded into the 15% link-out charge.
  - Further discounts apply for Mini Apps, Video Partner and Small Business programs.
  - Sources: [GIGAZINE, Aug 19 2026](https://gigazine.net/gsc_news/en/20260819-apple-eu-commission/); [Phiture](https://phiture.com/blog/apple-new-app-store-terms-2026/); [BetaNews](https://betanews.com/article/apple-eu-app-store-commission-fee/)

**Payouts and tax [BOTH]**
- Apple pays within 45 days of the last day of the fiscal month in which the transaction completed. Apple uses a fiscal calendar, not calendar months — [App Store Connect Help](https://www.developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments); [RevenueCat fiscal calendar](https://www.revenuecat.com/blog/app-store-fiscal-calendar-and-payment-dates)
- Google Play pays around the 15th of the following month for the prior month's sales. One German source cites a €100 minimum. These are third-party sources — [Disciple help](https://help.disciple.community/hc/en-gb/articles/6420869123601-How-Often-Will-I-Receive-Payments); [Nami ML](https://www.namiml.com/blog/apple-fiscal-calendar-developer-payout-schedule)
- AdMob: see Section 1 (monthly, ~21st, threshold-based) — [AdMob Help](https://support.google.com/admob/answer/3001017?hl=en)
- Tax analogue (Steam, not mobile, Oct 2026): a non-US dev from a country without a US tax treaty faced 30% US withholding on US sales, reduced to 5% after moving to a treaty country (Thailand). The general point that treaty status matters for US-source income likely carries over to mobile and ad income, but this research did not verify it for Apple/Google/AdMob — [r/gamedev, "How $560,000 in Steam gross revenue turns into just $73,000"](https://reddit.com/r/gamedev/comments/1wzv6kr/how_560000_in_steam_gross_revenue_turns_into_just/)

### Inferences
- For a small US-facing subscription app in late 2026:
  - iOS: Apple IAP costs 15% (Small Business Program), or **0% via a web link-out** while the remand is pending. Web checkout costs (Stripe or similar, roughly 3–5% plus tax handling) and conversion drop-off apply instead.
  - Android: an enrolled link-out costs 10% for subscriptions vs 15% via Play Billing, a smaller saving.
  - RevenueCat's data (web = 3.2% of revenue overall, but present in 41% of top-tier apps) suggests web checkout is mostly worth it at scale.
- Apple's US zero-commission link-out window could close once the district court sets a rate. Builders should treat it as temporary.
- Google's per-install fee ($2.85/$3.65) makes link-outs to off-Play app installs expensive for low-LTV apps.

### Gaps
- Apple's and Google's official pages on merchant-of-record and VAT/sales-tax handling were not retrieved. It is widely understood that the stores collect and remit VAT/GST in most jurisdictions and pay out net of it, but this research did not confirm it from a primary source.
- The "existing installs" fee column on Google's link-out page was garbled in extraction.
- No final district-court rate in Epic v. Apple as of the latest coverage found (Aug 2026).

---

## 7. Market reality: total market size and the distribution of indie outcomes

### Takeaway
The pie is large: $167B in 2025 app-store IAP, with non-game apps ($85.6B, +21%) overtaking games ($81.8B, +1%) for the first time. But it is extremely concentrated. The median subscription app makes ~$72/month a year after launch, and only 4.6% of new apps reach $10K/month within two years. Apps launched before 2020 still earn 69% of subscription revenue, even as launches have risen ~7x since 2022.

### Cited Findings
**Market size [BOTH]**
- **Sensor Tower State of Mobile 2026 (released Jan 21, 2026):**
  - 2025 global IAP revenue was **$167B (+10% YoY)**.
  - **Non-game apps reached ~$85.6B (+21%) and overtook games (~$81.8B, ~+1%) for the first time.**
  - Generative-AI apps' IAP more than tripled to >$5B; ChatGPT alone made ~$3.4B.
  - Users spent 5.3 trillion hours in apps. No new mobile game crossed $1B in 2025.
  - Sources: [Sensor Tower press release](https://sensortower.com/press/press-release-boosted-by-gen-ai-services-consumers-spent-more-money-in-apps-than-games-for-first-time); [TechCrunch](https://techcrunch.com/2026/01/21/consumers-spent-more-on-mobile-apps-than-games-in-2025-driven-by-ai-app-adoption)
- Mobile-game ad revenue was >$12B in 2025, but only for the 19 countries Sensor Tower covers. Coverage is secondary — [wnhub](https://wnhub.io/news/analytics/item-51349)
- **Newzoo (final 2025 estimate):** the global games market was **$201.6B (+9.1%)**. **Mobile games were $113.3B (+10.7%)**, boosted by Chinese mini-games and D2C web stores. The figure excludes advertising revenue. Newzoo had forecast mobile at $103B (Sept 2025) and then $108B (Dec 2025). Its forecast reaches $234.4B by 2028 — [GameDev Reports / Newzoo](https://gamedevreports.substack.com/p/newzoo-gaming-market-surpassed-200); [VGC](https://www.videogameschronicle.com/news/global-games-revenue-in-2025-is-expected-to-grow-7-5-compared-to-last-year-analysis-suggests)
- Adjust: mobile was 55% of gaming revenue in 2025, with ~3B mobile players — [GameDev Reports / Adjust](https://gamedevreports.substack.com/p/adjust-gaming-app-insights-report)
- Adapty forecast in-app purchase market of $170B for 2025 — [Adapty](https://adapty.io/blog/markdown/state-of-in-app-subscriptions-2025-in-10-minutes.md)

**Distribution of outcomes (power law) [BOTH]**
- RevenueCat 2026 (subscription apps):
  - Within 2 years, **17.3%** of new apps reach $1K/month and **4.6%** reach $10K/month (down from 19% and 5.3%).
  - **Median monthly revenue one year after launch is ~$72.** The top 25% make ≥$429/month and the top 10% ≥$2,574/month (36x the median). The middle 50% spans $16–429/month.
  - **Apps launched before 2020 earn 69% of subscription revenue; apps launched in 2025 or later earn 3%.**
  - Monthly new subscription-app launches rose from ~2,000 (Jan 2022) to 14,700+ (Jan 2026).
  - Sources: [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps); [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth); [PPC Land](https://ppc.land/the-app-middle-class-is-dying-and-revenuecats-data-shows-exactly-how-fast/); [Subscription Insider](https://www.subscriptioninsider.com/blog/revenuecat-data-shows-subscription-app-growth-concentrating-at-the-top-news)
- Top-quartile (75th percentile) monthly revenue one year after launch, by category: Business $4,554, Education $3,614, Productivity $1,250, Travel $822, Gaming $552 — [PPC Land](https://ppc.land/the-app-middle-class-is-dying-and-revenuecats-data-shows-exactly-how-fast/). Note that RevenueCat's gaming page lists $4,554 as the gaming top-10% figure, so the two summaries may conflict — [RevenueCat Gaming](https://www.revenuecat.com/state-of-subscription-apps-2026-gaming)
- **Sensor Tower concentration (older data):**
  - Q1 2016, US App Store: the top 1% of monetizing publishers took ~94% of revenue — [Sensor Tower blog](https://sensortower.com/blog/app-store-one-percent)
  - H1 2022, worldwide: the top 1% of publishers had ~79% of new downloads, and the top ~1,800 publishers had ~91% of revenue (~$42B) — [Sensor Tower H1 2022](https://sensortower.com/blog/top-one-percent-downloads-1h-2022); [PocketGamer.biz](https://www.pocketgamer.biz/1-of-publishers-are-responsible-for-91-of-app-revenue)
- GameAnalytics: 75% of game projects have D28 retention <3% (2024 data, indie-skewed) — [GameDev Reports](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- App Store supply (user analysis, unverified): ~2.09M apps and ~888K active developer accounts as of Jan 2026, with weekly releases rising sharply on AI-assisted "vibe-coded" apps — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1qeo2ke/app_store_is_flooding_got_data_to_prove_it/); [r/iOSProgramming, Apr 2026](https://reddit.com/r/iOSProgramming/comments/1sfbzc8/total_app_market_saturation_in_the_near_future/)
- Concrete indie outcomes (2025–2026):
  - A hobby game with 6.4K downloads and 71 DAU made ~$1.7K/year.
  - Three side-project iOS apps make $100–200/month in total.
  - A niche app reached $1K MRR after ~22 months.
  - Sources: [r/gamedev](https://reddit.com/r/gamedev/comments/1q4u7qf/mobile_hobby_dev_what_my_first_game_earned_in/); [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1ogkkb0/senior_ios_dev_by_day_indie_developer_by_night/); [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1p2xt96/the_road_to_1kmrr_is_not_immediate_nor_glamorous/)

### Inferences
- These figures come from RevenueCat, whose sample is already selected: apps that integrated a subscription SDK and made at least one sale. The realistic outcome for a typical new simple app is therefore under ~$100/month, and ~83% of new subscription apps never reach $1K/month within two years. The share of all store apps earning meaningful money is lower still.
- Gaming subscription apps hit milestones fastest (8.9% reach $10K/month), but casual-game IAP/ad markets are flat (+1% IAP in 2025), while non-game app spending grows ~21%/yr, led by AI. For a solo builder, simple subscription utilities sit in the faster-growing pool. Games sit in a flat, UA-cost-inflating pool where hybrid-casual is the growth pocket.
- The rising launch rate (14,700/month and accelerating with AI tools) combined with falling milestone rates (19% → 17% reaching $1K) points to increasing competition for a fixed pool of attention.

### Gaps
- No 2025–2026 figure for the top-1% publisher share of revenue. The latest found is H1 2022 (~91% for the top ~1,800 publishers).
- No reliable data on the share of all games (not just subscription games) earning >$1K/month.
- Global mobile in-app ad revenue for all apps (not just 19-country games) in 2025 was not found.
