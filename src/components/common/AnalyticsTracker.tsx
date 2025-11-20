'use client';

import { useEffect, memo } from 'react';
import { usePathname } from 'next/navigation';
import { getFirebaseAnalytics, getFirebasePerformance } from '@/lib/firebase/firebase';

// Tracks page views and performance using Firebase.
const AnalyticsTracker = memo(() => {
  // Gets the current URL path.
  const pathname = usePathname();

  // Initializes services and logs page views.
  useEffect(() => {
    const initializeFirebaseServices = async () => {
      try {
        // Initialize Performance Monitoring on every page load.
        getFirebasePerformance();

        // Lazily retrieves the Firebase Analytics instance.
        const analytics = await getFirebaseAnalytics();
        // Skips tracking if analytics is unavailable.
        if (!analytics) return;

        // Dynamically imports and uses the logEvent function.
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, 'page_view', { page_path: pathname });
      } catch {
        // Silently fails on errors to avoid impacting user experience.
      }
    };
    initializeFirebaseServices();
  }, [pathname]);

  // This component does not render any UI.
  return null;
});

AnalyticsTracker.displayName = 'AnalyticsTracker';

export { AnalyticsTracker };