export interface ArabicProgress {
  surah: number;
  ruku: number;
  completed: boolean;
  completedCount: number;
  lastUpdatedAt: string | null;
}

export interface BanglaProgress {
  surah: number;
  ayat: number;
  completed: boolean;
  completedCount: number;
  lastUpdatedAt: string | null;
}

export interface ReadingDay {
  date: string;
  arabicUpdated: boolean;
  banglaUpdated: boolean;
}

export type ReadingDays = Record<string, ReadingDay>;

export function createDefaultArabicProgress(): ArabicProgress {
  return {
    surah: 1,
    ruku: 1,
    completed: false,
    completedCount: 0,
    lastUpdatedAt: null,
  };
}

export function createDefaultBanglaProgress(): BanglaProgress {
  return {
    surah: 1,
    ayat: 1,
    completed: false,
    completedCount: 0,
    lastUpdatedAt: null,
  };
}
