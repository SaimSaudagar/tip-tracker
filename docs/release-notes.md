# Release notes

Text for each store's "What's new" box. The App Store allows 4,000 characters and shows the notes from the second version on; Google Play allows 500 characters per language and shows them from the first release.

## 1.0.0 (first release)

**Google Play, "Release notes"** (455 characters):

```
Welcome to Tipbook, the tip tracker with no ads and no account.

• Log a shift in about 5 seconds, or scan your checkout slip
• Your real hourly: wages + tips, minus tip-outs
• Calendar with what every day paid
• Monthly tip report for your employer, and a year-end summary (Pro)
• Import your history from another tip app or a spreadsheet
• Widgets, reminders and overtime

Your tips stay on your phone. Questions? See the support link on our store page.
```

**App Store:** the first version has no "What's New" text; use the promotional text in `docs/store-listing.md`.

## Template for later versions

Lead with what changed for the person using it, in their words, then fixes. Keep it to a few lines; most people read only the first.

```
New in [version]:
• [The biggest change, as a benefit: "See last year's tips side by side with this year's"]
• [Second change]

Fixes:
• [What was wrong, as the user saw it: "Shifts after midnight could show under the wrong day"]

Thanks for the reviews and emails, they decide what comes next.
```

## Checklist before each release

- `npm test`, `npm run typecheck`, `npm run lint` and `npm run test:e2e` all pass.
- Bump `version` in `app.json` (EAS increases the build numbers itself).
- If the privacy policy or terms changed, `npm run site` and upload the `site/` folder.
- On a test build: log a shift, back up, restore, and open every tab.
