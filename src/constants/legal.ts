/**
 * In-app privacy policy and terms. The hosted copies in docs/ must say the same
 * thing; update both together. Placeholders in [brackets] need real values before release.
 */

export type LegalDoc = { title: string; updated: string; sections: { heading: string; body: string }[] };

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'October 26, 2026',
  sections: [
    {
      heading: 'The short version',
      body: 'Your tips, shifts and settings are stored only on your device. Tip Tracker has no accounts and no ads, and we don’t collect, sell or share your personal data.',
    },
    {
      heading: 'What stays on your device',
      body: 'Everything you enter (shifts, tips, hours, wages, jobs, positions, notes and settings) is saved in a database on your phone. It is included in your phone’s own backups (iCloud or Google), which are controlled by you and your device maker, not by us.',
    },
    {
      heading: 'Files you export or import',
      body: 'When you export a CSV or PDF, the file goes wherever you choose to send it from the share sheet. When you import a CSV, it is read on your device. We never receive these files.',
    },
    {
      heading: 'Purchases',
      body: 'Subscriptions and purchases are processed by Apple or Google. To confirm what you’ve bought, the app uses RevenueCat, which receives an anonymous app user ID and your purchase receipts from the store. It does not receive your tips or shifts. See revenuecat.com/privacy.',
    },
    {
      heading: 'Notifications',
      body: 'Reminders are scheduled on your device. No notification data is sent to us.',
    },
    {
      heading: 'Children',
      body: 'Tip Tracker is meant for working adults and is not directed to children under 13.',
    },
    {
      heading: 'Changes and contact',
      body: 'If this policy changes, the new version will appear in the app with a new date. Questions: [contact email]. Developer: [developer name].',
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of Use',
  updated: 'October 26, 2026',
  sections: [
    {
      heading: 'Using Tip Tracker',
      body: 'Tip Tracker helps you keep records of your tips, hours and earnings. You may use it for your own personal records.',
    },
    {
      heading: 'Not tax or legal advice',
      body: 'Reports and summaries are records of what you entered, not tax, legal or financial advice. Check IRS.gov or a tax professional for how the rules apply to you. You are responsible for the accuracy of what you enter and report.',
    },
    {
      heading: 'Your data',
      body: 'Your data lives on your device. Keep your phone backups on and export your records regularly. We can’t recover data that was never backed up.',
    },
    {
      heading: 'Tip Tracker Pro',
      body: 'Pro is offered as a yearly or monthly subscription or a one-time lifetime purchase. Subscriptions renew automatically at the price shown unless you cancel at least 24 hours before the end of the current period. Free trials convert to a paid subscription when they end unless cancelled. Manage or cancel in your App Store or Google Play account settings. Refunds are handled by Apple or Google under their policies.',
    },
    {
      heading: 'No warranty',
      body: 'The app is provided “as is”. To the extent the law allows, we are not liable for losses arising from its use, including lost data or reporting errors.',
    },
    {
      heading: 'Apple’s standard terms',
      body: 'If you downloaded Tip Tracker from the App Store, Apple’s Licensed Application End User License Agreement also applies.',
    },
    {
      heading: 'Contact',
      body: 'Questions: [contact email]. These terms are governed by the laws of [jurisdiction].',
    },
  ],
};
