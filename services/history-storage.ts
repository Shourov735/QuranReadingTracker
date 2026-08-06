import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../types/history';
import { getAllSurahs } from '../data/quran-metadata';

const HISTORY_KEY = 'quran-reading-tracker:history';

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  const stored = await readJson(HISTORY_KEY);
  if (Array.isArray(stored) && stored.every(isHistoryEntry)) {
    return [...stored].reverse();
  }
  return [];
}

export async function appendHistoryEntry(entry: HistoryEntry): Promise<void> {
  const stored = await readJson(HISTORY_KEY);
  const entries = Array.isArray(stored) && stored.every(isHistoryEntry) ? stored : [];
  entries.push(entry);
  await writeJson(HISTORY_KEY, entries);
}

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    (candidate.track === 'arabic' || candidate.track === 'bangla') &&
    isSurahNumber(candidate.fromSurah) &&
    isPositiveInteger(candidate.fromPosition) &&
    isSurahNumber(candidate.toSurah) &&
    isPositiveInteger(candidate.toPosition)
  );
}

function isSurahNumber(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= getAllSurahs().length
  );
}

function isPositiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}
