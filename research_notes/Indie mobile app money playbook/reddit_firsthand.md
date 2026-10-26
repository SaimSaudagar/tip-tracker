# Reddit firsthand accounts: how solo devs and tiny teams actually make money from simple mobile games and apps (2023–2026, weighted to 2025–2026)

Method notes for the report writer:
- Sources are Reddit posts and comment threads read through the Reddit API (read-only). Reddit pages could not be fetched directly, so long post bodies were sometimes cut off. Numbers below come from the visible post text or from the original poster's (OP's) own replies in comments.
- **Verification labels used below:**
  - **[screenshot posted]**: OP attached an App Store Connect, Play Console, RevenueCat or similar image. I could not open the image, so this is still OP's claim.
  - **[store-verified]**: I confirmed the app exists through a store listing or a third-party listing.
  - **[unverified]**: text claim only, or the OP would not name the app.
- **Survivorship bias is heavy.** Success posts get many upvotes. Failures mostly show up as low-score posts. r/AppBusiness in particular is full of vendor and self-promotion posts; one commenter there said almost every post "is either selling a UGC AI engine, ASO tool and some AI Slopware" ([comment](https://reddit.com/r/AppBusiness/comments/1vw950q/my_app_was_dead_i_killed_the_free_trial_doubled/)).
- Today is 2026-10-25. Anything from 2023 or earlier is labeled with its year.

---

## 1. What step-by-step processes do Reddit devs who earn real money ($1k–$100k+/month) describe?

### Takeaway
The repeatable process for **subscription utility apps** has these steps:
1. Find demand. Most do this by scanning App Store top charts and revenue estimates (SensorTower/AppMagic), or by building for a niche they personally know.
2. Ship a narrow MVP in days to weeks, usually AI-assisted (SwiftUI or React Native/Expo, RevenueCat, Firebase/Supabase).
3. Monetize with a hard or near-hard paywall: weekly plus yearly plans, and more and more often no free trial.
4. Get users through localized ASO plus either short-form TikTok content (carousels/slideshows) or carefully run paid ads (Apple Search Ads, Meta).
5. Repeat across a portfolio, because individual hits are unpredictable.

For **games**, the earners describe one of two paths. The first is long persistence plus luck (one hit after many flops), monetized mainly through IAP with ads secondary. The second is a studio-like loop of many small word/trivia games with paid UA. Single-game first-timers rarely sustain income.

### Cited Findings

**Utility / subscription apps (labeled APP)**
- APP, Mar 2025, **$35K sales in 30 days** [screenshot posted; apps not named]. The dev built 20 iOS apps between June 2023 and Mar 2025 and had never coded before 2023. His apps are about 60% AI-written, mostly "AI feature" apps, and he works about 3–4 h/day. All installs are now organic through ASO, about 50K installs in 30 days. He bootstrapped with two TikTok videos that each passed 1M views, from his existing tech-influencer account. — [r/iOSProgramming AMA](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/)
  - His process, from his replies in the same thread:
    - Ideas: he checks the US App Store top charts in every category "almost every day" and picks apps that are easy to build and already earn decent money.
    - Validation: he estimates revenue with SensorTower/AppMagic and avoids niches where the top app earns under $5k/month.
    - Build: an MVP takes "about a week." Stack is SwiftUI, Firebase only when needed, the OpenAI API, and API keys hidden in Cloudflare Workers.
    - Pricing: a weekly plan (with-trial and no-trial variants) plus a heavily discounted yearly plan.
    - ASO: he localizes title, subtitle, keywords and screenshots into FR/DE/IT/ES/PT using ChatGPT, and uses the Astro ASO tool.
    - He calls ASO "definitely a hit or miss... which is why building several apps is not a bad idea."
    - His top app has about 5,000 DAU and his ratings are 4.7–4.9.
- APP, 2019–2024, **Viktor Seraleev's photo/video apps**.
  - The first app came from his wife, a nail tech, who wanted before/after videos for clients. It was built in "a couple of months" in 2019 and earned $100–200/month in its first year.
  - On Sept 20, 2023 the apps passed $3,000/day (90% iOS). The next day Apple terminated the account.
  - He says he later sold one app for $410,000. — [How to create mobile apps that make $3,000 a day (2024)](https://reddit.com/r/iOSProgramming/comments/1d2ofpf/how_to_create_mobile_apps_that_make_3000_a_day/); [Taking on Apple in court: $33,680 MRR wiped out (2024)](https://reddit.com/r/iOSProgramming/comments/1cor2t5/taking_on_apple_in_court_their_mistake_wiped_out/); [Screencut to $1,000 MRR (Feb 2025)](https://reddit.com/r/iOSProgramming/comments/1if5cxf/from_personal_project_to_1000_mrr_my_apps_journey/)
  - He restarted with Screencut, launched from a Twitter build-in-public post that got about 33K views, and reached $1,000 MRR.
- APP, Feb 2026, **8 years to $10k MRR** [screenshot posted].
  - Games came first and "totally flopped." A fluid-simulation app followed and was later sold for $44k. A music visualizer (Vythm) was then improved from user feedback for 4 years.
  - He spends about $800/month on Apple Search Ads and "roughly break[s] even within 3 months," with long-run profit from renewals. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/)
  - An experienced commenter in the same thread said the only channel that "truly moves the needle" is paid ads:
    - Google Ads is good for Android.
    - Apple Search Ads works but has limited scale.
    - Meta "works very well for iOS apps and is extremely scalable."
    - TikTok Ads traffic converts poorly.
    - ASO, daily TikTok posting, Reddit and press outreach help but do not scale. ([comment](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/))
  - OP replied that Meta creatives "burn out very quickly," that he "burned some hundreds within days," and that influencers rarely answer.
- APP, Aug 2026, **Parceladinho (Brazil installment tracker)**: $3k revenue and $1.6k MRR in 23 days [screenshot posted]. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1vw950q/my_app_was_dead_i_killed_the_free_trial_doubled/)
  - $250 of Meta Ads had produced 3 trials and 1 paid user.
  - He then removed the free trial and doubled the price from about $11/yr to about $22/yr, with "no change" in conversion.
  - He switched to about 10 TikTok image carousels per day in a "confession" format that never mentions the app.
  - From his replies:
    - He warmed up the account for 2 weeks without posting.
    - He copies the structure of viral formats from adjacent niches.
    - Claude generates the carousels and Nanobanana Pro makes the AI UGC images.
    - Downloads become "consistent" once posts pass 10K views. His best revenue day came from a post that passed 100K views in one day.
- APP, Oct 2026, **LoroNote, offline transcription**: $7,591 over 28 days, $1,295 MRR, 258 active subs [RevenueCat screenshot posted]. Runs Whisper on-device so there is no API bill. That makes lifetime pricing viable alongside subscriptions. Marketing is mostly ASO (localized names and keywords, screenshot order). — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1x3uagl/my_offline_transcription_app_made_76k_in_the_last/)
  - Same dev's second app, Local TTS: $4,572 over 28 days, $852 MRR, 170 subs, less than 3 months after its June 18, 2026 launch. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1wd3z8k/my_solo_ios_app_made_46k_in_the_last_28_days_less/)
