import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '../theme/colors';

const THEME_PREFERENCE_KEY = 'quran-reading-tracker:theme-preference';

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const raw = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    if (raw === 'light' || raw === 'dark') {
      return raw;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
}
