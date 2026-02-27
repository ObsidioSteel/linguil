'use client';

import { useEffect, memo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// Tracks page views and performance using Firebase.
const AnalyticsTracker = memo(() => {
  // Gets the current URL path.
  const pathname = usePathname();
  const { isInsideDiscord } = useAuth();

  // Initializes services and logs page views.
  useEffect(() => {
    // Do not initialize Analytics or Performance inside the Discord client
    // as their network requests violate Discord's Content Security Policy.
    if (isInsideDiscord) {
      return;
    }

    const initializeFirebaseServices = async () => {
      try {
        const { getFirebasePerformance } = await import('@/lib/firebase/firebase');
        // Initialize Performance Monitoring on every page load.
        getFirebasePerformance();

        const { getFirebaseAnalytics } = await import('@/lib/firebase/firebase');
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

    // Defer the initialization of Firebase services to prevent blocking the main thread during initial page load.
    const timer = setTimeout(() => {
      initializeFirebaseServices();
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname, isInsideDiscord]);

  // This component does not render any UI.
  return null;
});

AnalyticsTracker.displayName = 'AnalyticsTracker';

export { AnalyticsTracker };