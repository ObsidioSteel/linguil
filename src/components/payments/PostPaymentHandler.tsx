'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseFirestore, getFirebasePerformance, getFirebaseAnalytics } from '@/lib/firebase/firebase';
import type { DocumentData, Unsubscribe } from 'firebase/firestore';
import type { PerformanceTrace } from 'firebase/performance';

// Timeout for payment processing to prevent indefinite waiting.
const PROCESSING_TIMEOUT_MS = 30000;

// Handles post-payment verification and logging.
export const PostPaymentHandler = () => {
  // Hooks for URL params, routing, auth, and toasts.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user } = useAuth();
  const traceRef = useRef<PerformanceTrace | null>(null); // Ref for the Firebase Performance trace.

  useEffect(() => {
    // Get payment data from URL query parameters.
    const sessionId = searchParams.get('session_id');
    const value = searchParams.get('value');
    const currency = searchParams.get('currency');

    // Exit if session ID or user is missing.
    if (!sessionId || !user?.uid) {
      return;
    }

    // Firestore listener and timeout variables.
    let unsubscribe: Unsubscribe | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Stops the performance trace with a given status.
    const stopTrace = (status: string) => {
        if (traceRef.current) {
            traceRef.current.putAttribute('status', status);
            traceRef.current.stop();
            traceRef.current = null;
        }
    }

    // Handles the main payment verification process.
    const handlePaymentVerification = async () => {
      try {
        // Starts a Firebase Performance trace for payment verification.
        const perf = await getFirebasePerformance();
        if (perf) {
          const { trace } = await import('firebase/performance');
          traceRef.current = trace(perf, 'payment_verification');
          traceRef.current.start();
        }

        // Gets a Firestore database reference.
        const db = await getFirebaseFirestore();
        const { doc, onSnapshot } = await import('firebase/firestore');

        // Sets a timeout to notify the user if verification is slow.
        timeoutId = setTimeout(() => {
          unsubscribe?.(); // Stops the Firestore listener.
          stopTrace('timeout'); // Stops the performance trace.
          toast({
            title: "Processing payment...",
            description: "linguil+ pending",
          });
        }, PROCESSING_TIMEOUT_MS);

        // Listens for real-time updates on the user's Firestore document.
        unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (userDoc: DocumentData) => {
          // Checks if the 'hasPaid' field is true.
          if (userDoc.data()?.hasPaid) {
            stopTrace('success'); // Stops the performance trace on success.
            if (timeoutId) clearTimeout(timeoutId); // Clears the processing timeout.
            unsubscribe?.(); // Stops the Firestore listener.

            // Logs a 'purchase' event with Firebase Analytics.
            try {
              const analytics = await getFirebaseAnalytics();
              if (analytics) {
                const { logEvent } = await import('firebase/analytics');
                logEvent(analytics, 'purchase', {
                  transaction_id: sessionId,
                  value: value ? parseFloat(value) : 1.99,
                  currency: currency || 'USD',
                  items: [{
                    item_id: 'linguil_plus_lifetime',
                    item_name: 'linguil+ Lifetime',
                    price: value ? parseFloat(value) : 1.99,
                    quantity: 1
                  }]
                });
              }
            } catch {
              // Analytics logging is non-critical; errors are ignored.
            }

            // Notifies the user of successful payment.
            toast({
              title: 'Successful payment!',
              description: 'linguil+ unlocked',
            });

            // Refreshes the user's auth token for updated custom claims.
            user.getIdToken(true);
            // Cleans payment-related query parameters from the URL.
            router.replace(pathname);
          }
        });

      } catch {
        // Handles unexpected errors during verification setup.
        stopTrace('error');
        toast({ title: "Error", description: "An unexpected error occurred while verifying your payment", variant: "destructive" });
      }
    };

    // Executes the payment verification process.
    handlePaymentVerification();

    // Cleanup on component unmount.
    return () => {
      unsubscribe?.();
      if (timeoutId) clearTimeout(timeoutId);
      stopTrace('unmounted');
    };
  }, [searchParams, user, toast, router, pathname]);

  // This is a logic-only component and renders nothing.
  return null;
};

// Sets display name for debugging.
PostPaymentHandler.displayName = 'PostPaymentHandler';