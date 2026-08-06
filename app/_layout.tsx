import { Stack } from 'expo-router';

export default function RootLayout() {
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
