# Build Stack, Costs, and Store Rules for Solo/Indie Mobile Games and Apps (as of 2026-10-25)

Research date: 2026-10-25. Store policies and prices change often; every item below carries the date or version that the source gives. "Secondary" means a third-party blog or aggregator rather than the vendor or store. Reddit posts are first-hand anecdotes, not representative data.

---

## Q1. Games: which engine for simple 2D/3D casual mobile games, current Unity pricing/runtime-fee status, and which ad/analytics SDKs get integrated

### Takeaway
For a simple casual mobile game in 2026, Unity is still the default when ad monetization matters most, because it has the most mature ad/IAP SDK ecosystem, and its Runtime Fee was cancelled in September 2024. Unity Personal is free up to $200K revenue/funding. Godot (MIT, free) is the main free alternative for 2D. As of April 2026 its Foundation maintains official Play Billing, Play Games and StoreKit 2 plugins, but ads still come from community plugins. Defold (very small builds, official ad extensions in 2026) and GameMaker ($99.99 one-time commercial license) are niche options. On the ad side, AppLovin MAX leads mediation, with AdMob and Unity LevelPlay behind it. GameAnalytics and Firebase are the usual analytics.

### Cited Findings
**Unity pricing and the Runtime Fee**
- Unity cancelled the Runtime Fee for games customers "with immediate effect" on Sept 12, 2024 (CEO Matt Bromberg's blog post). Unity went back to seat-based subscriptions. — [Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee); [CG Channel, 2024-09-13](https://www.cgchannel.com/2024/09/unity-scraps-controversial-runtime-fee-but-raises-prices)
- Unity Personal stays free. Its revenue/funding ceiling rose from $100K to $200K. The "Made with Unity" splash screen is optional for Personal games built with Unity 6. — [Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee); [GameWorldObserver 2024-09-12](https://gameworldobserver.com/2024/09/12/unity-cancels-runtime-fee-new-pricing-changes)
- Unity Pro rose 8% to $2,200/seat/yr effective Jan 1, 2025 and is required above $200K annual revenue and funding. Enterprise rose 25%. — [CG Channel](https://www.cgchannel.com/2024/09/unity-scraps-controversial-runtime-fee-but-raises-prices)
- Unity's pricing-updates page says Pro and Enterprise get a further 5% increase starting Jan 12, 2026. A 2026 listing gives Pro at $2,310/yr per seat prepaid, or $210/mo. Enterprise is required above $25M annual revenue. Havok Physics is no longer bundled with Pro/Enterprise/Industry from Unity 6.3. — [Unity pricing updates](https://unity.com/products/pricing-updates) (the $2,310 figure came via a search snippet of a 2026 listing; confirm it on Unity's store page)
- Conflict: copies of Unity's page differ on whether the $200K threshold counts "revenue and funding" or funding only. Check the current wording. — [Unity pricing updates](https://unity.com/products/pricing-updates)
- Unity's CEO said in Feb 2026 that an upgraded Unity AI (beta at GDC, March 2026) would let developers create "full-fledged casual games" from prompts. This is a forward-looking company claim. — [WN Hub](https://wnhub.io/news/engines/item-50135); [Gigazine 2026-02-18](https://gigazine.net/gsc_news/en/20260218-unity-ai)
- A third-party earnings-call transcript (Q2 2026) says Unity announced Unity 7 with a beta planned for Q4 2026. This is unverified against Unity's own announcement. — [Benzinga transcript](https://www.benzinga.com/node/62182451)

**Godot**
- The Godot Foundation's April 2026 mobile update (tied to Godot 4.6 and 4.5.2) says it will improve and maintain core plugins: Godot Google Play Billing, Godot Google Play Games Services and Godot StoreKit 2 (IAP and achievements). Third-party plugins may still be needed for other services. — [Godot blog, Apr 2026](https://godotengine.org/article/godot-mobile-update-apr-2026/)
- A repost of that announcement says GPU-compatibility fixes cut crash rates from about 4% to under 1% for some games. This figure is not confirmed on the official post. — [GameDev.net](https://gamedev.net/news/2713-godot-mobile-update-april-2026/)
- Ads in Godot come from community plugins. Poing Studios' AdMob plugin (v5.0.0, Godot 4.2+, Android and iOS) supports banner, interstitial, rewarded and rewarded interstitial ads. — [Godot Asset Library](https://www.godotengine.org/asset-library/asset/2063); [GitHub poingstudios](https://github.com/poingstudios/godot-admob-ios)
- A 2025 academic Unity-vs-Godot 2D comparison found Godot easier to learn and use. Unity showed more stable performance and a more robust ecosystem. — [Preprints.org 202511.1981](https://www.preprints.org/manuscript/202511.1981/v1)
- Real example: a solo dev shipped a Suika-roguelite Godot game on iOS, then passed Google Play's tester requirement on the first try (r/androiddev, 2026-07-01). — [Reddit](https://reddit.com/r/androiddev/comments/1ukj54d/my_game_tension_head_has_just_been_approved_for/)
- Since mid-2026, Godot no longer accepts AI-authored code contributions to the engine itself. This governs engine contributions, not games made with Godot. — [PC Gamer via r/gamedev](https://reddit.com/r/gamedev/comments/1ujxb2z/godot_making_a_stance_on_ai_code/)

**Defold, GameMaker, Cocos, web-wrapped**
- Defold 1.13.0 (2026) made Vulkan the default on Android and removed deprecated paths. 1.13.1 (summer 2026) refreshed support for modern ad-mediation stacks, and official ad extensions were released. — [GameDev.net Defold summer newsletter 2026](https://gamedev.net/news/5363-defold-summer-newsletter-2026/) (secondary repost)
- Defold users praise its mobile optimization. Family Island (10M+ Play downloads) is cited as the biggest non-King Defold game. These forum threads date from around 2022. — [Defold forum](https://forum.defold.com/t/mobile-games-unity-vs-defold-vs-godot-which-engine/67042)
- GameMaker is free for non-commercial use, including mobile export. Commercial use needs a $99.99 one-time license (regional pricing applies). Console export needs Enterprise at about $79.99–$80/mo. — [GameMaker FAQ](https://gamemaker.io/en/help/articles/november-2023-pricing-terms-change-faq); [GameMaker get page](https://gamemaker.io/get); [TechRadar](https://www.techradar.com/gaming/consoles-pc/gamemaker-engine-transforms-its-business-model-and-introduces-a-one-time-fee)
- Web-wrapped HTML5 apps risk Apple guideline 4.2, which requires features, content and UI "that elevate it beyond a repackaged website". Guideline 4.7 separately allows HTML5/JS mini apps and mini games inside a host app, subject to privacy, IAP, content-filtering and age-restriction rules. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- A PWA wrapped as a Trusted Web Activity (Bubblewrap) was rejected twice for Play production access after closed testing. The dev's own logs showed testers had gone inactive 4–9 days before review (r/androiddev, 2026-07-22). — [Reddit](https://reddit.com/r/androiddev/comments/1v3knfg/twa_closed_testing_did_anyone_here_pass/)
- Non-engine route: a 1.5-dev team built a cozy farming game entirely in Expo/React Native (Skia + Reanimated, RevenueCat, PostHog, Sentry, EAS Update). It grossed $35K in 10 months. Pain points were CPU use and EAS Update's 1,000-asset limit (r/reactnative, 2026-10-10). — [Reddit](https://reddit.com/r/reactnative/comments/1x2cssg/we_built_a_farming_game_with_expo_react_native_10/)
- Another dev shipped a minimalist arcade game in Expo SDK 56 with Skia and no image or audio assets. TestFlight rejected the build until they added NSMicrophoneUsageDescription, because an audio library statically links the mic API. — [Reddit](https://reddit.com/r/reactnative/comments/1uqp2z5/finished_my_first_ever_game_built_in_react_native/)
- I found no reliable 2026 source on Cocos Creator's status.

**Engine recommendation sources**
- A 2026 comparison from a Unity studio (so Unity-biased) recommends Unity for mobile, citing its "mature mobile pipeline, profiling tools, ad/IAP SDKs, dominant market share". It recommends Godot for 2D indie work. — [Ocean View Games](https://oceanviewgames.co.uk/blog/posts/unity-vs-godot-vs-unreal-2026)

**Ad mediation and analytics SDKs**
- In PocketGamer.biz's 2025 sample of 175 games, 128 (73.1%) used AppLovin MAX. AdMob outperformed expectations in the top-downloaded (casual/hyper-casual-skewed) list, with more than twice LevelPlay's share there. — [PocketGamer.biz](https://www.pocketgamer.biz/nine-facts-about-the-mediation-space-in-2025)
- One guide says MAX, Unity LevelPlay and AdMob together held more than 90% of mediation in 2025, with MAX over half. AppLovin restricts ROAS campaigns to MAX users. These are secondary claims. — [Segwise](https://segwise.ai/blog/applovin-publisher-monetization-guide)
- Unity's ad platform "Vector" passed a $1B annual run rate (Q2 2026 earnings call, per transcript). — [Benzinga transcript](https://www.benzinga.com/node/62182451)
- GameAnalytics has official SDKs for Unity (Android, iOS, HTML5 and others) and Godot (MIT). A 2026 comparison says its Core tier stays free, with add-ons up to $499/mo. — [GameAnalytics SDK docs](https://docs.gameanalytics.com/integrations/); [Godot Asset Library](https://godotengine.org/asset-library/asset/5162); [Tech Insider (secondary)](https://tech-insider.org/?p=20371)

### Inferences
- Beginner default: Unity (C#, free under $200K) for ad-funded casual games, because the MAX, LevelPlay and AdMob Unity SDKs are first-class. Godot suits 2D/puzzle games where IAP matters more than ad mediation, or when the dev wants zero licensing risk. Expo/React Native works for UI- and timer-heavy "app-like" games (idle, farming, word, trivia), not physics-heavy games.
- Choose the engine with ad-SDK support in mind. MAX/LevelPlay support in Godot and Defold depends on community or extension work, so check plugin versions against the current engine release before you commit.

### Gaps
- Current Cocos Creator status for 2026 was not found.
- No verified 2026 per-engine share data for top-grossing indie mobile games.
- Whether the $200K Unity Personal threshold now counts revenue, funding, or both: Unity page copies conflict.
- Exact Unity Pro 2026 price on Unity's store page was not fetched directly. $2,310/yr is from a search snippet.

---

## Q2. Apps: SwiftUI vs React Native/Expo vs Flutter vs no-code/AI app builders, and the typical paywall, backend and AI stack

### Takeaway
In 2026 the common solo stack for a simple subscription or AI utility app is Expo/React Native (for iOS + Android) or SwiftUI (iOS-only), with RevenueCat for subscriptions/paywalls (free to $2.5K MTR, then 1%), Supabase or Firebase as the backend, and an LLM API called from a server function. Flutter is the other cross-platform option. No-code and AI builders (FlutterFlow, Rork) can ship store apps, but they have paid tiers for publishing. Apple's 4.2.6 "template/app generation service" rule also applies to apps that a builder service submits on a client's behalf.

### Cited Findings
**Frameworks**
- One 2026 indie-focused piece says Expo is the default for solo builders shipping iOS and Android. It cites one codebase, EAS builds and over-the-air (OTA) updates that ship fixes "in minutes between App Store releases". For iOS-only apps, Swift is "fully competitive". Expo SDK upgrades occasionally break prebuild and native modules. — [VP0 blog](https://vp0.com/blogs/indie-vibe-makers-expo-vs-native-swift/)
- The same source argues that AI agents now write both stacks fluently, so the question is "which fits what I'm shipping", not "which can I learn". — [VP0 blog](https://vp0.com/blogs/indie-vibe-makers-expo-vs-native-swift/)
- A Flutter boilerplate seller cites "Statista 2026" for Flutter at about 46% of cross-platform share vs React Native at 35–38%. This is vendor-reported and unverified. — [The Flutter Kit](https://theflutterk.it.com/blog/flutter-vs-react-native-2026)
- SwiftUI is recommended for iOS-only apps that need deep Apple integration (widgets, Live Activities, App Intents). — [The Swift Kit](https://theswiftk.it.com/blog/flutter-vs-react-native-vs-swiftui)
- First-hand, May 2026 ("VTapr" AI physique scanner): a solo dev built it in 4 weeks of focused time with Expo + RN + TypeScript, Supabase (auth, Postgres, edge functions), Claude API, RevenueCat ($14.99/mo or $99.99/yr) and EAS Build/Submit. They "never opened Xcode for a non-debug build". They found Claude/Cursor support better for JS/TS than for Swift. Downside: native config changes need full new EAS builds. — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1tk0qs5/lessons_from_launching_my_first_paid_ios_app_solo/)
- First-hand, Mar 2026 ("Stickly" AI sticker maker): SwiftUI, Replicate (SDXL) called from a Firebase Cloud Function so the API key stays off the client, Gemini Flash to rewrite prompts, Firebase auth/Firestore/Storage, RevenueCat and SwiftData. — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1rxtl4q/shipped_my_first_aigeneration_app_used_replicate/)
- First-hand, June 2026 ("ReRun"): native Swift/SwiftUI with HealthKit, MapKit and Metal, plus RevenueCat for the paywall and PostHog for analytics. — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1tyn8xq/route_visualization_using_scenekit_mapkit_metalfx/)

**Expo/EAS pricing (official, fetched 2026-10-25)**
- Free: 15 Android and 15 iOS builds (low-priority queue), 1,000 EAS Update MAUs, up to 60 CI/CD minutes. Starter: $19/mo plus usage ($45 build credit, 3,000 update MAUs). Production: $199/mo plus usage ($225 credit, 50,000 MAUs). Enterprise: custom. Builds beyond credit cost $2–$4 (iOS) or $1–$2 (Android). — [expo.dev/pricing](https://expo.dev/pricing)
- A third-party tracker logged a free-tier reduction from 30 total builds to 15 per platform, dated 2026-08-28. — via [Expo pricing search results / agentdeals](https://agentdeals.dev/vendor/expo) (secondary)

**Paywall and subscription SDKs**
- RevenueCat Pro is free up to $2,500 monthly tracked revenue (MTR), then 1% of tracked revenue. The paywall editor and A/B testing are included. Enterprise is custom. — [RevenueCat pricing](https://www.revenuecat.com/pricing/)
- Adapty's free tier is cited as $5K MTR (some older pages say $10K). Adapty reportedly removed its $99/mo minimum in Feb 2026. Superwall (paywall-first, often layered on RevenueCat or StoreKit) is cited at $49–$199/mo plus 1% of paywall-attributed revenue. All of these are secondary figures, so check vendor pages. — [BuildMVPFast](https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026); [PkgPulse](https://www.pkgpulse.com/guides/revenuecat-vs-adapty-vs-superwall-mobile-in-app-2026)

**Backends (secondary, 2026)**
- Supabase free tier: 2 active projects, 500 MB database, 1 GB storage, 50K MAU. Free projects pause after 1 week of inactivity. Pro is "from $25". New projects after May 30, 2026 need explicit Postgres grants for PostgREST access. — [JetAdmin Supabase pricing 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- Firebase Spark (no card) has 50K Firestore reads and 20K writes per day and no Cloud Functions. Blaze is pay-as-you-go with no built-in spending cap. Cloud Storage for Firebase requires Blaze (existing-bucket requirement from Feb 3, 2026). — [DEV.to Spark vs Blaze](https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb)

**LLM APIs for AI features**
- Anthropic first-party prices per million tokens (cached 2026-10-06): Claude Haiku 5.5 $0.10 in / $0.50 out (prompts up to 100K tokens), Claude Sonnet 5.5 $2 / $10, Claude Opus 5.5 $4 / $20. — [Anthropic pricing docs](https://docs.claude.com/en/docs/about-claude/pricing) (figures from Anthropic's SDK reference cached 2026-10-06)
- Secondary 2026 roundups list GPT-5 nano at about $0.05 in / $0.40 out and Gemini 3.1 Flash-Lite at about $0.10 / $0.40. The sources disagree on which models are current, so treat these as unverified. — [BenchLM](https://benchlm.ai/md/blog/posts/llm-pricing-2026.md); [Geotoolbox](https://geotoolbox.ai/blog/ai-token-cost.md)
- Apple's Small Business Program page says enrolled developers with fewer than 2M first-time downloads can use Apple Foundation Models on Private Cloud Compute "with no cloud API cost" once the entitlement is assigned. — [Apple SBP](https://developer.apple.com/app-store/small-business-program/)

**No-code and AI app builders**
- Apple 4.2.6: "Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content." Template providers may instead use a single "picker" binary. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- FlutterFlow: the free plan cannot publish to the App Store or Play Store. Basic ($39/mo, up from $30) is the lowest tier with store publishing. Growth is about $80/mo for the first seat. These are secondary figures. — [LowCode Agency](https://www.lowcode.agency/blog/flutterflow-pricing-plans); [Adalo (competitor)](https://www.adalo.com/posts/flutterflow-pricing/)
- Rork generates React Native/Expo code. "Rork Max" builds native Swift. Pricing is credit- or message-based, from roughly $20 to $200/mo, and sources conflict on free credits. Store fees and EAS are extra. — [VP0 Rork pricing](https://vp0.com/blogs/rork-pricing-plans-2026/); [Banani review](https://www.banani.co/tr/blog/rork-ai-review); [Bilt](https://bilt.me/blog/rork-pricing)
- March 2026: Apple blocked updates of the vibe-coding builder apps Replit and Vibecode under 2.5.2 (no downloading or executing code that changes app functionality), and removed "Anything" on March 26. Apple said its issue is guideline violations, not vibe coding itself. This hit the builder apps' in-app previews. It did not hit apps built with these tools and submitted normally. — [9to5Mac 2026-03-30](https://9to5mac.com/2026/03/30/apple-steps-up-crackdown-on-vibe-coding-apps/); [MediaNama](https://www.medianama.com/2026/04/223-apple-vibe-coding-app-ban-anythng/); [The Decoder](https://the-decoder.com/apple-reportedly-blocks-vibe-coding-apps-from-publishing-updates/)

**AI-feature compliance hooks**
- Apple 5.1.2(i) says you must "clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission". Under 1.2, AI content-creation apps need content filtering, reporting, user blocking and contact info. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Google Play requires generative-AI apps to include in-app reporting/flagging of offensive AI output without leaving the app. Announced Oct 2023. — [Play policy](https://support.google.com/googleplay/android-developer/answer/13985936); [9to5Google](https://9to5google.com/2023/10/25/google-play-gen-ai-policy/)

### Inferences
- Beginner default for a subscription or AI utility on both stores: Expo + RevenueCat + Supabase (or Firebase) + a server-side LLM call (never ship the API key in the client). Total tooling cost is near $0 until revenue arrives. iOS-only with deep Apple APIs: SwiftUI + RevenueCat.
- Apple's Foundation Models on-device/PCC offer may remove LLM API costs for simple iOS-only AI features for small developers. Worth flagging, but it is iOS-only.
- No-code builders shorten the path to a prototype. However, publishing tiers ($39+/mo), 4.2.6, and 4.3 "low-value" scrutiny make them weaker for differentiated apps.

### Gaps
- Adalo, Bubble (native mobile), Bolt and Lovable: no 2026 store-publishing pricing or rejection data was gathered. Bolt and Lovable are primarily web builders, which I could not confirm for mobile.
- Official Adapty and Superwall pricing pages were not fetched.
- Official OpenAI and Google Gemini pricing pages were not fetched. The secondary figures conflict.

---

## Q3. How developers use AI coding tools and AI asset tools to build in days or weeks: examples, timelines, limits

### Takeaway
Experienced developers report large speed-ups. For example, a 30-year Unity veteran reports about 5x after adopting AI with a Unity CLI. Solo devs ship simple Expo/Swift subscription apps in about 2–4 weeks of focused time. Beginners who let AI make the architecture decisions report unmaintainable code and abandoned projects. Store-side effects of the 2026 AI-driven flood of submissions are a tightened Apple 4.3(b), longer review queues and visible community backlash. AI tools cost about $10–$200/mo.

### Cited Findings
**Tool pricing (secondary, mid-2026)**
- GitHub Copilot Pro about $10/mo, Pro+ $39/mo. Copilot moved to usage-based billing on June 1, 2026 (1 credit = $0.01; completions not billed in credits). Cursor Pro from $20/mo. Claude Code via Claude Pro $20/mo, Max $100 or $200/mo. A reported $1,400 single-month Cursor overage shows the risk on metered plans. — [Fungies AI coding pricing 2026](https://fungies.io/ai-coding-tools-pricing-2026-comparison/); [MorphLLM](https://www.morphllm.com/comparisons/cursor-vs-copilot); [SitePoint](https://www.sitepoint.com/ai-coding-tools-cost-analysis-roi-calculator-2026/)

**Real speed and timeline examples**
- A studio owner with 30 years of software and 10 years of Unity experience (r/gamedev, 2026-09-23, 3.1K upvotes) says dev speed rose about 5x "almost overnight". He credits AI models and adopting a Unity CLI about a month earlier. Quality held because experienced devs keep control of structure and design patterns. He also says there is "no space for junior devs". — [Reddit](https://reddit.com/r/gamedev/comments/1wo5asm/ai_models_have_caught_up_with_unity_dev_my/)
- VTapr: first paid iOS app, solo, 4 weeks of focused build time on Expo + Supabase + Claude API + RevenueCat (May 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1tk0qs5/lessons_from_launching_my_first_paid_ios_app_solo/)
- A founder "coded a basic MVP in 2 days" (Expo, iOS + Android), then was blocked by Play's 14-day closed test and a pending Apple account verification (Nov 2025). — [Reddit](https://reddit.com/r/androiddev/comments/1oxqtso/google_play_forcing_14day_closed_test_before/)
- "Vibe coded" a GPS zombie-chase Android game "with Claude and Kimi", published on Play (Aug 2026). — [r/SideProject](https://reddit.com/r/SideProject/comments/1vvte0n/i_made_a_game_where_you_run_from_zombies_irl/)
- "Spent 3 weeks vibe coding" a novelty texting app (May 2026). — [r/SideProject](https://reddit.com/r/SideProject/comments/1t0wzki/spent_3_weeks_vibe_coding_a_texting_app_thats/)
- A side-hustle dev with a 9–5 job built 9 apps in 1 year for about $1,200 total revenue. They also sold one Android app for $4,000, and Android drove about $800 of the revenue (Oct 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1wyytct/journey_solo_dev_9_apps_in_1_year_with_95_job_and/)
- For comparison (PC/Steam, not mobile): a 2-dev team built a Godot game in about 4 months and grossed $361,657 in its first 24 hours (July 2026). Validation came from TikTok/short videos of an early prototype. — [Reddit](https://reddit.com/r/gamedev/comments/1v9z4vi/we_made_361657_gross_revenue_in_the_first_24/)

**Limits and pitfalls**
- A novice who leaned fully on ChatGPT, Claude, Gemini, DeepSeek and Cursor ended up with a codebase they didn't understand. Scripts grew to 800–1,000 lines and fixes created new bugs. They abandoned 4 months of work and $150 of subscriptions (r/gamedev, Dec 2025, 2.8K upvotes). — [Reddit](https://reddit.com/r/gamedev/comments/1q043ym/how_vibe_coding_lead_to_my_projects_downfall/)
- Community backlash: "please stop mass producing apps", saying half of r/iOSProgramming is now subscription/paywall posts and many devs launch multiple apps in short spans (Mar 2026, 652 upvotes). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s3t34t/please_learn_to_love_programming_again_im_begging/)
- Apple's June 8, 2026 guideline update rewrote 4.3(a)/(b) to reject "mediocre, low-quality, or low-effort" apps and saturated categories. One blog attributes slower 2026 review times to a rise in AI-assisted submissions (the author's explanation, not confirmed). Apple says it increasingly uses AI tools to help review. — [9to5Mac 2026-06-09](https://9to5mac.com/2026/06/09/apple-tightens-app-review-guidelines-against-apps-that-do-not-add-value-to-the-app-store/); [Choicely](https://www.choicely.com/tutorials/how-long-does-app-review-take)
- Native config changes (Info.plist permissions, entitlements) need full rebuilds in Expo, so AI "hot reload" speed doesn't cover them. — [Reddit VTapr](https://reddit.com/r/iOSProgramming/comments/1tk0qs5/lessons_from_launching_my_first_paid_ios_app_solo/)

**AI asset tools**
- A June 2026 roundup lists Ludo, PixelLab (pixel-art specialist, from $12/mo), AutoSprite, Layer.ai, Scenario (custom models trained on your art; images only, no sprite-sheet or animation pipeline), Sprite-AI (from $5/mo with a commercial license on the Creator and Studio tiers) and God Mode AI. Ludo publishes the roundup and ranks its own tool in it, so the rankings are biased. — [Ludo.ai](https://ludo.ai/compare/best-ai-sprite-generators)
- Some devs use AI only for weak spots. One RN game dev hand-wrote the code and used Claude "for design direction". — [Reddit](https://reddit.com/r/reactnative/comments/1uqp2z5/finished_my_first_ever_game_built_in_react_native/)

### Inferences
- AI compresses coding time most for developers who can review code. For beginners, the bottleneck moves to debugging, store compliance and marketing. Several posts report that compliance and testing took longer than the build.
- Faster building has met stricter Apple anti-spam review in 2026. "Many small low-effort apps" is riskier now than in 2024–2025.

### Gaps
- No verified data on ElevenLabs, Suno or Retro Diffusion commercial terms for game audio and voice in 2026.
- No controlled study of AI speed-up for mobile apps specifically. The evidence is anecdotal.
- Windsurf and OpenAI Codex pricing and usage were not specifically sourced.

---

## Q4. Templates, source-code marketplaces and reskinning: how they're used and the risks

### Takeaway
Buying a Unity Asset Store or CodeCanyon template and reskinning it is still common and legal under standard licenses (you may embed assets in your own product, but not resell them as assets). In 2026, though, it is the fastest route to Apple 4.3 spam rejections. Apple's rejection text explicitly names repackaged and purchased templates, and its system flags "binary matches". Google's Repetitive Content policy and associated-account terminations add the same risk on Android.

### Cited Findings
- Apple's 4.3(a) rejection message (quoted by a dev in Jan 2026) lists these factors: "Submitting an app with the same source code or assets as other apps", "Creating and submitting multiple similar apps using a repackaged app template", "Purchasing an app template with problematic code from a third party", and "Submitting several similar apps across multiple accounts". — [r/iOSProgramming](https://reddit.com/r/iOSProgramming/comments/1q4rljp/apple_rejected_my_app_for_spam/)
- 4.3(b) (June 2026): "Don't submit apps that are indistinguishable from what's already widely available." Apple will not accept new dating, flashlight, sound effects, wallpaper, simple timer or fortune-telling apps unless they are meaningfully different. Existing ones may be removed if not updated or not attracting customers. Repeated low-effort submissions "may lead to removal from the Apple Developer Program". — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); [9to5Mac](https://9to5mac.com/2026/06/09/apple-tightens-app-review-guidelines-against-apps-that-do-not-add-value-to-the-app-store/); [Mac Observer](https://www.macobserver.com/news/apple-app-review-guidelines-2026-changes-explained/)
- 4.3(a) also covers multiple Bundle IDs of the same app (e.g., one per city). Apple suggests a single app with IAP-based variants instead. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- A solo dev's car-sim sequel (1M+ Play installs, 4.9 rating) was rejected 5 times under 4.3(a). On a call, Apple said its system had flagged a "binary match" with another developer's game in the genre (Aug 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1vurkq2/just_hearing_43_gives_me_ptsd_how_app_store/)
- A dev submitting 4–5 unrelated new apps at once reports all of them being "instantly" auto-rejected under 4.3(a) (Aug 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1w07lj9/instant_auto_reject_guideline_43a_design_spam/)
- One app update (FilmFold) was rejected under 4.3(a) after adding the RevenueCat and Meta SDKs. The App Review Board later ruled the rejection invalid on appeal (Sept 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1w9ojf7/existing_app_repeatedly_rejected_under_43a_after/)
- Tactics that worked: request a one-on-one call with App Review, add at least one feature that differentiates the app from top apps in the category, and write the value proposition in "Notes to Reviewer". Reviewers said they rely heavily on those notes (Mar 2026). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s0z4jr/experiences_on_beating_guideline_43a_design_spam/). Another team cleared 4.3(b) by rewriting description, keywords and screenshots so the app didn't read as a saturated category. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s0nb97/got_rejected_by_the_app_store_5_times_before/)
- Unity Asset Store standard EULA: assets may be embedded or incorporated into a product with "substantial original creative work" that is not mainly asset distribution. Non-SDK assets may be modified. SDKs may not be modified without the publisher's consent. — [Unity Asset Store EULA FAQ](https://assetstore.unity.com/browse/eula-faq). Common reading: commercial games are OK, reselling the assets is not. — [Unity Discussions](https://discussions.unity.com/t/can-be-used-for-commercial-use/852446). Templates marketed as "easy to reskin" are sold under the standard EULA. — [Asset Store listing](https://assetstore.unity.com/packages/templates/packs/catch-the-balls-mobile-ready-game-easy-to-reskin-124421)
- On CodeCanyon, game-template listings often lock the source code (buyers swap images and sounds and contact the seller for code changes). They describe swapping in ad IDs before export to Google Play. One seller warns buyers to reskin heavily, because if Play detects two identical apps it "may remove the app of the publisher who uploaded it last" (the seller's claim). — [CodeCanyon listing](https://codecanyon.net/item/quick-jump/45660552); [CodeCanyon comments](https://codecanyon.net/comments/25846659)
- Google Play's Repetitive Content policy (since 2018) bars apps that replicate existing experiences without original value, including "multiple apps with highly similar functionality". — [MonetizeMore](https://www.monetizemore.com/blog/avoid-repetitive-content-violation/). Even three color variants of one icon pack were flagged. — [PhoneArena](https://www.phonearena.com/news/Google-Play-Stores-spam-policies-are-heavily-undefined-and-here-is-the-perfect-example_id145418)
- Google: "repeated or serious violations … will result in termination of individual or related Google Play Developer accounts". — [Play Enforcement Process](https://support.google.com/googleplay/android-developer/answer/9899234)
- Apple 4.2.6 bars template and app-generation services from submitting apps on clients' behalf. — [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Inferences
- Templates are best used as learning scaffolds or code to start from. Shipping a lightly reskinned template is now likely to fail 4.3 on iOS and risks account-level action on both stores.
- Code boilerplates (e.g., Expo/Swift "starter kits" with auth, paywall and onboarding) carry less 4.3 risk than full game templates, because the visible product is still original. This is my inference; I have no direct source.

### Gaps
- No 2026 data on how often Google Play enforces Repetitive Content against reskins.
- Mobile "ShipFast-style" boilerplate products were not specifically researched. The Swift Kit and Flutter Kit sites exist, but I did not verify their pricing or terms.

---

## Q5. Full cost breakdown (developer accounts, commissions, tools, backend/AI, business setup)

### Takeaway
The minimum cash outlay to ship on both stores is about $124 in year one: Apple $99/yr plus Google Play $25 one-time. Most tools have free tiers (Unity Personal, Godot, Expo Free, RevenueCat under $2.5K MTR, Supabase/Firebase free). Realistic monthly spend for an AI-assisted solo dev is about $20–$100 for AI tools plus usage-based backend and LLM costs. Store commissions for small developers are about 15% on Apple, and on Google about 15% for subscriptions (10% service + 5% billing fee in the US/EEA/UK since June 30, 2026) and up to 25% for one-time IAP.

### Cited Findings
**Developer accounts**
- Apple Developer Program: $99 per membership year (local currency varies). Fee waivers are only for nonprofits, accredited educational institutions and government entities. Individuals need an Apple Account with 2FA, their legal name (aliases delay approval) and a confirmed address (no P.O. boxes). Organizations need a D-U-N-S Number, a legal entity (DBAs not accepted), a domain email and a functional website. — [Apple enrollment](https://developer.apple.com/programs/enroll/)
- Google Play: $25 one-time registration fee. The Android Developer Console Full Distribution account is a "$25 one-time fee … similar to Play's $25 registration fee". The Limited Distribution account (up to 20 devices, no ID) is free. D-U-N-S is required for organization accounts; it is free but "can take up to 28 days". — [Android developer verification FAQ](https://developer.android.com/developer-verification/guides/faq)

**Store commissions**
- Apple Small Business Program: 15% on paid apps and IAP for developers with up to $1M proceeds in the prior calendar year, and for new developers. Associated accounts count toward the threshold. If you exceed $1M in the current year, the standard rate applies to further sales. The page also says "Developers on the alternative terms in the EU, and for subscriptions after their first year, get a further reduced rate of 10%" (wording as summarized; re-read the page to confirm which developers this covers). Enrollment requires accepting the Paid Apps agreement. The reduced rate starts 15 days after the end of the fiscal month in which enrollment is approved. — [Apple SBP](https://developer.apple.com/app-store/small-business-program/)
- Google Play, effective June 30, 2026 in the EEA, UK and US (Sept 30, 2026 in Australia and Japan), first $1M of annual earnings: auto-renewing subscriptions are 10% service fee + 5% billing fee. Other transactions are 20% + 5% for new installs and 25% + 5% for existing installs (or 20% via external web links) on the Standard tier. On the "Play Games Level Up" or "Apps Experience" programs: 15% + 5% for new installs and 20% + 5% for existing installs. Rest of the world until the global rollout: 15% tier on the first $1M, 30% above, subscriptions 15%. — [Play Console Help: service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en); [Android Developers Blog, June 2026](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)
- Commentary: the "10% headline" is really about 15% for subscriptions through Google Play Billing. — [Adapty](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees/)
- Apple US storefront: since the May 2025 change, US apps may include buttons, external links and other calls to action toward non-IAP purchasing. Elsewhere this is barred except under specific entitlements. — [App Review Guidelines 3.1.1(a)](https://developer.apple.com/app-store/review/guidelines/); [AppFollow summary](https://appfollow.io/blog/app-store-review-guidelines)

**Engines and build tools**
- Unity Personal free (<$200K). Pro about $2,200–$2,310/seat/yr. — [CG Channel](https://www.cgchannel.com/2024/09/unity-scraps-controversial-runtime-fee-but-raises-prices); [Unity pricing updates](https://unity.com/products/pricing-updates)
- Godot is free (MIT). — [Godot Asset Library listings, MIT](https://godotengine.org/asset-library/asset/5162). GameMaker is $99.99 one-time for commercial use. — [GameMaker FAQ](https://gamemaker.io/en/help/articles/november-2023-pricing-terms-change-faq)
- Expo: $0 / $19 / $199 per month. — [expo.dev/pricing](https://expo.dev/pricing). FlutterFlow from $39/mo to publish. — [LowCode Agency](https://www.lowcode.agency/blog/flutterflow-pricing-plans). Rork about $20–$200/mo. — [VP0](https://vp0.com/blogs/rork-pricing-plans-2026/)

**Ongoing services**
- RevenueCat: free up to $2.5K MTR, then 1%. — [RevenueCat](https://www.revenuecat.com/pricing/)
- Supabase Pro from $25/mo. Firebase Blaze is pay-as-you-go with no spending cap. — [JetAdmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/); [DEV.to](https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb)
- AI coding: $10–$200/mo. — [Fungies](https://fungies.io/ai-coding-tools-pricing-2026-comparison/). LLM API: Claude Haiku 5.5 $0.10/$0.50 per M tokens, Sonnet 5.5 $2/$10. — [Anthropic pricing](https://docs.claude.com/en/docs/about-claude/pricing)
- AI art tools: about $5–$12/mo entry tiers (Sprite-AI, PixelLab). — [Ludo.ai roundup](https://ludo.ai/compare/best-ai-sprite-generators)
- GameAnalytics Core is free. — [Tech Insider](https://tech-insider.org/?p=20371)

**Hidden "costs" of being a personal account**
- Google: personal accounts that monetize (paid apps or IAP) must show their full address publicly on Google Play. The address comes from the linked payments profile. Non-monetizing personal accounts show only legal name, country and email. — [Play Console Help 13634081](https://support.google.com/googleplay/android-developer/answer/13634081?hl=en); [Play Console Help 13628312](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en)
- Apple EU DSA: individuals declared as "traders" must provide an address (or PO box), phone and email, which are displayed on EU product pages. Ad revenue can make even a free app count as commercial. — [App Store Connect Help: DSA](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information)
- India example: Google's KYC partner (BillDesk) required a live Play app link before approving the merchant account. That created a chicken-and-egg problem with closed testing for a subscription app (Aug 2026). — [Reddit](https://reddit.com/r/androiddev/comments/1vm9ikk/stuck_in_circular_dependency_billdesk_merchant/)

### Inferences
- Beginner budget for year one, excluding hardware: $124 for accounts, plus $0–$40/mo for AI coding, plus about $0–$25/mo for backend, plus LLM usage (often cents per active user on small models). That totals roughly $125–$800/year before marketing.
- Forming an LLC or company mainly buys privacy (Google shows the business address instead of your home) and Play's exemption from the 12-tester rule. The trade-offs are D-U-N-S delays (up to 28 days) and Apple's website and domain-email requirements.

### Gaps
- Device and hardware costs (a Mac for iOS builds, test phones) were not sourced. Expo EAS cloud builds let devs ship iOS "without opening Xcode" ([Reddit](https://reddit.com/r/iOSProgramming/comments/1tk0qs5/lessons_from_launching_my_first_paid_ios_app_solo/)), but I found no source on whether a Mac is strictly needed for the whole pipeline.
- Tax forms (W-9/W-8BEN in App Store Connect and Google payments profile, VAT handling) and company formation costs were not researched with citations.
- Apple's exact rate for SBP subscriptions after year one: the official page's phrasing is ambiguous in the fetched summary.

---

## Q6. Store and legal requirements that commonly block or delay beginner launches

### Takeaway
The biggest blockers in 2026 are these:
- **Google Play:** the 12-testers/14-days closed test for personal accounts created after Nov 13, 2023, followed by a production-access review that can still reject.
- **Android developer verification:** enforced from Sept 30, 2026 in Brazil, Indonesia, Singapore and Thailand; global from 2027.
- **Apple review:** 4.3 spam (tightened June 2026), 2.1 completeness, 3.1.1 IAP, 5.1.1 privacy policy and account deletion, 5.1.2 ATT.
- **New 2025–2026 compliance items:** Apple's new age-rating questionnaire (due Jan 31, 2026), Texas age-assurance (from June 4, 2026), Xcode 26/iOS 26 SDK uploads (from Apr 28, 2026), Android target API 36 (Aug 31, 2026), EU DSA trader status, certified CMP consent for EEA/UK/CH ads, and the amended COPPA Rule (Apr 22, 2026).

### Cited Findings
**Google Play: closed testing and production access**
- Personal developer accounts created after Nov 13, 2023 must run a closed test with at least 12 testers "opted in continuously for at least 14 days" before applying for production. Production and pre-registration stay disabled until then. Organization accounts are exempt. — [Play Console Help 14151465](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en); [Choicely](https://www.choicely.com/blog/google-play-12-tester-rule)
- The requirement was originally 20 testers and was later lowered to 12. — [Android Authority](https://www.androidauthority.com/google-play-app-testing-requirement-3510580)
- The production application asks how hard recruiting testers was, whether testers used all features, a feedback summary, the target audience and value proposition, an estimated first-year installs range, and what changed after testing. Review "usually takes seven days or less". You may need to keep testing if tester engagement was insufficient. — [Play Console Help 14151465](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- Anecdotes:
  - Two weeks to reach 12 testers plus 3 weeks of testing, then rejected without a reason (Oct 2025, 75 upvotes). — [Reddit](https://reddit.com/r/androiddev/comments/1ogpq3z/my_first_app_got_rejected_after_doing_month_long/)
  - Timeline from Aug 26 to Oct 2, 2026: closed test live, applied after 14 days, production submitted Sept 21, published Oct 2 after about 10.5 days in review. — [Reddit](https://reddit.com/r/androiddev/comments/1wvqe3u/after_36_days_of_closed_testing_and_10_days_in/)
  - A dev reported unsolicited offers to sell "testers" to get around the rule. — [Reddit](https://reddit.com/r/androiddev/comments/1ukj54d/my_game_tension_head_has_just_been_approved_for/)
- Unverified blog claims say the 14-day clock resets if a tester goes inactive. Google's wording says only "opted in continuously". — [levelup.gitconnected](https://levelup.gitconnected.com/the-12-tester-tax-google-plays-closed-testing-rule-is-quietly-killing-solo-devs-2cea83c2e338) (secondary)

**Android developer verification (2025–2026)**
- FAQ last updated 2026-09-30:
  - Advanced flow and Limited Distribution accounts launched in August 2026.
  - From Sept 30, 2026, unregistered apps can't be installed from participating stores in select regions on certified Android 7+ phones and tablets.
  - Global rollout begins in 2027.
  - Play developers must register apps on all form factors. Play App Signing apps are claimed automatically.
  - ADB installs need no verification.
  - Users can still install unverified apps via an "advanced flow": developer mode, a restart, a 24-hour wait, then biometric/PIN.
  - A lost signing key means the package can't be registered.
  — [Android developer verification FAQ](https://developer.android.com/developer-verification/guides/faq)
- The first-phase regions are Brazil, Indonesia, Singapore and Thailand. The initially enforced stores are Google Play, Samsung Galaxy Store, Xiaomi GetApps, OPPO, vivo, HONOR and Transsion. Direct APK sideloading and F-Droid are not covered by the Sept 30 phase. — [Google support 16561738](https://support.google.com/android-developer-console/answer/16561738); [Gadget Hacks](https://android.gadgethacks.com/news/google-android-sideloading-restrictions-sept-30-explained/); [Android Developers Blog June 2026](https://android-developers.googleblog.com/2026/06/android-developer-verification.html)
- Earlier coverage (2025) said the requirement would apply to all sideloading from Sept 2026. Google later narrowed the first phase (June/July 2026). — [Gadget Hacks](https://android.gadgethacks.com/news/google-android-sideloading-restrictions-sept-30-explained/); [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/google-developer-verification-sideloaded-apps)

**Google Play technical and policy deadlines**
- From Aug 31, 2026, new apps and updates must target Android 16 (API 36). Developers can request an extension to Nov 1, 2026. Existing apps below API 35 are hidden from new users on newer devices. — [Android target SDK requirements](https://developer.android.com/google/play/requirements/target-sdk)
- API 36 behavior changes: apps can't lock orientation or aspect ratio on large screens (600dp and up), and the edge-to-edge opt-out is removed. — [DEV.to](https://dev.to/mr_manushukla/android-target-api-36-is-due-aug-31-2026-api-37-is-next-the-play-store-migration-checklist-2f9i)
- Families: apps whose target audience is only children must use only self-certified ads SDK versions. Mixed-audience apps must serve children only certified SDK ads, e.g. via a neutral age screen. — [Families Self-Certified Ads SDK Policy](https://support.google.com/googleplay/android-developer/answer/12918983)
- Account risk from ads: a 10-year-old app with 5M downloads was suspended on Play over a casino-style ad served through AdMob that the dev hadn't chosen. It was reinstated on appeal (May 2026). — [Reddit](https://reddit.com/r/androiddev/comments/1t6np69/admobs_brandsafety_classifier_was_circumvented_by/)
- Related accounts get terminated together. — [Play Enforcement Process](https://support.google.com/googleplay/android-developer/answer/9899234)

**Apple App Review: stats and timing**
- Apple's 2025 Transparency Report: 9,100,620 submissions reviewed and 2,093,244 rejected (about 23%). 387,087 were approved after an initial rejection. Rejections by section: Performance 1,354,418, Legal 495,673, Design 415,532, Business 283,820, Safety 151,159. — [Apple 2025 App Store Transparency Report](https://images.apple.com/legal/app-store/transparency/2025/)
- Apple's long-standing claim is that 90% of submissions are reviewed in under 24 hours. A July 2026 Apple confirmation email quoted by a dev says 50% within 24h and over 90% within 48h. Mac reviews slowed to about 5 days in early 2026. — [Choicely](https://www.choicely.com/tutorials/how-long-does-app-review-take); [Michael Tsai blog 2026-03-02](https://mjtsai.com/blog/2026/03/02/mac-app-store-review-times-increasing/)
- Guideline revisions in 2026: Feb 6 (anonymous/random chat falls under 1.2) and June 8 (4.3 rewritten, kid/teen safety guidance, 1.2 developer responsibility, 4.5.3 Live Activities spam). November 2025 added third-party AI disclosure and creator-app age-gating. — [Apple Developer News](https://developer.apple.com/news/?id=d75yllv4); [Mac Observer](https://www.macobserver.com/news/apple-app-review-guidelines-2026-changes-explained/); [AppFollow](https://appfollow.io/blog/app-store-review-guidelines)

**Apple: key guideline text**
- **2.1 App Completeness:** final versions only, with no placeholder content. Include demo account credentials "and turn on your back-end service!". IAPs must be complete, visible to the reviewer and functional. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
  - Example: one team was rejected twice for an onboarding bug. The second time reviewers tested on iPad although the app was iPhone-only; it passed after a Resolution Center reply. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s0nb97/got_rejected_by_the_app_store_5_times_before/)
- **3.1.1 In-App Purchase:** unlocking features, subscriptions, in-game currency or levels requires IAP. License keys, QR codes and similar mechanisms are not allowed. The US storefront exception allows external purchase links. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **4.2 Minimum Functionality:** apps must go beyond a repackaged website. **4.3 Spam:** see Q4. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **5.1.1 Privacy:**
  - A privacy policy link is required both in App Store Connect and inside the app.
  - The policy must explain what data the app collects, how, and all uses, plus how to revoke consent and request deletion.
  - Apps that collect user or usage data need user consent.
  - 5.1.1(v): "If your app supports account creation, you must also offer account deletion within the app."
  — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **5.1.2 ATT:** explicit permission via App Tracking Transparency is required to track users. Apps may not require enabling tracking, notifications or location to access functionality or rewards. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **1.3 Kids Category:** no third-party analytics or advertising, except limited contextual ads from services with documented Kids practices and human review of creatives. Links out and purchases must sit behind a parental gate. — [Guidelines](https://developer.apple.com/app-store/review/guidelines/)

**Apple: SDK, age rating and age assurance**
- Since Apr 28, 2026, uploads must be built with Xcode 26+ against the iOS/iPadOS 26 SDK. Expo SDK 54/55 EAS images already use Xcode 26. — [Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/); [Expo blog](https://expo.dev/blog/app-store-connect-minimum-sdk-26)
- New Apple age ratings: 4+, 9+, 13+, 16+ and 18+, replacing 12+ and 17+. New questionnaire items cover in-app controls, capabilities, medical/wellness topics and violent themes. The deadline was Jan 31, 2026; after it, updates are blocked until the questionnaire is answered. — [9to5Mac 2025-07-24](https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/); [iGeeksBlog](https://www.igeeksblog.com/apple-app-store-age-ratings/)
- Texas App Store Accountability Act (SB 2420) took effect June 4, 2026, after the Fifth Circuit lifted an injunction. Apple says developers distributing in Texas must review the Declared Age Range API and the PermissionKit Significant Change API, and implement them as needed. Reported penalties are up to $10,000 per violation. The constitutional challenge continues. — [9to5Mac 2026-06-03](https://9to5mac.com/2026/06/03/apple-says-texas-app-store-age-assurance-rules-start-tomorrow-after-court-ruling/); [AppleInsider](https://appleinsider.com/articles/26/06/03/age-verification-now-mandatory-for-app-store-users-in-texas)
- iPhone Duo (announced Sept 2026, per a Reddit post) letterboxes apps built against SDKs older than iOS 27, and only iOS 27.1 builds fill the display. This is a community claim I have not verified. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1wbxxj3/iphone_duo_is_official_how_much_work_is_this/)

**EU DSA trader status (Apple)**
- All developers must declare a trader status, even if they don't distribute in the EU. For traders, Apple displays address/PO box, phone and email on EU product pages. Apps without a declared status were removed from the EU from Feb 2025. — [App Store Connect Help](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-compliance-information); [SD Times](https://sdtimes.com/mobile/apple-adds-new-requirements-for-apps-distributed-through-the-app-store-in-the-eu/)

**Ads consent and children's privacy law**
- Google requires a Google-certified, TCF-integrated CMP to serve personalized ads in the EEA and UK (since Jan 16, 2024) and Switzerland (since July 31, 2024). Using Google's UMP SDK is optional; any certified CMP works. Non-certified traffic gets only non-personalized or limited ads. — [AdMob Help 13554116](https://support.google.com/admob/answer/13554116?hl=en); [AdMob iOS GDPR docs](https://developers.google.com/admob/ios/privacy/gdpr?hl=en)
- The amended FTC COPPA Rule took effect June 23, 2025, with full compliance required by Apr 22, 2026. The FTC signals robust enforcement. — [Davis Polk](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect); [Toy Association](https://toyassociation.org/PressRoom2/News/2026-News/updated-coppa-rule-requirements-take-effect-april-22.aspx)

**Account setup delays**
- One founder's Apple Developer account was "stuck in verification" for several days (Nov 2025). — [Reddit](https://reddit.com/r/androiddev/comments/1oxqtso/google_play_forcing_14day_closed_test_before/)
- D-U-N-S for organizations can take up to 28 days. — [Android verification FAQ](https://developer.android.com/developer-verification/guides/faq)

### Inferences
- For a brand-new personal Google account, plan on at least 3–5 weeks from first closed-test upload to public listing: 14+ days of testing, up to 7+ days of access review, then production review. Start the closed test as early as possible, even with an MVP.
- Using a properly formed organization account (with D-U-N-S) avoids the 12-tester rule and hides your home address. It adds weeks up front, so it suits devs planning multiple apps.
- Ad-funded games for EEA/UK need a certified CMP and ATT on iOS. Kids-directed games face the heaviest constraints (Apple 1.3, Play Families, COPPA). Beginners should avoid targeting under-13s.

### Gaps
- The current wording of Google's production-access rejection criteria ("insufficient engagement") is not documented beyond the help page.
- Google Play age-signals and age-verification obligations for 2026 (e.g., Play Age Signals API, the Utah/Louisiana laws) were not researched.
- Exact current COPPA consent requirements for third-party ad SDKs: the amended rule text was not fetched.
- Whether Apple extended the Jan 31, 2026 age-rating deadline is not confirmed. It appears to have passed.

---

## Q7. Realistic timeline from zero to first published app: beginner vs experienced developer

### Takeaway
An experienced developer using AI tools can build a simple utility, subscription or casual-game MVP in days to about 4 weeks. Store gating then adds about 1–3 days on iOS (longer if rejected) and 3–6+ weeks on Android for new personal accounts. A true beginner should expect about 1–3 months to a first iOS release. Android adds the closed-test period on top. Several rejection cycles are common.

### Cited Findings
- Experienced/AI-assisted builds:
  - Basic Expo MVP coded in 2 days. — [Reddit](https://reddit.com/r/androiddev/comments/1oxqtso/google_play_forcing_14day_closed_test_before/)
  - 4 weeks of focused build for a first paid AI subscription app. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1tk0qs5/lessons_from_launching_my_first_paid_ios_app_solo/)
  - About 5x studio-wide speed-up. — [Reddit](https://reddit.com/r/gamedev/comments/1wo5asm/ai_models_have_caught_up_with_unity_dev_my/)
  - 9 apps in 1 year part-time. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1wyytct/journey_solo_dev_9_apps_in_1_year_with_95_job_and/)
- Android gating timelines:
  - 36 days of closed testing plus about 10 days of review. — [Reddit](https://reddit.com/r/androiddev/comments/1wvqe3u/after_36_days_of_closed_testing_and_10_days_in/)
  - 2 weeks to recruit 12 testers plus 3 weeks of testing, then rejected; "It took me less time to develop the actual app than complying with their requirements". — [Reddit](https://reddit.com/r/androiddev/comments/1ogpq3z/my_first_app_got_rejected_after_doing_month_long/)
- iOS gating:
  - Most submissions are reviewed within 24–48h per Apple. — [Choicely](https://www.choicely.com/tutorials/how-long-does-app-review-take)
  - One team had 5 rejections "over a few weeks" (4.3(b), 2.1 bugs and others). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s0nb97/got_rejected_by_the_app_store_5_times_before/)
  - Another first app was approved on its first submission. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1t1seka/how_do_you_promote_your_ios_app_when_you_have_no/)
  - A dev hit 4.3(a) on their first app and needed "a few weeks" to add a unique feature. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1s0z4jr/experiences_on_beating_guideline_43a_design_spam/)
- Post-launch reality:
  - A first iOS app sold 107 units ($468 proceeds) in week one, and the dev had to rush out v1.2 for bugs (Dec 2025). — [Reddit](https://reddit.com/r/iOSProgramming/comments/1pfpwq0/just_launched_my_first_ios_app_and_the_first_week/)
  - Another dev's 12-day-old app had almost zero organic discovery. — [Reddit](https://reddit.com/r/iOSProgramming/comments/1t1seka/how_do_you_promote_your_ios_app_when_you_have_no/)
  - A budgeting app built on Expo reached 1,200+ downloads. — [Reddit](https://reddit.com/r/reactnative/comments/1sm10o4/i_just_shipped_my_react_native_app_with_expo_so/)
- Long-tail game example: a text idle RPG built over about 2 years with React Native + Firebase reached 30K downloads after 1 year live (Dec 2025). — [Reddit](https://reddit.com/r/reactnative/comments/1pf5m6h/my_game_reached_over_30k_downloads_after_1_year/)

### Inferences
- **Beginner pipeline (estimate):**
  - Week 0: enroll Apple (days) and Google ($25 + identity verification), and start a Play closed test with a rough build as early as possible.
  - Weeks 1–6: learn the stack and build the MVP with AI help.
  - Weeks 4–8: iOS submission with 1–3 likely rejection rounds; Android production access after the 14-day test plus up to about a week of review.
  - First public release on both stores in roughly 6–10 weeks.
- **Experienced pipeline (estimate):** 1–3 weeks build. iOS live within days of submission. Android limited by the closed test unless using an existing or organization account, so about 3–5 weeks.

### Gaps
- No survey-quality data on median time-to-first-app for beginners in 2026. All of the above is anecdote plus policy arithmetic.
- No data on how long Apple Developer Program individual enrollment typically takes in 2026.
