import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { resetArabicProgress, resetBanglaProgress } from '../domain/progress-logic';
import {
  getArabicProgress,
  getBanglaProgress,
  setArabicProgress as persistArabicProgress,
  setBanglaProgress as persistBanglaProgress,
} from '../services/progress-storage';
import {
  formatReminderTime,
  getReminderSettings,
  setReminderSettings as persistReminderSettings,
} from '../services/notification-service';
import {
  copyBackupToClipboard,
  exportBackupToFile,
  importBackupFromFile,
  restoreFromClipboard,
} from '../services/backup-service';
import { clearAllHistory } from '../services/history-storage';
import type { ThemeColors, ThemePreference } from '../theme/colors';
import { useTheme } from '../theme/theme-context';
import type { ArabicProgress, BanglaProgress } from '../types/progress';
import type { ReminderSettings } from '../types/settings';

const GITHUB_URL = 'https://github.com/Shourov735/QuranReadingTracker';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [arabicProgress, setArabicProgress] = useState<ArabicProgress | null>(null);
  const [banglaProgress, setBanglaProgress] = useState<BanglaProgress | null>(null);
  const [reminderSettings, setReminderSettingsState] = useState<ReminderSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [arabic, bangla, settings] = await Promise.all([
      getArabicProgress(),
      getBanglaProgress(),
      getReminderSettings(),
    ]);
    setArabicProgress(arabic);
    setBanglaProgress(bangla);
    setReminderSettingsState(settings);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [arabic, bangla, settings] = await Promise.all([
        getArabicProgress(),
        getBanglaProgress(),
        getReminderSettings(),
      ]);
      if (active) {
        setArabicProgress(arabic);
        setBanglaProgress(bangla);
        setReminderSettingsState(settings);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleReminder = useCallback(
    async (enabled: boolean) => {
      if (reminderSettings === null) {
        return;
      }
      const nextSettings: ReminderSettings = {
        ...reminderSettings,
        enabled,
      };
      setReminderSettingsState(nextSettings);
      try {
        await persistReminderSettings(nextSettings);
      } catch {
        Alert.alert('Update failed', 'Could not update reminder setting.');
      }
    },
    [reminderSettings],
  );

  const handleTimeChange = useCallback(
    async (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowTimePicker(Platform.OS === 'ios');
      if (event.type === 'set' && selectedDate && reminderSettings) {
        const nextSettings: ReminderSettings = {
          ...reminderSettings,
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        };
        setReminderSettingsState(nextSettings);
        try {
          await persistReminderSettings(nextSettings);
        } catch {
          Alert.alert('Update failed', 'Could not update reminder time.');
        }
      }
    },
    [reminderSettings],
  );

  const performReset = useCallback(
    async (track: 'arabic' | 'bangla') => {
      try {
        if (track === 'arabic') {
          if (arabicProgress === null) {
            return;
          }
          const next = resetArabicProgress(arabicProgress);
          await persistArabicProgress(next);
          setArabicProgress(next);
        } else {
          if (banglaProgress === null) {
            return;
          }
          const next = resetBanglaProgress(banglaProgress);
          await persistBanglaProgress(next);
          setBanglaProgress(next);
        }
      } catch {
        Alert.alert('Reset failed', 'Your progress could not be reset. Please try again.');
      }
    },
    [arabicProgress, banglaProgress],
  );

  const confirmReset = useCallback(
    (track: 'arabic' | 'bangla') => {
      const trackLabel = track === 'arabic' ? 'Arabic' : 'Bangla';
      const positionLabel = track === 'arabic' ? 'Ruku 1' : 'Ayat 1';
      const otherTrack = track === 'arabic' ? 'Bangla' : 'Arabic';
      Alert.alert(
        `Reset ${trackLabel} progress?`,
        `Your reading position will restart at Surah 1, ${positionLabel}. The lifetime completed count is kept, and ${otherTrack} progress is not affected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => void performReset(track) },
        ],
      );
    },
    [performReset],
  );

  const handleExportFile = useCallback(async () => {
    setBackupBusy(true);
    const result = await exportBackupToFile();
    setBackupBusy(false);
    if (!result.success) {
      Alert.alert('Export failed', result.error || 'Failed to export backup file.');
    }
  }, []);

  const handleExportClipboard = useCallback(async () => {
    setBackupBusy(true);
    const result = await copyBackupToClipboard();
    setBackupBusy(false);
    if (result.success) {
      Alert.alert('Copied', 'Backup data copied to clipboard.');
    } else {
      Alert.alert('Copy failed', result.error || 'Failed to copy backup.');
    }
  }, []);

  const handleImportFile = useCallback(async () => {
    setBackupBusy(true);
    const result = await importBackupFromFile();
    setBackupBusy(false);
    if (result.success) {
      await loadData();
      Alert.alert('Restored', 'Backup restored successfully from file.');
    } else if (result.error !== 'File selection was canceled.') {
      Alert.alert('Import failed', result.error || 'Failed to restore backup.');
    }
  }, [loadData]);

  const handleImportClipboard = useCallback(async () => {
    setBackupBusy(true);
    const result = await restoreFromClipboard();
    setBackupBusy(false);
    if (result.success) {
      await loadData();
      Alert.alert('Restored', 'Backup restored successfully from clipboard.');
    } else {
      Alert.alert('Restore failed', result.error || 'Failed to restore from clipboard.');
    }
  }, [loadData]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear all reading history?',
      'This will delete all past activity logs. Your current reading positions and streak will not be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllHistory();
              Alert.alert('History Cleared', 'All reading history records have been cleared.');
            } catch {
              Alert.alert('Error', 'Failed to clear reading history.');
            }
          },
        },
      ],
    );
  }, []);

  const openGitHub = useCallback(async () => {
    try {
      await Linking.openURL(GITHUB_URL);
    } catch {
      Alert.alert('Could not open link', 'The GitHub repository could not be opened.');
    }
  }, []);

  if (arabicProgress === null || banglaProgress === null || reminderSettings === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pickerDate = new Date();
  pickerDate.setHours(reminderSettings.hour, reminderSettings.minute, 0, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reminder</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.cardTitle}>Daily Notifications</Text>
              <Text style={styles.cardBody}>Remind me to read Quran every day</Text>
            </View>
            <Switch
              value={reminderSettings.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>

          {reminderSettings.enabled && (
            <View style={styles.timeSelectSection}>
              <Text style={styles.cardBody}>Reminder Time:</Text>
              <Pressable
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.reminderTime}>
                  {formatReminderTime(reminderSettings.hour, reminderSettings.minute)}
                </Text>
                <Text style={styles.changeTimeHint}>Tap to change</Text>
              </Pressable>
            </View>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Theme</Text>
          <Text style={styles.cardBody}>
            System follows your device setting. Choosing Light or Dark overrides it.
          </Text>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.themeOption, selected && styles.themeOptionSelected]}
                  onPress={() => void setPreference(option.value)}
                >
                  <Text
                    style={[styles.themeOptionLabel, selected && styles.themeOptionLabelSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Portability</Text>
          <Text style={styles.cardBody}>
            Export your reading progress, streaks, and history to a backup file or clipboard.
          </Text>

          <View style={styles.backupActionsGrid}>
            <Pressable
              style={[styles.backupButton, backupBusy && styles.buttonDisabled]}
              onPress={() => void handleExportFile()}
              disabled={backupBusy}
            >
              <Text style={styles.backupButtonText}>Export File</Text>
            </Pressable>
            <Pressable
              style={[styles.backupButton, backupBusy && styles.buttonDisabled]}
              onPress={() => void handleExportClipboard()}
              disabled={backupBusy}
            >
              <Text style={styles.backupButtonText}>Copy to Clipboard</Text>
            </Pressable>
          </View>

          <View style={styles.backupActionsGrid}>
            <Pressable
              style={[styles.backupButtonSecondary, backupBusy && styles.buttonDisabled]}
              onPress={() => void handleImportFile()}
              disabled={backupBusy}
            >
              <Text style={styles.backupButtonTextSecondary}>Import File</Text>
            </Pressable>
            <Pressable
              style={[styles.backupButtonSecondary, backupBusy && styles.buttonDisabled]}
              onPress={() => void handleImportClipboard()}
              disabled={backupBusy}
            >
              <Text style={styles.backupButtonTextSecondary}>Paste from Clipboard</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading History</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>History Records</Text>
          <Text style={styles.cardBody}>
            Clean up all logged reading entries if you wish to start a clean log.
          </Text>
          <Pressable style={styles.clearHistoryButton} onPress={handleClearHistory}>
            <Text style={styles.clearHistoryButtonLabel}>Clear Reading History</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reset Progress</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arabic Reading</Text>
          <Text style={styles.cardBody}>
            Restarts at Surah 1, Ruku 1. The lifetime completed count is kept.
          </Text>
          <Pressable style={styles.resetButton} onPress={() => confirmReset('arabic')}>
            <Text style={styles.resetButtonLabel}>Reset Arabic Progress</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bangla Reading</Text>
          <Text style={styles.cardBody}>
            Restarts at Surah 1, Ayat 1. The lifetime completed count is kept.
          </Text>
          <Pressable style={styles.resetButton} onPress={() => confirmReset('bangla')}>
            <Text style={styles.resetButtonLabel}>Reset Bangla Progress</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quran Reading Tracker</Text>
          <Text style={styles.cardBody}>
            Track your daily Quran reading in Arabic and Bangla — offline, on your device.
          </Text>
          <Pressable style={styles.linkButton} onPress={() => void openGitHub()}>
            <Text style={styles.linkButtonLabel}>GitHub Repository</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchInfo: {
      flex: 1,
      gap: 2,
    },
    timeSelectSection: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    timePickerButton: {
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      alignItems: 'center',
    },
    reminderTime: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.accent,
    },
    changeTimeHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    themeOptionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    themeOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    themeOptionSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeOptionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    themeOptionLabelSelected: {
      color: colors.accentText,
    },
    backupActionsGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    backupButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    backupButtonText: {
      color: colors.accentText,
      fontSize: 14,
      fontWeight: '700',
    },
    backupButtonSecondary: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    backupButtonTextSecondary: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    clearHistoryButton: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    clearHistoryButtonLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    resetButton: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.destructive,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    resetButtonLabel: {
      color: colors.destructiveText,
      fontSize: 15,
      fontWeight: '600',
    },
    linkButton: {
      marginTop: 4,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    linkButtonLabel: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
