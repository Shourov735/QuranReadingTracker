export interface HistoryEntry {
  id: string;
  date: string;
  track: 'arabic' | 'bangla';
  fromSurah: number;
  fromPosition: number;
  toSurah: number;
  toPosition: number;
}

export function createHistoryEntry(
  track: 'arabic' | 'bangla',
  fromSurah: number,
  fromPosition: number,
  toSurah: number,
  toPosition: number,
  date: string,
): HistoryEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    date,
    track,
    fromSurah,
    fromPosition,
    toSurah,
    toPosition,
  };
}
