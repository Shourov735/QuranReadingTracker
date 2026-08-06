import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { ensureDailyReminderScheduled } from '../services/notification-service';
import { ThemeProvider, useTheme } from '../theme/theme-context';

function RootNavigator() {
  const { mode, colors } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Quran Reading Tracker' }} />
        <Stack.Screen name="update-arabic" options={{ title: 'Update Arabic' }} />
        <Stack.Screen name="update-bangla" options={{ title: 'Update Bangla' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="history" options={{ title: 'History' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void ensureDailyReminderScheduled();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void ensureDailyReminderScheduled();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
