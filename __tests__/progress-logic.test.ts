import { describe, expect, it } from 'vitest';
import {
  advanceAyat,
  advanceAyats,
  advanceRuku,
  calculateLongestStreak,
  calculateStreak,
  calculateTrackProgress,
  formatBangladeshiTime,
  formatDateKey,
  recordReadingDay,
  resetArabicProgress,
  resetBanglaProgress,
  revertLastHistoryEntry,
  setArabicProgress,
  setBanglaProgress,
} from '../domain/progress-logic';
import type { ArabicProgress, BanglaProgress, ReadingDays } from '../types/progress';
import type { HistoryEntry } from '../types/history';

describe('advanceRuku', () => {
  it('advances ruku within the same surah', () => {
    const initial: ArabicProgress = {
      surah: 2,
      ruku: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceRuku(initial);
    expect(next.surah).toBe(2);
    expect(next.ruku).toBe(2);
    expect(next.completed).toBe(false);
  });

  it('rolls over to next surah at ruku 1 when reaching the end of a surah', () => {
    const initial: ArabicProgress = {
      surah: 1,
      ruku: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceRuku(initial);
    expect(next.surah).toBe(2);
    expect(next.ruku).toBe(1);
  });

  it('marks completed and increments completedCount when passing Surah 114', () => {
    const initial: ArabicProgress = {
      surah: 114,
      ruku: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceRuku(initial);
    expect(next.completed).toBe(true);
    expect(next.completedCount).toBe(1);
    expect(next.surah).toBe(114);
    expect(next.ruku).toBe(1);

    const afterCompleted = advanceRuku(next);
    expect(afterCompleted).toBe(next);
  });
});

describe('advanceAyats', () => {
  it('advances single ayat with advanceAyat', () => {
    const initial: BanglaProgress = {
      surah: 1,
      ayat: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceAyat(initial);
    expect(next.surah).toBe(1);
    expect(next.ayat).toBe(2);
  });

  it('advances multiple ayats within surah', () => {
    const initial: BanglaProgress = {
      surah: 1,
      ayat: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceAyats(initial, 5);
    expect(next.surah).toBe(1);
    expect(next.ayat).toBe(6);
  });

  it('advances across surah boundary accurately', () => {
    const initial: BanglaProgress = {
      surah: 1,
      ayat: 5,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceAyats(initial, 3);
    expect(next.surah).toBe(2);
    expect(next.ayat).toBe(1);
  });

  it('advances across multiple surahs', () => {
    const initial: BanglaProgress = {
      surah: 108,
      ayat: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceAyats(initial, 15);
    expect(next.surah).toBeGreaterThan(108);
  });

  it('completes at Surah 114 without exceeding total ayats', () => {
    const initial: BanglaProgress = {
      surah: 114,
      ayat: 5,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const next = advanceAyats(initial, 5);
    expect(next.completed).toBe(true);
    expect(next.completedCount).toBe(1);
    expect(next.surah).toBe(114);
    expect(next.ayat).toBe(6);
  });
});

describe('revertLastHistoryEntry', () => {
  it('reverts arabic progress to previous position', () => {
    const currentArabic: ArabicProgress = {
      surah: 2,
      ruku: 5,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const currentBangla: BanglaProgress = {
      surah: 1,
      ayat: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const entry: HistoryEntry = {
      id: 'test-1',
      date: '2026-09-24',
      createdAt: '2026-09-24T12:00:00.000Z',
      track: 'arabic',
      fromSurah: 2,
      fromPosition: 4,
      toSurah: 2,
      toPosition: 5,
    };
    const reverted = revertLastHistoryEntry(entry, currentArabic, currentBangla);
    expect(reverted.arabic.surah).toBe(2);
    expect(reverted.arabic.ruku).toBe(4);
    expect(reverted.bangla).toBe(currentBangla);
  });

  it('un-freezes completed status and decrements count on revert', () => {
    const currentArabic: ArabicProgress = {
      surah: 114,
      ruku: 1,
      completed: true,
      completedCount: 1,
      lastUpdatedAt: null,
    };
    const currentBangla: BanglaProgress = {
      surah: 1,
      ayat: 1,
      completed: false,
      completedCount: 0,
      lastUpdatedAt: null,
    };
    const entry: HistoryEntry = {
      id: 'test-comp',
      date: '2026-09-24',
      createdAt: '2026-09-24T12:00:00.000Z',
      track: 'arabic',
      fromSurah: 114,
      fromPosition: 1,
      toSurah: 114,
      toPosition: 1,
    };
    const reverted = revertLastHistoryEntry(entry, currentArabic, currentBangla);
    expect(reverted.arabic.completed).toBe(false);
    expect(reverted.arabic.completedCount).toBe(0);
  });
});

describe('calculateTrackProgress', () => {
  it('calculates surah and total progress percentages', () => {
    const arabic = calculateTrackProgress('arabic', 1, 1, false);
    expect(arabic.surahPercent).toBe(100);
    expect(arabic.totalQuranPercent).toBeGreaterThan(0);

    const completed = calculateTrackProgress('bangla', 114, 6, true);
    expect(completed.surahPercent).toBe(100);
    expect(completed.totalQuranPercent).toBe(100);
  });
});

describe('streaks', () => {
  it('returns 0 when reading days are empty', () => {
    expect(calculateStreak([])).toBe(0);
    expect(calculateLongestStreak([])).toBe(0);
  });

  it('calculates consecutive days accurately', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);

    const days = [
      { date: formatDateKey(twoDaysAgo), arabicUpdated: true, banglaUpdated: true },
      { date: formatDateKey(yesterday), arabicUpdated: true, banglaUpdated: true },
      { date: formatDateKey(today), arabicUpdated: true, banglaUpdated: true },
    ];

    expect(calculateStreak(days)).toBe(3);
    expect(calculateLongestStreak(days)).toBe(3);
  });
});

describe('formatBangladeshiTime', () => {
  it('formats time to 12-hour AM/PM string', () => {
    const morning = new Date(2026, 8, 24, 9, 5, 0).toISOString();
    expect(formatBangladeshiTime(morning)).toBe('09:05 AM');

    const evening = new Date(2026, 8, 24, 18, 30, 0).toISOString();
    expect(formatBangladeshiTime(evening)).toBe('06:30 PM');

    const midnight = new Date(2026, 8, 24, 0, 0, 0).toISOString();
    expect(formatBangladeshiTime(midnight)).toBe('12:00 AM');

    const noon = new Date(2026, 8, 24, 12, 15, 0).toISOString();
    expect(formatBangladeshiTime(noon)).toBe('12:15 PM');
  });
});
