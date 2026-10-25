import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        options={{ enableChangeListener: true }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="log-shift" options={{ presentation: 'modal', title: 'Log shift' }} />
          <Stack.Screen name="position" options={{ presentation: 'modal', title: 'Position' }} />
          <Stack.Screen name="import" options={{ presentation: 'modal', title: 'Import shifts' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
