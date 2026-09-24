import { useMemo, useState } from 'react';
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
  surahPercent: number;
  totalQuranPercent: number;
  disabled?: boolean;
  allowStepper?: boolean;
  onMarkDone: (step: number) => void;
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
  surahPercent,
  totalQuranPercent,
  disabled = false,
  allowStepper = false,
  onMarkDone,
  onReset,
}: ProgressCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(1);

  const handleDecrementStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementStep = () => {
    setStep((prev) => Math.min(50, prev + 1));
  };

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

          <View style={styles.meterContainer}>
            <View style={styles.meterHeader}>
              <Text style={styles.meterLabel}>Surah Progress</Text>
              <Text style={styles.meterValue}>{surahPercent}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[styles.meterFill, { width: `${Math.min(100, Math.max(0, surahPercent))}%` }]}
              />
            </View>
          </View>

          <View style={styles.meterContainer}>
            <View style={styles.meterHeader}>
              <Text style={styles.meterLabel}>Total Quran Progress</Text>
              <Text style={styles.meterValue}>{totalQuranPercent}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFillAccent,
                  { width: `${Math.min(100, Math.max(0, totalQuranPercent))}%` },
                ]}
              />
            </View>
          </View>

          <Text style={styles.lastUpdated}>
            Last updated: {formatLastUpdated(lastUpdatedAt)}
          </Text>

          {allowStepper && (
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperLabel}>Increment Amount:</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepButton}
                  onPress={handleDecrementStep}
                  disabled={disabled || step <= 1}
                >
                  <Text style={styles.stepButtonText}>-</Text>
                </Pressable>
                <View style={styles.stepDisplay}>
                  <Text style={styles.stepDisplayText}>+{step}</Text>
                </View>
                <Pressable
                  style={styles.stepButton}
                  onPress={handleIncrementStep}
                  disabled={disabled || step >= 50}
                >
                  <Text style={styles.stepButtonText}>+</Text>
                </Pressable>

                <View style={styles.presetGroup}>
                  {[1, 5, 10].map((preset) => (
                    <Pressable
                      key={preset}
                      style={[styles.presetChip, step === preset && styles.presetChipActive]}
                      onPress={() => setStep(preset)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          step === preset && styles.presetChipTextActive,
                        ]}
                      >
                        +{preset}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.markDoneButton, disabled && styles.markDoneButtonDisabled]}
            onPress={() => onMarkDone(allowStepper ? step : 1)}
            disabled={disabled}
          >
            <Text style={styles.markDoneLabel}>
              {allowStepper && step > 1
                ? `Mark +${step} ${positionLabel}s done`
                : `Mark ${positionLabel} done`}
            </Text>
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
      gap: 6,
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
    meterContainer: {
      marginTop: 4,
      gap: 4,
    },
    meterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meterLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    meterValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    meterTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    meterFill: {
      height: '100%',
      backgroundColor: colors.textSecondary,
      borderRadius: 3,
    },
    meterFillAccent: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    lastUpdated: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    stepperContainer: {
      marginTop: 8,
      padding: 10,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    stepperLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    stepDisplay: {
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDisplayText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.accent,
    },
    presetGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 'auto',
    },
    presetChip: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    presetChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: colors.accentText,
    },
    markDoneButton: {
      marginTop: 8,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    markDoneButtonDisabled: {
      opacity: 0.5,
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
