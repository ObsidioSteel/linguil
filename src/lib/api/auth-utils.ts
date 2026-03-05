import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if it hasn't been already.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Authenticates an incoming API request.
// It checks for a 'firebaseIdToken' cookie, verifies it with Firebase Admin, and returns the user's UID if the token is valid.
// If authentication fails at any step, it returns a NextResponse object with the appropriate HTTP status code and error message.

export const authenticateRequest = async (req: NextRequest): Promise<{ uid: string } | NextResponse> => {
  // 1. Try to get the token from our custom header to bypass Discord proxy stripping.
  const customHeader = req.headers.get('x-auth-token');
  const authHeader = req.headers.get('Authorization');
  let tokenValue = '';

  if (customHeader) {
    tokenValue = customHeader;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenValue = authHeader.substring(7);
  } else {
    // 2. Fall back to the cookie (for browsers).
    const cookieStore = await cookies();
    const idToken = cookieStore.get('firebaseIdToken');
    if (idToken) {
      tokenValue = idToken.value;
    }
  }

  if (!tokenValue) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized: No Firebase ID token provided.' }), { status: 401 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(tokenValue);
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return new NextResponse(JSON.stringify({ message: 'Unauthorized: Invalid Firebase ID token.' }), { status: 401 });
  }
};