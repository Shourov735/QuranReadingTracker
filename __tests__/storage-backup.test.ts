import { describe, expect, it } from 'vitest';
import type { BackupData } from '../services/backup-service';
import { createHistoryEntry } from '../types/history';
import { createDefaultArabicProgress, createDefaultBanglaProgress } from '../types/progress';
import { createDefaultReminderSettings } from '../types/settings';

describe('BackupData validation', () => {
  it('constructs a valid backup data object', () => {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      arabicProgress: createDefaultArabicProgress(),
      banglaProgress: createDefaultBanglaProgress(),
      readingDays: {
        '2026-09-24': {
          date: '2026-09-24',
          arabicUpdated: true,
          banglaUpdated: true,
        },
      },
      history: [
        createHistoryEntry('arabic', 1, 1, 2, 1, '2026-09-24'),
      ],
      reminderSettings: createDefaultReminderSettings(),
      themePreference: 'system',
    };

    expect(backup.version).toBe(1);
    expect(backup.history[0].track).toBe('arabic');
    expect(backup.history[0].createdAt).toBeDefined();
    expect(backup.reminderSettings.hour).toBe(18);
  });
});
