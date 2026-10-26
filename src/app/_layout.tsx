import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { addDatabaseChangeListener, SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ToastHost } from '@/components/toast';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { useNotificationRouting } from '@/lib/notify';
import { syncReminders } from '@/lib/sync-reminders';
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
        <ProProvider>
          <ReminderSync />
          <NotificationRouting />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="log-shift" options={{ presentation: 'modal', title: 'Log shift' }} />
            <Stack.Screen name="position" options={{ presentation: 'modal', title: 'Position' }} />
            <Stack.Screen name="import" options={{ presentation: 'modal', title: 'Import shifts' }} />
            <Stack.Screen name="paycheck" options={{ presentation: 'modal', title: 'Paycheck' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="legal" options={{ presentation: 'modal', title: '' }} />
          </Stack>
          <ToastHost />
        </ProProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
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
          Open this on your phone instead
        </ThemedText>
        <ThemedText>
          To test on a phone, use the Expo Go app: scan the QR code in the terminal with your iPhone’s Camera, or with
          Expo Go on Android. Don’t open this address in the phone’s web browser.
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          To use the browser version on this computer, open http://localhost:{port}. Browsers only allow the app to
          store data on localhost or https addresses.
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
