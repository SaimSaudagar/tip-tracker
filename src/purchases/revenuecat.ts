/**
 * RevenueCat, which handles App Store and Google Play purchases.
 *
 * It turns on when this platform's public SDK key is set: EXPO_PUBLIC_REVENUECAT_IOS_KEY
 * and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY, in a .env file for local runs or as EAS
 * environment variables for builds. Without a key, ProProvider keeps simulating purchases
 * in development. In Expo Go the SDK runs in Preview API Mode (mock purchases); real
 * purchases need a development or store build.
 *
 * Dashboard setup this code expects: an entitlement named `pro`; a current offering with
 * annual (14-day free trial), monthly and lifetime packages; and an offering named
 * `exit_offer` whose annual package has a one-month free trial.
 */
import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import { toISODate, type ISODate } from '@/lib/dates';
import type { PlanId, StorePrice } from '@/lib/plans';

export const ENTITLEMENT_ID = 'pro';
export const EXIT_OFFERING_ID = 'exit_offer';

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** Whether real purchases are set up for this build. */
export const revenueCatEnabled = !!apiKey;

let configured = false;

export function configureRevenueCat() {
  if (!apiKey || configured) return;
  Purchases.configure({ apiKey });
  configured = true;
}

export type ProStatus = { isPro: boolean; trialEndsOn: ISODate | null };

export function proStatusFrom(info: CustomerInfo): ProStatus {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return { isPro: false, trialEndsOn: null };
  const inTrial = entitlement.periodType.toUpperCase() === 'TRIAL' && entitlement.expirationDate !== null;
  return { isPro: true, trialEndsOn: inTrial ? toISODate(new Date(entitlement.expirationDate!)) : null };
}

export function packageFor(offerings: PurchasesOfferings, plan: PlanId): PurchasesPackage | null {
  const current = offerings.current;
  switch (plan) {
    case 'annual':
      return current?.annual ?? null;
    case 'monthly':
      return current?.monthly ?? null;
    case 'lifetime':
      return current?.lifetime ?? null;
    case 'annual_month_trial':
      return offerings.all[EXIT_OFFERING_ID]?.annual ?? null;
  }
}

/** Store prices for each plan that has a package, for the paywall. */
export function pricesFrom(offerings: PurchasesOfferings): Partial<Record<PlanId, StorePrice>> {
  const prices: Partial<Record<PlanId, StorePrice>> = {};
  for (const plan of ['annual', 'monthly', 'lifetime', 'annual_month_trial'] as PlanId[]) {
    const product = packageFor(offerings, plan)?.product;
    if (product) {
      prices[plan] = {
        priceString: product.priceString,
        pricePerMonthString: plan === 'lifetime' || plan === 'monthly' ? null : product.pricePerMonthString,
      };
    }
  }
  return prices;
}

export function isPurchaseCancelled(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const error = e as { code?: unknown; userCancelled?: unknown };
  return error.userCancelled === true || error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export { Purchases };
