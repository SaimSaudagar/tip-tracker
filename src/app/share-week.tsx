import { Stack, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { showToast } from '@/components/toast';
import { WEEK_CARD_SIZE, WeekCard } from '@/components/week-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getWeekStart, listShiftsBetween } from '@/db/repo';
import { useDbQuery } from '@/db/use-db-query';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { track } from '@/lib/analytics';
import { weekRange } from '@/lib/dates';
import { errorText } from '@/lib/errors';
import { imageShareSupported, shareViewAsImage } from '@/lib/share-image';
import { buildWeekCard } from '@/lib/week-card';

/** The picture is saved at 3x the card's on-screen size: 1080 × 1350, Instagram's 4:5. */
const IMAGE = { width: WEEK_CARD_SIZE.width * 3, height: WEEK_CARD_SIZE.height * 3 };

export default function ShareWeekScreen() {
  const theme = useTheme();
  const router = useRouter();
  const today = useToday();
  const { width: windowWidth } = useWindowDimensions();
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (db: SQLiteDatabase) => {
      const weekStart = await getWeekStart(db);
      const week = weekRange(today, weekStart);
      return buildWeekCard(await listShiftsBetween(db, week.start, week.end), today, weekStart);
    },
    [today],
  );
  const { data: card, error } = useDbQuery(load);

  // Narrow phones show the card smaller; the saved picture is the same size everywhere.
  const scale = Math.min(1, (Math.min(windowWidth, MaxContentWidth) - Spacing.three * 2) / WEEK_CARD_SIZE.width);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const shareImage = async () => {
    setBusy(true);
    try {
      await shareViewAsImage(cardRef, IMAGE.width, IMAGE.height, 'My week in tips');
      track({ name: 'week_shared', format: 'image' });
    } catch (e) {
      showToast({ title: 'Couldn’t share the picture', detail: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const shareText = async () => {
    if (!card) return;
    try {
      // Browsers without a share sheet get the text on the clipboard instead.
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.share) {
        await navigator.clipboard.writeText(card.text);
        showToast({ title: 'Copied to the clipboard' });
      } else {
        await Share.share({ message: card.text });
      }
      track({ name: 'week_shared', format: 'text' });
    } catch (e) {
      showToast({ title: 'Couldn’t share your week', detail: errorText(e) });
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Share my week',
          headerLeft: () => (
            <Pressable accessibilityRole="button" onPress={close} hitSlop={12} style={styles.headerButton}>
              <ThemedText style={{ color: theme.tint }}>Close</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {error ? <ThemedText style={{ color: theme.danger }}>Couldn’t load your week: {error.message}</ThemedText> : null}
        {card ? (
          <>
            <View style={{ width: WEEK_CARD_SIZE.width * scale, height: WEEK_CARD_SIZE.height * scale }}>
              <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
                <WeekCard card={card} ref={cardRef} />
              </View>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Only what’s on the card is shared. Your shifts stay on this phone.
            </ThemedText>
            {imageShareSupported ? (
              <Button
                title={busy ? 'Getting it ready…' : 'Share picture'}
                onPress={shareImage}
                disabled={busy}
                style={styles.button}
              />
            ) : null}
            <Button
              title="Share as text"
              variant={imageShareSupported ? 'secondary' : 'primary'}
              onPress={shareText}
              style={styles.button}
            />
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    alignItems: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  note: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
  headerButton: {
    paddingHorizontal: Platform.select({ web: Spacing.three, default: 0 }),
  },
});
