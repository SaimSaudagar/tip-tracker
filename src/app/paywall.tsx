import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getSettings, setSetting } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import type { PaywallReason } from '@/lib/pro';
import { usePro, type Plan, type PlanId } from '@/purchases/pro-context';

const HEADLINES: Record<PaywallReason, string> = {
  onboarding: 'Track every tip. No ads. Ever.',
  settings: 'Track every tip. No ads. Ever.',
  jobs: 'Track more than one job',
  positions: 'Add every position you work',
  tipout: 'Let Pro do your tip-out math',
  year: 'See your whole year',
  reports: 'Tip reports, ready when you need them',
  insights: 'Find out which shifts pay best',
};

const BENEFITS = [
  'Year-end tip summary for tax time',
  'Monthly tip report for your employer, with a reminder before the 10th',
  'Unlimited jobs and positions, with automatic tip-outs',
  'Insights: your best days, lunch vs dinner, and 12-week trends',
  'Your year at a glance: totals and real hourly',
];

export default function PaywallScreen() {
  const { reason: rawReason } = useLocalSearchParams<{ reason?: string }>();
  const reason: PaywallReason = rawReason && rawReason in HEADLINES ? (rawReason as PaywallReason) : 'settings';
  const router = useRouter();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { purchase, restore, plans, exitOffer: exitPlan } = usePro();

  const [selected, setSelected] = useState<PlanId>('annual');
  const [exitOffer, setExitOffer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => track({ name: 'paywall_viewed', placement: reason }), [reason]);
  useEffect(() => {
    if (exitOffer) track({ name: 'paywall_viewed', placement: 'exit_offer' });
  }, [exitOffer]);

  const plan: Plan = exitOffer ? exitPlan : (plans.find((p) => p.id === selected) ?? plans[0]);

  const dismiss = () => {
    track({ name: 'paywall_dismissed', placement: exitOffer ? 'exit_offer' : reason });
    close();
  };

  const close = () => {
    if (reason === 'onboarding' || !router.canGoBack()) router.replace('/');
    else router.back();
  };

  const closeOrOffer = async () => {
    // Offer a longer trial once, to people leaving the end of onboarding.
    if (reason === 'onboarding' && !exitOffer) {
      const settings = await getSettings(db);
      if (settings.exit_offer_shown !== '1') {
        await setSetting(db, 'exit_offer_shown', '1');
        setExitOffer(true);
        return;
      }
    }
    dismiss();
  };

  const buy = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await purchase(plan.id);
      if (result === 'purchased') {
        const trial = plan.id === 'annual' || plan.id === 'annual_month_trial';
        track({ name: trial ? 'trial_started' : 'purchase_completed', product: plan.id });
        close();
      } else if (result === 'unavailable') {
        setMessage('Purchases aren’t available yet. Please try again later.');
      } else if (result === 'failed') {
        setMessage('The purchase didn’t go through. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const restorePurchases = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (await restore()) close();
      else setMessage('No previous purchase found for this account.');
    } catch (e) {
      setMessage(`Couldn’t restore purchases: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={closeOrOffer} hitSlop={16}>
            <ThemedText style={[styles.close, { color: theme.textSecondary }]}>✕</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {exitOffer ? (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                Try Pro free for a month instead?
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                A full month to see your real hourly, reports and tip-outs at work. No payment now.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.block}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {HEADLINES[reason]}
              </ThemedText>
              {BENEFITS.map((b) => (
                <View key={b} style={styles.bullet}>
                  <ThemedText style={{ color: theme.tint }}>✓</ThemedText>
                  <ThemedText style={styles.bulletText}>{b}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {!exitOffer ? (
            <View style={styles.plans} accessibilityRole="radiogroup">
              {plans.map((p) => {
                const isSelected = p.id === selected;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="radio"
                    accessibilityLabel={`${p.title}, ${p.price}. ${p.detail}`}
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                    onPress={() => setSelected(p.id)}
                    style={[
                      styles.plan,
                      {
                        backgroundColor: isSelected ? theme.tintSoft : theme.backgroundElement,
                        borderColor: isSelected ? theme.tint : 'transparent',
                      },
                    ]}>
                    <View style={styles.planText}>
                      <View style={styles.planTitleRow}>
                        <ThemedText type="smallBold">{p.title}</ThemedText>
                        {p.badge ? (
                          <View style={[styles.badge, { backgroundColor: theme.tint }]}>
                            <ThemedText type="small" style={[styles.badgeText, { color: theme.onTint }]}>
                              {p.badge}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {p.detail}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">{p.price}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {message ? (
            <ThemedText style={{ color: theme.danger }} accessibilityLiveRegion="polite">
              {message}
            </ThemedText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button title={busy ? 'One moment…' : plan.cta} onPress={buy} disabled={busy} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {plan.terms}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={exitOffer ? 'No thanks, use the free plan' : 'Continue with free plan'}
            onPress={dismiss}
            hitSlop={8}
            style={styles.freeLink}>
            <ThemedText type="smallBold" style={[styles.center, { color: theme.tint }]}>
              {exitOffer ? 'No thanks, use the free plan' : 'Continue with free plan'}
            </ThemedText>
          </Pressable>
          <View style={styles.links}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
              onPress={restorePurchases}
              disabled={busy}
              hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary">
                Restore purchases
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              ·
            </ThemedText>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
              hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary">
                Terms
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              ·
            </ThemedText>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
              hitSlop={8}>
              <ThemedText type="small" themeColor="textSecondary">
                Privacy
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  close: {
    fontSize: 22,
    padding: Spacing.one,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  block: {
    gap: Spacing.two,
  },
  bullet: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
  },
  plans: {
    gap: Spacing.two,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  planText: {
    flex: 1,
    gap: Spacing.half,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: 700,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  center: {
    textAlign: 'center',
  },
  freeLink: {
    paddingVertical: Spacing.one,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
