'use client';

import { getFirebaseFirestore } from '@/lib/firebase/firebase';
import type { RawDailyData } from '@/types';

// Fetches daily word data from Firestore on the client.
export const getDailyWordDataClient = async (): Promise<RawDailyData | null> => {
  const today = new Date().toISOString().slice(0, 10); // Get date in YYYY-MM-DD format.

  try {
    const db = await getFirebaseFirestore(); // Dynamically load the Firestore instance.
    if (!db) {
      return null;
    }

    const { doc, getDoc } = await import('firebase/firestore'); // Dynamically import Firestore functions.

    const docRef = doc(db, 'dailyWords', today);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as RawDailyData; // Return data if document exists.
    } else {
      return null;
    }
  } catch {
    return null; // Return null on any error.
  }
};