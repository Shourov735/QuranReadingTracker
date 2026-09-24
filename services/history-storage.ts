import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../types/history';
import { getAllSurahs } from '../data/quran-metadata';

const HISTORY_KEY = 'quran-reading-tracker:history';

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  const stored = await readJson(HISTORY_KEY);
  if (Array.isArray(stored) && stored.every(isHistoryEntry)) {
    return stored
      .map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date(`${entry.date}T00:00:00`).toISOString(),
      }))
      .reverse();
  }
  return [];
}

export async function appendHistoryEntry(entry: HistoryEntry): Promise<void> {
  const stored = await readJson(HISTORY_KEY);
  const entries = Array.isArray(stored) && stored.every(isHistoryEntry) ? stored : [];
  entries.push(entry);
  await writeJson(HISTORY_KEY, entries);
}

export async function setHistoryEntries(entries: HistoryEntry[]): Promise<void> {
  await writeJson(HISTORY_KEY, entries);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const stored = await readJson(HISTORY_KEY);
  const entries = Array.isArray(stored) && stored.every(isHistoryEntry) ? stored : [];
  const next = entries.filter((entry) => entry.id !== id);
  await writeJson(HISTORY_KEY, next);
}

export async function clearAllHistory(): Promise<void> {
  await writeJson(HISTORY_KEY, []);
}

export async function getLatestEntryForTrack(track: 'arabic' | 'bangla'): Promise<HistoryEntry | null> {
  const entries = await getHistoryEntries();
  return entries.find((entry) => entry.track === track) || null;
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
    (candidate.createdAt === undefined || typeof candidate.createdAt === 'string') &&
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
