'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';

function ExternalAuthContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('Finalising Google sign-in...');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid session. Please close this window and try again.');
      return;
    }

    const handleAuth = async () => {
      try {
        const { getFirebaseAuth } = await import('@/lib/firebase/firebase');
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const auth = await getFirebaseAuth();
        const provider = new GoogleAuthProvider();

        const credential = await signInWithPopup(auth, provider);
        const user = credential.user;
        const idToken = await user.getIdToken();

        setMessage('Authenticating your Discord session...');

        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fulfill',
            sessionId,
            idToken,
            user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }
          })
        });

        setStatus('success');
        setMessage('Success! You can close this window and return to Discord.');
      } catch (error: any) {
        setStatus('error');
        setMessage(`Authentication failed: ${error.message}. You can close this window.`);
      }
    };

    handleAuth();
  }, [sessionId]);

  return (
    <>
      <div className="w-full text-center pb-24 px-4 pt-2 md:pt-4">
        <div className="min-h-[550px] flex flex-col justify-center items-center">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                {status === 'pending' && <LoadingSpinner className="mb-4" />}
                {status === 'success' && <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />}
                {status === 'error' && <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />}
                <h1 className="text-xl font-semibold text-gray-800 mb-2">Google Sign-In</h1>
                <p className="text-sm text-gray-600">{message}</p>
            </div>
        </div>
      </div>
    </>
  );
}

export default function ExternalGoogleAuth() {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
          <LoadingSpinner />
        </div>
      }>
        <ExternalAuthContent />
      </Suspense>
    );
  }
