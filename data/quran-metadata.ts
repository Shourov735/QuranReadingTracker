import rawMetadata from './quran-metadata.json';
import type { SurahMeta } from '../types/surah';

const ALL_SURAHS: SurahMeta[] = rawMetadata as SurahMeta[];
const LAST_SURAH_NUMBER = 114;

export function getAllSurahs(): SurahMeta[] {
  return ALL_SURAHS;
}

export function getSurahByNumber(number: number): SurahMeta {
  if (number < 1 || number > LAST_SURAH_NUMBER) {
    throw new Error(`Surah number out of range: ${number}. Valid range is 1-${LAST_SURAH_NUMBER}.`);
  }
  return ALL_SURAHS[number - 1];
}

export function getNextSurahNumber(number: number): number | null {
  return number >= LAST_SURAH_NUMBER ? null : number + 1;
}
