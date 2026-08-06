import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProgressCard from '../components/ProgressCard';
import { getSurahByNumber } from '../data/quran-metadata';
import {
  advanceAyat,
  advanceRuku,
  calculateStreak,
  formatDateKey,
  recordReadingDay,
  resetArabicProgress,
  resetBanglaProgress,
} from '../domain/progress-logic';
import {
  getArabicProgress,
  getBanglaProgress,
  getReadingDays,
  setArabicProgress as persistArabicProgress,
  setBanglaProgress as persistBanglaProgress,
  setReadingDays as persistReadingDays,
} from '../services/progress-storage';
import type { ArabicProgress, BanglaProgress, ReadingDays } from '../types/progress';

const navigationLinks = [
  { href: '/update-arabic', label: 'Update Arabic Reading' },
  { href: '/update-bangla', label: 'Update Bangla Reading' },
  { href: '/history', label: 'View History' },
  { href: '/settings', label: 'Settings' },
] as const;

export default function HomeScreen() {
  const [arabicProgress, setArabicProgress] = useState<ArabicProgress | null>(null);
  const [banglaProgress, setBanglaProgress] = useState<BanglaProgress | null>(null);
  const [readingDays, setReadingDays] = useState<ReadingDays>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [arabic, bangla, days] = await Promise.all([
          getArabicProgress(),
          getBanglaProgress(),
          getReadingDays(),
        ]);
        if (active) {
          setArabicProgress(arabic);
          setBanglaProgress(bangla);
          setReadingDays(days);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const handleMarkArabicDone = useCallback(async () => {
    if (arabicProgress === null) {
      return;
    }
    try {
      const next = advanceRuku(arabicProgress);
      await persistArabicProgress(next);
      const nextDays = recordReadingDay(readingDays, 'arabic', formatDateKey(new Date()));
      await persistReadingDays(nextDays);
      setArabicProgress(next);
      setReadingDays(nextDays);
    } catch {
      Alert.alert('Update failed', 'Your progress could not be saved. Please try again.');
    }
  }, [arabicProgress, readingDays]);

  const handleMarkBanglaDone = useCallback(async () => {
    if (banglaProgress === null) {
      return;
    }
    try {
      const next = advanceAyat(banglaProgress);
      await persistBanglaProgress(next);
      const nextDays = recordReadingDay(readingDays, 'bangla', formatDateKey(new Date()));
      await persistReadingDays(nextDays);
      setBanglaProgress(next);
      setReadingDays(nextDays);
    } catch {
      Alert.alert('Update failed', 'Your progress could not be saved. Please try again.');
    }
  }, [banglaProgress, readingDays]);

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
      Alert.alert(
        `Start a new ${trackLabel} cycle?`,
        'Reading progress will restart at Surah 1. The lifetime completed count is kept.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => void performReset(track) },
        ],
      );
    },
    [performReset],
  );

  if (arabicProgress === null || banglaProgress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const arabicSurah = getSurahByNumber(arabicProgress.surah);
  const banglaSurah = getSurahByNumber(banglaProgress.surah);
  const streak = calculateStreak(Object.values(readingDays));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.streakBanner}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <View>
          <Text style={styles.streakLabel}>Day Streak</Text>
          <Text style={styles.streakHint}>Both tracks updated on the same day</Text>
        </View>
      </View>

      <ProgressCard
        title="Arabic Reading"
        trackName="Arabic"
        surahNumber={arabicSurah.number}
        surahArabicName={arabicSurah.nameArabic}
        surahTransliteration={arabicSurah.nameTransliteration}
        positionLabel="Ruku"
        position={arabicProgress.ruku}
        positionTotal={arabicSurah.totalRuku}
        completed={arabicProgress.completed}
        completedCount={arabicProgress.completedCount}
        lastUpdatedAt={arabicProgress.lastUpdatedAt}
        onMarkDone={() => void handleMarkArabicDone()}
        onReset={() => confirmReset('arabic')}
      />

      <ProgressCard
        title="Bangla Reading"
        trackName="Bangla"
        surahNumber={banglaSurah.number}
        surahArabicName={banglaSurah.nameArabic}
        surahTransliteration={banglaSurah.nameTransliteration}
        positionLabel="Ayat"
        position={banglaProgress.ayat}
        positionTotal={banglaSurah.totalAyat}
        completed={banglaProgress.completed}
        completedCount={banglaProgress.completedCount}
        lastUpdatedAt={banglaProgress.lastUpdatedAt}
        onMarkDone={() => void handleMarkBanglaDone()}
        onReset={() => confirmReset('bangla')}
      />

      <View style={styles.navigationSection}>
        <Text style={styles.navigationTitle}>More</Text>
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} asChild>
            <Pressable style={styles.navigationLink}>
              <Text style={styles.navigationLinkLabel}>{link.label}</Text>
            </Pressable>
          </Link>
        ))}
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
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  streakNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#208AEF',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  streakHint: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  navigationSection: {
    gap: 8,
  },
  navigationTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navigationLink: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  navigationLinkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#208AEF',
    textAlign: 'center',
  },
});
