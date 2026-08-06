import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getSurahByNumber } from '../data/quran-metadata';
import {
  calculateLongestStreak,
  calculateStreak,
} from '../domain/progress-logic';
import { getHistoryEntries } from '../services/history-storage';
import {
  getArabicProgress,
  getBanglaProgress,
  getReadingDays,
} from '../services/progress-storage';
import type { HistoryEntry } from '../types/history';
import type { ArabicProgress, BanglaProgress, ReadingDays } from '../types/progress';

interface HistorySection {
  title: string;
  data: HistoryEntry[];
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [readingDays, setReadingDays] = useState<ReadingDays | null>(null);
  const [arabicProgress, setArabicProgress] = useState<ArabicProgress | null>(null);
  const [banglaProgress, setBanglaProgress] = useState<BanglaProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [historyEntries, days, arabic, bangla] = await Promise.all([
          getHistoryEntries(),
          getReadingDays(),
          getArabicProgress(),
          getBanglaProgress(),
        ]);
        if (active) {
          setEntries(historyEntries);
          setReadingDays(days);
          setArabicProgress(arabic);
          setBanglaProgress(bangla);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (entries === null || readingDays === null || arabicProgress === null || banglaProgress === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const sections = buildSections(entries);
  const readingDaysCount = Object.keys(readingDays).length;

  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item }) => <HistoryRow entry={item} />}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{formatSectionTitle(section.title)}</Text>
      )}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <StatRow label="Current streak" value={calculateStreak(Object.values(readingDays))} />
          <StatRow label="Longest streak" value={calculateLongestStreak(Object.values(readingDays))} />
          <StatRow label="Total reading days" value={readingDaysCount} />
          <StatRow label="Arabic completions" value={arabicProgress.completedCount} />
          <StatRow label="Bangla completions" value={banglaProgress.completedCount} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No reading activity yet. Mark progress on Home and it will show up here.
          </Text>
        </View>
      }
    />
  );
}

function buildSections(entries: HistoryEntry[]): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const entry of entries) {
    const last = sections[sections.length - 1];
    if (last !== undefined && last.title === entry.date) {
      last.data.push(entry);
    } else {
      sections.push({ title: entry.date, data: [entry] });
    }
  }
  return sections;
}

function formatSectionTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameLocalDay(date, today)) {
    return 'Today';
  }
  if (isSameLocalDay(date, yesterday)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
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

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const trackLabel = entry.track === 'arabic' ? 'Arabic' : 'Bangla';
  const positionLabel = entry.track === 'arabic' ? 'Ruku' : 'Ayat';
  const fromSurahName = getSurahByNumber(entry.fromSurah).nameTransliteration;
  const toSurahName = getSurahByNumber(entry.toSurah).nameTransliteration;
  const change =
    entry.fromSurah === entry.toSurah
      ? `${fromSurahName} ${positionLabel} ${entry.fromPosition} → ${entry.toPosition}`
      : `${fromSurahName} ${positionLabel} ${entry.fromPosition} → ${toSurahName} ${positionLabel} ${entry.toPosition}`;
  return (
    <View style={styles.entryCard}>
      <Text style={styles.entryTrack}>{trackLabel}</Text>
      <Text style={styles.entryChange}>{change}</Text>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 10,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.75,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#208AEF',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  entryTrack: {
    fontSize: 13,
    fontWeight: '700',
    color: '#208AEF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  entryChange: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
