import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import {
  getArabicProgress,
  getBanglaProgress,
  getReadingDays,
  setArabicProgress,
  setBanglaProgress,
  setReadingDays,
} from './progress-storage';
import { getHistoryEntries, setHistoryEntries } from './history-storage';
import { getReminderSettings, setReminderSettings } from './notification-service';
import { getThemePreference, setThemePreference } from './theme-storage';
import type { ArabicProgress, BanglaProgress, ReadingDays } from '../types/progress';
import type { HistoryEntry } from '../types/history';
import type { ReminderSettings } from '../types/settings';
import type { ThemePreference } from '../theme/colors';

export interface BackupData {
  version: number;
  exportedAt: string;
  arabicProgress: ArabicProgress;
  banglaProgress: BanglaProgress;
  readingDays: ReadingDays;
  history: HistoryEntry[];
  reminderSettings: ReminderSettings;
  themePreference: ThemePreference;
}

export async function createBackupJson(): Promise<string> {
  const [
    arabicProgress,
    banglaProgress,
    readingDays,
    history,
    reminderSettings,
    themePreference,
  ] = await Promise.all([
    getArabicProgress(),
    getBanglaProgress(),
    getReadingDays(),
    getHistoryEntries(),
    getReminderSettings(),
    getThemePreference(),
  ]);

  const payload: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    arabicProgress,
    banglaProgress,
    readingDays,
    history: [...history].reverse(),
    reminderSettings,
    themePreference,
  };

  return JSON.stringify(payload, null, 2);
}

export async function restoreFromJson(
  jsonString: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!isValidBackupData(parsed)) {
      return { success: false, error: 'Invalid backup file format.' };
    }

    await Promise.all([
      setArabicProgress(parsed.arabicProgress),
      setBanglaProgress(parsed.banglaProgress),
      setReadingDays(parsed.readingDays),
      setHistoryEntries(parsed.history),
      setReminderSettings(parsed.reminderSettings),
      setThemePreference(parsed.themePreference),
    ]);

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse JSON backup.' };
  }
}

export async function exportBackupToFile(): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    const json = await createBackupJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${directory}quran-reading-tracker-backup-${dateStr}.json`;

    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Quran Reading Tracker Backup',
        UTI: 'public.json',
      });
      return { success: true };
    }
    return { success: false, error: 'Sharing is not available on this device.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Export failed.' };
  }
}

export async function importBackupFromFile(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'File selection was canceled.' };
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return await restoreFromJson(content);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Import failed.' };
  }
}

export async function copyBackupToClipboard(): Promise<{ success: boolean; error?: string }> {
  try {
    const json = await createBackupJson();
    await Clipboard.setStringAsync(json);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Clipboard copy failed.' };
  }
}

export async function restoreFromClipboard(): Promise<{ success: boolean; error?: string }> {
  try {
    const content = await Clipboard.getStringAsync();
    if (!content || !content.trim()) {
      return { success: false, error: 'Clipboard is empty.' };
    }
    return await restoreFromJson(content.trim());
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Clipboard restore failed.' };
  }
}

function isValidBackupData(data: unknown): data is BackupData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.exportedAt === 'string' &&
    typeof candidate.arabicProgress === 'object' &&
    candidate.arabicProgress !== null &&
    typeof candidate.banglaProgress === 'object' &&
    candidate.banglaProgress !== null &&
    typeof candidate.readingDays === 'object' &&
    candidate.readingDays !== null &&
    Array.isArray(candidate.history)
  );
}
