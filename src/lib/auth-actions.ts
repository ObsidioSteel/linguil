'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInWithCustomToken,
  type UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/firebase';

// Maps Firebase auth error codes to user-friendly messages.
export const getAuthErrorMessage = (error: unknown): string => {
  let message = 'An unexpected error occurred';

  // Cast the error to a more detailed type to inspect its properties.
  const errorObj = error as { code?: string; message?: string; details?: { code?: string } };

  // Check for a nested error code from a Cloud Function first.
  const code = errorObj.details?.code ?? errorObj.code;

  if (typeof code === 'string') {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Incorrect email or password';
        break;
      case 'functions/already-exists':
      case 'auth/email-already-in-use':
        message = 'Email already in use';
        break;
      case 'auth/weak-password':
      case 'auth/invalid-password':
        message = 'Password is too weak (min. 6 characters)';
        break;
      case 'auth/popup-blocked':
        message = 'Sign-in popup blocked—allow popups for linguil.app';
        break;
      case 'auth/popup-closed-by-user':
      case 'auth/user-cancelled':
        message = 'Sign-in process was cancelled';
        break;
      default:
        // For any other errors, show a generic message but log the code for debugging.
        console.error(`Unhandled auth error code: ${code}`);
        message = 'An error occurred during authentication';
        break;
    }
  }
  return message;
};

// Initiates the Google sign-in process.
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Detailed sign-in error:", error);
    throw error;
  }
};

// Authenticates a user with email and password.
export const handleSignInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  const auth = await getFirebaseAuth();
  return await signInWithEmailAndPassword(auth, email, password);
};

// Creates a new user by calling the backend proxy, then signs them in.
export const handleSignUpWithEmail = async (name: string, email: string, password: string): Promise<UserCredential> => {
  const response = await fetch('/api/create-user-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Sign-up failed');
  }

  const auth = await getFirebaseAuth();
  return await signInWithCustomToken(auth, data.token);
};

// Sends a password reset email to the specified user.
export const handleResetPassword = async (email: string): Promise<void> => {
  const auth = await getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
};

// Signs out the currently authenticated user.
export const handleSignOut = async (): Promise<void> => {
  const auth = await getFirebaseAuth();
  await signOut(auth);
};