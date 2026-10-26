import { buildPlan, buildPlans } from '@/lib/plans';

describe('paywall plans', () => {
  it('shows launch prices until the store prices load', () => {
    expect(buildPlan('annual')).toEqual({
      id: 'annual',
      title: 'Yearly',
      price: '$24.99/year',
      detail: '14 days free, then $2.08/month',
      terms: 'No payment now. We’ll remind you 2 days before your trial ends. Then $24.99 a year, renewing until you cancel in Settings.',
      cta: 'Start my free 14 days',
      badge: 'Best value',
    });
    expect(buildPlan('monthly').cta).toBe('Subscribe for $3.99/month');
    expect(buildPlan('lifetime').price).toBe('$49.99 once');
    expect(buildPlan('annual_month_trial').detail).toBe('1 month free, then $24.99/year');
  });

  it('uses the store’s price strings everywhere the price appears', () => {
    const plans = buildPlans({
      annual: { priceString: '27,99 €', pricePerMonthString: '2,33 €' },
      lifetime: { priceString: '54,99 €', pricePerMonthString: null },
    });
    expect(plans.annual.price).toBe('27,99 €/year');
    expect(plans.annual.detail).toBe('14 days free, then 2,33 €/month');
    expect(plans.annual.terms).toContain('Then 27,99 € a year');
    expect(plans.lifetime.cta).toBe('Buy Pro for 54,99 €');
    expect(plans.monthly.price).toBe('$3.99/month'); // not loaded yet, so the launch price
  });

  it('drops the per-month figure when the store has none', () => {
    expect(buildPlan('annual', { priceString: '$24.99', pricePerMonthString: null }).detail).toBe('14 days free');
  });
});