- APP, 2026, **JEulerius portfolio (Sober Tracker etc.)** [screenshots posted]. — [$1k month](https://reddit.com/r/AppBusiness/comments/1ruu06e/1k_revenue_month_milestone_reached/); [$1,000 MRR](https://reddit.com/r/AppBusiness/comments/1ue43sy/so_guys_i_have_officially_reached_the_1000_mrr/); [$5,000 in 28 days](https://reddit.com/r/AppBusiness/comments/1uqltne/so_guys_i_have_officially_reached_the_5000/)
  - Mar 2026: $1k revenue month on only $150 MRR. Upfront annual and lifetime purchases dominate, and he reinvests them in ads.
  - Jun 2026: $1,000 MRR and about $4,300 revenue for the month. Android is about 70% of revenue and one app is about 70% of revenue.
  - Jul 2026: $5,000 in 28 days. Apple Search Ads at $300/month "doesn't appear to be doing anything." Growth is "organic store traffic," with 200 iOS and 765 Android ratings at 4.7+.
- APP, Jul 2026, **GainFrame (AI body-composition)**: 4 months old, $944 MRR, 203 active subs. Earlier posts by the same dev mention $5.7K wasted on ads. Claude Code writes "most of the code." — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1usio9p/my_ios_app_is_4_months_old_and_does_944_mrr_every/)
- APP, Jan 2026, **PushScroll** (second-hand account) [unverified]. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1qkvyhg/app_makes_you_do_pushups_before_you_can/)
  - Claimed $30K MRR in 4 months and 300K downloads.
  - The idea was validated with a fake demo video on TikTok before any code. The MVP had 3 screens and a hard paywall at about $30/yr.
  - Stated playbook: warm up a niche TikTok account, post daily until something hits, post organically until $5K MRR, then pay influencers, then paid ads.
  - Caveat: the same account posted this identical text to about 15 subreddits with links to a no-code tool (AppAlchemy) and its own r/ViralApps. Treat it as promotional.
- APP, Jun 2026, **Zenka budgeting app**: €3.99/mo or €29.99/yr. Downloads had dropped to about 3/day. "Genuine" comments on finance TikTok videos brought 140 new customers in 30 days, with a best day of 26. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1tu70l2/the_most_effective_marketing_channel_for_my_app/)
- APP, Nov 2025, **niche poker tracker**:
  - The first paying subscriber in January 2024 was the developer himself, at $20/yr.
  - It took about 2 years to reach $1K MRR.
  - He wrote the post to counter "social media app founder superheroes." — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1p2xt96/the_road_to_1kmrr_is_not_immediate_nor_glamorous/)
- APP, Dec 2025, **Apple Search Ads on a small budget**: an Apple rep told an indie with a $10–20/day budget:
  - Run one country per campaign. US CPA was about $2 versus about $0.10 in Germany or Brazil for his niche.
  - Use exact-match keywords only.
  - Disable Search Match. — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1pi9rma/i_talked_to_apple_about_why_my_search_ads_were/)

