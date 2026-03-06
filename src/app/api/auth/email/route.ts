import { NextResponse } from 'next/server';

// Proxies email auth to Firebase REST API to bypass Discord's iframe CSP.
// Signup is securely handled via /api/create-user-account + /api/auth/exchange.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    // 1. Sign in the user with email and password.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://linguil.app/'
      },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        const googleError = data.error?.message || "UNKNOWN_GOOGLE_ERROR";
        // The frontend expects a `code` property for auth errors.
        return NextResponse.json({ code: googleError }, { status: response.status });
    }

    // 2. The user data from signInWithPassword does not include displayName or photoURL.
    // We need a separate lookup to get the full user profile.
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://linguil.app/'
        },
        body: JSON.stringify({ idToken: data.idToken }),
    });

    const lookupData = await lookupRes.json();

    // If lookup fails, it's not critical. We can proceed with the partial data.
    // The frontend auth context will eventually sync the full profile.
    if (!lookupRes.ok) {
        const googleError = lookupData.error?.message || "UNKNOWN_GOOGLE_ERROR";
        console.error("User lookup failed after email sign-in:", googleError);
    }
    
    const userData = lookupData.users?.[0] || {};

    return NextResponse.json({
      idToken: data.idToken,
      user: { 
        uid: data.localId, 
        email: data.email,
        displayName: userData.displayName, 
        photoURL: userData.photoURL 
      }
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('Email auth proxy error:', errorMessage);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: errorMessage }, { status: 500 });
  }
}