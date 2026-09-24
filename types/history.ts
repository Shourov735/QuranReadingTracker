export interface HistoryEntry {
  id: string;
  date: string;
  createdAt: string;
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
  createdAt: string = new Date().toISOString(),
): HistoryEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    date,
    createdAt,
    track,
    fromSurah,
    fromPosition,
    toSurah,
    toPosition,
  };
}
