'use client';

import type { RawDailyData } from '@/types';

// Fetches daily word data from Firestore.
export const getDailyWordDataClient = async (isInsideDiscord: boolean = false): Promise<RawDailyData | null> => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // 1. Discord: Fetch securely through the backend API
    if (isInsideDiscord || typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('frame_id')) {
      const response = await fetch('/api/daily-word');
      if (response.ok) {
        return await response.json() as RawDailyData;
      }
      return null;
    }

    // 2. Browser: Standard Firebase Client SDK
    const { getFirebaseFirestore } = await import('@/lib/firebase/firebase');
    const db = await getFirebaseFirestore(); 
    if (!db) return null;

    const { doc, getDoc } = await import('firebase/firestore');

    const docRef = doc(db, 'dailyWords', today);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as RawDailyData; // Return data if document exists.
    } else {
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch daily word:", error);
    return null; 
  }
};