**Games (labeled GAME)**
- GAME, Sep 2026 (peak around 2022–23), **Lone Tower (Android tower-defense roguelite)**: over $200,000 lifetime [screenshot posted; listing exists, released on Android in 2022 per [Lutris](https://lutris.net/games/lone-tower-roguelite-defense/)]. — [r/IndieDev](https://reddit.com/r/IndieDev/comments/1w7dssh/how_my_solo_developed_hobby_mobile_game_made_over/)
  - About 4 months of solo development, inspired by "The Tower."
  - OP says it was his **96th** Google Play release and that "the first 95 were mostly all flops."
  - It made over $1,000/day for about 4 months at its peak.
  - He did zero marketing, but shipped updates "about 5 days a week" early on and grew a Discord to thousands of members.
  - Conditions have changed since that peak.
- GAME, Aug–Sep 2025, **Bricks Breaker RPG (brick-breaker plus RPG, Godot)** [screenshot posted; store-verified on the [App Store](https://apps.apple.com/app/id6749246731), the [Godot showcase](https://godotengine.org/showcase/bricks-breakers-rpg/) and a [price tracker](https://www.apppricinglab.com/app/google_play/com.WhimBearStudios.BricksBreakerRPG) showing about 2.0K reviews at 4.7]. — [first month post](https://reddit.com/r/gamedev/comments/1ne75o5/i_released_my_first_mobile_game_and_id_like_to/); [30-day post](https://reddit.com/r/gamedev/comments/1n29wqt/30_days_after_launch_how_my_solodev_mobile_game/)
  - $11,115.78 on Android in the first month (Jul 27–Aug 27, 2025): about $9,000 IAP and $2,000 ads.
  - Built in 18 months by a 38-year-old complete beginner.
  - Had 4,000 pre-launch installs. Launched with one post in an Android subreddit and spent £250 on ads he called "dead."
  - A commenter disputed the picture: downloads "dropped to 0 since sept 4th" and IAP fell to about $30/day ([comment](https://reddit.com/r/gamedev/comments/1ne75o5/i_released_my_first_mobile_game_and_id_like_to/)). OP conceded numbers were "definitely down."
  - Conflict: a news write-up says the game has "no microtransactions" ([ixbt.games](https://ixbt.games/en/news/2025/09/19/rolevoi-arkanoid-bricks-breaker-rpg-dostupen-besplatno-na-ios-i-android.html)), which contradicts OP's IAP figure.
- GAME/APP studio, Mar 2026, **12+ apps and games, 500K downloads, 100K MAU** [unverified; a commenter found a Play developer page but "not seeing the user count"]. — [r/vibecoding](https://reddit.com/r/vibecoding/comments/1rukoak/i_vibe_coded_over_12_mobile_apps_and_games_and/)
  - Mostly word and trivia games, part-time alongside a full-time job.
  - Stack: React Native Expo, Firebase/Supabase, Claude Code/Codex.
  - Revenue is mostly ads plus IAP with a small share of subscriptions.
  - Paid UA on Meta and Google ("Google ads works better for me"), plus organic TikTok/IG with one account per app. Market research with AppBrain/AppBird.
  - Most downloads come from Google Play. Margins are "around 40–50%," and 3–4 apps earn most of the money.
  - He killed several bad apps and said: "I mostly earn from games but apps is easier. Games are super hard to earn from."
- GAME, Apr 2026, **Truth or Dare 2 (party game)**: over $10K from $1.99 **weekly subscriptions** after ads alone earned "very low" [screenshot posted; store-verified, [App Store id1241647692](https://apps.apple.com/app/id1241647692)]. Traffic came from 9gag posts that pushed it to #3 for the keyword "Truth or Dare." Revenue is now declining because "millions of these games" compete for that keyword. — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1sne0iq/a_game_i_created_made_over_10k_by_selling_199/)

### Inferences
- Across the higher-earning app stories, the common elements are:
  - choosing a niche with proven spending (a top-chart app or a personal-pain niche);
  - very fast MVPs, often AI-coded;
  - aggressive monetization: weekly or annual subscriptions, hard paywalls, trial removal or price increases;
  - **one** distribution engine that works for that dev: localized ASO, TikTok carousels, a large existing social following, or Apple Search Ads/Meta with positive payback.
- Game earners mostly describe luck and volume, as in Lone Tower's 96 releases. Few describe a repeatable funnel.
- Several of the biggest single-dev wins had a pre-existing audience or launch spike behind them: TikTok influencer status, a Twitter following, 9gag, or Reddit launch posts. That is easy to underweight when copying their "process."

### Gaps
- None of the $10k+/month app posters disclosed exact ad spend or ROAS curves alongside revenue.
- The $35K/month dev would not name his apps, so his numbers cannot be verified.
- I found no detailed 2025–26 Reddit firsthand account of a **hyper-casual publisher deal that paid out** (revenue share received, CPI test results to contract).

---

## 2. What kinds of simple games/apps work best for solo devs now? Which categories are called saturated or dead?

### Takeaway
On Reddit, simple **utility/subscription apps** are seen as more attainable for solo devs than games. "I mostly earn from games but apps is easier" ([source](https://reddit.com/r/vibecoding/comments/1rukoak/i_vibe_coded_over_12_mobile_apps_and_games_and/)).

What works in 2025–26 posts:
- Niche trackers (sobriety, supplements, installments, poker).
- On-device AI utilities: transcription and TTS, where there is no per-use API cost.
- AI feature apps (photo/voice/video).
- Small party or word games monetized with subscriptions or IAP.

Pure **hyper-casual** with ads only is widely described as dead or impractical for solo devs because CPI exceeds LTV. Reddit talk has moved to **hybrid-casual** (simple core loop plus a meta layer plus IAP).

Apple explicitly treats astrology, dating and other crowded categories as 4.3 spam. Fitness, to-do and habit apps are described as oversaturated.

### Cited Findings
- **Hyper-casual seen as dead or unviable for indies**:
  - "Mobile game publishers no longer release a new game unless they have to. They don't even review the games submitted" (Jul 2023) — [r/gamedev](https://reddit.com/r/gamedev/comments/15avu7q/dead_of_hyper_casual/).
  - A Feb 2026 indie says he heard "hyper casual games are not worth giving a shot since cpi needs to be very less." He is now pitching **hybrid-casual** prototypes to a "renowned publisher's dashboard" and asks whether a CPI test build needs about 35–40 minutes / about 30 levels or just 3–4 levels — [r/gamedev](https://reddit.com/r/gamedev/comments/1qyqhxq/tell_me_what_should_be_hybrid_casual_game_length/).
  - Historic Voodoo publishing thresholds quoted in 2019: D1 45%, D7 17%, CPI about $0.30 (2019; conditions have since tightened) — [r/gamedev 2019](https://reddit.com/r/gamedev/comments/ca7etf/which_hypercasual_publisher_to_choose/).
- **Hybrid-casual as the default**: a 2026 opinion post says pure hyper-casual sees about 5–8% D7 while hybrid targets 15–20% D7, because "UA got expensive and ad revenue alone isn't as reliable." The post got low upvotes (11%), so treat it as one person's view — [r/gamedev](https://reddit.com/r/gamedev/comments/1sai8bv/is_hybridcasual_quietly_becoming_the_default_model/).
- **Ads-only casual games do not pay back UA**. FootIQ, a football micro-game (Sep 2026), has CPI about $0.50 (FR/ES/UK) and ARPU about $0.018 from AdMob only. That recovers 3.6% of CPI; OP would need about 28x more revenue per user to break even — [r/gamedev](https://reddit.com/r/gamedev/comments/1wrep99/my_mobile_game_has_a_050_cpi_and_a_0018_arpu_is/). Commenters:
  - You must design for whales; ARPU needs to be "$5+ in order for the UA to be profitable at scale" (u/PartTimeMonkey).
  - "Mobile has been dead for indies for more than 10 years... about as much chance of success as winning the lottery" (u/YKLKTMA).
  - The FootIQ name collides with at least 5 similarly named apps, a saturated niche (u/CrashNowhereDrive).
  - Soft-launch in one cheap market before spending (u/MeaningfulChoices).
- **Board/word/party games**:
  - Word and trivia games are the core of the 500K-download vibe-coded studio — [r/vibecoding](https://reddit.com/r/vibecoding/comments/1rukoak/i_vibe_coded_over_12_mobile_apps_and_games_and/).
  - A backgammon game (May 2026) got 2,000+ downloads, but broad Google Ads made it 78% Turkey. It had only 5 purchases, 3 of them from one whale. Rewarded eCPM was about $5.60, and ₺159 localized pricing caused sticker shock — [r/gamedev](https://reddit.com/r/gamedev/comments/1tl7vse/launched_a_backgammon_game_2_weeks_ago_2000/).
- **Hybrid / IAP-led sim games can monetize**: a football club owner sim (Oct 2026) reached about 30k installs in about 2 weeks. — [r/gamedev](https://reddit.com/r/gamedev/comments/1xdbyt7/my_mobile_game_has_no_energy_bars_and_no_loot/)
  - On Android it got about 5–6 purchases per 100 installs.
  - Cash packs were 75% of IAP revenue and remove-ads 11%.
  - Ad revenue was "well under a tenth" of IAP.
  - iPhone users spend about 60% more per purchase.
- **Premium (paid) mobile games struggle**: one game (Sep 2026) priced at $2.99 sells about 1 copy/day after 2.5 years. The dev is testing free-to-play with a one-time $9.99 unlock on iOS only, because "Google Play does not allow a free app to return to paid later" — [r/gamedev](https://reddit.com/r/gamedev/comments/1wopvwn/after_25_years_my_premium_mobile_game_sells_about/).
- **Apps that work (2025–26 examples)**:
  - Offline transcription and TTS with no API cost — [LoroNote](https://reddit.com/r/AppBusiness/comments/1x3uagl/my_offline_transcription_app_made_76k_in_the_last/).
  - Sobriety and supplement trackers — [JEulerius](https://reddit.com/r/AppBusiness/comments/1ue43sy/so_guys_i_have_officially_reached_the_1000_mrr/).
  - A localized finance tool for Brazil — [Parceladinho](https://reddit.com/r/AppBusiness/comments/1vw950q/my_app_was_dead_i_killed_the_free_trial_doubled/).
  - A "boring" satellite-dish alignment app built by reading negative reviews of high-rating incumbents — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1x6gg5o/i_built_the_most_boring_app_i_could_think_of/).
  - AI-feature apps copied from top charts — [$35K AMA](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/).
- **Saturated / "spam" categories per Apple review**:
  - Astrology/horoscope: "we simply have enough of these types of apps on the App Store, and they are considered a form of spam" (2023) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/17j6m87/my_app_was_rejected_due_to_43/).
  - Dating (2023) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/18rmu97/app_store_rejected_my_dating_app_guideline_43/).
  - TTS clone, Jan 2026 — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1q4rljp/apple_rejected_my_app_for_spam/).
  - File manager, Aug 2026 — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1w08hqf/rejected_43_design_spam/).
- **Community backlash against commodity apps**:
  - "The world has enough to-do lists... please stop mass producing apps" (Mar 2026, 650+ upvotes) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1s3t34t/please_learn_to_love_programming_again_im_begging/).
  - Complaints about "LLM design smell" making new apps look alike — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1ul7q2s/can_we_talk_about_llm_design_smell/).
  - A dev's app name "flooded with clones" — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1x2a8lb/my_app_name_got_flooded_with_clones_apple_took_down/).
- **Fitness is called saturated**: a year-long advanced-lifting tracker failed; OP opened with "fitness niche (yeah I know)" — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1tzglrk/i_am_giving_up_on_my_app/).

### Inferences
- The categories that work for solo devs share low marginal cost (on-device or no backend), a clear pain point, and willingness to pay via subscription.
- Simple games appear to work mainly when they add a progression or meta layer (roguelite, RPG, tower-defense idle) and monetize through IAP. Banner/interstitial-only casual games are the most commonly reported failures.
- Fully generic categories (to-do, habit, astrology, dating, fitness logging, flashlight-type utilities) face both 4.3 rejection risk and clone competition.

### Gaps
- No Reddit firsthand data in 2025–26 on merge, sort or idle games specifically from solo devs, beyond "The Tower"-inspired Lone Tower.
- No firsthand eCPM-by-geo tables beyond single data points: rewarded about $5.60 in Turkey; a commenter's self-researched benchmarks of interstitial about $2.5–5 and rewarded about $8–18 (unverified; [comment](https://reddit.com/r/gamedev/comments/1wrep99/my_mobile_game_has_a_050_cpi_and_a_0018_arpu_is/)).

---

## 3. What revenue numbers do people share, and what is the typical (median) first-time outcome?

### Takeaway
The typical first-time outcome reported on Reddit is **near zero to a few hundred dollars per month**:
- 12 downloads a month;
- $2 of ad revenue;
- €100 MRR after 4 years;
- $100–200/month from 3 apps;
- about $1,200/year from 9 apps;
- $50 total from 7 Google Play games.

Visible "wins" cluster at $1k–$10k MRR after 1–8 years. Five-figure monthly results are rare, often unverifiable, and sometimes followed by account bans.

### Cited Findings

**Low-end and "median-like" results (most common)**
- APP, May 2026: 12 first-time downloads last month after 1.5 years. "Classic mistake of building before validating... zero audience" — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1tjtl6x/i_need_a_reality_check_12_downloads_last_month_on/).
- APP, Nov 2025: €100 MRR after 4 years, ASO only, no ads [screenshot posted] — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1or5ktu/just_reached_100_mrr_after_4_years/).
- APP, Oct 2025: a senior iOS dev's 3 apps earned 2,500 downloads and $100–200/month despite MacStories coverage — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1ogkkb0/senior_ios_dev_by_day_indie_developer_by_night/).
- APP + GAME, Oct 2026: 9 apps in 1 year earned about $1,200 total, about $800 of it from Android. Selling one Android app outright for $4,000 was "the biggest single payday" — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1wyytct/journey_solo_dev_9_apps_in_1_year_with_95_job_and/).
- APP, Jul 2025: "first $100 from my apps" about 6 months after launch — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1m9ok1f/just_earned_my_first_100_from_my_apps/).
- APP, Nov 2025: $70 MRR after quitting a 9–5 for a small iOS portfolio — [r/micro_saas](https://reddit.com/r/micro_saas/comments/1ov2w27/small_win_hit_70_mrr_after_quitting_my_95_to_go/).
- GAME, Jan 2025: "first $2" in ad revenue — [r/gamedev](https://reddit.com/r/gamedev/comments/1i8wy44/i_made_my_first_2_with_my_mobile_game_breaking/).
- GAME, May 2024: GeoMaze spent $150.36 on Google Ads for under 1,000 installs and earned $5.24 from AdMob, a net loss of $145. Many early "conversions" were bots. About 100 hours of development — [r/gamedev](https://reddit.com/r/gamedev/comments/1cqir4f/post_mortemanalysis_making_mobile_games_sucks_or/).
- GAME, Sep 2026 comment: "All 7 games I released on Google Play made me about $50 over several years" — [r/IndieDev](https://reddit.com/r/IndieDev/comments/1w7dssh/how_my_solo_developed_hobby_mobile_game_made_over/).
- GAME, Jan 2026, **Flappy Bat (Godot, Android)**, year 1 [store link given in post; the post itself is the data]. — [r/gamedev](https://reddit.com/r/gamedev/comments/1q4u7qf/mobile_hobby_dev_what_my_first_game_earned_in/)
  - 2025: 6,400 downloads (13,000 lifetime), DAU 71, D7 about 12%, 4.7 stars from 450 reviews, about 60 minutes of play per install.
  - Gross $1,694.60: IAP $1,146.60 (67.5%) and ads $548 (32.5%).
  - About €800 spent on Google Ads, so "actual profit is really slim."
- GAME, Dec 2025: a second F2P puzzle game with D1 27–29% and D7 about 10% had zero purchases. US Google Ads traffic was "expensive and looked like a junk" — [r/gamedev](https://reddit.com/r/gamedev/comments/1pwyh1r/my_second_game_with_25_d1_retention_and_another/).

**Mid-range wins ($1k–$10k/month)**
- APP, Dec 2025: first iOS app's first week brought 107 units and $468 in proceeds [screenshot posted] — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1pfpwq0/just_launched_my_first_ios_app_and_the_first_week/).
- APP, Mar 2026: SinceWhen made $240 and 370+ installs in 10 days with a one-time IAP, raising the price from $4.99 to $9.99 — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1rro8ta/got_240_revenue_and_370_installs_in_10_days_of_my/).
- APP, May 2026: a Japanese learning app passed 10,000 users and $1,000 in its first weeks. Under $100 paid to small creators produced shorts with about 100K views each — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1tqwlvx/my_japanese_learning_app_hit_over_10000_users_and/).
- APP, Jun 2026: a Mac dictation app made $2,184 in 30 days with cheap lifetime pricing — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1u5i8k1/i_made_2184_in_the_last_30_days_from_a_small_mac/).
- APP: $944 MRR (GainFrame), $1,295 MRR (LoroNote), $1.6k MRR (Parceladinho), $1,000 MRR / $4–5k per month revenue (JEulerius), $10k MRR after 8 years (Vythm). Links are in section 1.
- GAME: $11,115 first month falling to about $30/day IAP (Bricks Breaker RPG); over $10K lifetime (Truth or Dare 2); over $200K lifetime after 96 releases (Lone Tower). Links are in section 1.

**High-end and unverified claims**
- $35K in 30 days from 20 AI apps (Mar 2025, apps hidden) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/).
- "6 B2C apps to $48,000/month" (Dec 2025). No apps named; commenters: "Proof or invalid tips," "They probably don't exist. He's selling courses" — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1pjy1kq/i_scaled_6_b2c_apps_to_48000month_here_are_12/).
- "$100k MRR" account terminated (Jul 2026, 43% upvoted, unnamed) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1va1tay/apple_killed_our_whole_developer_account/).
- An "indie dev with 5M+ organic downloads," 8 apps, 5 years full-time (Jul 2026). No revenue given — [r/FreeAppReviews](https://reddit.com/r/FreeAppReviews/comments/1uzulo6/indie_dev_with_5m_organic_download_here_post_your/).
- **Exit values for tiny apps**: one dev listed live iOS apps (habit tracker, PDF signer, voice changer and others) at **$200–450 per app** (Jun 2026) — [r/iOSAppsMarketing](https://reddit.com/r/iOSAppsMarketing/comments/1uaz2j5/selling_live_ios_apps/). Larger exits mentioned: $4,000 (Android app), $44k (fluid simulation app), $410,000 (Seraleev).

### Inferences
- Taken together, the first-attempt median is plausibly under $100/month. Most first apps and games never recoup even small ad tests.
- People reaching about $1k/month usually needed several apps or several years. People at $10k+ usually had a distribution edge or a hit after many attempts.
- These posts are self-selected, so the true median is likely lower than this sample suggests.

### Gaps
- The main r/iOSProgramming survey thread "Developers: How much do you earn with your apps?" (Jun 2024) shows as **[removed]**, so its distribution could not be read — [link](https://reddit.com/r/iOSProgramming/comments/1di4d6c/developers_how_much_do_you_earn_with_your_apps/).
- I found no systematic Reddit poll with a median for 2025–26.
- Screenshot contents (App Store Connect, RevenueCat) could not be inspected directly.

---

## 4. Common strategies: app portfolios / "app factory," cloning top-chart apps, reskinning, ASO-first, TikTok organic, publishers

### Takeaway
- **Portfolio / app-factory**: the most-endorsed strategy among earners, because "ASO is hit or miss." It is also the most criticized by the wider dev community, as AI-generated shovelware that causes 4.3 rejections.
- **Cloning or improving top-chart apps**: done openly. Devs pick apps with proven revenue and fix complaints from negative reviews.
- **TikTok organic** in 2025–26 means image carousels/slideshows posted in volume from warmed-up accounts, sometimes via paid "slideshow farms."
- **ASO**: localization is the main lever cited.
- **Publishers**: discussed mostly for hybrid-casual CPI tests, with little evidence of payouts.

### Cited Findings
- **Portfolio / snowball**:
  - "The good part isn't the first app. It's the tenth." Individual apps making $10, $20, $30 or $50 add up to a steady flow (Dec 2025, anecdotal) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1pkfazb/what_really_happens_after_you_publish_10_apps_on/).
  - 20 apps behind the $35K AMA — [link](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/).
  - 12+ apps with 3–4 earning most of the money — [link](https://reddit.com/r/vibecoding/comments/1rukoak/i_vibe_coded_over_12_mobile_apps_and_games_and/).
  - 96 games for one hit — [link](https://reddit.com/r/IndieDev/comments/1w7dssh/how_my_solo_developed_hobby_mobile_game_made_over/).
  - An 11th app made "$3000 on the first week" (Sep 2026). This post names several marketing tools and may be promotional — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1wsg3bt/launched_my_11th_app_with_3000_on_the_first_week/). Its process:
    - Find creators with AI-tutorial videos over 100k views.
    - Pay about $2.50 CPM, recruiting 20 UGC creators in week 1.
    - Make about 20 AI UGC videos modeled on viral hooks.
- **Cloning / top-chart mining**:
  - "I look at the top chart in the US App Store (in all the categories) to see if some of these apps are easy to build and if they are making some decent money" — [$35K AMA](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/).
  - The satellite-dish app was built by reading negative reviews of incumbents with thousands of ratings — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1x6gg5o/i_built_the_most_boring_app_i_could_think_of/).
  - A mobile game dev (2023) says he takes UI/UX features from the best games in a category and that it "works almost 80% of times" [unverified, 2023] — [r/gamedev](https://reddit.com/r/gamedev/comments/16ymayf/is_mobile_gaming_under_estimated_in_earning_money/).
  - Large companies clone too: Kingshot copied the indie game Thronefall and was reportedly making about $1M/day (2025) — [r/gamedev](https://reddit.com/r/gamedev/comments/1kvu56d/kingshot_a_top_30_mobile_game_with_35m_revenue_in/).
  - An AI summary of 90 Starter Story interviews lists "Copy something that already works... clone a $100M incumbent, undercut, change geography" as the top pattern (2026). This is secondary and AI-generated — [r/micro_saas](https://reddit.com/r/micro_saas/comments/1uepccr/i_analysed_90_of_starter_story_videos_to_find_the/).
- **ASO-first**:
  - Localization into 5+ European languages — [$35K AMA](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/); [LoroNote](https://reddit.com/r/AppBusiness/comments/1x3uagl/my_offline_transcription_app_made_76k_in_the_last/).
  - €100 MRR after 4 years on ASO alone — [link](https://reddit.com/r/iOSProgramming/comments/1or5ktu/just_reached_100_mrr_after_4_years/).
  - Concern that ASO alone is getting harder: a new dev's hope of reaching $10k MRR "with pure ASO is slowly fading away because of competition and apple's ad position changes" — [comment, r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/). There is also a Dec 2025 image-only thread titled "Did Apple just kill ASO?"; I could not read its content — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1pq83gz/did_apple_just_kill_aso/).
  - Contrarian view: "ASO is overrated. Marketing > Development" (from the unverified $48K poster) — [link](https://reddit.com/r/AppBusiness/comments/1pjy1kq/i_scaled_6_b2c_apps_to_48000month_here_are_12/).
- **TikTok organic and slideshows**:
  - About 10 carousels/day after a 2-week account warm-up — [Parceladinho](https://reddit.com/r/AppBusiness/comments/1vw950q/my_app_was_dead_i_killed_the_free_trial_doubled/).
  - Automated slideshows: 10 accounts x 3 posts/day giving about 5k installs/month at 0.3–1% view-to-install. This is a vendor post promoting a tool — [r/AppMarketingHelp](https://reddit.com/r/AppMarketingHelp/comments/1p66m6u/automated_my_way_from_0_to_10000_app_downloads/).
  - A founder of an app-discovery site ranks "organic slideshows" as the highest-ROI channel, TikTok only, followed by paid "Canvas UGC" and "TikTok farms." Vendor bias disclosed — [r/iOSDevelopment](https://reddit.com/r/iOSDevelopment/comments/1x9rypq/rank_your_app_marketing_channels_stier_to_ftier/).
  - Hiring posts offer creators pay per 1,000 views to post slideshows on accounts owned by the app company, with budgets of $15K and $7K (2026) — [r/BrandsCreators](https://reddit.com/r/BrandsCreators/comments/1x9kllf/hiring_get_paid_for_posting_tiktok_slideshows_for/); [r/BrandsCreators](https://reddit.com/r/BrandsCreators/comments/1w8vf2a/hiring_get_paid_for_posting_ai_ugc_tiktok/).
  - Counterpoint: "creating content manually every day was exhausting" and it didn't work for some devs — [comment](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/). Another dev says TikTok and YouTube "shadow ban" app developers and paid TikTok promotion brought bot views — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1x96on7/is_ios_app_dev_worth_it_for_indie_devs_anymore/).
- **Pricing tactics that recur in 2026**:
  - Removing free trials and raising prices (Parceladinho).
  - "God bless the man who suggested to remove free trials": a $2 first month instead of a weekly trial (Oct 2026) — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1xcq29t/god_bless_the_man_who_suggested_to_remove_free/).
  - A "Try for Week" label replacing the trial, with a claimed $100 to $700 MRR. The post was downvoted to 47% — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1qp3ftj/one_small_paywall_text_change_took_my_app_from/).
  - Weekly subscriptions at $1.99 in a game — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1sne0iq/a_game_i_created_made_over_10k_by_selling_199/). A commenter there calls weekly subs "predatory."
- **Ad-load tuning in games** (studio, not solo): an A/B test in "Hello Kitty: Kids Hospital" compared 1 ad versus 2 at launch (Nov 2025) — [r/gamedev](https://reddit.com/r/gamedev/comments/1ov5mcr/we_cut_one_early_ad_in_our_kids_game_and_somehow/).
  - R1 +1.1% and R2–3 +2.1%.
  - Ad revenue −0.5%, purchase revenue +85%, total +5%.
  - "No ads at all tanked revenue hard."
- **Discounting premium games**: an audit of 15 Google Play sales found purchases rose in all 15 but proceeds rose in only 13. A Halloween sale gave 2.66x purchases but 0.80x proceeds; the best sale gave 25.15x purchases and 9.36x proceeds (Sep 2026) — [r/gamedev](https://reddit.com/r/gamedev/comments/1wrbf1g/i_audited_15_sales_from_my_paid_mobile_game_all/).
- **Publishers (hyper/hybrid-casual)**:
  - The Voodoo model (dated): "Prototype, Test, Iterate or Kill"; the publisher pays for a roughly 4-day marketing test (2020–21) — [r/gamedev 2021](https://reddit.com/r/gamedev/comments/pcug12/what_do_you_know_about_yodo1_and_voodoo_looking/).
  - A 2019 publisher test acquired only 55 users — [r/gamedev 2019](https://reddit.com/r/gamedev/comments/dlll8u/to_those_who_entered_a_retention_test_phase_with/).
  - In 2025–26, first-time devs still ask whether to approach publishers — [r/gamedev](https://reddit.com/r/gamedev/comments/1kai2td/firsttime_indie_dev_here_should_i_look_for/).
  - One dev sent a game to 2 publishers and got no response — [r/gamedev](https://reddit.com/r/gamedev/comments/1pwyh1r/my_second_game_with_25_d1_retention_and_another/).

### Inferences
- The "app factory" works when each app is cheap enough to build that the portfolio can absorb a high failure rate. Reported failure rates: most apps fail, about 3–4 of 12 carry revenue, and 1 of 96 games hit.
- AI coding has lowered build cost so much that Reddit discussion has shifted almost entirely to **distribution and pricing**. That same flood is what triggers 4.3 rejections and community backlash.
- TikTok slideshow tactics are being industrialized through farms and paid view-based creators. Their effectiveness for newcomers is likely falling as more apps use them, though no data shows that yet.

### Gaps
- No firsthand 2025–26 account of a solo dev reskinning a template and selling it at scale.
- No verified publisher revenue-share payout data.
- No hard data on how TikTok slideshow conversion has changed over time.

---

## 5. Common mistakes, failure post-mortems and warnings

### Takeaway
The dominant failure pattern is **building without distribution**. Other recurring failures:
- buying cheap untargeted installs (wrong geos, bots) that hurt ranking;
- ads-only monetization in short-session games;
- generous free trials that users cancel on day 1;
- platform risk: Apple 4.3 spam rejections, sudden account terminations with frozen payouts, and Google Play's 12-tester / 14-day closed testing gate for personal accounts.

### Cited Findings
- **No distribution / no audience**:
  - "Classic mistake of building before validating... zero audience" (12 downloads/month) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1tjtl6x/i_need_a_reality_check_12_downloads_last_month_on/).
  - "app developers primary job is a ShitTok promoter. Coding is just a side gig" — [comment](https://reddit.com/r/AppBusiness/comments/1tzglrk/i_am_giving_up_on_my_app/).
  - Lone Tower's dev admits to "practically zero marketing" and "the familiar dream... that if we build what we believe is an amazing game that players will naturally find it" — [r/IndieDev](https://reddit.com/r/IndieDev/comments/1w7dssh/how_my_solo_developed_hobby_mobile_game_made_over/).
- **Paid ads burning money**:
  - The giving-up fitness app post (Jun 2026). Commenters said:
    - Ads "create a traffic spike, then everything goes flat."
    - Turkish casual-game studios "keep the ads running only as long as the game makes more money than the ad spend."
    - "Cheap installs from the wrong country are the most expensive mistake you can make early" because stores read early uninstalls as a quality signal.
    - Get your first 50 reviews from real users met in person.
    - Source: [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1tzglrk/i_am_giving_up_on_my_app/).
  - About $5 per download via ads and about 1 in 1,000 converting to a sale (Oct 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1x96on7/is_ios_app_dev_worth_it_for_indie_devs_anymore/).
  - GeoMaze's bot "conversions" from Google Ads — [r/gamedev](https://reddit.com/r/gamedev/comments/1cqir4f/post_mortemanalysis_making_mobile_games_sucks_or/).
  - Broad Google Ads made a backgammon game 78% Turkish with near-zero IAP — [r/gamedev](https://reddit.com/r/gamedev/comments/1tl7vse/launched_a_backgammon_game_2_weeks_ago_2000/).
- **Wrong monetization**:
  - FootIQ: ads-only ARPU of $0.018 against $0.50 CPI. Advice: "monetization can't be just an afterthought... You have to integrate your monetization strategy into the design" — [r/gamedev](https://reddit.com/r/gamedev/comments/1wrep99/my_mobile_game_has_a_050_cpi_and_a_0018_arpu_is/).
  - Flappy Bat's dev: "Think about monetization from the beginning" and make the concept clear from the icon and title alone — [r/gamedev](https://reddit.com/r/gamedev/comments/1q4u7qf/mobile_hobby_dev_what_my_first_game_earned_in/).
  - Day-1 trial cancellations — [Parceladinho](https://reddit.com/r/AppBusiness/comments/1vw950q/my_app_was_dead_i_killed_the_free_trial_doubled/).
  - An over-generous coin economy plus a paywall that pushes "Watch ad" over "Buy" — [backgammon](https://reddit.com/r/gamedev/comments/1tl7vse/launched_a_backgammon_game_2_weeks_ago_2000/).
- **AdMob invalid-traffic limits**: Google limited ad serving because testers weren't registered as test devices. It took about 14 days to lift — [r/gamedev](https://reddit.com/r/gamedev/comments/1pwyh1r/my_second_game_with_25_d1_retention_and_another/).
- **Apple account terminations (platform risk)**:
  - Seraleev: $33,680 MRR and 1,209 active trials gone; $108,878 frozen (Sept 2023). — [r/iOSProgramming 2024](https://reddit.com/r/iOSProgramming/comments/1cor2t5/taking_on_apple_in_court_their_mistake_wiped_out/)
    - Commenters note the ban cited "association with a previously closed fraudulent account." One suspects deceptive pricing, pointing to an $84.99 "forever IAP" on a before/after collage app — [comments](https://reddit.com/r/iOSProgramming/comments/1d2ofpf/how_to_create_mobile_apps_that_make_3000_a_day/).
    - Advice: one company per app, or don't depend on one platform.
  - A Unity endless runner (4.8 stars, about 80 ratings) got a "Pending Termination Notice" for "concept or feature switch schemes" (Jan 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1qigdq1/pending_termination_notice_for_my_app/).
  - A claimed $100k MRR account was terminated over "misleading purchase flows" and "scareware tactics" (Jul 2026, unverified) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1va1tay/apple_killed_our_whole_developer_account/).
  - A terminated account with a year of no response (May 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1tcji41/apple_developer_account_terminated_i_want_to_take/).
  - A trademark complaint over a bundle ID (Oct 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1wyaiim/trademark_complaint_over_a_bundle_id_that_matches/).
- **App Store 4.3(a)/(b) spam rejections** (frequent in 2025–26):
  - A first-time dev met with App Review one-on-one (Mar 2026). — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1s0z4jr/experiences_on_beating_guideline_43a_design_spam/)
    - Rejections are driven by "market saturation."
    - You need "at least one unique feature that differentiates you from the top apps in that category."
    - Reviewers "rely heavily on the Notes to Reviewer."
    - 4.3 came back on a later resubmission anyway.
  - 4 unrelated new apps were instantly auto-rejected under 4.3(a) (Aug 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1w07lj9/instant_auto_reject_guideline_43a_design_spam/).
  - An existing app update was rejected under 4.3(a) after adding RevenueCat plus the Meta SDK. The App Review Board overturned it on appeal (Sep 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1w9ojf7/existing_app_repeatedly_rejected_under_43a_after/).
  - A 50-app one-language-per-app flashcard series was rejected for duplicating the dev's own app (Jul 2025) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1mbnn4e/app_rejected_under_43a_educational_flashcard_apps/).
  - 4.3(b) on a social app was cleared by rewriting all store copy away from the "saturated category" (Mar 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1s0nb97/got_rejected_by_the_app_store_5_times_before/).
- **Google Play closed-testing gate (personal accounts)**:
  - The new requirement drew immediate complaints when announced, originally framed as 20 testers (Nov 2023) — [r/androiddev](https://reddit.com/r/androiddev/comments/17tmfkc/what_do_you_guys_think_of_the_new_google_play/).
  - By 2025 posts describe **12 testers opted in for 14 days**, then a production-access review.
  - A dev did 14 days with 12 testers and was told to do another 14 days (Sep 2025) — [r/androiddev](https://reddit.com/r/androiddev/comments/1n7jeyq/im_officially_done_with_google_plays_ridiculous/).
  - Rejected because testers "weren't engaged enough" — [r/androiddev](https://reddit.com/r/androiddev/comments/1ngj1mk/im_beyond_frustrated_with_google_play_right_now/).
  - Paid "12+ testers for 14 days" services have appeared — [r/androiddev](https://reddit.com/r/androiddev/comments/1n8389g/so_now_closed_testing_on_google_play_is_a_business/).
  - A $12 tester service was used, then a VPN app was rejected because it needed an organization account — [r/androiddev](https://reddit.com/r/androiddev/comments/1n5sype/why_google_is_killing_individuals_android_dev/).
  - A personal account went through 3 months of rejections; the same app on a new business account ($25) was approved in 3 days (May 2025) — [r/androiddev](https://reddit.com/r/androiddev/comments/1kr1i7p/google_play_personal_account_wasted_42_days_of_my/).
  - Tester-swap subreddits exist, e.g. "need 20 active testers for 14 days" (Sep 2026) — [r/AndroidClosedTesting](https://reddit.com/r/AndroidClosedTesting/comments/1wfiao2/need_20_active_tester_for_14_days_chota_guru_kids/).
- **Over-building and burnout** (games): a premium mobile game kept in maintenance for 2.5 years at about 1 sale/day; "hope is no longer a plan" — [r/gamedev](https://reddit.com/r/gamedev/comments/1wopvwn/after_25_years_my_premium_mobile_game_sells_about/).
- **Clones and copycats** of successful apps' names and screenshots, with slow Apple takedown disputes (Oct 2026) — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1x2a8lb/my_app_name_got_flooded_with_clones_apple_took_down/).
- **Reddit self-promotion is hostile**: "people see a cash-grabber and dismiss it as AI slop in half a second" — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1tqwlvx/my_japanese_learning_app_hit_over_10000_users_and/).

### Inferences
- Platform risk is concentrated. One Apple decision can wipe a whole portfolio, and the reported bans tend to follow aggressive paywalls or many similar apps on one account. That suggests the app-factory and hard-paywall playbook carries real termination risk.
- On Android, a business/organization account appears to avoid the 12-tester gate and is reported to be reviewed faster. That makes it a practical recommendation, though only a few anecdotes support it.

### Gaps
- No Reddit data on how often 4.3 appeals succeed. There are only individual cases, some won on appeal and some not.
- No firsthand 2025–26 reports of Google Play account bans for solo game devs specifically, apart from AdMob limits.

---

## 6. Opinions on course-sellers and Instagram/TikTok/X "app gurus": legit?

### Takeaway
Reddit devs are broadly skeptical. Common views:
- "I made $X MRR" posts and Starter Story-style videos distort expectations.
- Unnamed-app success claims are assumed to be course or tool marketing.
- Many viral "playbooks" are cross-posted promotion for no-code tools or UGC services.

Long-grind posts (8 years to $10k MRR; 2 years to $1K MRR) are explicitly praised as "way more useful" than overnight stories. I found no Reddit thread analyzing a specific Instagram app-course seller by name.

### Cited Findings
- "All the glitz and glam of social media app founder superheroes is destroying real life expectations for a lot of solo app developers" — [r/iOSProgramming, Nov 2025](https://reddit.com/r/iOSProgramming/comments/1p2xt96/the_road_to_1kmrr_is_not_immediate_nor_glamorous/).
- The 8-year $10k MRR dev: "If you just scroll through that subreddit or watch videos from Starterstory, it's easy to get a wrong picture of what reality looks like for many of us." A commenter adds that posts like his are "way more useful than the '$20k MRR in 3 months' ones" — [r/AppBusiness, Feb 2026](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/).
- On the unverified "$48K/month from 6 apps" post: "They probably don't exist. He's selling courses"; "Proof or invalid tips" — [r/AppBusiness, Dec 2025](https://reddit.com/r/AppBusiness/comments/1pjy1kq/i_scaled_6_b2c_apps_to_48000month_here_are_12/).
- On the $35K AMA: "most of these 'how i made xx money' are fake anyway... those who make real money rarely goes to reddit and brag." Another commenter suspected that people talking about their money-making plan "have a plan for sale" — [r/iOSProgramming, Mar 2025](https://reddit.com/r/iOSProgramming/comments/1jaffjf/made_35k_in_sales_over_the_past_30_days_as_an/).
- On a 12-app vibe-coding claim: "I will believe once op drops names of the apps... this post is AI and that pic is bullshit" — [r/vibecoding, Mar 2026](https://reddit.com/r/vibecoding/comments/1rukoak/i_vibe_coded_over_12_mobile_apps_and_games_and/).
- Viral case-study posts are promotional: the PushScroll "$30k/month" text was posted near-identically to about 15 subreddits by one account linking a no-code app builder and its own r/ViralApps (Jan 2026) — [example](https://reddit.com/r/AppBusiness/comments/1qkvyhg/app_makes_you_do_pushups_before_you_can/).
- Other vendor-authored playbooks:
  - A UGC playbook by a co-founder of an AI app tool, warning about "bad advise on X" while selling a related service — [r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1umdt70/how_to_scale_your_mobile_app_to_10k_with_ugc/).
  - A marketing-channel tier list by a discovery-platform founder — [r/iOSDevelopment](https://reddit.com/r/iOSDevelopment/comments/1x9rypq/rank_your_app_marketing_channels_stier_to_ftier/).
  - An "automated TikTok slideshows" post selling "UGC Fleet" — [r/AppMarketingHelp](https://reddit.com/r/AppMarketingHelp/comments/1p66m6u/automated_my_way_from_0_to_10000_app_downloads/).
- "Get rich quick schemes of overnight success with 'use this 7 word prompt and make a full stack app in minutes'... when others try... it doesn't work" — [comment, r/AppBusiness](https://reddit.com/r/AppBusiness/comments/1r4j9bp/after_8_years_i_finally_hit_10k_mrr_what_a_ride/).
- Broader backlash in r/iOSProgramming against subscription-app mass production and "AI slop" apps:
  - "Please stop mass producing apps" — [link](https://reddit.com/r/iOSProgramming/comments/1s3t34t/please_learn_to_love_programming_again_im_begging/).
  - "So tired of seeing AI apps" — [link](https://reddit.com/r/iOSProgramming/comments/1pp3ydj/tbh_im_so_tired_of_seeing_ai_apps_or_even_ai_made/).
  - "Now most of this sub is AI posting, self promotion, and app marketing questions" — [link](https://reddit.com/r/iOSProgramming/comments/1txl3j1/i_miss_the_programming_aspect_of_ios_programming/).
- A balanced veteran view (15+ years building, about 3 years with paywalled apps): start shipping, but "there are no guarantees, keep your expectations very low, don't bet your house on it, don't quit your job, treat it like a hobby" — [r/iOSProgramming, Nov 2025](https://reddit.com/r/iOSProgramming/comments/1p3q6q7/waiting_for_a_million_dollar_app_idea_to_start/).

### Inferences
- Reddit's working rule for judging a guru claim is: no named app plus a high revenue figure plus a sales link equals assumed course or tool marketing.
- Named apps with RevenueCat or App Store Connect screenshots and modest numbers ($1k–$8k/month) get the most trust.
- The pattern of vendors writing "playbooks" means even popular tactics (slideshows, UGC at $X CPM) may be overstated by people selling them.

### Gaps
- I found no Reddit thread reviewing a specific Instagram/TikTok "app course" (by name) with refund experiences or outcomes from buyers.
- Searches for "guru" or "course" mostly returned unrelated content. This angle may need non-Reddit sources (YouTube comment sections, Trustpilot), which were out of scope.
