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
  setArabicProgress,
} from '../domain/progress-logic';
import {
  getArabicProgress,
  getReadingDays,
  setArabicProgress as persistArabicProgress,
  setReadingDays as persistReadingDays,
} from '../services/progress-storage';
import type { ArabicProgress } from '../types/progress';

const ALL_SURAHS = getAllSurahs();

export default function UpdateArabicScreen() {
  const [progress, setProgress] = useState<ArabicProgress | null>(null);
  const [surahNumber, setSurahNumber] = useState(1);
  const [ruku, setRuku] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await getArabicProgress();
      if (active) {
        setProgress(stored);
        setSurahNumber(stored.surah);
        setRuku(stored.ruku);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSurahChange = useCallback((number: number) => {
    setSurahNumber(number);
    const totalRuku = getSurahByNumber(number).totalRuku;
    setRuku((current) => (current <= totalRuku ? current : totalRuku));
  }, []);

  const handleSave = useCallback(async () => {
    if (progress === null) {
      return;
    }
    setSaving(true);
    try {
      const next = setArabicProgress(progress, surahNumber, ruku);
      await persistArabicProgress(next);
      const days = await getReadingDays();
      await persistReadingDays(recordReadingDay(days, 'arabic', formatDateKey(new Date())));
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Save failed', 'Your progress could not be saved. Please try again.');
    }
  }, [progress, ruku, surahNumber]);

  if (progress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalRuku = getSurahByNumber(surahNumber).totalRuku;
  const rukuOptions = Array.from({ length: totalRuku }, (_, index) => index + 1);

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
        <Text style={styles.label}>Ruku</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={ruku} onValueChange={setRuku} style={styles.picker}>
            {rukuOptions.map((option) => (
              <Picker.Item key={option} label={`Ruku ${option}`} value={option} />
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
