/**
 * Who has Pro, and how to buy it.
 *
 * With a RevenueCat key for this platform (see revenuecat.ts), Pro comes from the `pro`
 * entitlement and purchases go through the App Store or Google Play. Without one,
 * development builds simulate a purchase with the `pro_override` setting and release
 * builds report purchases as unavailable. The "simulate Pro" switch works either way.
 */
import { addDatabaseChangeListener, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSettings, removeSetting, setSetting } from '@/db/repo';
import { todayISO, type ISODate } from '@/lib/dates';
import { buildPlans, PAYWALL_PLAN_IDS, type Plan, type PlanId, type StorePrice } from '@/lib/plans';
import { trialEndDate } from '@/lib/reminders-plan';
import {
  configureRevenueCat,
  isPurchaseCancelled,
  packageFor,
  pricesFrom,
  proStatusFrom,
  Purchases,
  revenueCatEnabled,
} from '@/purchases/revenuecat';

export type { Plan, PlanId } from '@/lib/plans';

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'failed';

type ProState = {
  isPro: boolean;
  ready: boolean;
  /** The main paywall's plans, in order, with store prices once they've loaded. */
  plans: Plan[];
  /** The one-time longer-trial offer for people leaving the onboarding paywall. */
  exitOffer: Plan;
  purchase: (plan: PlanId) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  /** Development only: turn simulated Pro on or off. */
  setSimulatedPro: (on: boolean) => Promise<void>;
};

const ProContext = createContext<ProState | null>(null);

/** Remembers when a running free trial ends, so a reminder can go out 2 days before. */
async function saveTrialEnd(db: SQLiteDatabase, trialEndsOn: ISODate | null) {
  const current = (await getSettings(db)).trial_ends_at ?? null;
  if (current === trialEndsOn) return;
  if (trialEndsOn) await setSetting(db, 'trial_ends_at', trialEndsOn);
  else await removeSetting(db, 'trial_ends_at');
}

export function ProProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [simulatedPro, setSimulatedProState] = useState(false);
  const [storePro, setStorePro] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [storeReady, setStoreReady] = useState(!revenueCatEnabled);
  const [prices, setPrices] = useState<Partial<Record<PlanId, StorePrice>>>({});

  useEffect(() => {
    let active = true;
    const refresh = () =>
      getSettings(db).then((settings) => {
        if (!active) return;
        setSimulatedProState(settings.pro_override === '1');
        setSettingsReady(true);
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

  useEffect(() => {
    if (!revenueCatEnabled) return;
    let active = true;
    configureRevenueCat();
    const apply = (info: Parameters<typeof proStatusFrom>[0]) => {
      if (!active) return;
      const status = proStatusFrom(info);
      setStorePro(status.isPro);
      setStoreReady(true);
      saveTrialEnd(db, status.trialEndsOn).catch((e) => console.warn('Could not save trial end', e));
    };
    Purchases.getCustomerInfo()
      .then(apply)
      .catch((e) => {
        console.warn('Could not load purchases', e);
        if (active) setStoreReady(true);
      });
    Purchases.getOfferings()
      .then((offerings) => {
        if (active) setPrices(pricesFrom(offerings));
      })
      .catch((e) => console.warn('Could not load prices', e));
    Purchases.addCustomerInfoUpdateListener(apply);
    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(apply);
    };
  }, [db]);

  const setSimulatedPro = useCallback(
    async (on: boolean) => {
      await db.withTransactionAsync(async () => {
        await setSetting(db, 'pro_override', on ? '1' : '0');
        if (!on && !revenueCatEnabled) await removeSetting(db, 'trial_ends_at');
      });
    },
    [db],
  );

  const purchase = useCallback(
    async (plan: PlanId): Promise<PurchaseResult> => {
      if (!revenueCatEnabled) {
        if (!__DEV__) return 'unavailable';
        await setSimulatedPro(true);
        await saveTrialEnd(db, trialEndDate(todayISO(), plan));
        return 'purchased';
      }
      try {
        const pkg = packageFor(await Purchases.getOfferings(), plan);
        if (!pkg) return 'unavailable';
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const status = proStatusFrom(customerInfo);
        setStorePro(status.isPro);
        await saveTrialEnd(db, status.trialEndsOn);
        return status.isPro ? 'purchased' : 'failed';
      } catch (e) {
        if (isPurchaseCancelled(e)) return 'cancelled';
        console.warn('Purchase failed', e);
        return 'failed';
      }
    },
    [db, setSimulatedPro],
  );

  const restore = useCallback(async () => {
    if (!revenueCatEnabled) return (await getSettings(db)).pro_override === '1';
    const status = proStatusFrom(await Purchases.restorePurchases());
    setStorePro(status.isPro);
    await saveTrialEnd(db, status.trialEndsOn);
    return status.isPro;
  }, [db]);

  const value = useMemo(() => {
    const all = buildPlans(prices);
    return {
      isPro: storePro || simulatedPro,
      ready: settingsReady && storeReady,
      plans: PAYWALL_PLAN_IDS.map((id) => all[id]),
      exitOffer: all.annual_month_trial,
      purchase,
      restore,
      setSimulatedPro,
    };
  }, [storePro, simulatedPro, settingsReady, storeReady, prices, purchase, restore, setSimulatedPro]);
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProState {
  const state = useContext(ProContext);
  if (!state) throw new Error('usePro must be used inside <ProProvider>');
  return state;
}
