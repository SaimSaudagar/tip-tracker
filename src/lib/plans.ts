/**
 * The Pro plans shown on the paywall. Prices default to the launch prices; once
 * RevenueCat is connected the store's own price strings (local currency) replace them,
 * because the paywall must show exactly what the store will charge.
 */

export type PlanId = 'annual' | 'monthly' | 'lifetime' | 'annual_month_trial';

export type Plan = {
  id: PlanId;
  title: string;
  price: string;
  /** Shown under the price on the paywall. */
  detail: string;
  /** Fine print next to the buy button. */
  terms: string;
  cta: string;
  badge?: string;
};

/** A price as the store formats it, e.g. "$24.99", plus the per-month equivalent when it has one. */
export type StorePrice = { priceString: string; pricePerMonthString: string | null };

/** The plans on the main paywall, in display order. */
export const PAYWALL_PLAN_IDS = ['annual', 'monthly', 'lifetime'] as const satisfies readonly PlanId[];

export const DEFAULT_PRICES: Record<PlanId, StorePrice> = {
  annual: { priceString: '$24.99', pricePerMonthString: '$2.08' },
  monthly: { priceString: '$3.99', pricePerMonthString: null },
  lifetime: { priceString: '$49.99', pricePerMonthString: null },
  annual_month_trial: { priceString: '$24.99', pricePerMonthString: '$2.08' },
};

const TRIAL_TERMS = 'No payment now. We’ll remind you 2 days before your trial ends.';

export function buildPlan(id: PlanId, price: StorePrice = DEFAULT_PRICES[id]): Plan {
  const p = price.priceString;
  const perMonth = price.pricePerMonthString;
  switch (id) {
    case 'annual':
      return {
        id,
        title: 'Yearly',
        price: `${p}/year`,
        detail: perMonth ? `14 days free, then ${perMonth}/month` : '14 days free',
        terms: `${TRIAL_TERMS} Then ${p} a year, renewing until you cancel in Settings.`,
        cta: 'Start my free 14 days',
        badge: 'Best value',
      };
    case 'monthly':
      return {
        id,
        title: 'Monthly',
        price: `${p}/month`,
        detail: 'No trial. Cancel anytime.',
        terms: `${p} a month, renewing until you cancel in Settings.`,
        cta: `Subscribe for ${p}/month`,
      };
    case 'lifetime':
      return {
        id,
        title: 'Lifetime',
        price: `${p} once`,
        detail: 'Pay once, keep Pro forever.',
        terms: 'One-time purchase. No subscription.',
        cta: `Buy Pro for ${p}`,
      };
    case 'annual_month_trial':
      return {
        id,
        title: 'Yearly',
        price: `${p}/year`,
        detail: `1 month free, then ${p}/year`,
        terms: `${TRIAL_TERMS} Then ${p} a year, renewing until you cancel in Settings.`,
        cta: 'Try Pro free for a month',
      };
  }
}

/** Every plan, using store prices where they're known and launch prices otherwise. */
export function buildPlans(prices: Partial<Record<PlanId, StorePrice>>): Record<PlanId, Plan> {
  const plan = (id: PlanId) => buildPlan(id, prices[id] ?? DEFAULT_PRICES[id]);
  return {
    annual: plan('annual'),
    monthly: plan('monthly'),
    lifetime: plan('lifetime'),
    annual_month_trial: plan('annual_month_trial'),
  };
}
