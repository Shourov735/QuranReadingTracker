import { getAllSurahs, getNextSurahNumber, getSurahByNumber } from '../data/quran-metadata';
import type { HistoryEntry } from '../types/history';
import type {
  ArabicProgress,
  BanglaProgress,
  ReadingDay,
  ReadingDays,
} from '../types/progress';

function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function previousDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);
  return formatDateKey(date);
}

export function advanceRuku(progress: ArabicProgress): ArabicProgress {
  if (progress.completed) {
    return progress;
  }
  const surahMeta = getSurahByNumber(progress.surah);
  if (progress.ruku < surahMeta.totalRuku) {
    return {
      ...progress,
      ruku: progress.ruku + 1,
      lastUpdatedAt: nowIso(),
    };
  }
  const nextSurahNumber = getNextSurahNumber(progress.surah);
  if (nextSurahNumber === null) {
    return {
      ...progress,
      completed: true,
      completedCount: progress.completedCount + 1,
      lastUpdatedAt: nowIso(),
    };
  }
  return {
    ...progress,
    surah: nextSurahNumber,
    ruku: 1,
    lastUpdatedAt: nowIso(),
  };
}

export function advanceAyat(progress: BanglaProgress): BanglaProgress {
  return advanceAyats(progress, 1);
}

export function advanceAyats(progress: BanglaProgress, count: number): BanglaProgress {
  if (progress.completed || count <= 0) {
    return progress;
  }
  let currentSurah = progress.surah;
  let currentAyat = progress.ayat;
  let remaining = count;
  let completed = false;
  let completedCount = progress.completedCount;

  while (remaining > 0) {
    const surahMeta = getSurahByNumber(currentSurah);
    const availableInSurah = surahMeta.totalAyat - currentAyat;
    if (remaining <= availableInSurah) {
      currentAyat += remaining;
      remaining = 0;
    } else {
      const nextSurah = getNextSurahNumber(currentSurah);
      if (nextSurah === null) {
        completed = true;
        completedCount += 1;
        currentAyat = surahMeta.totalAyat;
        remaining = 0;
      } else {
        remaining -= (availableInSurah + 1);
        currentSurah = nextSurah;
        currentAyat = 1;
      }
    }
  }

  return {
    ...progress,
    surah: currentSurah,
    ayat: currentAyat,
    completed,
    completedCount,
    lastUpdatedAt: nowIso(),
  };
}

export function setArabicProgress(
  progress: ArabicProgress,
  surah: number,
  ruku: number,
): ArabicProgress {
  const surahMeta = getSurahByNumber(surah);
  if (ruku < 1 || ruku > surahMeta.totalRuku) {
    throw new Error(
      `Invalid ruku ${ruku} for surah ${surah}: valid range is 1-${surahMeta.totalRuku}.`,
    );
  }
  return {
    ...progress,
    surah,
    ruku,
    completed: false,
    lastUpdatedAt: nowIso(),
  };
}

export function setBanglaProgress(
  progress: BanglaProgress,
  surah: number,
  ayat: number,
): BanglaProgress {
  const surahMeta = getSurahByNumber(surah);
  if (ayat < 1 || ayat > surahMeta.totalAyat) {
    throw new Error(
      `Invalid ayat ${ayat} for surah ${surah}: valid range is 1-${surahMeta.totalAyat}.`,
    );
  }
  return {
    ...progress,
    surah,
    ayat,
    completed: false,
    lastUpdatedAt: nowIso(),
  };
}

export function resetArabicProgress(progress: ArabicProgress): ArabicProgress {
  return {
    surah: 1,
    ruku: 1,
    completed: false,
    completedCount: progress.completedCount,
    lastUpdatedAt: nowIso(),
  };
}

export function resetBanglaProgress(progress: BanglaProgress): BanglaProgress {
  return {
    surah: 1,
    ayat: 1,
    completed: false,
    completedCount: progress.completedCount,
    lastUpdatedAt: nowIso(),
  };
}

export function recordReadingDay(
  readingDays: ReadingDays,
  track: 'arabic' | 'bangla',
  date: string,
): ReadingDays {
  const existing = readingDays[date];
  const updated = existing
    ? { ...existing }
    : { date, arabicUpdated: false, banglaUpdated: false };
  if (track === 'arabic') {
    updated.arabicUpdated = true;
  } else {
    updated.banglaUpdated = true;
  }
  return { ...readingDays, [date]: updated };
}

