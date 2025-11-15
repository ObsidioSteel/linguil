import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { RawDailyData, Word, LanguageStats, Distractors } from '@/types/index';

// Fetches and assembles the complete daily word data from Firestore.
export const getDailyWordData = cache(
  async (): Promise<RawDailyData | null> => {
    const today = new Date().toISOString().slice(0, 10); // Get date in YYYY-MM-DD format.

    try {
      const db = await getAdminDb();
      const dailyWordRef = db.collection('dailyWords').doc(today);
      const dailyWordSnap = await dailyWordRef.get();
      if (!dailyWordSnap.exists) {
        return null;
      }

      const dailyData = dailyWordSnap.data();

      if (!dailyData) {
        return null;
      }

      const wordObject: Word = {
        family: dailyData.word.family,
        language: dailyData.word.language,
        nativeScript: dailyData.word.nativeScript,
        translation: dailyData.word.translation,
        transliteration: dailyData.word.transliteration,
        langCode: dailyData.word.langCode,
      };

      const fullData: RawDailyData = {
        word: wordObject,
        audioUrl: dailyData.audioUrl || null,
        distractors: dailyData.distractors as Distractors,
        languageStats: dailyData.languageStats as LanguageStats,
        date: dailyData.date,
      };
      
      return JSON.parse(JSON.stringify(fullData)); // Serialize/deserialize to ensure a plain object for caching.

    } catch {
      return null; // Return null on any error.
    }
  },
  ['daily-word'],
  { revalidate: 86400 } // Revalidate the cache once per day.
);