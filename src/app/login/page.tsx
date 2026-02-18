'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/firebase';

export default function LoginPage() {
  const { signInWithGoogle, user } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (sessionId && !user) {
      signInWithGoogle();
    }
  }, [sessionId, user, signInWithGoogle]);

  useEffect(() => {
    if (user && sessionId) {
      const mintTokenAndClose = async () => {
        try {
            const res = await fetch('/api/mint-custom-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: user.uid }),
            });

            if (!res.ok) {
                throw new Error('Failed to mint custom token');
            }

            const { customToken } = await res.json();
            const db = await getFirebaseFirestore();

            if (db) {
              await setDoc(doc(db, "auth_sessions", sessionId), {
                customToken: customToken
              });
            }
            window.close();
        } catch(e) {
            console.error(e)
        }
      };
      mintTokenAndClose();
    }
  }, [user, sessionId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Signed in</h1>
      <p>Returning to Discord...</p>
    </div>
  );
}