export function isReadingDayComplete(readingDays: ReadingDays, dateKey: string): boolean {
  const day = readingDays[dateKey];
  return day !== undefined && day.arabicUpdated && day.banglaUpdated;
}

export function calculateStreak(readingDays: ReadingDay[]): number {
  const bothUpdatedDays = new Set(
    readingDays
      .filter((day) => day.arabicUpdated && day.banglaUpdated)
      .map((day) => day.date),
  );
  if (bothUpdatedDays.size === 0) {
    return 0;
  }
  let cursor = formatDateKey(new Date());
  if (!bothUpdatedDays.has(cursor)) {
    cursor = previousDateKey(cursor);
    if (!bothUpdatedDays.has(cursor)) {
      return 0;
    }
  }
  let streak = 1;
  let previous = previousDateKey(cursor);
  while (bothUpdatedDays.has(previous)) {
    cursor = previous;
    streak += 1;
    previous = previousDateKey(cursor);
  }
  return streak;
}

export function calculateLongestStreak(readingDays: ReadingDay[]): number {
  const bothUpdatedDates = readingDays
    .filter((day) => day.arabicUpdated && day.banglaUpdated)
    .map((day) => day.date)
    .sort();
  if (bothUpdatedDates.length === 0) {
    return 0;
  }
  let longest = 1;
  let currentRun = 1;
  for (let index = 1; index < bothUpdatedDates.length; index += 1) {
    if (previousDateKey(bothUpdatedDates[index]) === bothUpdatedDates[index - 1]) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
  }
  return longest;
}

export interface TrackProgressPercentage {
  surahPercent: number;
  totalQuranPercent: number;
}

export function calculateTrackProgress(
  track: 'arabic' | 'bangla',
  surah: number,
  position: number,
  completed: boolean,
): TrackProgressPercentage {
  if (completed) {
    return { surahPercent: 100, totalQuranPercent: 100 };
  }
  const allSurahs = getAllSurahs();
  const currentSurah = getSurahByNumber(surah);

  if (track === 'arabic') {
    const surahPercent = Math.min(100, Math.round((position / currentSurah.totalRuku) * 100));
    let cumulative = 0;
    let total = 0;
    for (const item of allSurahs) {
      if (item.number < surah) {
        cumulative += item.totalRuku;
      }
      total += item.totalRuku;
    }
    cumulative += position;
    const totalQuranPercent = total > 0 ? Math.min(100, Math.round((cumulative / total) * 1000) / 10) : 0;
    return { surahPercent, totalQuranPercent };
  } else {
    const surahPercent = Math.min(100, Math.round((position / currentSurah.totalAyat) * 100));
    let cumulative = 0;
    let total = 0;
    for (const item of allSurahs) {
      if (item.number < surah) {
        cumulative += item.totalAyat;
      }
      total += item.totalAyat;
    }
    cumulative += position;
    const totalQuranPercent = total > 0 ? Math.min(100, Math.round((cumulative / total) * 1000) / 10) : 0;
    return { surahPercent, totalQuranPercent };
  }
}

export function revertLastHistoryEntry(
  entry: HistoryEntry,
  currentArabic: ArabicProgress,
  currentBangla: BanglaProgress,
): { arabic: ArabicProgress; bangla: BanglaProgress } {
  if (entry.track === 'arabic') {
    const wasCompleted = currentArabic.completed && entry.toSurah === 114;
    const nextCompletedCount = wasCompleted
      ? Math.max(0, currentArabic.completedCount - 1)
      : currentArabic.completedCount;
    return {
      arabic: {
        ...currentArabic,
        surah: entry.fromSurah,
        ruku: entry.fromPosition,
        completed: false,
        completedCount: nextCompletedCount,
        lastUpdatedAt: nowIso(),
      },
      bangla: currentBangla,
    };
  } else {
    const wasCompleted = currentBangla.completed && entry.toSurah === 114;
    const nextCompletedCount = wasCompleted
      ? Math.max(0, currentBangla.completedCount - 1)
      : currentBangla.completedCount;
    return {
      arabic: currentArabic,
      bangla: {
        ...currentBangla,
        surah: entry.fromSurah,
        ayat: entry.fromPosition,
        completed: false,
        completedCount: nextCompletedCount,
        lastUpdatedAt: nowIso(),
      },
    };
  }
}

export function formatBangladeshiTime(isoString: string): string {
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${String(hours).padStart(2, '0')}:${formattedMinutes} ${period}`;
}
