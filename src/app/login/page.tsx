'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/firebase';
import { getRedirectResult, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';

// Defines the authentication page that handles the Google Sign-In redirect flow.
function LoginPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  // State for managing the UI feedback to the user.
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // Ensures a session ID is present, which is critical for the handshake.
    if (!sessionId) {
      setError('No session ID was provided. This window can be closed.');
      setStatus('Error');
      return;
    }

    // Processes the entire authentication flow.
    const processAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        setStatus('Authenticating with Google...');

        // First, check if there's a user from a redirect.
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handleSuccessfulLogin(result.user, sessionId);
          return;
        }

        // If no redirect result, check for a currently signed-in user in this browser.
        if (auth.currentUser) {
          await handleSuccessfulLogin(auth.currentUser, sessionId);
          return;
        }

        // If no user is found, this is a fresh login. We use onAuthStateChanged
        // to be certain we capture the user state after Google's own redirect.
        const unsub = onAuthStateChanged(auth, async (user) => {
          unsub(); // The listener is only needed once to determine the initial state.
          if (user) {
            await handleSuccessfulLogin(user, sessionId);
          } else {
            // If no authenticated user is found, triggers the Google Sign-In redirect.
            setStatus('Redirecting to Google Sign-In...');
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
          }
        });

      } catch (err) {
        console.error("Authentication Error:", err);
        setError('An error occurred during authentication. Please try again.');
        setStatus('Error');
      }
    };

    processAuth();
  }, [sessionId]);

  // Handles the final steps after a user is successfully authenticated with Google.
  const handleSuccessfulLogin = async (user: User, sessionId: string) => {
    try {
      setStatus('Creating secure session...');

      // Requests a secure custom token from the server-side API endpoint.
      const response = await fetch('/api/mint-custom-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to retrieve a secure token.');
      }

      const { customToken } = await response.json();
      const db = await getFirebaseFirestore();

      setStatus('Finalizing login...');
      // Writes the custom token to the Firestore session document for the original app to consume.
      await setDoc(doc(db, 'auth_sessions', sessionId), { customToken });

      setStatus('Success! Returning to the app...');
      // Attempts to close the window, returning focus to the original application.
      setTimeout(() => window.close(), 1500);

    } catch (err) {
      console.error("Session Creation Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not create a secure session: ${errorMessage} Please close this window and try again.`);
      setStatus('Error');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">linguil</h1>
        <div className="mt-6">
          {status !== 'Error' && status !== 'Success! Returning to Discord...' && <GlobalLoadingSpinner />}
        </div>
        <p className="text-muted-foreground mt-4">{status}</p>
        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
        {status === 'Success! Returning to Discord...' && (
          <p className="text-green-600 mt-2">You can now close this window and return to Discord.</p>
        )}
      </div>
    </main>
  );
}

// Wraps the login page in a Suspense boundary, required for using `useSearchParams`.
export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<GlobalLoadingSpinner />}>
      <LoginPage />
    </Suspense>
  );
}