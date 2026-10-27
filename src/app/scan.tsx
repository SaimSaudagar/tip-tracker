import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ListGroup } from '@/components/list-group';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { msg, t } from '@/i18n';
import { track } from '@/lib/analytics';
import { parseCheckoutSlip, type SlipField, type SlipValues } from '@/lib/checkout-slip';
import { centsToInput, formatMoney } from '@/lib/money';
import { recognizeText, scanSupported } from '@/lib/scan';

const FIELDS: { field: SlipField; label: string; param: string }[] = [
  { field: 'cashTips', label: msg('Cash tips'), param: 'cash' },
  { field: 'cardTips', label: msg('Card tips'), param: 'card' },
  { field: 'tipOut', label: msg('Tip-out'), param: 'tipOut' },
  { field: 'serviceCharge', label: msg('Service charges'), param: 'serviceCharge' },
  { field: 'sales', label: msg('Sales'), param: 'sales' },
  { field: 'covers', label: msg('Covers'), param: 'covers' },
];

type State =
  | { step: 'choose' }
  | { step: 'reading' }
  | { step: 'review'; values: SlipValues }
  | { step: 'nothing' }
  | { step: 'error'; message: string };

export default function ScanScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [state, setState] = useState<State>({ step: 'choose' });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const logByHand = () => router.replace({ pathname: '/log-shift', params: date ? { date } : {} });

  const read = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setState({
            step: 'error',
            message: t('Camera access is off for Tipbook. Turn it on in Settings, or choose a photo instead.'),
          });
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const picked =
        source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (picked.canceled || !picked.assets[0]) return;
      setState({ step: 'reading' });
      const values = parseCheckoutSlip(await recognizeText(picked.assets[0].uri));
      track({ name: 'slip_scanned', fieldsFound: Object.keys(values).length });
      setState(Object.keys(values).length > 0 ? { step: 'review', values } : { step: 'nothing' });
    } catch (e) {
      setState({
        step: 'error',
        message: t('Couldn’t read that photo: {error}', { error: e instanceof Error ? e.message : String(e) }),
      });
    }
  };

  const applyValues = (values: SlipValues) => {
    const params: Record<string, string> = date ? { date } : {};
    for (const { field, param } of FIELDS) {
      const value = values[field];
      if (value !== undefined) params[param] = field === 'covers' ? String(value) : centsToInput(value);
    }
    router.replace({ pathname: '/log-shift', params });
  };

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen
        options={{
          title: t('Scan checkout slip'),
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Close')}
              onPress={close}
              hitSlop={12}
              style={styles.headerButton}>
              <ThemedText style={{ color: theme.tint }}>{t('Close')}</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {!scanSupported ? (
          <View style={styles.block}>
            <ThemedText type="smallBold">{t('Scanning works in the Tipbook app')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t(
                'Reading a slip uses your phone’s built-in text recognition, which isn’t available in Expo Go or a browser. Install a Tipbook build to try it. You can still log the shift by hand.',
              )}
            </ThemedText>
            <Button title={t('Log shift by hand')} onPress={logByHand} />
          </View>
        ) : state.step === 'choose' || state.step === 'error' ? (
          <View style={styles.block}>
            <ThemedText type="small" themeColor="textSecondary">
              {t(
                'Take a photo of the checkout slip from the end of your shift. Tipbook reads the totals on your phone; the photo isn’t saved or uploaded. You can check every number before saving.',
              )}
            </ThemedText>
            {state.step === 'error' ? (
              <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
                {state.message}
              </ThemedText>
            ) : null}
            {Platform.OS !== 'web' ? <Button title={t('Take a photo')} onPress={() => read('camera')} /> : null}
            <Button title={t('Choose a photo')} variant="secondary" onPress={() => read('library')} />
          </View>
        ) : state.step === 'reading' ? (
          <ThemedText accessibilityLiveRegion="polite">{t('Reading your slip…')}</ThemedText>
        ) : state.step === 'nothing' ? (
          <View style={styles.block}>
            <ThemedText type="smallBold">{t('No totals found')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('Try again with the slip flat, well lit and filling the photo, or enter the numbers yourself.')}
            </ThemedText>
            <Button title={t('Try another photo')} onPress={() => setState({ step: 'choose' })} />
            <Button title={t('Log shift by hand')} variant="secondary" onPress={logByHand} />
          </View>
        ) : (
          <View style={styles.block}>
            <ThemedText type="smallBold">{t('Here’s what Tipbook found')}</ThemedText>
            <ListGroup>
              {FIELDS.map(({ field, label }) => {
                const value = state.values[field];
                return (
                  <View key={field} style={styles.row}>
                    <ThemedText type="small" themeColor={value === undefined ? 'textSecondary' : undefined}>
                      {t(label)}
                    </ThemedText>
                    <ThemedText type="smallBold" themeColor={value === undefined ? 'textSecondary' : undefined}>
                      {value === undefined ? t('Not found') : field === 'covers' ? String(value) : formatMoney(value)}
                    </ThemedText>
                  </View>
                );
              })}
            </ListGroup>
            <ThemedText type="small" themeColor="textSecondary">
              {t('Next you’ll see the shift with these filled in. Add your hours and fix anything that’s off before saving.')}
            </ThemedText>
            <Button title={t('Use these numbers')} onPress={() => applyValues(state.values)} />
            <Button title={t('Try another photo')} variant="secondary" onPress={() => setState({ step: 'choose' })} />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: Platform.select({ web: Spacing.three, default: 0 }),
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  block: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
});
