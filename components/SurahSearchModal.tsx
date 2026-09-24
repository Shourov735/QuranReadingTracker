import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getAllSurahs } from '../data/quran-metadata';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/theme-context';
import type { SurahMeta } from '../types/surah';

interface SurahSearchModalProps {
  visible: boolean;
  selectedSurahNumber: number;
  onSelect: (surahNumber: number) => void;
  onClose: () => void;
}

const ALL_SURAHS = getAllSurahs();

export default function SurahSearchModal({
  visible,
  selectedSurahNumber,
  onSelect,
  onClose,
}: SurahSearchModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return ALL_SURAHS;
    }
    return ALL_SURAHS.filter(
      (surah) =>
        surah.number.toString().includes(trimmed) ||
        surah.nameTransliteration.toLowerCase().includes(trimmed) ||
        surah.nameArabic.includes(trimmed),
    );
  }, [query]);

  const handleSelect = (surahNumber: number) => {
    onSelect(surahNumber);
    setQuery('');
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Surah</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or number..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => item.number.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.number === selectedSurahNumber;
              return (
                <Pressable
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => handleSelect(item.number)}
                >
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{item.number}</Text>
                  </View>
                  <View style={styles.nameContainer}>
                    <Text
                      style={[styles.transliterationText, isSelected && styles.selectedText]}
                    >
                      {item.nameTransliteration}
                    </Text>
                    <Text style={styles.detailText}>
                      {item.totalRuku} Rukus · {item.totalAyat} Ayats
                    </Text>
                  </View>
                  <Text style={styles.arabicText}>{item.nameArabic}</Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No surah found matching "{query}"</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.accent,
    },
    searchContainer: {
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    itemRowSelected: {
      backgroundColor: colors.border,
    },
    numberBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    numberText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    nameContainer: {
      flex: 1,
    },
    transliterationText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    selectedText: {
      color: colors.accent,
    },
    detailText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    arabicText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: 12,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
  });
}
