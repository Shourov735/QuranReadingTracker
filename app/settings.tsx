import { useCallback, useEffect, useState } from 'react';
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
import type { ArabicProgress, BanglaProgress } from '../types/progress';

const GITHUB_URL = 'https://github.com/Shourov735/QuranReadingTracker';

export default function SettingsScreen() {
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

  const openGitHub = useCallback(() => {
    void Linking.openURL(GITHUB_URL);
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
          <Pressable style={styles.linkButton} onPress={openGitHub}>
            <Text style={styles.linkButtonLabel}>GitHub Repository</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
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
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 20,
  },
  reminderTime: {
    fontSize: 40,
    fontWeight: '800',
    color: '#208AEF',
  },
  resetButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonLabel: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 4,
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
