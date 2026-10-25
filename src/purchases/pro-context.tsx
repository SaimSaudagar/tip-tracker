/**
 * Who has Pro, and how to buy it.
 *
 * RevenueCat isn't connected yet (it needs the App Store, Play Console and
 * RevenueCat accounts). Until then, development builds simulate a purchase by
 * setting the `pro_override` setting, and release builds report purchases as
 * unavailable. When RevenueCat is added, replace `loadIsPro`, `purchase` and
 * `restore` with Purchases.getCustomerInfo / purchasePackage / restorePurchases,
 * and read plan prices from the current offering instead of PLANS.
 */
import { addDatabaseChangeListener, useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSettings, setSetting } from '@/db/repo';

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

export const PLANS: Plan[] = [
  {
    id: 'annual',
    title: 'Yearly',
    price: '$24.99/year',
    detail: '14 days free, then $2.08/month',
    terms: 'No payment now. We’ll remind you 2 days before your trial ends. Then $24.99 a year, renewing until you cancel in Settings.',
    cta: 'Start my free 14 days',
    badge: 'Best value',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$3.99/month',
    detail: 'No trial. Cancel anytime.',
    terms: '$3.99 a month, renewing until you cancel in Settings.',
    cta: 'Subscribe for $3.99/month',
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    price: '$49.99 once',
    detail: 'Pay once, keep Pro forever.',
    terms: 'One-time purchase. No subscription.',
    cta: 'Buy Pro for $49.99',
  },
];

/** Offered once, to people who close the paywall at the end of onboarding. */
export const EXIT_OFFER: Plan = {
  id: 'annual_month_trial',
  title: 'Yearly',
  price: '$24.99/year',
  detail: '1 month free, then $24.99/year',
  terms: 'No payment now. We’ll remind you 2 days before your trial ends. Then $24.99 a year, renewing until you cancel in Settings.',
  cta: 'Try Pro free for a month',
};

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable';

type ProState = {
  isPro: boolean;
  ready: boolean;
  purchase: (plan: PlanId) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  /** Development only: turn simulated Pro on or off. */
  setSimulatedPro: (on: boolean) => Promise<void>;
};

const ProContext = createContext<ProState | null>(null);

export function ProProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [isPro, setIsPro] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      getSettings(db).then((settings) => {
        if (!active) return;
        setIsPro(settings.pro_override === '1');
        setReady(true);
      });
    refresh();
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === 'settings') refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [db]);

  const setSimulatedPro = useCallback(
    async (on: boolean) => {
      await setSetting(db, 'pro_override', on ? '1' : '0');
    },
    [db],
  );

  const purchase = useCallback(
    async (_plan: PlanId): Promise<PurchaseResult> => {
      if (!__DEV__) return 'unavailable';
      await setSimulatedPro(true);
      return 'purchased';
    },
    [setSimulatedPro],
  );

  const restore = useCallback(async () => {
    const pro = (await getSettings(db)).pro_override === '1';
    setIsPro(pro);
    return pro;
  }, [db]);

  const value = useMemo(
    () => ({ isPro, ready, purchase, restore, setSimulatedPro }),
    [isPro, ready, purchase, restore, setSimulatedPro],
  );
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProState {
  const state = useContext(ProContext);
  if (!state) throw new Error('usePro must be used inside <ProProvider>');
  return state;
}
