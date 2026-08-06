import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ArabicProgress,
  BanglaProgress,
  ReadingDay,
  ReadingDays,
} from '../types/progress';
import {
  createDefaultArabicProgress,
  createDefaultBanglaProgress,
} from '../types/progress';
import { getAllSurahs } from '../data/quran-metadata';

const ARABIC_PROGRESS_KEY = 'quran-reading-tracker:arabic-progress';
const BANGLA_PROGRESS_KEY = 'quran-reading-tracker:bangla-progress';
const READING_DAYS_KEY = 'quran-reading-tracker:reading-days';

export async function getArabicProgress(): Promise<ArabicProgress> {
  const stored = await readJson(ARABIC_PROGRESS_KEY);
  return isArabicProgress(stored) ? stored : createDefaultArabicProgress();
}

export async function setArabicProgress(progress: ArabicProgress): Promise<void> {
  await writeJson(ARABIC_PROGRESS_KEY, progress);
}

export async function getBanglaProgress(): Promise<BanglaProgress> {
  const stored = await readJson(BANGLA_PROGRESS_KEY);
  return isBanglaProgress(stored) ? stored : createDefaultBanglaProgress();
}

export async function setBanglaProgress(progress: BanglaProgress): Promise<void> {
  await writeJson(BANGLA_PROGRESS_KEY, progress);
}

export async function getReadingDays(): Promise<ReadingDays> {
  const stored = await readJson(READING_DAYS_KEY);
  return isReadingDays(stored) ? stored : {};
}

export async function setReadingDays(days: ReadingDays): Promise<void> {
  await writeJson(READING_DAYS_KEY, days);
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

function isArabicProgress(value: unknown): value is ArabicProgress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isSurahNumber(candidate.surah) &&
    isPositiveInteger(candidate.ruku) &&
    typeof candidate.completed === 'boolean' &&
    isNonNegativeInteger(candidate.completedCount) &&
    (typeof candidate.lastUpdatedAt === 'string' || candidate.lastUpdatedAt === null)
  );
}

function isBanglaProgress(value: unknown): value is BanglaProgress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isSurahNumber(candidate.surah) &&
    isPositiveInteger(candidate.ayat) &&
    typeof candidate.completed === 'boolean' &&
    isNonNegativeInteger(candidate.completedCount) &&
    (typeof candidate.lastUpdatedAt === 'string' || candidate.lastUpdatedAt === null)
  );
}

function isReadingDays(value: unknown): value is ReadingDays {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every(isReadingDay);
}

function isReadingDay(value: unknown): value is ReadingDay {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.date === 'string' &&
    typeof candidate.arabicUpdated === 'boolean' &&
    typeof candidate.banglaUpdated === 'boolean'
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

function isNonNegativeInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
