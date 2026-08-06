import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { ensureDailyReminderScheduled } from '../services/notification-service';

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
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Quran Reading Tracker' }} />
      <Stack.Screen name="update-arabic" options={{ title: 'Update Arabic' }} />
      <Stack.Screen name="update-bangla" options={{ title: 'Update Bangla' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
    </Stack>
  );
}
