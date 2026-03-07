import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { unstable_cache as cache } from 'next/cache';
import type { RawDailyData, Word, LanguageStats, Distractors } from '@/types/index';

// Fetches and assembles the complete daily word data from Firestore.
// 1. Separate the direct database call.
const fetchFromFirestore = async (dateStr: string): Promise<RawDailyData | null> => {
  try {
    const db = await getAdminDb();
    const dailyWordRef = db.collection('dailyWords').doc(dateStr);
    const dailyWordSnap = await dailyWordRef.get();
    if (!dailyWordSnap.exists) return null;

    const dailyData = dailyWordSnap.data();
    if (!dailyData) return null;

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
    
    return JSON.parse(JSON.stringify(fullData)); 
  } catch (error) {
    console.error("Error fetching daily word:", error);
    return null; 
  }
};

// 2. The cached function. Next.js automatically appends 'dateStr' to the cache key.
const getCachedDailyWord = cache(
  async (dateStr: string) => fetchFromFirestore(dateStr),
  ['daily-word-data'], 
  { revalidate: 3600 } // Revalidate cache hourly.
);

// 3. The exported function.
export const getDailyWordData = async (): Promise<RawDailyData | null> => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  const data = await getCachedDailyWord(today);
  
  // If the cache throws a null, fetch from Firebase directly.
  if (!data) {
    return fetchFromFirestore(today);
  }
  
  return data;
};