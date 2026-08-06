import { Pressable, StyleSheet, Text, View } from 'react-native';

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSection: {
    gap: 4,
  },
  surahArabic: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'right',
  },
  surahTransliteration: {
    fontSize: 16,
    fontWeight: '600',
  },
  positionLine: {
    fontSize: 14,
    opacity: 0.75,
  },
  lastUpdated: {
    fontSize: 13,
    opacity: 0.55,
  },
  markDoneButton: {
    marginTop: 8,
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  markDoneLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  completedSection: {
    gap: 8,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  resetButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonLabel: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
