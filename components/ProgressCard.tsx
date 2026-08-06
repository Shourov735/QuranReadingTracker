import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/theme-context';

interface ProgressCardProps {
  title: string;
  trackName: string;
  surahNumber: number;
  surahArabicName: string;
  surahTransliteration: string;
  positionLabel: string;
  position: number;
  positionTotal: number;
  completed: boolean;
  completedCount: number;
  lastUpdatedAt: string | null;
  onMarkDone: () => void;
  onReset: () => void;
}

export default function ProgressCard({
  title,
  trackName,
  surahNumber,
  surahArabicName,
  surahTransliteration,
  positionLabel,
  position,
  positionTotal,
  completed,
  completedCount,
  lastUpdatedAt,
  onMarkDone,
  onReset,
}: ProgressCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {completed ? (
        <View style={styles.completedSection}>
          <Text style={styles.completedTitle}>
            Alhamdulillah — you've completed the Quran in {trackName} 🎉
          </Text>
          <Text style={styles.completedCount}>
            Completed {completedCount} time{completedCount === 1 ? '' : 's'}
          </Text>
          <Pressable style={styles.resetButton} onPress={onReset}>
            <Text style={styles.resetButtonLabel}>Start New Cycle</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.progressSection}>
          <Text style={styles.surahArabic}>{surahArabicName}</Text>
          <Text style={styles.surahTransliteration}>{surahTransliteration}</Text>
          <Text style={styles.positionLine}>
            Surah {surahNumber} · {positionLabel} {position} of {positionTotal}
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: {formatLastUpdated(lastUpdatedAt)}
          </Text>
          <Pressable style={styles.markDoneButton} onPress={onMarkDone}>
            <Text style={styles.markDoneLabel}>Mark {positionLabel} done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function formatLastUpdated(iso: string | null): string {
  if (iso === null) {
    return 'Never';
  }
  const updated = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameLocalDay(updated, today)) {
    return 'Today';
  }
  if (isSameLocalDay(updated, yesterday)) {
    return 'Yesterday';
  }
  return updated.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    progressSection: {
      gap: 4,
    },
    surahArabic: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'right',
    },
    surahTransliteration: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    positionLine: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    lastUpdated: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    markDoneButton: {
      marginTop: 8,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    markDoneLabel: {
      color: colors.accentText,
      fontSize: 15,
      fontWeight: '600',
    },
    completedSection: {
      gap: 8,
    },
    completedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    completedCount: {
      fontSize: 14,
      color: colors.textSecondary,
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
  });
}
