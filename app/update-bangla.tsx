import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SurahSearchModal from '../components/SurahSearchModal';
import { getSurahByNumber } from '../data/quran-metadata';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/theme-context';
import {
  formatDateKey,
  recordReadingDay,
  setBanglaProgress,
} from '../domain/progress-logic';
import {
  getBanglaProgress,
  getReadingDays,
  setBanglaProgress as persistBanglaProgress,
  setReadingDays as persistReadingDays,
} from '../services/progress-storage';
import { appendHistoryEntry } from '../services/history-storage';
import type { BanglaProgress } from '../types/progress';
import { createHistoryEntry } from '../types/history';

export default function UpdateBanglaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [progress, setProgress] = useState<BanglaProgress | null>(null);
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayat, setAyat] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await getBanglaProgress();
      if (active) {
        setProgress(stored);
        setSurahNumber(stored.surah);
        setAyat(stored.ayat);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalAyat = useMemo(() => getSurahByNumber(surahNumber).totalAyat, [surahNumber]);
  const selectedSurah = useMemo(() => getSurahByNumber(surahNumber), [surahNumber]);

  const handleSurahChange = useCallback((number: number) => {
    setSurahNumber(number);
    const surahTotal = getSurahByNumber(number).totalAyat;
    setAyat((current) => (current <= surahTotal ? current : surahTotal));
  }, []);

  const handleAyatTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      setAyat(1);
      return;
    }
    const num = parseInt(cleaned, 10);
    if (num < 1) {
      setAyat(1);
    } else if (num > totalAyat) {
      setAyat(totalAyat);
    } else {
      setAyat(num);
    }
  };

  const handleSave = useCallback(async () => {
    if (progress === null) {
      return;
    }
    setSaving(true);
    try {
      const next = setBanglaProgress(progress, surahNumber, ayat);
      await persistBanglaProgress(next);
      const days = await getReadingDays();
      const todayKey = formatDateKey(new Date());
      await persistReadingDays(recordReadingDay(days, 'bangla', todayKey));
      if (next.surah !== progress.surah || next.ayat !== progress.ayat) {
        await appendHistoryEntry(
          createHistoryEntry('bangla', progress.surah, progress.ayat, next.surah, next.ayat, todayKey),
        ).catch(() => undefined);
      }
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Save failed', 'Your progress could not be saved. Please try again.');
    }
  }, [ayat, progress, surahNumber]);

  if (progress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Surah</Text>
        <Pressable
          style={styles.surahSelectorButton}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.surahInfo}>
            <Text style={styles.surahNumberText}>{selectedSurah.number}.</Text>
            <Text style={styles.surahNameText}>{selectedSurah.nameTransliteration}</Text>
          </View>
          <Text style={styles.surahArabicText}>{selectedSurah.nameArabic}</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ayat (1 to {totalAyat})</Text>
        <View style={styles.numericContainer}>
          <Pressable
            style={[styles.stepButton, ayat <= 1 && styles.stepButtonDisabled]}
            onPress={() => setAyat((prev) => Math.max(1, prev - 1))}
            disabled={ayat <= 1}
          >
            <Text style={styles.stepButtonText}>-</Text>
          </Pressable>

          <TextInput
            style={styles.numericInput}
            value={ayat.toString()}
            onChangeText={handleAyatTextChange}
            keyboardType="number-pad"
            maxLength={3}
            textAlign="center"
          />

          <Pressable
            style={[styles.stepButton, ayat >= totalAyat && styles.stepButtonDisabled]}
            onPress={() => setAyat((prev) => Math.min(totalAyat, prev + 1))}
            disabled={ayat >= totalAyat}
          >
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveButtonLabel}>{saving ? 'Saving...' : 'Save'}</Text>
      </Pressable>

      <SurahSearchModal
        visible={modalVisible}
        selectedSurahNumber={surahNumber}
        onSelect={handleSurahChange}
        onClose={() => setModalVisible(false)}
      />
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
      gap: 20,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    field: {
      gap: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    surahSelectorButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    surahInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    surahNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    surahNameText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    surahArabicText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    numericContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonDisabled: {
      opacity: 0.4,
    },
    stepButtonText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    numericInput: {
      flex: 1,
      height: 48,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonLabel: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
