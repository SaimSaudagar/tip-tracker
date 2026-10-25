import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { addDatabaseChangeListener, SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { useNotificationRouting } from '@/lib/notify';
import { syncReminders } from '@/lib/sync-reminders';
import { ProProvider, usePro } from '@/purchases/pro-context';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
            <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="legal" options={{ presentation: 'modal', title: '' }} />
          </Stack>
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
