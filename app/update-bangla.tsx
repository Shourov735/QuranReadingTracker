import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getAllSurahs, getSurahByNumber } from '../data/quran-metadata';
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

const ALL_SURAHS = getAllSurahs();

export default function UpdateBanglaScreen() {
  const [progress, setProgress] = useState<BanglaProgress | null>(null);
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayat, setAyat] = useState(1);
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

  const handleSurahChange = useCallback((number: number) => {
    setSurahNumber(number);
    const totalAyat = getSurahByNumber(number).totalAyat;
    setAyat((current) => (current <= totalAyat ? current : totalAyat));
  }, []);

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
  }, [progress, surahNumber, ayat]);

  if (progress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalAyat = getSurahByNumber(surahNumber).totalAyat;
  const ayatOptions = Array.from({ length: totalAyat }, (_, index) => index + 1);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Surah</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={surahNumber}
            onValueChange={handleSurahChange}
            style={styles.picker}
          >
            {ALL_SURAHS.map((surah) => (
              <Picker.Item
                key={surah.number}
                label={`${surah.number}. ${surah.nameTransliteration}`}
                value={surah.number}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ayat</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={ayat} onValueChange={setAyat} style={styles.picker}>
            {ayatOptions.map((option) => (
              <Picker.Item key={option} label={`Ayat ${option}`} value={option} />
            ))}
          </Picker>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={() => void handleSave()}
        disabled={saving}
      >
        <Text style={styles.saveButtonLabel}>{saving ? 'Saving...' : 'Save'}</Text>
      </Pressable>
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
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 52,
  },
  saveButton: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
