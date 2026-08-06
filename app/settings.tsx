import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resetArabicProgress, resetBanglaProgress } from '../domain/progress-logic';
import {
  getArabicProgress,
  getBanglaProgress,
  setArabicProgress as persistArabicProgress,
  setBanglaProgress as persistBanglaProgress,
} from '../services/progress-storage';
import { getReminderTimeLabel } from '../services/notification-service';
import type { ThemeColors, ThemePreference } from '../theme/colors';
import { useTheme } from '../theme/theme-context';
import type { ArabicProgress, BanglaProgress } from '../types/progress';

const GITHUB_URL = 'https://github.com/Shourov735/QuranReadingTracker';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [arabicProgress, setArabicProgress] = useState<ArabicProgress | null>(null);
  const [banglaProgress, setBanglaProgress] = useState<BanglaProgress | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [arabic, bangla] = await Promise.all([getArabicProgress(), getBanglaProgress()]);
      if (active) {
        setArabicProgress(arabic);
        setBanglaProgress(bangla);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const performReset = useCallback(
    async (track: 'arabic' | 'bangla') => {
      try {
        if (track === 'arabic') {
          if (arabicProgress === null) {
            return;
          }
          const next = resetArabicProgress(arabicProgress);
          await persistArabicProgress(next);
          setArabicProgress(next);
        } else {
          if (banglaProgress === null) {
            return;
          }
          const next = resetBanglaProgress(banglaProgress);
          await persistBanglaProgress(next);
          setBanglaProgress(next);
        }
      } catch {
        Alert.alert('Reset failed', 'Your progress could not be reset. Please try again.');
      }
    },
    [arabicProgress, banglaProgress],
  );

  const confirmReset = useCallback(
    (track: 'arabic' | 'bangla') => {
      const trackLabel = track === 'arabic' ? 'Arabic' : 'Bangla';
      const positionLabel = track === 'arabic' ? 'Ruku 1' : 'Ayat 1';
      const otherTrack = track === 'arabic' ? 'Bangla' : 'Arabic';
      Alert.alert(
        `Reset ${trackLabel} progress?`,
        `Your reading position will restart at Surah 1, ${positionLabel}. The lifetime completed count is kept, and ${otherTrack} progress is not affected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => void performReset(track) },
        ],
      );
    },
    [performReset],
  );

  const openGitHub = useCallback(async () => {
    try {
      await Linking.openURL(GITHUB_URL);
    } catch {
      Alert.alert('Could not open link', 'The GitHub repository could not be opened.');
    }
  }, []);

  if (arabicProgress === null || banglaProgress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reminder</Text>
        <View style={styles.card}>
          <Text style={styles.reminderTime}>{getReminderTimeLabel()}</Text>
          <Text style={styles.cardBody}>
            A reminder notification is scheduled every day at this time. Choosing a custom
            time will be available in a future version.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Theme</Text>
          <Text style={styles.cardBody}>
            System follows your device setting. Choosing Light or Dark overrides it.
          </Text>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.themeOption, selected && styles.themeOptionSelected]}
                  onPress={() => void setPreference(option.value)}
                >
                  <Text
                    style={[styles.themeOptionLabel, selected && styles.themeOptionLabelSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reset Progress</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arabic Reading</Text>
          <Text style={styles.cardBody}>
            Restarts at Surah 1, Ruku 1. The lifetime completed count is kept.
          </Text>
          <Pressable style={styles.resetButton} onPress={() => confirmReset('arabic')}>
            <Text style={styles.resetButtonLabel}>Reset Arabic Progress</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bangla Reading</Text>
          <Text style={styles.cardBody}>
            Restarts at Surah 1, Ayat 1. The lifetime completed count is kept.
          </Text>
          <Pressable style={styles.resetButton} onPress={() => confirmReset('bangla')}>
            <Text style={styles.resetButtonLabel}>Reset Bangla Progress</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quran Reading Tracker</Text>
          <Text style={styles.cardBody}>
            Track your daily Quran reading in Arabic and Bangla — offline, on your device.
          </Text>
          <Pressable style={styles.linkButton} onPress={() => void openGitHub()}>
            <Text style={styles.linkButtonLabel}>GitHub Repository</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    reminderTime: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.accent,
    },
    themeOptionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    themeOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    themeOptionSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeOptionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    themeOptionLabelSelected: {
      color: colors.accentText,
    },
    resetButton: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.destructive,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    resetButtonLabel: {
      color: colors.destructiveText,
      fontSize: 15,
      fontWeight: '600',
    },
    linkButton: {
      marginTop: 4,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    linkButtonLabel: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
