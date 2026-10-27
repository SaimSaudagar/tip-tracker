import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { addDatabaseChangeListener, SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ToastHost } from '@/components/toast';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { getSettings } from '@/db/repo';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { applyLanguagePreference, getLanguage, parseLanguagePreference, t, useLanguage } from '@/i18n';
import { applyAppearance, parseAppearance } from '@/lib/appearance';
import { useNotificationRouting } from '@/lib/notify';
import { syncReminders } from '@/lib/sync-reminders';
import { loadWidgetSnapshot } from '@/widgets/load';
import { updateHomeWidgets } from '@/widgets/update';
import { ProProvider, usePro } from '@/purchases/pro-context';

export { ErrorBoundary } from 'expo-router';

// Browsers only allow the database's storage on https or localhost, so the web
// build can't start when opened at a network address like http://192.168.x.x.
const insecureWeb = Platform.OS === 'web' && typeof window !== 'undefined' && !window.isSecureContext;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  if (insecureWeb) return <InsecureWebNotice />;
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        options={{ enableChangeListener: true }}>
        <LanguageGate>
          <ProProvider>
            <AppearanceSync />
            <ReminderSync />
            <WidgetSync />
            <NotificationRouting />
            <AppStack />
            <ToastHost />
          </ProProvider>
        </LanguageGate>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

function AppStack() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="log-shift" options={{ presentation: 'modal', title: t('Log shift') }} />
      <Stack.Screen name="position" options={{ presentation: 'modal', title: t('Position') }} />
      <Stack.Screen name="import" options={{ presentation: 'modal', title: t('Import shifts') }} />
      <Stack.Screen name="paycheck" options={{ presentation: 'modal', title: t('Paycheck') }} />
      <Stack.Screen name="tip-pool" options={{ presentation: 'modal', title: t('Tip pool') }} />
      <Stack.Screen name="scan" options={{ presentation: 'modal', title: t('Scan checkout slip') }} />
      <Stack.Screen name="share-week" options={{ presentation: 'modal', title: t('Share my week') }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="legal" options={{ presentation: 'modal', title: '' }} />
    </Stack>
  );
}

/**
 * Applies the language picked in Settings (or the phone's), and remounts the app when it
 * changes so every screen redraws in the new language. Shows nothing until the choice has
 * loaded, so the app doesn't flash the phone's language first.
 */
function LanguageGate({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const language = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const backToSettings = useRef(false);

  useEffect(() => {
    let active = true;
    const load = (fromSettings: boolean) =>
      getSettings(db)
        .then((settings) => {
          const before = getLanguage();
          applyLanguagePreference(parseLanguagePreference(settings.language));
          // Only ever set here: a restore fires many overlapping loads, and a later one mustn't undo it.
          if (fromSettings && getLanguage() !== before) backToSettings.current = true;
        })
        .catch((e) => console.warn('Could not load the language', e))
        .finally(() => {
          if (active) setLoaded(true);
        });
    load(false);
    const dbSubscription = addDatabaseChangeListener((event) => {
      if (event.tableName === 'settings') load(true);
    });
    // The phone's language can change while the app is in the background.
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load(false);
    });
    return () => {
      active = false;
      dbSubscription.remove();
      appSubscription.remove();
    };
  }, [db]);

  // Remounting starts navigation over on Home. A language picked in Settings (or brought back
  // by restoring a backup there) returns to Settings, where the person was.
  useEffect(() => {
    if (!backToSettings.current) return;
    backToSettings.current = false;
    router.navigate('/settings');
  }, [language, router]);

  if (!loaded) return null;
  return <Fragment key={language}>{children}</Fragment>;
}

/** Applies the light/dark choice from Settings at launch and whenever it changes. */
function AppearanceSync() {
  const db = useSQLiteContext();

  useEffect(() => {
    let active = true;
    const load = () =>
      getSettings(db).then((settings) => {
        if (active) applyAppearance(parseAppearance(settings.appearance));
      });
    load();
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === 'settings') load();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [db]);

  return null;
}

/** Keeps scheduled reminders in step with shifts and settings, and rolls the window forward each time the app opens. */
function ReminderSync() {
  const db = useSQLiteContext();
  const { isPro, ready } = usePro();

  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncReminders(db, { isPro }).catch((e) => console.warn('Could not schedule reminders', e));
      }, 400);
    };
    sync();
    const dbSubscription = addDatabaseChangeListener((event) => {
      if (event.tableName === 'shifts' || event.tableName === 'settings') sync();
    });
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearTimeout(timer);
      dbSubscription.remove();
      appSubscription.remove();
    };
  }, [db, isPro, ready]);

  return null;
}

/** Keeps the home-screen widgets showing this week's numbers whenever shifts or settings change. */
function WidgetSync() {
  const db = useSQLiteContext();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        loadWidgetSnapshot(db)
          .then(updateHomeWidgets)
          .catch((e) => console.warn('Could not update widgets', e));
      }, 600);
    };
    sync();
    const dbSubscription = addDatabaseChangeListener((event) => {
      if (event.tableName === 'shifts' || event.tableName === 'settings' || event.tableName === 'jobs') sync();
    });
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearTimeout(timer);
      dbSubscription.remove();
      appSubscription.remove();
    };
  }, [db]);

  return null;
}

function NotificationRouting() {
  useNotificationRouting();
  return null;
}

function InsecureWebNotice() {
  const port = typeof window !== 'undefined' ? window.location.port || '8081' : '8081';
  return (
    <ThemedView style={styles.notice}>
      <View style={styles.noticeBody}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {t('Open this on your phone instead')}
        </ThemedText>
        <ThemedText>
          {t(
            'To test on a phone, use the Expo Go app: scan the QR code in the terminal with your iPhone’s Camera, or with Expo Go on Android. Don’t open this address in the phone’s web browser.',
          )}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {t(
            'To use the browser version on this computer, open {address}. Browsers only allow the app to store data on localhost or https addresses.',
            { address: `http://localhost:${port}` },
          )}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  notice: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  noticeBody: {
    gap: Spacing.three,
    maxWidth: 560,
    alignSelf: 'center',
  },
});
