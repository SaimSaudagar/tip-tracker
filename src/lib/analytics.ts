/**
 * The funnel events from the launch plan. No analytics service is connected, so
 * nothing leaves the phone: development builds log each event to the console and
 * release builds drop them. To connect PostHog or Aptabase, send from `track` here,
 * then update the privacy policy (src/constants/legal.ts and docs/) and the store
 * privacy labels. Event properties must never include tip amounts or other money.
 */

export type AnalyticsEvent =
  | { name: 'onboarding_step_viewed'; step: number }
  | { name: 'onboarding_completed'; reminders: boolean }
  | { name: 'paywall_viewed'; placement: string }
  | { name: 'paywall_dismissed'; placement: string }
  | { name: 'trial_started'; product: string }
  | { name: 'purchase_completed'; product: string }
  | { name: 'shift_logged'; nth: number }
  | { name: 'report_exported'; type: 'monthly_pdf' | 'year_pdf' | 'csv' | 'backup' }
  | { name: 'import_completed'; rows: number }
  | { name: 'reminder_opened'; kind: string };

export function track(event: AnalyticsEvent) {
  if (__DEV__) console.log('[analytics]', JSON.stringify(event));
}
